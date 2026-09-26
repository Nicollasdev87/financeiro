"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only the dashboard has been reskinned dark so far — everywhere else
  // keeps its original light page background untouched.
  const dark = pathname.startsWith("/dashboard");

  return (
    <div className="flex min-h-screen gap-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <div
          className={cn(
            "w-full max-w-[1400px]",
            dark &&
              "my-4 mr-4 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#140F27] via-[#170F2C] to-[#0F0B1D] shadow-xl shadow-black/30"
          )}
        >
          <TopNav />
          <main className="w-full px-4 pb-24 pt-0 md:px-6 md:pb-10">{children}</main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
