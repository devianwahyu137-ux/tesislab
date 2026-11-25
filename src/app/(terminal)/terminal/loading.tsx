export default function TerminalLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <div className="h-8 w-56 animate-pulse rounded-md bg-surface" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-hairline bg-surface/70"
          />
        ))}
      </div>
      <div className="h-72 w-full animate-pulse rounded-xl border border-hairline bg-surface/60" />
    </div>
  );
}
