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

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 4 && value.every((option) => typeof option === "string" && option.trim()),
        message: "Each quiz question must have exactly four options.",
      },
    },
    answerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    questions: {
      type: [quizQuestionSchema],
      default: [],
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
    quiz: {
      type: quizSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);
