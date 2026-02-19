"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "hindi" | "hinglish";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "hinglish",
  setLang: () => {},
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("maize-lang") as Language) || "hinglish";
    }
    return "hinglish";
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("maize-lang", newLang);
    }
  }, []);

  const toggleLang = useCallback(() => {
    handleSetLang(lang === "hinglish" ? "hindi" : "hinglish");
  }, [lang, handleSetLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
