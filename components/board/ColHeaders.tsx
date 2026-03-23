import type { Column } from "@prisma/client";

export function ColHeaders({ columns }: { columns: Column[] }) {
  return (
    <div className="flex items-center bg-[#161616] border-b border-white/[0.07] text-[10px] text-white/25 font-semibold uppercase tracking-widest select-none">
      <div className="w-80 shrink-0 px-5 py-2.5">Name</div>
      {columns.map((col) => (
        <div key={col.id} className="w-36 shrink-0 px-3 py-2.5 text-center">
          {col.name}
        </div>
      ))}
    </div>
  );
}
