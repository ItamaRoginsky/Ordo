"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NewProjectModal } from "./NewProjectModal";

export function CreateBoardButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg transition-colors"
        style={{ color: "var(--chart-primary)", border: "1px solid var(--border)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Plus size={14} />
        New project
      </button>

      {open && <NewProjectModal onClose={() => setOpen(false)} />}
    </>
  );
}
