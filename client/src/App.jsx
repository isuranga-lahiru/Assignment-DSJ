import { useEffect, useMemo, useState } from "react";
import { createNote, createQuiz, deleteNote, fetchNotes, summarizeNote, updateNote } from "./api";
import NoteForm from "./components/NoteForm";
import NoteCard from "./components/NoteCard";
import SearchBar from "./components/SearchBar";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [activeSummaryId, setActiveSummaryId] = useState("");
  const [activeQuizId, setActiveQuizId] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("studymate-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("studymate-theme", theme);
  }, [theme]);

  useEffect(() => {
    void loadNotes();
  }, []);

  async function loadNotes() {
    try {
      setIsLoading(true);
      const data = await fetchNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(noteData) {
    try {
      setError("");
      setIsSubmitting(true);
      const newNote = await createNote(noteData);
      setNotes((current) => [newNote, ...current]);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(noteId) {
    const confirmDelete = window.confirm("Delete this note? This cannot be undone.");
    if (!confirmDelete) {
      return;
    }

    try {
      setError("");
      await deleteNote(noteId);
      setNotes((current) => current.filter((note) => note._id !== noteId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleSummarize(noteId) {
    try {
      setError("");
      setActiveSummaryId(noteId);
      const updatedNote = await summarizeNote(noteId);
      setNotes((current) => current.map((note) => (note._id === noteId ? updatedNote : note)));
    } catch (summaryError) {
      setError(summaryError.message);
    } finally {
      setActiveSummaryId("");
    }
  }

  async function handleUpdate(noteId, noteData) {
    try {
      setError("");
      const updatedNote = await updateNote(noteId, noteData);
      setNotes((current) => current.map((note) => (note._id === noteId ? updatedNote : note)));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleQuiz(noteId) {
    try {
      setError("");
      setActiveQuizId(noteId);
      const updatedNote = await createQuiz(noteId);
      setNotes((current) => current.map((note) => (note._id === noteId ? updatedNote : note)));
    } catch (quizError) {
      setError(quizError.message);
    } finally {
      setActiveQuizId("");
    }
  }

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      return [note.title, note.subject]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [notes, searchTerm]);

  return (
    <div className="app-shell">
      <header className="app-hero">
        <div>
          <p className="eyebrow">StudyMate</p>
          <h1>Study notes that can think for you.</h1>
          <p className="app-subtitle">
            A polished study workspace for capturing notes, finding them instantly, generating AI summaries, and managing content through Claude-connected workflows.
          </p>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{notes.length}</strong>
            <span>Total notes</span>
          </div>
          <div>
            <strong>{filteredNotes.length}</strong>
            <span>Visible notes</span>
          </div>
        </div>
        <button className="theme-toggle" type="button" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </header>

      <main className="app-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Add a note</h2>
            <p>Use the form to create a note and store it in MongoDB.</p>
          </div>
          <NoteForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
        </section>

        <section className="panel">
          <div className="panel-heading panel-heading--inline">
            <div>
              <h2>Your notes</h2>
              <p>{isLoading ? "Loading notes…" : "Search, delete, or summarize your study material."}</p>
            </div>
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {error ? <div className="alert">{error}</div> : null}

          {isLoading ? (
            <div className="state-card">Loading notes…</div>
          ) : filteredNotes.length === 0 ? (
            <div className="state-card">No notes yet — add your first one!</div>
          ) : (
            <div className="notes-list">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onDelete={handleDelete}
                  onSummarize={handleSummarize}
                  onUpdate={handleUpdate}
                  onQuiz={handleQuiz}
                  isSummarizing={activeSummaryId === note._id}
                  isQuizLoading={activeQuizId === note._id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
