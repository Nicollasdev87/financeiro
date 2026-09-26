import { ThemeToggle } from "@/components/ThemeToggle";
import { UserPill } from "@/components/UserPill";

/** Barra no topo da página: toggle de tema à esquerda do pill do usuário. */
export function Topbar() {
  return (
    <div className="mb-5 flex items-center justify-end gap-3">
      <ThemeToggle />
      <UserPill />
    </div>
  );
}
