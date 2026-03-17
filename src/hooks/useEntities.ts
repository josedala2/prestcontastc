import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Entity, EntityTipologia } from "@/types";

let cachedEntities: Entity[] | null = null;

export function useEntities() {
  const [entities, setEntities] = useState<Entity[]>(cachedEntities || []);
  const [loading, setLoading] = useState(!cachedEntities);

  useEffect(() => {
    if (cachedEntities) return;
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .order("id");

    if (!error && data) {
      const mapped: Entity[] = data.map((e: any) => ({
        id: e.id,
        name: e.name,
        nif: e.nif,
        tutela: e.tutela || "",
        contacto: e.contacto || "",
        morada: e.morada || "",
        tipologia: (e.tipologia || "orgao_soberania") as EntityTipologia,
        provincia: e.provincia || undefined,
        createdAt: e.created_at?.split("T")[0] || "2024-01-01",
      }));
      cachedEntities = mapped;
      setEntities(mapped);
    }
    setLoading(false);
  };

  const refresh = async () => {
    cachedEntities = null;
    await loadEntities();
  };

  const findById = (id: string) => entities.find(e => e.id === id);

  return { entities, loading, refresh, findById };
}

/** Preload entities into cache (call early in app lifecycle) */
export async function preloadEntities(): Promise<Entity[]> {
  if (cachedEntities) return cachedEntities;
  const { data } = await supabase.from("entities").select("*").order("id");
  if (data) {
    cachedEntities = data.map((e: any) => ({
      id: e.id,
      name: e.name,
      nif: e.nif,
      tutela: e.tutela || "",
      contacto: e.contacto || "",
      morada: e.morada || "",
      tipologia: (e.tipologia || "orgao_soberania") as EntityTipologia,
      provincia: e.provincia || undefined,
      createdAt: e.created_at?.split("T")[0] || "2024-01-01",
    }));
  }
  return cachedEntities || [];
}
