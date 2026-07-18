import { useState } from "react";

const initialState = {
  title: "",
  subject: "",
  content: "",
};

export default function NoteForm({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState(initialState);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(formData);
    setFormData(initialState);
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Title</span>
          <input name="title" value={formData.title} onChange={handleChange} placeholder="Chapter 3: Cellular Respiration" />
        </label>
        <label>
          <span>Subject</span>
          <input name="subject" value={formData.subject} onChange={handleChange} placeholder="Biology" />
        </label>
      </div>

      <label>
        <span>Content</span>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows="6"
          placeholder="Add your lecture notes, reminders, or revision bullets here..."
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
