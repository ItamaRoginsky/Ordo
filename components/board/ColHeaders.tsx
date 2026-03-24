import type { Column } from "@prisma/client";

export function ColHeaders({ columns }: { columns: Column[] }) {
  return (
    <div className="flex items-center text-[10px] font-semibold uppercase tracking-widest select-none" style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)", color: "var(--text-4)" }}>
      <div className="w-80 shrink-0 px-5 py-2.5">Name</div>
      {columns.map((col) => (
        <div key={col.id} className="w-36 shrink-0 px-3 py-2.5 text-center">
          {col.name}
        </div>
      ))}
    </div>
  );
}
