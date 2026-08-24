import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">That page is missing</h1>
      <p className="mt-3 text-[var(--muted)]">Try a course level or the home path.</p>
      <Link href="/" className="mt-6 inline-block text-[var(--accent)]">
        Home
      </Link>
    </main>
  );
}
