"use client";

import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { UserCodeCard } from "@/components/profile/UserCodeCard";
import { PlanningCard } from "@/components/profile/PlanningCard";
import { PasswordCard } from "@/components/profile/PasswordCard";
import { LogoutCard } from "@/components/profile/LogoutCard";
import { PageHeader } from "@/components/PageHeader";

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Perfil" subtitle="Foto, nome, senha, planejamento e convites" />

      <ProfileHeaderCard />
      <UserCodeCard />
      <PlanningCard />
      <PasswordCard />
      <LogoutCard />
    </div>
  );
}
