import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Brand from "../components/Brand.jsx";
import { api } from "../services/api.js";

export default function ExamScreen() {
  const navigate = useNavigate();
  const initial = useMemo(() => JSON.parse(sessionStorage.getItem("active_exam") || "null"), []);
  const [bundle, setBundle] = useState(initial);
  const [isPaused, setIsPaused] = useState(Boolean(initial?.exam?.isPaused));
  const [index, setIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState(() => {
    const map = {};
    initial?.answers?.forEach((answer) => { map[answer.questionId] = answer; });
    return map;
  });
  const extraMinutes = initial?.exam?.extraTimeMinutes || 0;
  const [remaining, setRemaining] = useState(() => {
    if (!initial) return 0;
    const now = Date.now();
    const elapsed = Math.floor((now - new Date(initial.attempt.startedAt).getTime()) / 1000);
    const durationRemaining = (initial.exam.durationMinutes + extraMinutes) * 60 - elapsed;
    const endDateRemaining = Math.floor((new Date(initial.exam.endDate).getTime() - now) / 1000);
    return Math.max(Math.min(durationRemaining, endDateRemaining), 0);
  });

  const question = bundle?.questions?.[index];
  const selectedAnswer = question ? answers[question._id]?.selectedAnswer || "" : "";
  const answeredCount = bundle?.questions.filter((item) => answers[item._id]?.selectedAnswer).length || 0;
  const unansweredCount = (bundle?.questions.length || 0) - answeredCount;

  useEffect(() => {
    if (!bundle) navigate("/student/courses");
  }, [bundle, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) setRemaining((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (remaining === 0 && bundle && !isPaused) submit({ skipConfirm: true });
  }, [remaining, isPaused]);

  useEffect(() => {
    const interval = setInterval(save, 15000);
    return () => clearInterval(interval);
  }, [answers]);

  useEffect(() => {
    if (!bundle?.exam?._id) return undefined;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get("/exams");
        const latestExam = data.find((exam) => exam._id === bundle.exam._id);
        if (!latestExam) return;
        setIsPaused(Boolean(latestExam.isPaused));
        setBundle((current) => current ? { ...current, exam: latestExam } : current);
        setRemaining((current) => {
          const elapsed = Math.floor((Date.now() - new Date(bundle.attempt.startedAt).getTime()) / 1000);
          const durationRemaining = ((latestExam.durationMinutes || 0) + (latestExam.extraTimeMinutes || 0)) * 60 - elapsed;
          const endDateRemaining = Math.floor((new Date(latestExam.endDate).getTime() - Date.now()) / 1000);
          const refreshedRemaining = Math.max(Math.min(durationRemaining, endDateRemaining), 0);
          return refreshedRemaining > current ? refreshedRemaining : current;
        });
      } catch (err) {
        console.error("Failed to refresh exam status", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bundle?.exam?._id]);

  if (!bundle || !question) return null;

  function answerPayload() {
    return Object.entries(answers).map(([questionId, answer]) => ({ questionId, ...answer }));
  }

  async function save() {
    try {
      await api.put(`/exams/attempts/${bundle.attempt._id}/answers`, { answers: answerPayload() });
    } catch (err) {
      console.error("Failed to save answers", err);
    }
  }

  async function submit({ skipConfirm = false } = {}) {
    if (!skipConfirm) {
      setShowSubmitConfirm(true);
      return;
    }

    setSubmitting(true);
    try {
      await save();
      await api.post("/exams/submit", { attemptId: bundle.attempt._id });
      sessionStorage.removeItem("active_exam");
      navigate("/student/results");
    } finally {
      setSubmitting(false);
    }
  }

  function selectOption(letter) {
    setAnswers((current) => ({
      ...current,
      [question._id]: {
        selectedAnswer: letter,
        markedForReview: current[question._id]?.markedForReview || false
      }
    }));
  }

  function clearChoice() {
    setAnswers((current) => ({
      ...current,
      [question._id]: {
        selectedAnswer: "",
        markedForReview: current[question._id]?.markedForReview || false
      }
    }));
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-portal">
      <header className="border-b border-blue-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Brand />
          <div className="text-sm md:text-right">
            <p className="font-bold">{bundle.exam.courseId?.courseName}</p>
            <p className="text-slate-500">{bundle.exam.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {extraMinutes > 0 && (
              <span className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white animate-pulse">
                +{extraMinutes} Min Extra Time
              </span>
            )}
            <div className="rounded-xl bg-blue-600 px-4 py-2 text-center text-base font-bold text-white sm:text-lg">{minutes}:{seconds}</div>
          </div>
        </div>
      </header>
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-orange-200 bg-white p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <AlertTriangle size={34} />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">Exam paused</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">The administrator has paused this exam. Your timer is stopped and will continue when the exam is resumed.</p>
          </div>
        </div>
      )}
      <main className="mx-auto grid max-w-7xl gap-4 p-3 sm:p-4 lg:grid-cols-[260px_1fr]">
        <aside className="card p-3 sm:p-4">
          <h2 className="mb-3 font-bold">Questions</h2>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-4">
            {bundle.questions.map((item, itemIndex) => {
              const saved = answers[item._id];
              const state = saved?.markedForReview ? "bg-amber-100 text-amber-700" : saved?.selectedAnswer ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";
              return <button key={item._id} className={`h-10 rounded-lg text-sm font-bold ${itemIndex === index ? "ring-2 ring-blue-500" : ""} ${state}`} onClick={() => { save(); setIndex(itemIndex); }}>{itemIndex + 1}</button>;
            })}
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-500">
            <p>Green: Answered</p>
            <p>Amber: Marked for review</p>
            <p>Gray: Unanswered</p>
          </div>
        </aside>
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700">Question {index + 1} of {bundle.questions.length}</p>
              <h1 className="mt-3 text-lg font-bold leading-7 sm:text-xl">{question.questionText}</h1>
            </div>
          </div>

          <fieldset className="mt-6 grid gap-3">
            <legend className="sr-only">Answer choices</legend>
            {["A", "B", "C", "D"].map((letter) => {
              const isSelected = selectedAnswer === letter;
              return (
                <label key={letter} className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 sm:gap-4 sm:p-4 ${isSelected ? "border-slate-950 ring-2 ring-slate-950" : "border-slate-200"}`}>
                  <input className="mt-1 h-5 w-5 accent-slate-950" type="radio" name={`question-${question._id}`} value={letter} checked={isSelected} onChange={() => selectOption(letter)} />
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {letter}
                  </span>
                  <span className="pt-1 font-semibold leading-7">{question[`option${letter}`]}</span>
                </label>
              );
            })}
          </fieldset>

          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Answer key selected: <span className="font-bold text-slate-950">{selectedAnswer || "No choice selected"}</span>
          </div>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-between">
            <button className="btn-secondary" disabled={index === 0} onClick={() => { save(); setIndex(index - 1); }}>Previous</button>
            <button className="btn-secondary" type="button" disabled={!selectedAnswer} onClick={clearChoice}>Clear Choice</button>
            {index < bundle.questions.length - 1 ? <button className="btn-primary" onClick={() => { save(); setIndex(index + 1); }}>Next</button> : <button className="btn-primary" onClick={() => submit()}>Submit</button>}
          </div>
        </section>
      </main>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Submit exam?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Please confirm before submitting. After submission, you cannot change your answers.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-sm font-semibold text-emerald-700">Answered</p>
                <p className="mt-1 text-3xl font-bold text-emerald-800">{answeredCount}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-sm font-semibold text-red-700">Unanswered</p>
                <p className="mt-1 text-3xl font-bold text-red-800">{unansweredCount}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Make sure you reviewed every question before final submission.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="btn-secondary" type="button" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}>Cancel</button>
              <button className="btn-primary" type="button" onClick={() => submit({ skipConfirm: true })} disabled={submitting}>{submitting ? "Submitting..." : "Yes, submit exam"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

