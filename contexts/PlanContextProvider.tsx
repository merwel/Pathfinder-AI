"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface PlanContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanContextProvider({
  children,
  defaultCurrency = "USD",
}: {
  children: ReactNode;
  defaultCurrency?: string;
}) {
  const [activeSection, setActiveSection] = useState("about");
  const [currency, setCurrency] = useState(defaultCurrency);

  return (
    <PlanContext.Provider
      value={{
        activeSection,
        setActiveSection,
        currency,
        setCurrency,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlanContext must be used within a PlanContextProvider");
  }
  return context;
}
