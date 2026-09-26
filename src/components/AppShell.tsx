"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only the dashboard has been reskinned dark so far — everywhere else
  // keeps its original light page background untouched. Setting the color
  // on this root (instead of on a floating panel with margins) means there
  // is no gap anywhere that can show the light body color through.
  const dark = pathname.startsWith("/dashboard");

  return (
    <div className={cn("min-h-screen", dark && "bg-[#0B0817]")}>
      <Sidebar />
      <TopNav />
      {/* pl matches the fixed rail's width + gap; pr matches the rail's own
          left inset, so this column lines up under the fixed top nav. */}
      <div className="flex flex-col items-center px-4 md:pl-24 md:pr-4">
        <main className="w-full max-w-[1400px] pb-24 pt-4 md:pb-10 md:pt-24">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
