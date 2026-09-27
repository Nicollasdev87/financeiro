export function AuthPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative hidden h-full w-full flex-col justify-between overflow-hidden rounded-card bg-gradient-to-br from-[#0B1220] via-[#12203A] to-[#184787] p-10 lg:flex">
      {/* Traços decorativos, só textura — sem remeter a nenhuma marca/ilustração específica */}
      <svg className="pointer-events-none absolute -right-6 top-10 h-24 w-24 text-white/10" viewBox="0 0 100 100" fill="none">
        <path d="M5 50 Q 25 20, 45 50 T 85 50" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className="pointer-events-none absolute -left-8 bottom-32 h-28 w-28 text-white/10" viewBox="0 0 100 100" fill="none">
        <path d="M5 20 Q 30 60, 60 30 T 95 60" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="pointer-events-none absolute right-16 top-24 h-2 w-2 rounded-full bg-white/20" />
      <span className="pointer-events-none absolute left-24 top-1/3 h-1.5 w-1.5 rounded-full bg-white/20" />

      <div className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-white/10 text-sm font-semibold text-white">
          G
        </span>
        <span className="font-semibold text-white">Grannaup</span>
      </div>

      {/* Mini cartões flutuantes, no estilo do próprio dashboard */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-[280px]">
          <div className="absolute -top-14 left-0 w-44 rounded-card border border-white/10 bg-white/10 p-4 shadow-card backdrop-blur">
            <p className="text-xs text-white/60">Saldo do mês</p>
            <p className="mt-1 text-xl font-semibold text-white">R$ 6.240,80</p>
            <span className="mt-1 inline-block rounded-control bg-success/20 px-1.5 py-0.5 text-[11px] font-medium text-success">
              +12%
            </span>
          </div>

          <div className="w-52 rounded-card border border-white/10 bg-white/10 p-4 shadow-card backdrop-blur">
            <p className="mb-3 text-xs text-white/60">Investimentos</p>
            <div className="flex h-16 items-end gap-1.5">
              {[35, 55, 45, 70, 60, 90].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-success/70" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="absolute -bottom-12 right-0 w-40 rounded-card border border-white/10 bg-white/10 p-3 shadow-card backdrop-blur">
            <p className="mb-2 text-xs text-white/60">Quem gastou?</p>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-primary" /> Nicollas
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-success" /> Carol
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-xs text-sm text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}
