const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function handleResponse(response) {
  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function fetchNotes() {
  const response = await fetch(`${API_BASE}/api/notes`);
  return handleResponse(response);
}

export async function createNote(note) {
  const response = await fetch(`${API_BASE}/api/notes`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(note),
  });

  return handleResponse(response);
}

export async function deleteNote(noteId) {
  const response = await fetch(`${API_BASE}/api/notes/${noteId}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}

export async function summarizeNote(noteId) {
  const response = await fetch(`${API_BASE}/api/notes/${noteId}/summarize`, {
    method: "POST",
  });

  return handleResponse(response);
}
