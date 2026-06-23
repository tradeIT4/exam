import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { api } from "../services/api.js";

const blankExam = { courseId: "", title: "", description: "", durationMinutes: 30, extraTimeMinutes: 0, totalMarks: 10, passPercentage: 50, startDate: "", endDate: "" };
const blankQuestion = { examId: "", questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", marks: 1 };
const blankExtraTime = { examId: "", minutes: 5 };

function examStatus(exam, now = Date.now()) {
  const start = new Date(exam.startDate).getTime();
  const end = new Date(exam.endDate).getTime();

  if (exam.isPaused) return { label: "Paused", className: "bg-orange-50 text-orange-700" };
  if (now < start) return { label: "Scheduled", className: "bg-amber-50 text-amber-700" };
  if (now > end) return { label: "Ended", className: "bg-slate-100 text-slate-600" };
  return { label: "Live", className: "bg-emerald-50 text-emerald-700" };
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "Not set";
}

function countdownState(exam, now) {
  if (!exam) {
    return { label: "No exam selected", remaining: 0, mode: "idle", progress: 0 };
  }

  const start = new Date(exam.startDate).getTime();
  const end = new Date(exam.endDate).getTime();
  const current = now.getTime();

  if (exam.isPaused) {
    return { label: "Paused", remaining: Math.max(Math.floor((end - current) / 1000), 0), mode: "paused", progress: 0 };
  }

  if (current < start) {
    return { label: "Starts in", remaining: Math.max(Math.floor((start - current) / 1000), 0), mode: "scheduled", progress: 0 };
  }

  if (current <= end) {
    const total = Math.max(end - start, 1);
    const elapsed = Math.min(Math.max(current - start, 0), total);
    return { label: "Time remaining", remaining: Math.max(Math.floor((end - current) / 1000), 0), mode: "live", progress: Math.round((elapsed / total) * 100) };
  }

  return { label: "Exam finished", remaining: 0, mode: "ended", progress: 100 };
}

function timeParts(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    { label: "HR", value: hours },
    { label: "MIN", value: minutes },
    { label: "SEC", value: seconds }
  ];
}

function ClockSegment({ label, value, active }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-center shadow-sm transition ${active ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-100" : "border-slate-100 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#17223a] dark:text-slate-100"}`}>
      <p className="font-mono text-2xl font-black tabular-nums tracking-tight">{String(value).padStart(2, "0")}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function toExamPayload(exam, overrides = {}) {
  return {
    courseId: exam.courseId?._id || exam.courseId,
    title: exam.title,
    description: exam.description || "",
    durationMinutes: exam.durationMinutes,
    extraTimeMinutes: exam.extraTimeMinutes || 0,
    totalMarks: exam.totalMarks,
    passPercentage: exam.passPercentage,
    startDate: exam.startDate,
    endDate: exam.endDate,
    ...overrides
  };
}

export default function ExamManagement() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState(blankExam);
  const [questionForm, setQuestionForm] = useState(blankQuestion);
  const [extraTimeForm, setExtraTimeForm] = useState(blankExtraTime);
  const [modal, setModal] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedStartExamId, setSelectedStartExamId] = useState("");
  const [now, setNow] = useState(new Date());

  function load() {
    Promise.all([api.get("/courses"), api.get("/exams")]).then(([c, e]) => {
      setCourses(c.data);
      setExams(e.data);
      setSelectedStartExamId((current) => current || e.data[0]?._id || "");
      setExtraTimeForm((current) => ({ ...current, examId: current.examId || e.data[0]?._id || "" }));
    });
  }

  useEffect(load, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function saveExam(e) {
    e.preventDefault();
    await api.post("/exams", examForm);
    setModal(null);
    setExamForm(blankExam);
    load();
  }

  async function saveQuestion(e) {
    e.preventDefault();
    await api.post("/questions", questionForm);
    setModal(null);
    setQuestionForm(blankQuestion);
  }

  async function addExtraTime(e) {
    e.preventDefault();
    const exam = exams.find((item) => item._id === extraTimeForm.examId);
    const minutes = Number(extraTimeForm.minutes) || 0;
    if (!exam || minutes <= 0) return;

    const endDate = new Date(new Date(exam.endDate).getTime() + minutes * 60000);
    setSavingId(exam._id);
    try {
      await api.put(`/exams/${exam._id}`, toExamPayload(exam, {
        extraTimeMinutes: (Number(exam.extraTimeMinutes) || 0) + minutes,
        endDate: endDate.toISOString()
      }));
      setModal(null);
      setExtraTimeForm({ examId: exam._id, minutes: 5 });
      load();
    } finally {
      setSavingId("");
    }
  }

  async function startExamNow(exam) {
    const startDate = new Date();
    const totalMinutes = (Number(exam.durationMinutes) || 0) + (Number(exam.extraTimeMinutes) || 0);
    const currentEnd = new Date(exam.endDate);
    const fallbackEnd = new Date(startDate.getTime() + Math.max(totalMinutes, 1) * 60000);
    const endDate = currentEnd > startDate ? currentEnd : fallbackEnd;

    setSavingId(exam._id);
    try {
      await api.put(`/exams/${exam._id}`, toExamPayload(exam, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }));
      load();
    } finally {
      setSavingId("");
    }
  }

  const selectedStartExam = exams.find((exam) => exam._id === selectedStartExamId);
  const selectedClock = countdownState(selectedStartExam, now);
  const isLiveClock = selectedClock.mode === "live";
  const isPausedClock = selectedClock.mode === "paused";

  async function startSelectedExam() {
    if (!selectedStartExam) return;
    await startExamNow(selectedStartExam);
  }

  async function toggleSelectedPause() {
    if (!selectedStartExam) return;
    setSavingId(selectedStartExam._id);
    try {
      const action = selectedStartExam.isPaused ? "resume" : "pause";
      await api.patch(`/exams/${selectedStartExam._id}/${action}`);
      load();
    } finally {
      setSavingId("");
    }
  }

  async function removeExam() {
    if (!deleteTarget) return;
    setSavingId(deleteTarget._id);
    try {
      await api.delete(`/exams/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-2xl font-bold">Exam Management</h2>
          <p className="text-sm text-slate-500">Create exams, set start and end time, then start an exam immediately when needed.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setModal("extraTime")}><Clock3 size={16} /> Extra Time</button>
          <button className="btn-secondary" onClick={() => setModal("question")}><Plus size={16} /> Add Question</button>
          <button className="btn-primary" onClick={() => setModal("exam")}><Plus size={16} /> Create Exam</button>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border border-blue-100 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-[#111a2b] lg:grid-cols-[minmax(0,1fr)_360px_auto_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#287fae] dark:text-sky-300">
            <PlayCircle size={18} /> Start Exam
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select an exam and make it live immediately. The countdown updates every second for the selected exam.</p>
          <select className="input mt-4 max-w-xl" value={selectedStartExamId} onChange={(event) => setSelectedStartExamId(event.target.value)} disabled={!exams.length}>
            {!exams.length && <option value="">No exams created</option>}
            {exams.map((exam) => (
              <option key={exam._id} value={exam._id}>{exam.title} - {exam.courseId?.courseCode || exam.courseId?.courseName || "Course"}</option>
            ))}
          </select>
        </div>

        <div className={`overflow-hidden rounded-2xl border p-4 transition ${isLiveClock ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-[0_18px_45px_rgba(16,185,129,0.18)]" : isPausedClock ? "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-[0_18px_45px_rgba(249,115,22,0.16)]" : "border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-[#17223a]"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`relative flex h-3 w-3 ${isLiveClock ? "animate-pulse" : ""}`}>
                {isLiveClock && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                {isPausedClock && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />}
                <span className={`relative inline-flex h-3 w-3 rounded-full ${isLiveClock ? "bg-emerald-500" : isPausedClock ? "bg-orange-500" : selectedClock.mode === "scheduled" ? "bg-amber-400" : "bg-slate-400"}`} />
              </span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-100">{selectedClock.label}</p>
            </div>
            <Clock3 className={isLiveClock ? "animate-spin text-emerald-600 [animation-duration:3s]" : isPausedClock ? "text-orange-600" : "text-slate-400"} size={20} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {timeParts(selectedClock.remaining).map((part) => <ClockSegment key={part.label} {...part} active={isLiveClock} />)}
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className={`h-full rounded-full transition-all duration-1000 ${isLiveClock ? "bg-emerald-500" : isPausedClock ? "bg-orange-500" : "bg-amber-400"}`} style={{ width: `${selectedClock.progress}%` }} />
          </div>
          <p className="mt-2 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{selectedStartExam ? selectedStartExam.title : "Create an exam to show the clock."}</p>
        </div>

        <button className="btn-primary min-h-11 px-6" type="button" onClick={startSelectedExam} disabled={!selectedStartExam || savingId === selectedStartExam?._id}>
          <PlayCircle size={18} /> {savingId === selectedStartExam?._id ? "Starting..." : "Start Exam"}
        </button>
        <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${selectedStartExam?.isPaused ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-orange-500 text-white hover:bg-orange-600"}`} type="button" onClick={toggleSelectedPause} disabled={!selectedStartExam || savingId === selectedStartExam?._id}>
          {selectedStartExam?.isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
          {selectedStartExam?.isPaused ? "Resume Exam" : "Pause Exam"}
        </button>
      </section>

      <DataTable columns={[
        { key: "title", label: "Exam" },
        { key: "course", label: "Course", render: (row) => row.courseId?.courseName },
        { key: "status", label: "Status", render: (row) => {
          const status = examStatus(row, now.getTime());
          return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>;
        } },
        { key: "durationMinutes", label: "Duration", render: (row) => `${row.durationMinutes} min` },
        { key: "extraTimeMinutes", label: "Extra Time", render: (row) => `${row.extraTimeMinutes || 0} min` },
        { key: "passPercentage", label: "Pass %", render: (row) => `${row.passPercentage}%` },
        { key: "startDate", label: "Starts", render: (row) => formatDateTime(row.startDate) },
        { key: "endDate", label: "Ends", render: (row) => formatDateTime(row.endDate) },
        { key: "actions", label: "Actions", render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary px-2" onClick={() => setDeleteTarget(row)} title="Delete exam"><Trash2 size={16} /></button>
          </div>
        ) }
      ]} rows={exams} />
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-[#111a2b]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-slate-100">Delete exam?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This will permanently delete <span className="font-semibold text-slate-950 dark:text-slate-100">{deleteTarget.title}</span> and all of its questions.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="btn-secondary" type="button" onClick={() => setDeleteTarget(null)} disabled={savingId === deleteTarget._id}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300" type="button" onClick={removeExam} disabled={savingId === deleteTarget._id}>
                <Trash2 size={16} /> {savingId === deleteTarget._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === "exam" && (
        <Modal title="Create Exam" onClose={() => setModal(null)}>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveExam}>
            <select className="input sm:col-span-2" value={examForm.courseId} onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value })} required>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course._id} value={course._id}>{course.courseCode} - {course.courseName}</option>)}
            </select>
            <input className="input sm:col-span-2" placeholder="Exam title" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} required />
            <input className="input" type="number" placeholder="Duration minutes" value={examForm.durationMinutes} onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })} required />
            <input className="input" type="number" min="0" placeholder="Extra time minutes" value={examForm.extraTimeMinutes} onChange={(e) => setExamForm({ ...examForm, extraTimeMinutes: e.target.value })} />
            <input className="input" type="number" placeholder="Total marks" value={examForm.totalMarks} onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })} required />
            <input className="input" type="number" placeholder="Pass percentage" value={examForm.passPercentage} onChange={(e) => setExamForm({ ...examForm, passPercentage: e.target.value })} required />
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              <span>Start time</span>
              <input className="input" type="datetime-local" value={examForm.startDate} onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })} required />
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              <span>End time</span>
              <input className="input" type="datetime-local" value={examForm.endDate} onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })} required />
            </label>
            <textarea className="input sm:col-span-2" placeholder="Description" value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} />
            <button className="btn-primary sm:col-span-2">Save Exam</button>
          </form>
        </Modal>
      )}
      {modal === "extraTime" && (
        <Modal title="Add Extra Time" onClose={() => setModal(null)}>
          <form className="grid gap-3" onSubmit={addExtraTime}>
            <label className="space-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span>Exam</span>
              <select className="input" value={extraTimeForm.examId} onChange={(e) => setExtraTimeForm({ ...extraTimeForm, examId: e.target.value })} required>
                <option value="">Select exam</option>
                {exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title} - {exam.courseId?.courseCode || exam.courseId?.courseName || "Course"}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span>Extra time minutes</span>
              <input className="input" type="number" min="1" value={extraTimeForm.minutes} onChange={(e) => setExtraTimeForm({ ...extraTimeForm, minutes: e.target.value })} required />
            </label>
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">This adds minutes to the exam extra time and extends the end time for students.</p>
            <button className="btn-primary" disabled={savingId === extraTimeForm.examId}><Clock3 size={16} /> {savingId === extraTimeForm.examId ? "Adding..." : "Add Extra Time"}</button>
          </form>
        </Modal>
      )}
      {modal === "question" && (
        <Modal title="Add Question" onClose={() => setModal(null)}>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveQuestion}>
            <select className="input sm:col-span-2" value={questionForm.examId} onChange={(e) => setQuestionForm({ ...questionForm, examId: e.target.value })} required>
              <option value="">Select exam</option>
              {exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title}</option>)}
            </select>
            <textarea className="input sm:col-span-2" placeholder="Question text" value={questionForm.questionText} onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })} required />
            {["A", "B", "C", "D"].map((letter) => <input key={letter} className="input" placeholder={`Option ${letter}`} value={questionForm[`option${letter}`]} onChange={(e) => setQuestionForm({ ...questionForm, [`option${letter}`]: e.target.value })} required />)}
            <select className="input" value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}>
              {["A", "B", "C", "D"].map((letter) => <option key={letter}>{letter}</option>)}
            </select>
            <input className="input" type="number" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })} />
            <button className="btn-primary sm:col-span-2">Save Question</button>
          </form>
        </Modal>
      )}
    </div>
  );
}