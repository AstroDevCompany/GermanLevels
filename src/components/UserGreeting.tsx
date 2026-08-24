"use client";

import { useApp } from "@/components/Providers";

export function UserGreeting({ className = "" }: { className?: string }) {
  const { prefs, ready } = useApp();
  if (!ready || !prefs.displayName.trim()) return null;
  return (
    <p className={className}>
      Welcome back, {prefs.displayName.trim()}.
    </p>
  );
}
