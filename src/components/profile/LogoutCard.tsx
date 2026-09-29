"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function LogoutCard() {
  const router = useRouter();

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="font-medium">Conta</h3>
        <p className="text-sm text-text-secondary">Encerrar a sessão neste dispositivo.</p>
      </div>
      <Button variant="danger" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Sair
      </Button>
    </Card>
  );
}
