"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { notifyProfileUpdated, useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { resizeImageToJpeg } from "@/lib/avatar";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ProfileHeaderCard() {
  const supabase = createClient();
  const { id, name, email, avatarUrl, loading } = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (name) setFullName(name);
  }, [name]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setMessage({ type: "error", text: "Informe um nome com pelo menos 2 caracteres." });
      return;
    }
    setSavingName(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("id", id);
    if (error) {
      setMessage({ type: "error", text: `Não foi possível salvar o nome: ${error.message}` });
      setSavingName(false);
      return;
    }
    // O nome também aparece no dashboard ("Quem gastou?") via household_members.
    await supabase.from("household_members").update({ display_name: trimmed }).eq("profile_id", id);
    await supabase.auth.updateUser({ data: { full_name: trimmed } });

    setSavingName(false);
    setMessage({ type: "ok", text: "Nome atualizado." });
    notifyProfileUpdated();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !id) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Escolha um arquivo de imagem (JPG, PNG, WebP...)." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "A imagem é muito grande (máximo 10 MB)." });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const blob = await resizeImageToJpeg(file, 256);
      const path = `${id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`; // evita cache da foto antiga

      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", id);
      if (error) throw new Error(error.message);

      setMessage({ type: "ok", text: "Foto atualizada." });
      notifyProfileUpdated();
    } catch (err) {
      setMessage({ type: "error", text: `Não foi possível enviar a foto: ${(err as Error).message}` });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!id) return;
    setUploading(true);
    setMessage(null);
    await supabase.storage.from("avatars").remove([`${id}/avatar.jpg`]);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", id);
    setUploading(false);
    if (error) {
      setMessage({ type: "error", text: `Não foi possível remover a foto: ${error.message}` });
      return;
    }
    setMessage({ type: "ok", text: "Foto removida." });
    notifyProfileUpdated();
  }

  if (loading) return <Card><p className="text-sm text-text-secondary">Carregando...</p></Card>;

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Foto de perfil" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white">
              {initials(name ?? "?")}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button size="sm" variant="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> {uploading ? "Enviando..." : "Alterar foto"}
            </Button>
            {avatarUrl && (
              <Button size="sm" variant="ghost" disabled={uploading} onClick={handleRemovePhoto}>
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveName} className="flex flex-1 flex-col gap-3 sm:pl-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Nome</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">E-mail</label>
            <Input value={email ?? ""} readOnly disabled className="opacity-70" />
          </div>
          <div>
            <Button type="submit" size="sm" disabled={savingName || fullName.trim() === (name ?? "")}>
              {savingName ? "Salvando..." : "Salvar nome"}
            </Button>
          </div>
        </form>
      </div>

      {message && (
        <p className={`mt-4 text-sm ${message.type === "ok" ? "text-success" : "text-danger"}`}>{message.text}</p>
      )}
    </Card>
  );
}
