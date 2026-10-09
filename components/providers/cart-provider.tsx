"use client";

import { useEffect, useState } from "react";

/** Prevents hydration mismatch with zustand persist */
export function CartHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return <>{children}</>;
}
