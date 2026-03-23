import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  // Tailwind class merger — install clsx + tailwind-merge if needed
  return inputs.filter(Boolean).join(" ");
}
