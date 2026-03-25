// Single source of truth for the board table column grid.
// Used verbatim in ColHeaders, ItemRow, and AddItemRow.
// Columns: [check 36px] [name 1fr] [status 180px] [deadline 120px] [kebab 36px]
export const BOARD_ROW_GRID = "36px minmax(0,1fr) 180px 120px 36px";

// Mobile: hide deadline column, shrink status
// Columns: [check 32px] [name 1fr] [status 110px]
export const MOBILE_ROW_GRID = "32px minmax(0,1fr) 110px";
