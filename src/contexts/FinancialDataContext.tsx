import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface FinancialDataSet {
  ativNaoCorr: Record<string, number>;
  ativCorr: Record<string, number>;
  capProprio: Record<string, number>;
  passNaoCorr: Record<string, number>;
  passCorr: Record<string, number>;
  proveitos: Record<string, number>;
  custos: Record<string, number>;
  uploadedFile: string | null;
}

const emptyDataSet: FinancialDataSet = {
  ativNaoCorr: {},
  ativCorr: {},
  capProprio: {},
  passNaoCorr: {},
  passCorr: {},
  proveitos: {},
  custos: {},
  uploadedFile: null,
};

interface FinancialDataContextType {
  getData: (key: string) => FinancialDataSet;
  setData: (key: string, data: FinancialDataSet) => void;
  clearData: (key: string) => void;
  hasData: (key: string) => boolean;
}

const FinancialDataContext = createContext<FinancialDataContextType | null>(null);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Record<string, FinancialDataSet>>({});

  const getData = useCallback(
    (key: string): FinancialDataSet => store[key] || { ...emptyDataSet },
    [store]
  );

  const setData = useCallback((key: string, data: FinancialDataSet) => {
    setStore((prev) => ({ ...prev, [key]: data }));
  }, []);

  const clearData = useCallback((key: string) => {
    setStore((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const hasData = useCallback((key: string) => !!store[key]?.uploadedFile, [store]);

  return (
    <FinancialDataContext.Provider value={{ getData, setData, clearData, hasData }}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData() {
  const ctx = useContext(FinancialDataContext);
  if (!ctx) throw new Error("useFinancialData must be used within FinancialDataProvider");
  return ctx;
}

export { emptyDataSet };
