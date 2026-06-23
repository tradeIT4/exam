import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Globe2, Lock, Monitor, Power, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import logoUrl from "../logo/download.png";

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [resetMessage, setResetMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(() => {
    return new URLSearchParams(window.location.search).get("expired") === "true";
  });
  const { register, handleSubmit } = useForm({
    defaultValues: { identifier: "", password: "" }
  });

  if (user) return <Navigate to={user.role === "ADMIN" ? "/admin" : "/student"} replace />;

  async function onSubmit(values) {
    setError("");
    setSessionExpired(false);
    try {
      const loggedIn = await login({ identifier: values.identifier, password: values.password });
      navigate(loggedIn.role === "ADMIN" ? "/admin" : "/student");
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError("Cannot reach the backend API. Make sure the server is running on http://localhost:5000.");
      } else {
        setError(err.message || "Login failed");
      }
    }
  }


  return (
    <main className="min-h-screen bg-[#d9eef8] px-4 py-8 text-slate-950 sm:px-8 lg:flex lg:items-center lg:justify-center">
      <section className="relative mx-auto grid min-h-[620px] w-full max-w-7xl overflow-hidden bg-white shadow-[0_28px_80px_rgba(15,84,122,0.25)] lg:grid-cols-[1.04fr_0.96fr]">
        <button type="button" className="absolute left-7 top-7 z-10 text-slate-900" aria-label="Back to home" onClick={() => navigate("/")}>
          <ArrowLeft size={34} strokeWidth={2.8} />
        </button>

        <div className="relative hidden overflow-hidden bg-[#f4fbff] lg:block">
          <div className="absolute -top-28 left-72 h-72 w-72 rounded-full bg-[#e1f1f9]" />
          <div className="absolute bottom-[-150px] left-[-70px] h-96 w-96 rounded-full bg-[#e4f4fb]" />
          <div className="absolute bottom-20 right-20 h-32 w-32 rounded-full bg-[#e1f1f9]" />
          <div className="absolute inset-0 flex items-center justify-center p-16">
            <div className="relative h-[430px] w-[560px]">
              <div className="absolute left-16 top-28 h-48 w-72 rounded-[1.5rem] bg-[#302f45] shadow-xl" />
              <div className="absolute left-24 top-36 h-32 w-56 rounded-xl bg-[#343249]" />
              <div className="absolute left-14 top-72 h-8 w-80 rounded-b-xl bg-[#c5d1d8]" />
              <div className="absolute left-[210px] top-[282px] h-4 w-4 rounded-full bg-[#22a7d8]" />
              <div className="absolute left-8 top-10 h-32 w-52 -rotate-12 bg-black [clip-path:polygon(0_35%,100%_0,82%_72%,26%_100%)]" />
              <div className="absolute left-44 top-2 h-36 w-8 -rotate-12 rounded bg-white shadow" />
              <div className="absolute left-48 top-32 h-7 w-7 rounded-full bg-white shadow" />
              <div className="absolute left-72 top-32 flex items-end gap-1">
                <div className="h-12 w-8 rounded-t-full bg-[#1f5c9a]" />
                <div className="h-16 w-10 rounded-t-full bg-[#2b7cc4]" />
                <div className="h-8 w-12 rounded bg-[#ef7b91]" />
              </div>
              <div className="absolute bottom-16 right-24 h-28 w-12 rounded-t-full bg-[#285d93]" />
              <div className="absolute bottom-12 right-16 h-20 w-11 rounded-t-full bg-[#247cc0]" />
              <div className="absolute bottom-8 right-7 h-28 w-5 rotate-[-22deg] rounded-full bg-[#302f45]" />
              <div className="absolute bottom-14 left-64 h-3 w-48 rounded-full bg-[#302f45]" />
              <Monitor className="absolute left-[178px] top-[302px] text-[#8495a0]" size={78} strokeWidth={1.2} />
              <Power className="absolute right-4 top-44 text-[#d5e4ec]" size={48} />
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-white px-6 py-12 sm:px-10">
          <div className="absolute right-10 top-6 hidden items-center gap-2 text-xs text-slate-700 sm:flex">
            <Globe2 size={14} /> www.universityname.ac.in
          </div>

          <div className="w-full max-w-[520px] rounded-2xl bg-white px-4 py-8 sm:px-10">
            <div className="mb-9 text-center">
              <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-2 shadow-[0_16px_35px_rgba(15,84,122,0.16)]">
                <img className="h-full w-full object-contain" src={logoUrl} alt="University logo" />
              </div>
              <h1 className="text-3xl font-semibold tracking-wide text-black">UNIVERSITY NAME</h1>
              <p className="mt-4 text-xl font-semibold uppercase text-[#2c9ad0]">Online Examination Portal</p>
            </div>

            <form className="space-y-7" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="sr-only">Student ID or email</span>
                <div className="flex items-center border-b border-slate-500 focus-within:border-[#2c9ad0]">
                  <UserRound size={18} className="mr-3 text-slate-500" />
                  <input className="w-full bg-transparent py-3 text-base outline-none placeholder:text-slate-400" placeholder="Student ID or email" {...register("identifier", { required: true })} />
                </div>
              </label>

              <label className="block">
                <span className="sr-only">Password</span>
                <div className="flex items-center border-b border-slate-500 focus-within:border-[#2c9ad0]">
                  <Lock size={18} className="mr-3 text-slate-500" />
                  <input className="w-full bg-transparent py-3 text-base outline-none placeholder:text-slate-400" type={showPassword ? "text" : "password"} placeholder="Password" {...register("password", { required: true })} />
                  <button type="button" className="text-slate-500" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                    <Eye size={24} />
                  </button>
                </div>
              </label>


              {sessionExpired && !error && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2.5">
                  <Monitor size={18} className="mt-0.5 shrink-0" />
                  <p><strong>Session Terminated:</strong> You have been logged out because this account was logged in on another browser or device.</p>
                </div>
              )}

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {resetMessage && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{resetMessage}</p>}

              <button className="mx-auto flex w-full max-w-sm items-center justify-center rounded-md bg-[#2b9bd0] px-6 py-4 text-2xl font-semibold text-white shadow-sm transition hover:bg-[#208abd] disabled:bg-sky-200" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}






