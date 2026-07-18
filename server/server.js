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
  res.json({
    message: "StudyMate API is running",
    status: "ok",
  });
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
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
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

    return {
      bullets,
      quizQuestion,
      rawResponse: text,
    };
  } catch (error) {
    console.warn("AI summary fallback used:", error.message);
    return fallback;
  }
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
