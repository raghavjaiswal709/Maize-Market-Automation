"use client";

import * as React from "react";
import { useLanguage } from "@/components/language-provider";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 rounded-md border border-input bg-background px-3" />
    );
  }

  return (
    <button
      onClick={toggleLang}
      className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-input bg-background px-3 hover:bg-accent hover:text-accent-foreground transition-colors text-xs font-medium"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "hindi" ? "हिंदी" : "Hinglish"}
    </button>
  );
}
