import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elev)_70%,transparent)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="font-semibold">GermanLevels</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            A1 to C1 for certificates, and A/B for the conversations you have between papers.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Learn</p>
          <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
            <Link href="/courses">Courses</Link>
            <Link href="/conversations">Conversations</Link>
            <Link href="/exam">Mock exams</Link>
            <Link href="/grammar">Grammar</Link>
            <Link href="/vocabulary">Vocabulary</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Levels</p>
          <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
            <Link href="/courses/a1">A1 Breakthrough</Link>
            <Link href="/courses/a2">A2 Waystage</Link>
            <Link href="/courses/b1">B1 Threshold</Link>
            <Link href="/courses/b2">B2 Vantage</Link>
            <Link href="/courses/c1">C1 Effective</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Account</p>
          <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
            <Link href="/profile">Profile</Link>
            <Link href="/progress">Progress</Link>
            <Link href="/account">Account</Link>
            <Link href="/settings">Settings</Link>
            <Link href="/about">About the method</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-[var(--line)] px-4 py-4 text-center text-xs text-[var(--muted)]">
        Practice papers follow Goethe/telc skill split. Not an official exam.
      </p>
    </footer>
  );
}
