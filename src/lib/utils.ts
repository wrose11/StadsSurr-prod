import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractFirstHeadingAndRest(html?: string) {
  if (!html) return { title: null as string | null, content: "" };
  const doc = new DOMParser().parseFromString(html, "text/html");
  const h = doc.querySelector("h2") || doc.querySelector("h1,h3");
  const title = h?.textContent?.trim() ?? null;
  h?.remove();
  return { title, content: doc.body.innerHTML };
}
