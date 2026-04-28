"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CustomRoute = {
  url: string;
  apiKey: string;
  model: string;
};

export type SettingsState = {
  openaiApiKey: string;
  openaiModel: string;
  googleApiKey: string;
  googleModel: string;
  customRoute: CustomRoute;
  setOpenaiApiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  setGoogleApiKey: (key: string) => void;
  setGoogleModel: (model: string) => void;
  setCustomRoute: (route: Partial<CustomRoute>) => void;
  /** Return the active API key (legacy) */
  getActiveApiKey: () => string;
  /** Return the full active AI config */
  getActiveConfig: () => { apiKey?: string; baseURL?: string; model?: string };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      openaiApiKey: "",
      openaiModel: "gpt-4o-mini",
      googleApiKey: "",
      googleModel: "gemini-1.5-flash",
      customRoute: { url: "", apiKey: "", model: "" },

      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
      setOpenaiModel: (model) => set({ openaiModel: model }),
      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setGoogleModel: (model) => set({ googleModel: model }),
      setCustomRoute: (route) =>
        set((s) => ({ customRoute: { ...s.customRoute, ...route } })),

      getActiveApiKey: () => {
        const { customRoute, openaiApiKey } = get();
        if (customRoute.url && customRoute.apiKey) return customRoute.apiKey;
        return openaiApiKey;
      },
      
      getActiveConfig: () => {
        const { customRoute, openaiApiKey, openaiModel } = get();
        if (customRoute.url && customRoute.apiKey) {
          return {
            apiKey: customRoute.apiKey,
            baseURL: customRoute.url,
            model: customRoute.model || undefined,
          };
        }
        return {
          apiKey: openaiApiKey || undefined,
          model: openaiModel || undefined,
        };
      },
    }),
    {
      name: "hte-settings",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          } as unknown as Storage;
        }
        return localStorage;
      }),
    }
  )
);
