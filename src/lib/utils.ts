import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const clampPillX = (x: number, pillWidth: number, svgWidth: number) => {
  return Math.min(Math.max(x - pillWidth / 2, 0), svgWidth - pillWidth);
};
