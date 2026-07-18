const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema(
  {
    bullets: {
      type: [String],
      default: [],
    },
    quizQuestion: {
      type: String,
      default: "",
    },
    rawResponse: {
      type: String,
      default: "",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "General",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: summarySchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);
