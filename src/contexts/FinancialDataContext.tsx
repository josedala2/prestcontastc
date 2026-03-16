import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

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
  /** Incremented on each setData/clearData to trigger effects */
  version: number;
}

const FinancialDataContext = createContext<FinancialDataContextType | null>(null);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Record<string, FinancialDataSet>>({});
  const [version, setVersion] = useState(0);

  const getData = useCallback(
    (key: string): FinancialDataSet => storeRef.current[key] || { ...emptyDataSet },
    []
  );

  const setData = useCallback((key: string, data: FinancialDataSet) => {
    storeRef.current = { ...storeRef.current, [key]: data };
    setVersion((v) => v + 1);
  }, []);

  const clearData = useCallback((key: string) => {
    const next = { ...storeRef.current };
    delete next[key];
    storeRef.current = next;
    setVersion((v) => v + 1);
  }, []);

  const hasData = useCallback((key: string) => !!storeRef.current[key]?.uploadedFile, []);

  return (
    <FinancialDataContext.Provider value={{ getData, setData, clearData, hasData, version }}>
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
