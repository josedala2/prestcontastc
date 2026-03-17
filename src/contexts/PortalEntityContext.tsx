import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Entity } from "@/types";
import { useEntities } from "@/hooks/useEntities";

export type PortalUserRole = "entidade" | "tecnico";

interface PortalEntityContextType {
  entity: Entity;
  entityId: string;
  setEntityId: (id: string) => void;
  userRole: PortalUserRole;
  setUserRole: (role: PortalUserRole) => void;
  allEntities: Entity[];
  loadingEntities: boolean;
}

const PortalEntityContext = createContext<PortalEntityContextType | null>(null);

const defaultEntity: Entity = {
  id: "1", name: "A carregar...", nif: "", tutela: "", contacto: "", morada: "",
  tipologia: "orgao_soberania", createdAt: "",
};

export function PortalEntityProvider({ children }: { children: ReactNode }) {
  const [entityId, setEntityId] = useState("1");
  const [userRole, setUserRole] = useState<PortalUserRole>("entidade");
  const { entities, loading: loadingEntities } = useEntities();

  const entity = entities.find((e) => e.id === entityId) || entities[0] || defaultEntity;

  return (
    <PortalEntityContext.Provider value={{
      entity, entityId, setEntityId, userRole, setUserRole,
      allEntities: entities, loadingEntities,
    }}>
      {children}
    </PortalEntityContext.Provider>
  );
}

export function usePortalEntity() {
  const ctx = useContext(PortalEntityContext);
  if (!ctx) throw new Error("usePortalEntity must be used within PortalEntityProvider");
  return ctx;
}
