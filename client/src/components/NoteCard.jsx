import { useEffect, useState } from "react";

const emptyEditorState = {
  title: "",
  subject: "",
  content: "",
};

export default function NoteCard({ note, onDelete, onSummarize, onUpdate, onQuiz, isSummarizing, isQuizLoading }) {
  const summary = note.summary;
  const quiz = note.quiz;
  const [isEditing, setIsEditing] = useState(false);
  const [editor, setEditor] = useState(emptyEditorState);

  useEffect(() => {
    if (isEditing) {
      setEditor({
        title: note.title,
        subject: note.subject || "General",
        content: note.content,
      });
    }
  }, [isEditing, note.content, note.subject, note.title]);

  function handleEditorChange(event) {
    const { name, value } = event.target;
    setEditor((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    await onUpdate(note._id, editor);
    setIsEditing(false);
  }

  return (
    <article className="note-card">
      {!isEditing ? (
        <>
          <div className="note-card__header">
            <div>
              <p className="note-card__subject">{note.subject || "General"}</p>
              <h3>{note.title}</h3>
            </div>
            <div className="note-card__header-actions">
              <button className="ghost-button" type="button" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button className="ghost-button" type="button" onClick={() => onDelete(note._id)}>
                Delete
              </button>
            </div>
          </div>

          <p className="note-card__content">{note.content}</p>
        </>
      ) : (
        <form className="note-editor" onSubmit={handleSave}>
          <div className="form-grid">
            <label>
              <span>Title</span>
              <input name="title" value={editor.title} onChange={handleEditorChange} />
            </label>
            <label>
              <span>Subject</span>
              <input name="subject" value={editor.subject} onChange={handleEditorChange} />
            </label>
          </div>
          <label>
            <span>Content</span>
            <textarea name="content" rows="6" value={editor.content} onChange={handleEditorChange} />
          </label>
          <div className="note-card__actions note-card__actions--edit">
            <button type="submit">Save changes</button>
            <button type="button" className="ghost-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="note-card__actions note-card__actions--primary">
        <button type="button" onClick={() => onSummarize(note._id)} disabled={isSummarizing}>
          {isSummarizing ? "Summarizing…" : "✨ Summarize"}
        </button>
        <button type="button" onClick={() => onQuiz(note._id)} disabled={isQuizLoading}>
          {isQuizLoading ? "Building quiz…" : "🎯 Quiz mode"}
        </button>
      </div>

      {summary?.bullets?.length ? (
        <section className="summary-box">
          <h4>AI Summary</h4>
          <ul>
            {summary.bullets.map((bullet, index) => (
              <li key={`${note._id}-bullet-${index}`}>{bullet}</li>
            ))}
          </ul>
          <p className="quiz-question">
            <strong>Quiz question:</strong> {summary.quizQuestion}
          </p>
        </section>
      ) : null}

      {quiz?.questions?.length ? (
        <section className="quiz-box">
          <h4>AI Quiz Mode</h4>
          <p className="quiz-box__hint">Answer these 3 MCQs to check how well you know the note.</p>
          <div className="quiz-list">
            {quiz.questions.map((question, questionIndex) => (
              <article className="quiz-card" key={`${note._id}-quiz-${questionIndex}`}>
                <strong>
                  {questionIndex + 1}. {question.question}
                </strong>
                <ol type="A" className="quiz-options">
                  {question.options.map((option, optionIndex) => (
                    <li key={`${note._id}-quiz-${questionIndex}-${optionIndex}`}>{option}</li>
                  ))}
                </ol>
                <p className="quiz-question">
                  <strong>Answer:</strong> {String.fromCharCode(65 + question.answerIndex)}
                </p>
                {question.explanation ? (
                  <p className="quiz-question">
                    <strong>Why:</strong> {question.explanation}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
