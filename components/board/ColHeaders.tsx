import { BOARD_ROW_GRID, MOBILE_ROW_GRID } from "@/lib/board-layout";
import { useIsMobile } from "@/hooks/useIsMobile";

// ColHeaders must use BOARD_ROW_GRID so every column aligns with ItemRow.
export function ColHeaders() {
  const isMobile = useIsMobile();
  const grid = isMobile ? MOBILE_ROW_GRID : BOARD_ROW_GRID;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: grid,
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
      {/* Deadline — hidden on mobile */}
      {!isMobile && (
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--text-4)",
          textAlign: "center",
        }}>
          Deadline
        </div>
      )}
      {/* actions — empty, hidden on mobile */}
      {!isMobile && <div />}
    </div>
  );
}
