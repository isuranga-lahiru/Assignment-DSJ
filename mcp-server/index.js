import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.STUDYMATE_API_URL || "http://localhost:5000";

const server = new Server(
  {
    name: "studymate-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_notes",
      description: "Return all StudyMate notes as JSON.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "create_note",
      description: "Create a new StudyMate note with a title, subject, and content.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "The note title" },
          subject: { type: "string", description: "The study subject", default: "General" },
          content: { type: "string", description: "The note body" },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === "list_notes") {
    const notes = await fetchNotes();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(notes, null, 2),
        },
      ],
    };
  }

  if (name === "create_note") {
    const note = await createNote(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(note, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function fetchNotes() {
  const response = await fetch(`${API_BASE}/api/notes`);
  if (!response.ok) {
    throw new Error(`Failed to load notes (${response.status})`);
  }
  return response.json();
}

async function createNote({ title, subject = "General", content }) {
  const response = await fetch(`${API_BASE}/api/notes`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ title, subject, content }),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error?.message || `Failed to create note (${response.status})`);
  }

  return response.json();
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const transport = new StdioServerTransport();
await server.connect(transport);
