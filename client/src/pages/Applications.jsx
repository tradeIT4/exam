import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Eye, FileCheck2, GraduationCap, Printer, Search, UserRound } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { api, assetUrl } from "../services/api.js";

function fullName(person = {}) {
  return [person.firstName, person.lastName, person.grandfatherName].filter(Boolean).join(" ") || "Not provided";
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not set";
}

function valueOrDash(value) {
  return value || "-";
}

function printApplication(application) {
  if (!application) return;

  const personal = application.personalInformation || {};
  const training = application.trainingInformation || {};
  const employment = application.employmentInformation || {};
  const assessment = application.assessmentInformation || {};
  const sections = [
    ["Personal Information", [
      ["Full Name", fullName(personal)],
      ["Gender", personal.gender],
      ["Age", personal.age],
      ["Nationality", personal.nationality],
      ["Phone", personal.phoneNumber],
      ["Email", personal.email],
      ["Sub City", personal.subCity],
      ["Woreda", personal.woreda],
      ["Address", personal.address],
      ["Marital Status", personal.maritalStatus],
      ["Physical Disability", personal.physicalDisability],
      ["Disability Description", personal.disabilityDescription]
    ]],
    ["Training Information", [
      ["Occupation", training.occupation],
      ["Assessment Level", training.assessmentLevel],
      ["College/Institute", training.collegeInstituteName],
      ["Institution Type", training.institutionType],
      ["Training Start Year", training.trainingStartYear],
      ["Training End Year", training.trainingEndYear],
      ["Training Mode", training.trainingMode],
      ["Training Type", training.trainingType],
      ["Cooperative Training", training.cooperativeTraining]
    ]],
    ["Employment Information", [
      ["Employment Status", employment.employmentStatus],
      ["Company Name", employment.companyName],
      ["Company Category", employment.companyCategory]
    ]],
    ["Assessment Information", [
      ["Register For", assessment.registerFor],
      ["Assessment Type", assessment.assessmentType],
      ["Agreement", application.agreementAccepted ? "Confirmed" : "Not confirmed"],
      ["Passport Photo", application.passportPhoto?.originalName],
      ["FAYADA / National ID", application.fayadaDigitalId?.originalName]
    ]]
  ];

  const escapeHtml = (value) => String(valueOrDash(value))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const rows = sections.map(([title, items]) => `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <div class="grid">
        ${items.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      </div>
    </section>
  `).join("");
  const photoUrl = assetUrl(application.passportPhoto?.path);
  const fayadaUrl = assetUrl(application.fayadaDigitalId?.path);
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>Application ${escapeHtml(application.applicationNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; color: #172b4d; font-family: Arial, sans-serif; background: #fff; }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #0b5cab; padding-bottom: 18px; margin-bottom: 18px; }
    h1 { margin: 0 0 8px; color: #0b5cab; font-size: 24px; }
    h2 { margin: 22px 0 10px; color: #0b5cab; font-size: 16px; border-bottom: 1px solid #d8e6f7; padding-bottom: 6px; }
    .meta { text-align: right; font-size: 12px; line-height: 1.6; }
    .photo { width: 112px; height: 140px; border: 1px solid #b9cce4; object-fit: cover; background: #f5f8fc; }
    .attachments { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .attachment-card { border: 1px solid #d8e6f7; border-radius: 10px; padding: 10px; break-inside: avoid; background: #fff; }
    .attachment-card img { display: block; width: 100%; height: 260px; object-fit: contain; border: 1px solid #eef3f9; border-radius: 8px; background: #f8fbff; }
    .national-id-card { grid-column: span 2; }
    .national-id-card img { height: 360px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .grid div { min-height: 50px; border: 1px solid #d8e6f7; border-radius: 8px; padding: 8px 10px; }
    span { display: block; margin-bottom: 4px; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    strong { display: block; color: #172b4d; font-size: 13px; word-break: break-word; }
    .files { display: flex; gap: 12px; margin-top: 18px; font-size: 12px; }
    .files a { color: #0b5cab; font-weight: 700; }
    footer { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 12px; }
    .line { margin-top: 42px; border-top: 1px solid #172b4d; padding-top: 6px; }
    @media print { body { padding: 18px; } button { display: none; } .grid div { break-inside: avoid; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Online Competency Assessment Registration</h1>
      <strong>Application Number: ${escapeHtml(application.applicationNumber)}</strong>
      <p>Applicant: ${escapeHtml(fullName(personal))}</p>
    </div>
    <div class="meta">
      <div>Submitted: ${escapeHtml(formatDate(application.submittedAt || application.createdAt))}</div>
      ${photoUrl ? `<img class="photo" src="${escapeHtml(photoUrl)}" alt="Passport photo" />` : ""}
    </div>
  </header>
  ${rows}
  <section>
    <h2>Uploaded Documents</h2>
    <div class="attachments">
      ${photoUrl ? `<div class="attachment-card"><span>Passport Photo</span><img src="${escapeHtml(photoUrl)}" alt="Passport photo" /></div>` : ""}
      ${fayadaUrl ? `<div class="attachment-card national-id-card"><span>FAYADA / National ID</span><img src="${escapeHtml(fayadaUrl)}" alt="FAYADA National ID" /></div>` : ""}
    </div>
  </section>
  <div class="files">
    ${photoUrl ? `<a href="${escapeHtml(photoUrl)}" target="_blank">Passport Photo</a>` : ""}
    ${fayadaUrl ? `<a href="${escapeHtml(fayadaUrl)}" target="_blank">FAYADA / National ID</a>` : ""}
  </div>
  <footer>
    <div class="line">Applicant Signature</div>
    <div class="line">Officer Signature / Stamp</div>
  </footer>
  <script>
    window.onload = () => {
      const images = Array.from(document.images);
      const waits = images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; }));
      Promise.all(waits).then(() => { window.focus(); window.print(); });
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}
function DetailSection({ title, icon: Icon, items }) {
  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-800 dark:bg-[#111a2b]">
      <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0f88d2] dark:bg-[#17324d] dark:text-sky-300">
          <Icon size={18} />
        </span>
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-[#0f172a]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{value || "Not provided"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Applications() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/applications?search=${encodeURIComponent(search)}`);
        if (!cancelled) setRows(response.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load applications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const stats = useMemo(() => {
    const theory = rows.filter((row) => row.assessmentInformation?.registerFor === "Theory").length;
    const practical = rows.filter((row) => row.assessmentInformation?.registerFor === "Practical").length;
    const both = rows.filter((row) => row.assessmentInformation?.registerFor === "Both").length;
    return [
      { label: "Total Applications", value: rows.length },
      { label: "Theory", value: theory },
      { label: "Practical", value: practical },
      { label: "Both", value: both }
    ];
  }, [rows]);

  const columns = [
    {
      key: "applicationNumber",
      label: "Application No.",
      render: (row) => <span className="font-mono text-xs font-bold text-blue-700 dark:text-sky-400">{row.applicationNumber}</span>
    },
    {
      key: "applicant",
      label: "Applicant",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{fullName(row.personalInformation)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.personalInformation?.phoneNumber || "No phone"}</p>
        </div>
      )
    },
    { key: "occupation", label: "Occupation", render: (row) => row.trainingInformation?.occupation || "Not provided" },
    { key: "level", label: "Level", render: (row) => row.trainingInformation?.assessmentLevel || "Not provided" },
    {
      key: "registerFor",
      label: "Register For",
      render: (row) => (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-[#17324d] dark:text-sky-300">
          {row.assessmentInformation?.registerFor || "Not set"}
        </span>
      )
    },
    { key: "assessmentType", label: "Type", render: (row) => row.assessmentInformation?.assessmentType || "Not set" },
    { key: "submittedAt", label: "Submitted", render: (row) => formatDate(row.submittedAt || row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => setSelected(row)}>
            <Eye size={14} /> View
          </button>
          <button className="btn-secondary" type="button" onClick={() => printApplication(row)}>
            <Printer size={14} /> Print
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="break-words text-2xl font-bold">Assessment Applications</h2>
          <p className="break-words text-sm text-slate-500 dark:text-slate-400">View online competency assessment registration submissions.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">{stat.value}</p>
          </div>
        ))}
      </div>

      <label className="relative block w-full max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input className="input pl-9" placeholder="Search by name, phone, application no." value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {loading && <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading applications...</div>}

      <DataTable columns={columns} rows={rows} empty="No assessment applications found" />

      {selected && (
        <Modal title={`Application ${selected.applicationNumber}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-slate-800 dark:bg-[#17324d] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">Applicant</p>
                <p className="text-lg font-bold text-slate-950 dark:text-slate-100">{fullName(selected.personalInformation)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Submitted {formatDate(selected.submittedAt || selected.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f88d2] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700" type="button" onClick={() => printApplication(selected)}>
                  <Printer size={16} /> Print Application
                </button>
              </div>
            </div>

            {(selected.passportPhoto?.path || selected.fayadaDigitalId?.path) && (
              <section className="grid gap-4 rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-800 dark:bg-[#111a2b] md:grid-cols-2">
                {selected.passportPhoto?.path && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Passport Photo</p>
                    <img className="h-64 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain dark:border-slate-700 dark:bg-[#0f172a]" src={assetUrl(selected.passportPhoto.path)} alt="Passport" />
                  </div>
                )}
                {selected.fayadaDigitalId?.path && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">FAYADA / National ID</p>
                    <img className="h-64 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain dark:border-slate-700 dark:bg-[#0f172a]" src={assetUrl(selected.fayadaDigitalId.path)} alt="FAYADA National ID" />
                  </div>
                )}
              </section>
            )}

            <DetailSection title="Personal Information" icon={UserRound} items={[
              ["Full Name", fullName(selected.personalInformation)],
              ["Gender", selected.personalInformation?.gender],
              ["Age", selected.personalInformation?.age],
              ["Nationality", selected.personalInformation?.nationality],
              ["Phone", selected.personalInformation?.phoneNumber],
              ["Email", selected.personalInformation?.email],
              ["Sub City", selected.personalInformation?.subCity],
              ["Woreda", selected.personalInformation?.woreda],
              ["Address", selected.personalInformation?.address],
              ["Marital Status", selected.personalInformation?.maritalStatus],
              ["Physical Disability", selected.personalInformation?.physicalDisability],
              ["Disability Description", selected.personalInformation?.disabilityDescription]
            ]} />

            <DetailSection title="Training Information" icon={GraduationCap} items={[
              ["Occupation", selected.trainingInformation?.occupation],
              ["Assessment Level", selected.trainingInformation?.assessmentLevel],
              ["College/Institute", selected.trainingInformation?.collegeInstituteName],
              ["Institution Type", selected.trainingInformation?.institutionType],
              ["Training Start Year", selected.trainingInformation?.trainingStartYear],
              ["Training End Year", selected.trainingInformation?.trainingEndYear],
              ["Training Mode", selected.trainingInformation?.trainingMode],
              ["Training Type", selected.trainingInformation?.trainingType],
              ["Cooperative Training", selected.trainingInformation?.cooperativeTraining]
            ]} />

            <DetailSection title="Employment Information" icon={BriefcaseBusiness} items={[
              ["Employment Status", selected.employmentInformation?.employmentStatus],
              ["Company Name", selected.employmentInformation?.companyName],
              ["Company Category", selected.employmentInformation?.companyCategory]
            ]} />

            <DetailSection title="Assessment Information" icon={FileCheck2} items={[
              ["Register For", selected.assessmentInformation?.registerFor],
              ["Assessment Type", selected.assessmentInformation?.assessmentType],
              ["Agreement", selected.agreementAccepted ? "Confirmed" : "Not confirmed"],
              ["Photo File", selected.passportPhoto?.originalName],
              ["FAYADA / National ID File", selected.fayadaDigitalId?.originalName]
            ]} />
          </div>
        </Modal>
      )}
    </div>
  );
}

