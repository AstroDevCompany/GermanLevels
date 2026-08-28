"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ProfileHud } from "@/components/ProfileHud";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/conversations", label: "Talk" },
  { href: "/exam", label: "Exam" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/grammar", label: "Grammar" },
  { href: "/vocabulary", label: "Words" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <ProfileHud />
        <nav className="hidden items-center gap-5 text-sm lg:flex xl:gap-7">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-[var(--muted)] hover:text-[var(--ink)]"
                data-active={active}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>
      {open ? (
        <nav className="grid gap-3 border-t border-[var(--line)] px-4 py-4 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-2 py-3 text-[var(--muted)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
