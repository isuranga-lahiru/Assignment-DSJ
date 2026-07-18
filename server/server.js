require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Note = require("./models/Note");

const app = express();
const PORT = process.env.PORT || 5000;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "StudyMate API is running", status: "ok" });
});

app.get("/api/notes", async (_req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notes", error: error.message });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { title, subject, content } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    const note = await Note.create({
      title: title.trim(),
      subject: subject?.trim() || "General",
      content: content.trim(),
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: "Failed to create note", error: error.message });
  }
});

app.put("/api/notes/:id", async (req, res) => {
  try {
    const { title, subject, content } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        subject: subject?.trim() || "General",
        content: content.trim(),
        summary: null,
        quiz: null,
      },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Failed to update note", error: error.message });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.json({ message: "Note deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete note", error: error.message });
  }
});

app.post("/api/notes/:id/summarize", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const summary = await summarizeNoteContent(note.title, note.subject, note.content);
    note.summary = {
      bullets: summary.bullets,
      quizQuestion: summary.quizQuestion,
      rawResponse: summary.rawResponse,
      updatedAt: new Date(),
    };
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Failed to summarize note", error: error.message });
  }
});

app.post("/api/notes/:id/quiz", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const quiz = await generateQuizFromNote(note.title, note.subject, note.content);
    note.quiz = {
      questions: quiz.questions,
      updatedAt: new Date(),
    };
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Failed to create quiz", error: error.message });
  }
});

async function summarizeNoteContent(title, subject, content) {
  const fallback = buildFallbackSummary(title, subject, content);

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  const prompt = `
Summarize the study note below.

Return ONLY valid JSON in this exact shape:
{
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "quizQuestion": "one quiz question"
}

Rules:
- Keep each bullet short and useful.
- The quiz question should test understanding, not trivia.
- If there are fewer than 3 strong points, still return exactly 3 bullets.

Title: ${title}
Subject: ${subject}
Content:
${content}
`.trim();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        temperature: 0.2,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();

    const parsed = JSON.parse(text);
    const bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 3) : [];
    const quizQuestion = typeof parsed.quizQuestion === "string" ? parsed.quizQuestion.trim() : "";

    if (bullets.length < 3 || !quizQuestion) {
      return fallback;
    }

    return { bullets, quizQuestion, rawResponse: text };
  } catch (error) {
    console.warn("AI summary fallback used:", error.message);
    return fallback;
  }
}

async function generateQuizFromNote(title, subject, content) {
  const fallback = buildFallbackQuiz(title, subject, content);

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  const prompt = `
Generate exactly 3 multiple-choice questions from the study note below.

Return ONLY valid JSON in this exact shape:
{
  "questions": [
    {
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "answerIndex": 0,
      "explanation": "short explanation"
    }
  ]
}

Rules:
- Each question must have exactly 4 options.
- answerIndex must be 0, 1, 2, or 3.
- Questions should test understanding of the note.
- Avoid trivial or duplicate questions.

Title: ${title}
Subject: ${subject}
Content:
${content}
`.trim();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 900,
        temperature: 0.2,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();

    const parsed = JSON.parse(text);
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.slice(0, 3).map(normalizeQuizQuestion).filter(Boolean)
      : [];

    if (questions.length < 3) {
      return fallback;
    }

    return { questions };
  } catch (error) {
    console.warn("AI quiz fallback used:", error.message);
    return fallback;
  }
}

function normalizeQuizQuestion(question) {
  if (!question || typeof question.question !== "string") {
    return null;
  }

  const options = Array.isArray(question.options)
    ? question.options.map((option) => String(option).trim()).slice(0, 4)
    : [];

  if (options.length !== 4 || options.some((option) => !option)) {
    return null;
  }

  const answerIndex = Number.parseInt(question.answerIndex, 10);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
    return null;
  }

  return {
    question: question.question.trim(),
    options,
    answerIndex,
    explanation: typeof question.explanation === "string" ? question.explanation.trim() : "",
  };
}

function buildFallbackSummary(title, subject, content) {
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const bullets = sentences.slice(0, 3);
  while (bullets.length < 3) {
    bullets.push(`Review the key ideas from ${subject || title}.`);
  }

  const quizQuestion = `What is the main takeaway from ${title}?`;

  return {
    bullets,
    quizQuestion,
    rawResponse: JSON.stringify({ bullets, quizQuestion }),
  };
}

function buildFallbackQuiz(title, subject, content) {
  const baseTopic = subject || title;
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const mainIdea = sentences[0] || `The note focuses on ${baseTopic}.`;
  const supportingIdea = sentences[1] || `A key detail from ${baseTopic} is important to remember.`;
  const detailIdea = sentences[2] || `Review the supporting facts about ${baseTopic}.`;

  return {
    questions: [
      {
        question: `What is the main focus of ${title}?`,
        options: [mainIdea, supportingIdea, detailIdea, `No key topic was mentioned in ${title}.`],
        answerIndex: 0,
        explanation: `The first option summarizes the primary idea from ${title}.`,
      },
      {
        question: `Which statement best describes an important detail from ${baseTopic}?`,
        options: [detailIdea, `It is unrelated to ${baseTopic}.`, `It means the topic has no examples.`, `It removes the need for review.`],
        answerIndex: 0,
        explanation: `The first option reflects a supporting point from the note.`,
      },
      {
        question: `Why should you review this note again?`,
        options: [`To reinforce understanding of ${baseTopic}.`, `Because the topic is always trivial.`, `To avoid remembering any facts.`, `To delete the note.`],
        answerIndex: 0,
        explanation: `Repetition helps reinforce the concepts in the note.`,
      },
    ],
  };
}

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`StudyMate API running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
