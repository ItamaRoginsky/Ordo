# Ordo — Complete Project Reference for AI Assistants

> **Purpose:** This file gives any AI assistant complete context about the Ordo codebase from zero. Read this before making any changes or answering any questions.

---

## 1. WHAT IS ORDO?

Ordo is a **personal task management & project planning web app** built for one user (the owner) plus optional admin-managed team members. Think Notion + Linear combined with a daily planner. Key views:

- **My Day** — daily planner with priority-grouped tasks
- **Goals** — weekly goals tracker with colored goal cards
- **My Month** — calendar with drag-drop task scheduling
- **Projects/Boards** — Notion-style boards with table and kanban views
- **Dashboard** — KPI stats, charts, daily glance
- **Done / Overdue** — archive & overdue tracker

All data is **per-user** (not multi-tenant team collaboration). Auth is handled by Auth0.

---

## 2. TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, TypeScript) | 16.2.1 |
| UI library | React | 19.2.14 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS + CSS variables | 4.2.2 |
| ORM | Prisma with libSQL adapter | 6.19.2 |
| Database | LibSQL (SQLite-compatible, Turso) | 0.17.2 |
| Auth | Auth0 (@auth0/nextjs-auth0) | 4.16.0 |
| Data fetching | TanStack React Query | 5.95.1 |
| Client state | Zustand | 5.0.12 |
| Drag & Drop | @dnd-kit (core + sortable) | 6.3.1 / 10.0.0 |
| Accessible UI | Radix UI (Dialog, Dropdown, Popover) | various |
| Icons | Lucide React | 1.0.1 |
| Charts | Recharts | 3.8.0 |
| Toasts | Sonner | 2.0.7 |
| Date utils | date-fns | 4.1.0 |
| Class merge | clsx + tailwind-merge | 2.1.1 / 3.5.0 |
| Error tracking | Sentry | 10.45.0 |
| Analytics | Vercel Analytics | 2.0.1 |
| Rate limiting | Upstash Redis + ratelimit | 1.37.0 |
| Google Calendar | OAuth 2.0 (custom implementation) | — |

---

## 3. PROJECT STRUCTURE

```
/Ordo
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: Auth0, Theme, Toaster, Analytics
│   ├── globals.css               # CSS variables (theme), all animations, utility classes
│   ├── dashboard/page.tsx        # Home dashboard with KPI cards and charts
│   ├── today/page.tsx            # Daily planner (My Day)
│   ├── week/page.tsx             # Weekly goals (Goals)
│   ├── month/page.tsx            # Monthly calendar
│   ├── done/page.tsx             # Completed tasks archive
│   ├── overdue/page.tsx          # Overdue tasks
│   ├── boards/[boardId]/page.tsx # Project board (server component entry)
│   ├── login/page.tsx            # Login screen
│   ├── admin/
│   │   └── users/page.tsx        # Admin: user management
│   └── api/                      # ~40 API route handlers
│       ├── items/                # CRUD items
│       ├── boards/               # CRUD boards
│       ├── groups/               # CRUD groups + reorder
│       ├── columns/              # CRUD columns
│       ├── column-values/        # Update cell values
│       ├── custom-fields/        # CRUD custom fields
│       ├── custom-field-values/  # Update custom field values
│       ├── comments/             # Item comments
│       ├── stats/                # Dashboard KPIs
│       ├── today/                # Daily tasks API
│       ├── weekly/               # Weekly goals API
│       ├── month/                # Calendar API
│       ├── done/                 # Completed tasks API
│       ├── overdue/              # Overdue tasks API
│       ├── search/               # Global search
│       ├── me/                   # Current user profile
│       ├── daily-glance/         # Dashboard widget data
│       ├── gcal/                 # Google Calendar integration
│       │   ├── auth/             # OAuth initiation
│       │   ├── callback/         # OAuth callback + token storage
│       │   ├── status/           # Check if connected
│       │   └── export/           # Export tasks to Google Calendar
│       └── admin/                # Admin-only routes
│           ├── users/            # List, suspend, restore users
│           ├── create-user/      # Admin-create user
│           └── settings/         # App-level settings
├── components/
│   ├── AppShell.tsx              # Server wrapper around AppShellClient
│   ├── AppShellClient.tsx        # Desktop/mobile layout shell
│   ├── QueryProvider.tsx         # React Query client setup
│   ├── GlobalShortcuts.tsx       # Keyboard shortcut handler (Cmd+K)
│   ├── sidebar/
│   │   └── Sidebar.tsx           # Desktop sidebar nav (224px)
│   ├── board/
│   │   ├── BoardView.tsx         # Table + Kanban view switcher
│   │   ├── KanbanView.tsx        # Kanban columns with DnD
│   │   ├── GroupRow.tsx          # Group section header + item rows
│   │   ├── ItemRow.tsx           # Single task row (table view)
│   │   ├── ColHeaders.tsx        # Column header row
│   │   ├── StatusPill.tsx        # Inline status selector
│   │   └── NewProjectModal.tsx   # Create board modal
│   ├── tasks/
│   │   ├── TaskDetailPanel.tsx   # Full task editor modal (895 lines)
│   │   ├── TaskDetailModal.tsx   # Lightweight task detail view (524 lines)
│   │   └── AddTaskModal.tsx      # Quick task creation modal (555 lines)
│   ├── dashboard/
│   │   ├── DailyGlance.tsx       # Priority breakdown widget
│   │   └── DayProgress.tsx       # Donut chart progress widget
│   ├── columns/
│   │   ├── StatusCell.tsx        # Inline status editor
│   │   ├── PriorityCell.tsx      # Inline priority editor
│   │   └── DateCell.tsx          # Inline date editor
│   ├── ui/
│   │   └── DatePicker.tsx        # Reusable date picker (Radix Popover)
│   ├── search/
│   │   └── CommandPalette.tsx    # Cmd+K global search overlay
│   └── admin/
│       ├── CreateUserModal.tsx
│       └── ChangePasswordModal.tsx
├── lib/
│   ├── auth.ts                   # Auth0 user sync + inbox creation
│   ├── theme.tsx                 # ThemeProvider + useTheme hook
│   ├── toast.ts                  # Sonner wrapper (t.success/error/info/promise)
│   ├── utils.ts                  # cn() = clsx + tailwind-merge
│   ├── board-layout.ts           # CSS Grid column templates for board rows
│   └── prisma.ts                 # Prisma client singleton
├── hooks/
│   ├── useIsMobile.ts            # Detects mobile viewport
│   └── useScrollReveal.ts        # IntersectionObserver scroll reveal hook
├── prisma/
│   └── schema.prisma             # Full database schema
└── next.config.ts                # Security headers + Sentry config
```

---

## 4. DATABASE SCHEMA (All Models)

### User
```prisma
model User {
  id            String    @id @default(uuid())
  auth0Id       String    @unique       // Auth0 subject claim
  email         String    @unique
  name          String?
  picture       String?                 // URL (DiceBear or Auth0 avatar)
  isAdmin       Boolean   @default(false)
  isActive      Boolean   @default(true) // false = suspended
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  weeklyGoalsTarget Int   @default(5)   // slider setting for weekly goals page

  // Relations
  boards        Board[]
  assignedItems Item[]        @relation("AssignedItems")
  auditLogs     AuditLog[]    @relation("ActorLogs")
  comments      Comment[]
  googleToken   GoogleToken?
  weeklyGoals   WeeklyGoal[]
}
```

### Board (Projects)
```prisma
model Board {
  id        String   @id @default(uuid())
  ownerId   String
  name      String
  icon      String?  // emoji
  color     String?  // hex color for dot in sidebar
  type      String   @default("project")  // "project" | "inbox"
  isSystem  Boolean  @default(false)      // true = inbox board

  owner     User     @relation(...)
  groups    Group[]
  columns   Column[]
  customFields CustomField[]
}
```

### Group (Sections within a board)
```prisma
model Group {
  id       String  @id @default(uuid())
  boardId  String
  name     String
  color    String? // hex color for group header dot
  position Int

  board    Board   @relation(...)
  items    Item[]
}
```

### Item (Tasks)
```prisma
model Item {
  id            String    @id @default(uuid())
  groupId       String
  name          String
  notes         String?   // legacy rich text
  description   String?   // plain text description
  position      Int
  assigneeId    String?   // FK to User
  scheduledDate DateTime? // when task is planned (appears in Today/Month views)
  isToday       Boolean   @default(false) // pinned to today
  completedAt   DateTime? // null = not done
  priority      String?   // "p1" | "p2" | "p3" | "p4"
  category      String?   // user-defined tag/label
  parentId      String?   // FK to Item (subtask relationship)
  deadline      DateTime? // due date (separate from scheduled)
  weeklyGoalId  String?   // FK to WeeklyGoal

  // Relations
  group         Group
  assignee      User?
  parent        Item?     @relation("SubItems", fields: [parentId])
  subItems      Item[]    @relation("SubItems")
  columnValues  ColumnValue[]
  customValues  CustomFieldValue[]
  comments      Comment[]
}
```

### WeeklyGoal
```prisma
model WeeklyGoal {
  id         String   @id @default(uuid())
  userId     String
  weekStart  DateTime // Monday 00:00:00 UTC
  title      String
  isComplete Boolean  @default(false)
  position   Int
  createdAt  DateTime @default(now())

  user  User   @relation(...)
  items Item[] // linked via Item.weeklyGoalId
}
```

### Column & ColumnValue (Custom table columns)
```prisma
model Column {
  id       String     @id @default(uuid())
  boardId  String
  name     String
  type     ColumnType // enum: status | priority | date | text | number | checkbox
  position Int

  board        Board
  columnValues ColumnValue[]
}

model ColumnValue {
  id       String @id @default(uuid())
  itemId   String
  columnId String
  value    String // JSON string (e.g., '"in_progress"' or '"2024-01-15"')

  @@unique([itemId, columnId])
}
```

### CustomField & CustomFieldValue
```prisma
model CustomField {
  id       String @id @default(uuid())
  boardId  String
  name     String
  type     String   // "text" | "url" | "number" | "checkbox"
  position Int
}

model CustomFieldValue {
  id      String @id @default(uuid())
  itemId  String
  fieldId String
  value   String // JSON string
}
```

### Comment
```prisma
model Comment {
  id        String   @id @default(uuid())
  itemId    String
  authorId  String
  text      String
  createdAt DateTime @default(now())

  author User
  item   Item
}
```

### GoogleToken
```prisma
model GoogleToken {
  id           String    @id @default(uuid())
  userId       String    @unique
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  scope        String?

  user User @relation(...)
}
```

### AuditLog
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  actorId    String
  action     String   // e.g., "user.suspend", "board.delete"
  targetId   String?
  targetType String?
  meta       String?  // JSON string with extra info
  createdAt  DateTime @default(now())

  actor User @relation(...)
}
```

### AppSetting
```prisma
model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

---

## 5. AUTHENTICATION FLOW

1. User hits any protected route → Auth0 redirects to login
2. After login, Auth0 callback fires `getOrdoUser()` in `lib/auth.ts`:
   - Reads `session.user.sub` (Auth0 ID)
   - Checks if User exists in DB by `auth0Id`
   - **First login:** Creates user + generates DiceBear avatar + creates "Inbox" system board
   - **Subsequent logins:** Updates `lastLoginAt`
   - **Pre-created users:** Admin can create users by email; they're linked on first login
3. Inactive users (`isActive: false`) are redirected to `/suspended`
4. Admin check: `user.isAdmin` (set manually in DB or via admin API)

**Auth0 session:** JWT-based, managed by `@auth0/nextjs-auth0`. Access via `getSession()` in server components/routes.

**Auth routes:**
- `/api/auth/login` — Auth0 login redirect
- `/api/auth/logout` — Clear session
- `/api/auth/callback` — Auth0 callback
- `/auth/logout` → redirects to `/api/auth/logout`

---

## 6. THEMING SYSTEM

**CSS Variable approach** — all colors are CSS custom properties.

**Dark theme (default):**
```css
--bg-page: #111111
--bg-sidebar: #141414
--bg-card: #1c1c1c
--bg-popover: #252525
--bg-input: rgba(255,255,255,0.05)
--bg-hover: rgba(255,255,255,0.04)
--bg-active: rgba(255,255,255,0.07)
--border: rgba(255,255,255,0.07)
--border-strong: rgba(255,255,255,0.12)
--text-1: rgba(255,255,255,0.90)  /* primary text */
--text-2: rgba(255,255,255,0.45)  /* secondary */
--text-3: rgba(255,255,255,0.25)  /* tertiary */
--text-4: rgba(255,255,255,0.15)  /* disabled/hint */
--accent: #5b9cf6                 /* blue */
--nav-active-border: #5b9cf6
--card-shadow: none
--radius-card: 10px
```

**Light theme (`[data-theme="light"]`):**
```css
--bg-page: #F2F2F7    /* iOS gray */
--bg-sidebar: #F8F8F8
--bg-card: #FFFFFF
--bg-popover: #FFFFFF
--border: #E8E8E8
--text-1: #000000
--accent: #000000     /* black accent in light mode */
--nav-active-border: #000000
--card-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
--radius-card: 12px
```

**Semantic colors (same in both themes):**
```css
--sys-green: #22c55e (dark) / #34C759 (light)
--sys-red: #ef4444 (dark) / #FF3B30 (light)
--sys-orange: #f97316 (dark) / #FF9500 (light)
--chart-primary: #5b9cf6 (dark) / #2563EB (light)
```

**Toggle animation:** Radial reveal using clip-path + CSS keyframe. A div expands from the toggle button position covering the entire viewport. 0.65s duration.

**Theme is set via:** `data-theme="light"` attribute on `<html>`. Default is dark (no attribute).

---

## 7. STYLING CONVENTIONS

**This codebase uses inline styles + Tailwind CSS hybrid approach:**

```tsx
// Inline styles for theme-aware values:
style={{ color: "var(--text-1)", background: "var(--bg-card)" }}

// Tailwind for layout/utility:
className="flex items-center gap-2 rounded-lg transition-colors"

// Both together:
<div className="flex items-center p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
```

**Hover effects** are done via `onMouseEnter`/`onMouseLeave` inline handlers setting `element.style.*`:
```tsx
onMouseEnter={(e) => {
  (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
}}
onMouseLeave={(e) => {
  (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
  (e.currentTarget as HTMLElement).style.background = "transparent";
}}
```

**CSS utility classes** (defined in globals.css):
- `.animate-fade-in-up` — entrance animation (opacity 0→1, translateY 14px→0)
- `.animate-slide-in-left` — slide from left (for sidebar nav)
- `.animate-scale-in` — scale 0.96→1 + fade (for modals)
- `.animate-modal-in` — modal entrance with translate(-50%,-50%) preserved
- `.animate-backdrop-in` — backdrop fade
- `.stagger-1` through `.stagger-6` — animation delays (50ms–300ms)
- `.board-card` — project card with hover lift transition

---

## 8. PRIORITY SYSTEM

| Priority | Key | Color | Usage |
|----------|-----|-------|-------|
| High | `p1` | `#ef4444` (red) | Urgent tasks |
| Medium | `p2` | `#f97316` (orange) | Normal important |
| Low | `p3` | `#5b9cf6` (blue) | Nice to have |
| None | `p4` | `#6b7280` (gray) | Uncategorized |

Priority displayed as:
- **Circles** in Today view (with fill dot on hover)
- **Dots** (7px) in board rows and task detail
- **Colored border** on task cards in kanban
- **Bottom bar color** on KPI cards
- **Label badges** in task detail panel

---

## 9. STATUS SYSTEM

Status is stored as a **JSON string** in `ColumnValue` for the "status" type column.

| Status | Value | Color |
|--------|-------|-------|
| Not started | `"not_started"` | gray `#94a3b8` |
| In progress | `"in_progress"` | blue `#5b9cf6` |
| In review | `"review"` | amber `#f59e0b` |
| Stuck | `"stuck"` | red `#ef4444` |
| Done | `"done"` | green `#22c55e` |

**Important:** Setting status to "done" also sets `completedAt` on the item. Moving from "done" to another status clears `completedAt`.

---

## 10. APP LAYOUT (Desktop vs Mobile)

### Desktop (width > 768px)
```
┌──────────────────────────────────────────┐
│ Sidebar (224px) │ Main content (flex: 1) │
│                 │                        │
│ Logo            │ Page content scrolls   │
│ Search          │ here                   │
│ My Space nav    │                        │
│ Projects list   │                        │
│                 │                        │
│ Admin link      │                        │
│ User footer     │                        │
└──────────────────────────────────────────┘
```

### Mobile (width ≤ 768px)
```
┌──────────────────────────────────────────┐
│ Top bar: [Ordo logo]         [≡ menu]   │ 52px fixed
├──────────────────────────────────────────┤
│                                          │
│              Page content                │
│                                          │
├──────────────────────────────────────────┤
│ [Home] [My Day]  [Month]  [Goals]       │ 56px fixed
└──────────────────────────────────────────┘
```

Mobile slide-in menu (75vw from right) has full navigation.

---

## 11. ALL API ROUTES

### Items
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/items` | Create item. Body: `{groupId, name, priority?, scheduledDate?, isToday?, description?, weeklyGoalId?, parentId?, category?}` |
| PATCH | `/api/items/[itemId]` | Update item fields |
| DELETE | `/api/items/[itemId]` | Delete item |

### Boards
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/boards` | All user boards |
| POST | `/api/boards` | Create board. Body: `{name, icon?, color?}`. Creates 3 default columns + 1 group |
| GET | `/api/boards/[boardId]` | Board with groups+items+columns |
| PATCH | `/api/boards/[boardId]` | Update name/icon/color |
| DELETE | `/api/boards/[boardId]` | Delete board + cascade |

### Groups
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/groups` | Create group. Body: `{boardId, name, color?}` |
| PATCH | `/api/groups/[groupId]` | Update name/color |
| DELETE | `/api/groups/[groupId]` | Delete group + items |
| PATCH | `/api/groups/[groupId]/reorder` | Reorder items. Body: `{itemIds: string[]}` |

### Columns & Values
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/columns` | Create column |
| DELETE | `/api/columns/[columnId]` | Delete column |
| PATCH | `/api/column-values` | Update cell value. Body: `{itemId, columnId, value}` |

### Custom Fields
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/custom-fields` | Create custom field |
| DELETE | `/api/custom-fields/[fieldId]` | Delete custom field |
| PATCH | `/api/custom-field-values` | Update custom field value |

### Views / Data
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/stats` | Dashboard KPIs. Returns `StatsData` |
| GET | `/api/today?date=YYYY-MM-DD` | Daily tasks + overdue |
| GET | `/api/weekly?weekStart=YYYY-MM-DD` | Weekly goals + tasks |
| POST | `/api/weekly` | Create weekly goal |
| PATCH | `/api/weekly/[id]` | Update goal title/completion |
| DELETE | `/api/weekly/[id]` | Delete goal |
| GET | `/api/month?year=X&month=Y` | Monthly calendar items |
| GET | `/api/done` | Completed tasks archive |
| DELETE | `/api/done` | Clear completed (all or specific) |
| GET | `/api/overdue` | Past-due, incomplete items |
| GET | `/api/daily-glance` | Priority breakdown for widget |
| GET | `/api/search?q=text` | Global search across boards+items |

### User
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/me` | Current user profile |
| PATCH | `/api/me` | Update user settings (e.g. `weeklyGoalsTarget`) |
| GET | `/api/users/[id]` | User by ID |
| PATCH | `/api/users/[id]` | Update user (admin or self) |

### Comments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/comments` | Add comment. Body: `{itemId, text}` |
| DELETE | `/api/comments/[commentId]` | Delete comment |

### Google Calendar
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/gcal/auth?returnTo=/today` | Redirect to Google OAuth |
| GET | `/api/gcal/callback` | OAuth callback, stores token |
| GET | `/api/gcal/status` | Returns `{connected: boolean}` |
| POST | `/api/gcal/export` | Export today's tasks to calendar. Body: `{date}` |

### Admin (requires `user.isAdmin`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/create-user` | Pre-create user by email |
| PATCH | `/api/admin/users/[id]` | Update user (suspend, restore, make admin) |
| GET | `/api/admin/settings` | App settings |
| PATCH | `/api/admin/settings` | Update app settings |

---

## 12. KEY COMPONENTS — HOW THEY WORK

### Sidebar (`/components/sidebar/Sidebar.tsx`)
- **Width:** 224px, `height: 100vh`, `flexShrink: 0`
- **Search:** Opens CommandPalette on click or Cmd+K
- **NavItem:** Links with hover color + data prefetch on hover
- **BoardItem:** Colored dot + name + kebab menu (delete with Radix Dialog confirm)
- **User footer:** Avatar, name/email, theme toggle, sign out
- **Animations:** Nav items slide in left with stagger on page load

### TaskDetailPanel (`/components/tasks/TaskDetailPanel.tsx`)
- Full-screen centered modal (780px max, 85vh max)
- Fields: name (editable), description, priority (p1-p4), scheduledDate, deadline, category
- Custom fields from board definition
- Comments list + add form
- Subtasks expandable list
- Delete with confirmation
- Animation: `animate-modal-in` (slide up + scale)

### AddTaskModal (`/components/tasks/AddTaskModal.tsx`)
- Fields: name, description, priority (radio), date (inline calendar with presets), project (dropdown), category
- Presets: Today, Tomorrow, Next Saturday, Next Monday
- Submit button color matches priority
- Appears inline within priority sections or as standalone modal

### GroupRow (`/components/board/GroupRow.tsx`)
- Uses `SortableContext` + `useSortable` from dnd-kit for item reordering
- Collapse state persisted to `localStorage` key `ordo-collapsed-{groupId}`
- Inline group rename (Enter to save, Esc to cancel)
- `ColHeaders` component renders column headers in grid format

### ItemRow (`/components/board/ItemRow.tsx`)
- CSS Grid: `36px minmax(0,1fr) 180px 120px 36px` (desktop)
- Columns: completion circle, name+description, StatusPill, deadline badge, kebab menu
- Tooltip component wraps interactive elements
- Opens `TaskDetailPanel` on click

### BoardView (`/components/board/BoardView.tsx`)
- Switches between table and kanban view modes
- Table: `DndContext` wrapping all groups for cross-group drag
- Kanban: `KanbanView` component
- View mode saved: `localStorage` key `ordo-view-{boardId}`

### DailyGlance (`/components/dashboard/DailyGlance.tsx`)
- Tabbed priority selector (p1, p2, p3, p4)
- Shows up to 3 tasks by default, "View N more" button
- Completion circle buttons → marks task done instantly
- Task list re-animates when switching priority tabs

---

## 13. REACT QUERY PATTERNS

**Query key conventions:**
```typescript
["stats"]                    // Dashboard KPIs
["today", "2024-01-15"]     // Daily tasks (by date string)
["weekly", "2024-01-15"]    // Weekly goals (by week start date)
["month", year, month]      // Monthly view
["board", boardId]           // Single board with all data
["boards"]                   // User's board list
["done"]                     // Completed tasks
["overdue"]                  // Overdue tasks
["search", query]            // Search results
```

**Update patterns:**
```typescript
// Optimistic update example:
queryClient.setQueryData(["board", boardId], (old) => ({
  ...old,
  groups: old.groups.map(g => g.id === groupId
    ? { ...g, items: g.items.filter(i => i.id !== itemId) }
    : g
  )
}));
await fetch(`/api/items/${itemId}`, { method: "DELETE" });
queryClient.invalidateQueries({ queryKey: ["board", boardId] });
```

---

## 14. BUSINESS RULES & IMPORTANT LOGIC

### Inbox Board
- Created on first user login (type: "inbox", isSystem: true, icon: "📥")
- Named "Inbox" with one group "Tasks"
- Cannot be deleted by user
- Is the default project for AddTaskModal when no project selected

### Task Scheduling
- `scheduledDate` = when the user plans to work on it (appears in Today/Month)
- `isToday` = pinned to today specifically (for "My Day" page)
- `deadline` = hard due date (shown in board table, detail panel)
- **Overdue:** task is overdue when `scheduledDate < today` AND `!completedAt` AND `!isToday`

### Subtasks
- `parentId` on Item points to parent Item
- Subtasks always belong to the same group as parent
- In Today view: shown as indented sub-rows under parent task

### Weekly Goals
- WeeklyGoal.weekStart is always the Monday of that week
- User has `weeklyGoalsTarget` (1-10, default 5) as their weekly goal count
- Empty goal slots appear in the grid until target is reached
- Goal can be marked complete independently of its tasks

### Status ↔ completedAt sync
When updating status:
- Setting status to `"done"` → also sets `completedAt = new Date().toISOString()`
- Setting status to anything else from "done" → also sets `completedAt = null`

### Board Creation
Creates these automatically:
1. Board record
2. 3 default columns: "Status" (type: status), "Priority" (type: priority), "Due date" (type: date)
3. 1 default group with the board name

---

## 15. GOOGLE CALENDAR INTEGRATION

**Flow:**
1. User clicks "Export to Calendar" or "Connect Calendar" on Today page
2. If not connected: redirect to `/api/gcal/auth?returnTo=/today`
3. `/api/gcal/auth` builds Google OAuth URL and redirects
4. User authorizes on Google
5. Google redirects to `/api/gcal/callback`
6. Callback stores `accessToken`, `refreshToken`, `expiresAt` in `GoogleToken` table
7. Redirects back to `returnTo` with `?gcal=connected`
8. Export: `POST /api/gcal/export` with `{date}` → creates Google Calendar events for uncompleted tasks on that date

---

## 16. ANIMATIONS (globals.css)

All defined in `app/globals.css`:

**Keyframes available:**
- `fadeInUp` — opacity 0→1, translateY 14px→0
- `fadeInDown` — opacity 0→1, translateY -8px→0
- `scaleInFade` — opacity 0→1, scale 0.96→1
- `slideInLeft` — opacity 0→1, translateX -10px→0
- `modalIn` — combined translate(-50%,-46%) + scale 0.97 → translate(-50%,-50%) + scale 1
- `backdropIn` — opacity 0→1
- `slideInRight` — translateX 100%→0 (mobile menu)
- `theme-circle-open` — radial reveal for theme toggle

**CSS utility classes:**
- `.animate-fade-in-up` — 0.4s spring
- `.animate-fade-in-down` — 0.25s spring
- `.animate-scale-in` — 0.3s spring (use for modals with flexbox centering)
- `.animate-slide-in-left` — 0.3s spring (sidebar nav items)
- `.animate-modal-in` — 0.3s spring (use for modals with translate(-50%,-50%) centering)
- `.animate-backdrop-in` — 0.2s ease
- `.stagger-1` through `.stagger-6` — delays 50ms, 100ms, 150ms, 200ms, 250ms, 300ms

**IMPORTANT:** Do not use `.animate-scale-in` on elements that use `transform: translate(-50%, -50%)` for centering — use `.animate-modal-in` instead, which includes the translate in the keyframe.

**CSS hover classes:**
- `.board-card` — project card hover: border color + translateY(-1px) + shadow
- **Radix UI elements** auto-get `fadeInDown` via `[data-radix-popper-content-wrapper] > div` selector

**All animations respect `prefers-reduced-motion: reduce`.**

---

## 17. ADMIN FEATURES

**Access:** Only users with `user.isAdmin = true`

**Admin page** (`/admin/users`):
- List all users (name, email, status, last login, admin badge)
- Create new user by email (pre-created, linked on first Auth0 login)
- Suspend / restore users (`isActive` toggle)
- Make user admin / remove admin
- Change password (triggers Auth0 password reset or custom flow)
- Audit log view (planned but may be in schema only)

**Admin API routes:**
- All require `user.isAdmin` check server-side
- Actions are logged in `AuditLog` table

---

## 18. SECURITY

**Headers (all routes):**
- `X-DNS-Prefetch-Control: on`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

**API Security pattern:**
```typescript
// In every API route:
const session = await getSession();
if (!session?.user) return Response.json({error: "Unauthorized"}, {status: 401});
const user = await getOrdoUser();
if (!user) return Response.json({error: "User not found"}, {status: 404});
// Then verify ownership before any data operation
```

**Rate limiting:** Upstash Redis client available in `lib/` but applied selectively.

---

## 19. FONTS

- **Primary:** Inter (Google Fonts, loaded in layout.tsx)
- **Logo only:** Gelasio (Google Fonts, serif, used for "Ordo" text in sidebar)
- Font sizes: 9px (uppercase labels) up to 20px (page titles)

---

## 20. TOAST NOTIFICATIONS

```typescript
import { t } from "@/lib/toast";

t.success("Task completed", itemName);  // green
t.error("Failed to save");              // red
t.info("Marked incomplete", itemName);  // blue
t.promise(fetchPromise, {
  loading: "Saving...",
  success: "Saved!",
  error: "Failed",
});
```

Displayed bottom-right, no close button, auto-dismiss.

---

## 21. MOBILE-SPECIFIC BEHAVIOR

- **Bottom nav:** 4 tabs (Home→/dashboard, My Day→/today, Month→/month, Goals→/week)
- **Min tap target:** 44x44px for buttons/links (except pill-btn class)
- **Safe areas:** `env(safe-area-inset-bottom/top)` for notch devices
- **Modals:** Full-screen on mobile (borderRadius 0, no max-width)
- **Kanban:** Scroll horizontally on mobile
- **Board rows:** Shorter grid (no deadline column) via `MOBILE_ROW_GRID`
- **Month view:** Capped at 3-day strip on mobile (even if 7-day selected)
- **KPI grid:** 2 columns on mobile via `.kpi-grid` class
- **Widget grid:** 1 column on mobile via `.widget-grid` class

---

## 22. ENVIRONMENT VARIABLES

```bash
# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Database
DATABASE_URL=libsql://...

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 23. COMMON PATTERNS & CONVENTIONS

### Creating a new page
1. Add `app/[routename]/page.tsx` as `"use client"` component
2. Use `useQuery` from React Query with appropriate key
3. Wrap in `div` with `padding: "clamp(12px, 4vw, 24px)"`
4. Show loading state (`isLoading`) and empty state

### Creating a new API route
1. Add `app/api/[routename]/route.ts`
2. Always: get session → get user → verify ownership → do operation
3. Return `Response.json(data)` or `Response.json({error}, {status: N})`
4. Use Prisma transactions for multi-step operations

### Inline editing pattern
```tsx
const [editing, setEditing] = useState(false);
const [draft, setDraft] = useState(initial);
// On click: setEditing(true)
// On blur/Enter: save and setEditing(false)
// On Escape: reset draft and setEditing(false)
```

### Adding hover effects
```tsx
onMouseEnter={(e) => {
  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
  (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
}}
onMouseLeave={(e) => {
  (e.currentTarget as HTMLElement).style.background = "transparent";
  (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
}}
```

---

## 24. KNOWN ARCHITECTURE DECISIONS

1. **LibSQL (not PostgreSQL):** Chosen for Turso (edge SQLite). Prisma uses `@prisma/adapter-libsql`.
2. **Inline styles (not CSS modules):** Allows easy CSS variable theming and component colocation.
3. **No server state outside React Query:** All mutations go through fetch → invalidate.
4. **No Framer Motion:** Animations are pure CSS keyframes + classes in globals.css.
5. **`cn()` utility:** Use for combining Tailwind classes; prevents class conflicts.
6. **Radix UI primitives:** Used for Dialog, Dropdown, Popover — provides accessibility (ARIA, focus management) without UI opinions.
7. **Auth0 for auth:** No custom JWT. Session is managed entirely by `@auth0/nextjs-auth0`.
8. **`isSystem: true` for inbox:** Prevents accidental deletion, marks it as special.
9. **`position` field on items/groups/columns:** For manual ordering (drag-drop).
10. **`columnValues` vs `customValues`:** Built-in column types (status, priority, date) use `ColumnValue`. User-defined fields use `CustomFieldValue`.
