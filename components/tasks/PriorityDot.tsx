export const PRIORITY_ORDER: Record<string, number> = {
  p1: 0,
  p2: 1,
  p3: 2,
  p4: 3,
};

export const PRIORITY_COLORS: Record<string, string> = {
  p1: "#ef4444",
  p2: "#f97316",
  p3: "#5b9cf6",
  p4: "#6b7280",
};

export function PriorityDot({ priority }: { priority: string | null }) {
  const color = PRIORITY_COLORS[priority ?? "p4"] ?? "#6b7280";
  return (
    <span
      className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
      style={{ backgroundColor: color }}
    />
  );
}

export function sortByPriority<T extends { priority: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = PRIORITY_ORDER[a.priority ?? "p4"] ?? 3;
    const bo = PRIORITY_ORDER[b.priority ?? "p4"] ?? 3;
    return ao - bo;
  });
}
