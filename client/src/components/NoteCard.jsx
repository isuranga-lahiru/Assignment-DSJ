export default function NoteCard({ note, onDelete, onSummarize, isSummarizing }) {
  const summary = note.summary;

  return (
    <article className="note-card">
      <div className="note-card__header">
        <div>
          <p className="note-card__subject">{note.subject || "General"}</p>
          <h3>{note.title}</h3>
        </div>
        <button className="ghost-button" type="button" onClick={() => onDelete(note._id)}>
          Delete
        </button>
      </div>

      <p className="note-card__content">{note.content}</p>

      <div className="note-card__actions">
        <button type="button" onClick={() => onSummarize(note._id)} disabled={isSummarizing}>
          {isSummarizing ? "Summarizing…" : "✨ Summarize"}
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
    </article>
  );
}
