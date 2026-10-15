"use client";

import { createContext, useContext } from "react";

type ShippingSettings = {
  freeShippingThreshold: number;
  defaultShippingCost: number;
};

const ShippingSettingsContext = createContext<ShippingSettings | null>(null);

export function ShippingSettingsProvider({
  settings,
  children,
}: {
  settings: ShippingSettings;
  children: React.ReactNode;
}) {
  return (
    <ShippingSettingsContext.Provider value={settings}>
      {children}
    </ShippingSettingsContext.Provider>
  );
}

export function useShippingSettings() {
  const settings = useContext(ShippingSettingsContext);
  if (!settings) {
    throw new Error("Shipping settings provider is missing.");
  }
  return settings;
}
