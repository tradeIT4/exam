export default function DataTable({ columns, rows, empty = "No records found" }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm text-slate-700 dark:text-slate-200">
          <thead className="bg-blue-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-[#17324d] dark:text-slate-300">
            <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
            {rows?.length ? rows.map((row, index) => (
              <tr key={row._id || index} className="bg-white transition hover:bg-slate-50 dark:bg-[#111a2b] dark:hover:bg-[#17223a]">
                {columns.map((column) => <td key={column.key} className="px-4 py-3 align-top">{column.render ? column.render(row) : row[column.key]}</td>)}
              </tr>
            )) : (
              <tr className="bg-white dark:bg-[#111a2b]"><td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}