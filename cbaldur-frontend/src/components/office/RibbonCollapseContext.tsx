import React, { createContext, useContext, useState, useCallback } from 'react';

interface RibbonCollapseContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

const RibbonCollapseContext = createContext<RibbonCollapseContextValue | null>(
  null,
);

export const RibbonCollapseProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((v) => !v), []);

  return (
    <RibbonCollapseContext.Provider
      value={{ collapsed, toggle, setCollapsed }}
    >
      {children}
    </RibbonCollapseContext.Provider>
  );
};

export const useRibbonCollapse = (): RibbonCollapseContextValue => {
  const ctx = useContext(RibbonCollapseContext);
  if (!ctx) {
    return {
      collapsed: false,
      toggle: () => {},
      setCollapsed: () => {},
    };
  }
  return ctx;
};
