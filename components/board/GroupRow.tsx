"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Group, Item, Column, ColumnValue } from "@prisma/client";
import { ColHeaders } from "./ColHeaders";
import { ItemRow } from "./ItemRow";

type ItemWithValues = Item & { columnValues: ColumnValue[] };
type GroupWithItems = Group & { items: ItemWithValues[] };

export function GroupRow({
  group,
  columns,
}: {
  group: GroupWithItems;
  columns: Column[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const color = group.color ?? "#0073ea";

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
        <h3
          className="text-sm font-semibold px-2 py-0.5 rounded"
          style={{ color }}
        >
          {group.name}
        </h3>
        <span className="text-xs text-gray-400">{group.items.length} items</span>
      </div>

      {!collapsed && (
        <div className="ml-5 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          {/* Left color strip */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-tl-xl rounded-bl-xl"
              style={{ backgroundColor: color }}
            />
            <div className="pl-1">
              <ColHeaders columns={columns} />
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} columns={columns} />
              ))}
              {/* Add item */}
              <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                <Plus size={14} />
                Add item
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
