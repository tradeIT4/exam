import { useEffect, useState } from "react";
import { Plus, Search, UserPlus, Copy, Check, Eye, EyeOff } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { api } from "../services/api.js";

export default function Students() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", batchYear: new Date().getFullYear(), trainingTaken: "", password: "" });

  const trainingOptions = [
    "Coffee Cupping",
    "Barista",
    "International Import/Export"
  ];
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get(`/users/students?search=${encodeURIComponent(search)}`).then((res) => setRows(res.data));
  }
  useEffect(load, [search]);

  async function toggle(row) {
    await api.patch(`/users/students/${row._id}/active`, { isActive: !row.isActive });
    load();
  }

  function openModal() {
    setForm({ name: "", batchYear: new Date().getFullYear(), trainingTaken: "", password: "" });
    setCreated(null);
    setError("");
    setShowPassword(false);
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setCreated(null);
    setError("");
    if (created) load();
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/users/students", {
        name: form.name,
        batchYear: Number(form.batchYear),
        trainingTaken: form.trainingTaken,
        password: form.password
      });
      setCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  }

  function copyId() {
    if (!created) return;
    navigator.clipboard.writeText(created.enrollmentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Generate batch year options from 2015 to current year
  const currentYear = new Date().getFullYear();
  const batchYears = [];
  for (let y = currentYear; y >= 2015; y--) {
    batchYears.push(y);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-sm text-slate-500">Search, activate, deactivate, and add student accounts.</p>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <UserPlus size={16} /> Add Student
        </button>
      </div>
      <label className="relative block max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input className="input pl-9" placeholder="Search students" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <DataTable columns={[
        { key: "name", label: "Full Name" },
        { key: "enrollmentNumber", label: "Student ID", render: (row) => (
          <span className="font-mono text-xs font-semibold tracking-wide text-blue-700 dark:text-sky-400">
            {row.enrollmentNumber || "—"}
          </span>
        )},
        { key: "batchYear", label: "Batch Year", render: (row) => row.batchYear || "—" },
        { key: "trainingTaken", label: "Training Taken", render: (row) => row.trainingTaken || "Not assigned" },
        { key: "isActive", label: "Status", render: (row) => (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${row.isActive ? "bg-emerald-500" : "bg-red-500"}`}></span>
            {row.isActive ? "Active" : "Inactive"}
          </span>
        )},
        { key: "actions", label: "Actions", render: (row) => <button className="btn-secondary" onClick={() => toggle(row)}>{row.isActive ? "Deactivate" : "Activate"}</button> }
      ]} rows={rows} />

      {modal && (
        <Modal title={created ? "Student Created" : "Add New Student"} onClose={closeModal}>
          {!created ? (
            <form className="space-y-4" onSubmit={save}>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  placeholder="Enter student's full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Batch Year <span className="text-red-500">*</span></label>
                <select
                  className="input"
                  value={form.batchYear}
                  onChange={(e) => setForm({ ...form, batchYear: Number(e.target.value) })}
                  required
                >
                  {batchYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Training Program <span className="text-red-500">*</span></label>
                <select
                  className="input"
                  value={form.trainingTaken}
                  onChange={(e) => setForm({ ...form, trainingTaken: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a training program</option>
                  {trainingOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Set password (min 6 characters)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button className="btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      Creating...
                    </span>
                  ) : (
                    <><UserPlus size={16} /> Create Student</>
                  )}
                </button>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Check size={20} />
                  <span className="text-sm font-semibold">Student registered successfully!</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Full Name</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{created.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Student ID</span>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-lg font-bold tracking-wider text-blue-700 dark:text-sky-400">{created.enrollmentNumber}</p>
                      <button
                        className="rounded-md border border-blue-200 bg-white p-1.5 text-blue-600 transition hover:bg-blue-50 dark:border-slate-700 dark:bg-[#111a2b] dark:text-sky-400 dark:hover:bg-slate-800"
                        onClick={copyId}
                        title="Copy Student ID"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Batch Year</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{created.batchYear}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Training Program</span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{created.trainingTaken}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The student can log in using their <strong>Student ID</strong> ({created.enrollmentNumber}) and the password you set.
              </p>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={() => { setCreated(null); setForm({ name: "", batchYear: new Date().getFullYear(), trainingTaken: "", password: "" }); setShowPassword(false); }}>
                  <UserPlus size={16} /> Add Another
                </button>
                <button className="btn-secondary" onClick={closeModal}>Close</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
