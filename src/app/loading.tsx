export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="h-8 w-40 animate-pulse rounded-full bg-[var(--line)]" />
      <div className="mt-4 h-24 animate-pulse rounded-3xl bg-[var(--line)]" />
    </div>
  );
}
