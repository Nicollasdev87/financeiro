export function AuthPanel({ title, subtitle }: { title: string; subtitle: string }) {
  const percent = 0.42;
  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#12203A] to-[#184787] p-10">
      {/* Textura decorativa — só quadradinhos soltos, sem nenhuma informação real */}
      <span className="pointer-events-none absolute right-10 top-10 h-3 w-3 rounded-sm bg-white/10" />
      <span className="pointer-events-none absolute right-24 top-24 h-2 w-2 rounded-sm bg-white/10" />
      <span className="pointer-events-none absolute right-8 top-40 h-4 w-4 rounded-sm border border-white/10" />
      <span className="pointer-events-none absolute left-10 bottom-24 h-2.5 w-2.5 rounded-sm bg-white/10" />
      <span className="pointer-events-none absolute left-20 bottom-40 h-2 w-2 rounded-sm border border-white/10" />

      <div className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-white/10 text-sm font-semibold text-white">
          G
        </span>
        <span className="font-semibold text-white">Grannaup</span>
      </div>

      {/* Mockup genérico (sem nomes/dados de ninguém) — só pra ilustrar o produto */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-[300px]">
          <div className="w-64 rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#101828]">Análises</span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/50">
                Mensal
              </span>
            </div>
            <svg viewBox="0 0 220 70" className="h-16 w-full" preserveAspectRatio="none">
              <polyline
                points="0,55 30,54 55,25 85,45 110,18 140,38 165,15 190,32 220,20"
                fill="none"
                stroke="#33B669"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
              <polyline
                points="0,45 30,30 55,42 85,20 110,38 140,12 165,30 190,10 220,24"
                fill="none"
                stroke="#184787"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-black/35">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
            </div>
          </div>

          <div className="absolute -bottom-10 right-0 w-36 rounded-2xl bg-white p-4 text-center shadow-2xl">
            <div className="relative mx-auto h-20 w-20">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r={radius} fill="none" stroke="#E7E9EC" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  fill="none"
                  stroke="#184787"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference * percent} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] text-black/40">Investido</span>
                <span className="text-sm font-semibold text-[#101828]">{Math.round(percent * 100)}%</span>
              </div>
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
