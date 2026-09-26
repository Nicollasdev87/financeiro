"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, CreditCard, Member } from "@/lib/types";

export function useHouseholdData() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);

    const { data: memberRows } = await supabase
      .from("household_members")
      .select("*")
      .order("created_at", { ascending: true });

    const hId = memberRows?.[0]?.household_id ?? null;
    setHouseholdId(hId);
    setMembers(memberRows ?? []);

    if (hId) {
      const [{ data: cats }, { data: cardRows }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("household_id", hId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("credit_cards")
          .select("*")
          .eq("household_id", hId)
          .order("created_at", { ascending: true }),
      ]);
      setCategories(cats ?? []);
      setCards(cardRows ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, householdId, members, categories, cards, reload };
}
