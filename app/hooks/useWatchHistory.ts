"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "watchHistory";
const MAX_ITEMS = 20;

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useWatchHistory() {
  const [ids, setIds] = useState<string[]>(readIds);

  const addToHistory = useCallback((contentId: string) => {
    setIds((prev) => {
      const next = [contentId, ...prev.filter((id) => id !== contentId)].slice(0, MAX_ITEMS);
      writeIds(next);
      return next;
    });
  }, []);

  return { ids, addToHistory };
}
