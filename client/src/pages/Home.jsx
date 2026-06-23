import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import logoUrl from "../logo/download.png";

export default function Home() {
  const { user } = useAuth();
  const [showStartNotice, setShowStartNotice] = useState(false);

  function handleStartExam() {
    setShowStartNotice(true);
    window.open("/login", "_blank", "noopener,noreferrer");
    window.setTimeout(() => setShowStartNotice(false), 3500);
  }

  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin" : "/student"} replace />;

  return (
    <main className="relative min-h-screen bg-white text-slate-950">
      {showStartNotice && (
        <div className="fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 shadow-[0_18px_45px_rgba(16,185,129,0.22)]" role="status" aria-live="polite">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={24} />
          <div>
            <p className="font-semibold">Login opened</p>
            <p className="mt-1 text-sm text-emerald-800">A new tab is ready. Please sign in to continue.</p>
          </div>
        </div>
      )}

      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,84,122,0.14)]">
              <img className="h-full w-full object-contain" src={logoUrl} alt="University logo" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-wide">UNIVERSITY NAME</p>
              <p className="text-xs text-slate-500">Online Examination System</p>
            </div>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-md bg-[#0f7ead] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#096f9b]" onClick={handleStartExam}>
            Sign in <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8 lg:px-10">
        <div className="mb-8 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,84,122,0.16)]">
          <img className="h-full w-full object-contain" src={logoUrl} alt="University logo" />
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Welcome to the Exam Management System
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Your gateway to seamless online assessments. Access exam schedules, take examinations, view results, and track your academic progress-all in one place.
        </p>

        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Please sign in to continue. Remember to review exam guidelines before starting your test.
        </p>

        <p className="mt-8 text-2xl font-semibold text-[#0f7ead]">Learn. Achieve. Succeed.</p>

        <button type="button" className="mt-10 inline-flex min-h-14 items-center gap-3 rounded-lg bg-[#0f7ead] px-8 py-4 text-lg font-bold text-white shadow-[0_18px_35px_rgba(15,126,173,0.28)] ring-4 ring-[#d7eff8] transition hover:bg-[#096f9b] focus:outline-none focus:ring-4 focus:ring-[#8ed2ec]" onClick={handleStartExam}>
          Sign in to continue
          <ArrowRight size={22} />
        </button>
      </section>
    </main>
  );
}
