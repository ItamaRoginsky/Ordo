import type { Item, Column, ColumnValue } from "@prisma/client";

type ItemWithValues = Item & { columnValues: ColumnValue[] };

function CellValue({ type, value }: { type: string; value: unknown }) {
  if (value == null || value === "") return <span className="text-gray-300">—</span>;

  switch (type) {
    case "status":
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {String(value)}
        </span>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          readOnly
          className="w-4 h-4 accent-blue-600 cursor-default"
        />
      );
    case "date":
      return <span className="text-gray-600 text-xs">{String(value)}</span>;
    default:
      return <span className="text-gray-700 text-sm">{String(value)}</span>;
  }
}

export function ItemRow({ item, columns }: { item: ItemWithValues; columns: Column[] }) {
  function getCellValue(columnId: string) {
    const cv = item.columnValues.find((v) => v.columnId === columnId);
    if (!cv) return null;
    try {
      return JSON.parse(cv.value);
    } catch {
      return cv.value;
    }
  }

  return (
    <div className="flex items-center border-b border-gray-100 hover:bg-blue-50/40 group transition-colors">
      <div className="w-80 shrink-0 px-4 py-2.5 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <span className="text-sm text-gray-800 truncate">{item.name}</span>
      </div>
      {columns.map((col) => (
        <div key={col.id} className="w-36 shrink-0 px-3 py-2.5 flex items-center justify-center">
          <CellValue type={col.type} value={getCellValue(col.id)} />
        </div>
      ))}
    </div>
  );
}
