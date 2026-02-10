import { createContext, useContext, useState, ReactNode } from "react";
import { Entity } from "@/types";
import { mockEntities } from "@/data/mockData";

interface PortalEntityContextType {
  entity: Entity;
  entityId: string;
  setEntityId: (id: string) => void;
}

const PortalEntityContext = createContext<PortalEntityContextType | null>(null);

export function PortalEntityProvider({ children }: { children: ReactNode }) {
  const [entityId, setEntityId] = useState("1");
  const entity = mockEntities.find((e) => e.id === entityId) || mockEntities[0];

  return (
    <PortalEntityContext.Provider value={{ entity, entityId, setEntityId }}>
      {children}
    </PortalEntityContext.Provider>
  );
}

export function usePortalEntity() {
  const ctx = useContext(PortalEntityContext);
  if (!ctx) throw new Error("usePortalEntity must be used within PortalEntityProvider");
  return ctx;
}
