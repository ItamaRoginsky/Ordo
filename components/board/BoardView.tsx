import type { Board, Group, Item, Column, ColumnValue } from "@prisma/client";
import { GroupRow } from "./GroupRow";
import { Plus } from "lucide-react";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };
export type BoardWithData = Board & { groups: GroupWithItems[]; columns: Column[] };

export function BoardView({ board }: { board: BoardWithData }) {
  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="px-8 pt-7 pb-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{board.icon ?? "📋"}</span>
          <h1 className="text-2xl font-semibold text-gray-800">{board.name}</h1>
        </div>
      </div>

      {/* Board body */}
      <div className="flex-1 overflow-auto p-8">
        {board.groups.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">This board is empty</p>
            <p className="text-sm">Add a group to get started</p>
          </div>
        ) : (
          <div className="space-y-6 min-w-max">
            {board.groups.map((group) => (
              <GroupRow key={group.id} group={group} columns={board.columns} />
            ))}
          </div>
        )}

        {/* Add group button */}
        <button className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white border border-dashed border-gray-300 rounded-lg transition-colors">
          <Plus size={14} />
          Add group
        </button>
      </div>
    </div>
  );
}
