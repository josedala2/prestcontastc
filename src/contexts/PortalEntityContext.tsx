import { createContext, useContext, useState, ReactNode } from "react";
import { Entity } from "@/types";
import { mockEntities } from "@/data/mockData";

export type PortalUserRole = "entidade" | "tecnico";

interface PortalEntityContextType {
  entity: Entity;
  entityId: string;
  setEntityId: (id: string) => void;
  userRole: PortalUserRole;
  setUserRole: (role: PortalUserRole) => void;
}

const PortalEntityContext = createContext<PortalEntityContextType | null>(null);

export function PortalEntityProvider({ children }: { children: ReactNode }) {
  const [entityId, setEntityId] = useState("1");
  const [userRole, setUserRole] = useState<PortalUserRole>("entidade");
  const entity = mockEntities.find((e) => e.id === entityId) || mockEntities[0];

  return (
    <PortalEntityContext.Provider value={{ entity, entityId, setEntityId, userRole, setUserRole }}>
      {children}
    </PortalEntityContext.Provider>
  );
}

export function usePortalEntity() {
  const ctx = useContext(PortalEntityContext);
  if (!ctx) throw new Error("usePortalEntity must be used within PortalEntityProvider");
  return ctx;
}
