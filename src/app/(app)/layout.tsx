import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
