import { useEffect, useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, downloadFile } from "../services/api.js";

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "Not set";
}

function buildResultQuery(filters) {
  const params = new URLSearchParams();
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00`);
    const end = new Date(`${filters.date}T23:59:59.999`);
    params.set("from", start.toISOString());
    params.set("to", end.toISOString());
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default function Results() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("completed");
  const [completedRows, setCompletedRows] = useState([]);
  const [activeRows, setActiveRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ courseId: "", date: "" });
  const query = useMemo(() => buildResultQuery(filters), [filters]);

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data));
  }, []);

  useEffect(() => {
    api.get(`/results${query}`).then((res) => setCompletedRows(res.data));
    if (isAdmin) {
      api.get(`/results/active${query}`).then((res) => setActiveRows(res.data));
    }
  }, [isAdmin, query]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({ courseId: "", date: "" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Results</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Results appear after a student submits or when the exam timer finishes.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => downloadFile("/results/export/pdf", "exam-results.pdf")}><Download size={16} /> PDF</button>
            <button className="btn-primary" onClick={() => downloadFile("/results/export/excel", "exam-results.xlsx")}><Download size={16} /> Excel</button>
          </div>
        )}
      </div>

      <section className="grid gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-[#111a2b] md:grid-cols-[1.3fr_1fr_auto] md:items-end">
        <label className="space-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2"><Filter size={16} /> Course</span>
          <select className="input" value={filters.courseId} onChange={(event) => updateFilter("courseId", event.target.value)}>
            <option value="">All courses</option>
            {courses.map((course) => <option key={course._id} value={course._id}>{course.courseCode} - {course.courseName}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span>Exam date</span>
          <input className="input" type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} />
        </label>
        <button className="btn-secondary h-10" type="button" onClick={resetFilters}>Reset</button>
      </section>

      {isAdmin && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === "completed" ? "border-blue-500 text-blue-600 dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed Exams ({completedRows.length})
          </button>
          <button
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === "active" ? "border-blue-500 text-blue-600 dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            onClick={() => setActiveTab("active")}
          >
            Active Exams ({activeRows.length})
          </button>
        </div>
      )}

      {activeTab === "completed" ? (
        <DataTable columns={[
          ...(isAdmin ? [{ key: "student", label: "Student", render: (row) => (
            <div>
              <p className="font-semibold text-slate-950 dark:text-slate-100">{row.studentId?.name}</p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.studentId?.enrollmentNumber || row.studentId?.email}</p>
            </div>
          ) }] : []),
          { key: "course", label: "Course", render: (row) => row.examId?.courseId?.courseName },
          { key: "exam", label: "Exam", render: (row) => row.examId?.title },
          { key: "submittedAt", label: "Submitted / Finished", render: (row) => formatDateTime(row.submittedAt) },
          { key: "score", label: "Score" },
          { key: "percentage", label: "Percentage", render: (row) => `${row.percentage}%` },
          { key: "status", label: "Status", render: (row) => <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === "PASS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}>{row.status}</span> }
        ]} rows={completedRows} />
      ) : (
        <DataTable columns={[
          { key: "student", label: "Student", render: (row) => (
            <div>
              <p className="font-semibold text-slate-950 dark:text-slate-100">{row.studentId?.name}</p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.studentId?.enrollmentNumber || row.studentId?.email}</p>
            </div>
          ) },
          { key: "course", label: "Course", render: (row) => row.examId?.courseId?.courseName },
          { key: "exam", label: "Exam", render: (row) => row.examId?.title },
          { key: "startedAt", label: "Started At", render: (row) => formatDateTime(row.startedAt) },
          { key: "duration", label: "Exam Duration", render: (row) => `${(row.examId?.durationMinutes || 0) + (row.examId?.extraTimeMinutes || 0)} min` },
          { key: "extraTime", label: "Exam Extra Time", render: (row) => row.examId?.extraTimeMinutes ? <span className="font-semibold text-amber-600 dark:text-amber-400">+{row.examId.extraTimeMinutes} min</span> : "None" }
        ]} rows={activeRows} empty="No students are currently taking any exams." />
      )}
    </div>
  );
}