"use client";

import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { UserCodeCard } from "@/components/profile/UserCodeCard";
import { PlanningCard } from "@/components/profile/PlanningCard";
import { PasswordCard } from "@/components/profile/PasswordCard";
import { LogoutCard } from "@/components/profile/LogoutCard";

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Perfil</h1>
        <p className="text-sm text-text-secondary">Foto, nome, senha, planejamento e convites</p>
      </div>

      <ProfileHeaderCard />
      <UserCodeCard />
      <PlanningCard />
      <PasswordCard />
      <LogoutCard />
    </div>
  );
}
