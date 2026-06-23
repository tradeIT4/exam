import { z } from "zod";
import { Question } from "../models/Question.js";

export const questionSchema = z.object({
  body: z.object({
    examId: z.string().min(1),
    questionText: z.string().min(3),
    optionA: z.string().min(1),
    optionB: z.string().min(1),
    optionC: z.string().min(1),
    optionD: z.string().min(1),
    correctAnswer: z.enum(["A", "B", "C", "D"]),
    marks: z.coerce.number().min(1).default(1)
  })
});

export async function listQuestions(req, res, next) {
  try {
    const query = req.query.examId ? { examId: req.query.examId } : {};
    const projection = req.user.role === "ADMIN" ? "" : "-correctAnswer";
    res.json(await Question.find(query).select(projection).sort({ createdAt: 1 }));
  } catch (error) {
    next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    res.status(201).json(await Question.create(req.body));
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateQuestions(req, res, next) {
  try {
    const questions = await Question.insertMany(req.body.questions);
    res.status(201).json(questions);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json(question);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

