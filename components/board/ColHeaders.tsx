import type { Column } from "@prisma/client";
import { Plus } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  status: "Status",
  date: "Date",
  text: "Text",
  number: "Number",
  checkbox: "Check",
};

export function ColHeaders({ columns }: { columns: Column[] }) {
  return (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium uppercase tracking-wider select-none">
      <div className="w-80 shrink-0 px-4 py-2">Item</div>
      {columns.map((col) => (
        <div key={col.id} className="w-36 shrink-0 px-3 py-2 text-center">
          {col.name}
          <span className="ml-1 text-gray-300 normal-case tracking-normal font-normal">
            ({TYPE_LABELS[col.type] ?? col.type})
          </span>
        </div>
      ))}
      <div className="px-3 py-2 text-gray-300 hover:text-gray-500 cursor-pointer">
        <Plus size={14} />
      </div>
    </div>
  );
}
