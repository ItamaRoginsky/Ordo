import { BOARD_ROW_GRID } from "@/lib/board-layout";

// ColHeaders must use BOARD_ROW_GRID so every column aligns with ItemRow.
export function ColHeaders() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: BOARD_ROW_GRID,
        alignItems: "center",
        height: 30,
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* check col — empty */}
      <div />
      {/* Task name */}
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--text-4)",
        paddingLeft: 4,
      }}>
        Task
      </div>
      {/* Status */}
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--text-4)",
        textAlign: "center",
      }}>
        Status
      </div>
      {/* Deadline */}
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--text-4)",
        textAlign: "center",
      }}>
        Deadline
      </div>
      {/* actions — empty */}
      <div />
    </div>
  );
}
