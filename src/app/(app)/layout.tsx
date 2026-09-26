import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="w-full px-4 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
