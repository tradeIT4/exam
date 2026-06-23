import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    questionText: { type: String, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctAnswer: { type: String, enum: ["A", "B", "C", "D"], required: true },
    marks: { type: Number, default: 1, min: 1 }
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);

