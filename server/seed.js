import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Course } from "./models/Course.js";
import { Exam } from "./models/Exam.js";
import { Question } from "./models/Question.js";

dotenv.config();

await connectDB();
await Promise.all([User.deleteMany(), Course.deleteMany(), Exam.deleteMany(), Question.deleteMany()]);

const [admin, student] = await User.create([
  { name: "System Administrator", email: "admin@university.edu", password: "password123", role: "ADMIN" },
  { name: "Jane Student", email: "student@university.edu", enrollmentNumber: "TSE/1234/2028", batchYear: 2028, trainingTaken: "Coffee Cupping", password: "password123", role: "STUDENT" }
]);

const [course] = await Course.create([
  {
    courseName: "Coffee Cupping",
    courseCode: "CCP101",
    description: "Sensory evaluation, aroma, flavor, acidity, body, and scoring methods for coffee quality."
  },
  {
    courseName: "Barista",
    courseCode: "BAR101",
    description: "Espresso preparation, milk steaming, equipment handling, drink recipes, and customer service basics."
  },
  {
    courseName: "International Import and Export",
    courseCode: "IEX101",
    description: "International trade documentation, customs basics, logistics, import/export procedures, and compliance."
  }
]);

const exam = await Exam.create({
  courseId: course._id,
  title: "Midterm Examination",
  description: "Foundational concepts assessment.",
  durationMinutes: 30,
  extraTimeMinutes: 0,
  totalMarks: 4,
  passPercentage: 50,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
});

await Question.create([
  { examId: exam._id, questionText: "What does CPU stand for?", optionA: "Central Processing Unit", optionB: "Computer Personal Unit", optionC: "Central Program Utility", optionD: "Control Processing User", correctAnswer: "A", marks: 1 },
  { examId: exam._id, questionText: "Which data structure uses FIFO?", optionA: "Stack", optionB: "Queue", optionC: "Tree", optionD: "Graph", correctAnswer: "B", marks: 1 },
  { examId: exam._id, questionText: "Which option is a JavaScript framework/library?", optionA: "Laravel", optionB: "Django", optionC: "React", optionD: "Flask", correctAnswer: "C", marks: 1 },
  { examId: exam._id, questionText: "MongoDB stores data primarily as:", optionA: "Rows", optionB: "Documents", optionC: "Cells", optionD: "Sheets", correctAnswer: "B", marks: 1 }
]);

console.log("Seed complete", { admin: admin.email, student: student.email });
process.exit(0);



