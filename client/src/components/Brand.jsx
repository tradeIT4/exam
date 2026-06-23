import logoUrl from "../logo/download.png";

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-white p-1 shadow-soft">
        <img className="h-full w-full object-contain" src={logoUrl} alt="University logo" />
      </div>
      {!compact && (
        <div>
          <p className="text-base font-bold text-ink">University Portal</p>
          <p className="text-xs text-slate-500">Online Examination System</p>
        </div>
      )}
    </div>
  );
}



