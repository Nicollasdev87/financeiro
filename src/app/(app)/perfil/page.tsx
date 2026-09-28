"use client";

import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { UserCodeCard } from "@/components/profile/UserCodeCard";
import { PlanningCard } from "@/components/profile/PlanningCard";
import { PasswordCard } from "@/components/profile/PasswordCard";

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Perfil</h1>
        <p className="text-sm text-text-secondary">Foto, nome, senha e convites do planejamento</p>
      </div>

      <ProfileHeaderCard />
      <UserCodeCard />
      <PlanningCard />
      <PasswordCard />
    </div>
  );
}
