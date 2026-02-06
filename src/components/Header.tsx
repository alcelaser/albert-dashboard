export default function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Albert Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-up animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
