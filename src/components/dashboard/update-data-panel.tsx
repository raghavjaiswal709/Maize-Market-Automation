"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  Check,
  AlertTriangle,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/components/language-provider";

interface UpdateDataPanelProps {
  onSuccess: () => void;
}

const MODEL_OPTIONS = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "perplexity_sonar_pro", label: "Perplexity Sonar Pro" },
  { value: "perplexity_research", label: "Perplexity Research" },
  { value: "other", label: "Other" },
];

export function UpdateDataPanel({ onSuccess }: UpdateDataPanelProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [predictionDate, setPredictionDate] = useState<Date | undefined>(
    undefined
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    details?: string;
  } | null>(null);

  const validateJson = useCallback(
    (text: string): { valid: boolean; error?: string } => {
      if (!text.trim()) return { valid: false, error: "JSON data is empty" };

      try {
        const parsed = JSON.parse(text);
        const reports = Array.isArray(parsed) ? parsed : [parsed];

        if (reports.length === 0)
          return { valid: false, error: "Empty array provided" };

        const requiredFields = [
          "current_prices",
          "news_items",
          "market_sentiment",
          "predictions_10_day",
        ];
        for (let i = 0; i < reports.length; i++) {
          const report = reports[i];
          const missing = requiredFields.filter((f) => !(f in report));
          if (missing.length > 0) {
            return {
              valid: false,
              error: `Report ${i + 1}: Missing required fields: ${missing.join(", ")}`,
            };
          }
          if (!Array.isArray(report.predictions_10_day)) {
            return {
              valid: false,
              error: `Report ${i + 1}: predictions_10_day must be an array`,
            };
          }
          if (!Array.isArray(report.news_items)) {
            return {
              valid: false,
              error: `Report ${i + 1}: news_items must be an array`,
            };
          }
        }

        return { valid: true };
      } catch (e) {
        const msg =
          e instanceof SyntaxError ? e.message : "Invalid JSON format";
        return { valid: false, error: `Invalid JSON: ${msg}` };
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setResult(null);

    // Validate date and model are selected
    if (!predictionDate) {
      setResult({
        type: "error",
        message:
          lang === "hindi"
            ? "कृपया पूर्वानुमान तारीख चुनें"
            : "Please select a prediction date",
      });
      return;
    }

    if (!selectedModel) {
      setResult({
        type: "error",
        message:
          lang === "hindi"
            ? "कृपया मॉडल/स्रोत चुनें"
            : "Please select a model/source",
      });
      return;
    }

    const validation = validateJson(jsonText);
    if (!validation.valid) {
      setResult({ type: "error", message: validation.error || "Invalid data" });
      return;
    }

    setSubmitting(true);
    try {
      const parsed = JSON.parse(jsonText);
      const reports = Array.isArray(parsed) ? parsed : [parsed];

      // Inject date, _id, and model into each report
      const dateStr = format(predictionDate, "yyyy-MM-dd");
      const timeStr = format(new Date(), "HH:mm:ss");
      const tsStr = format(predictionDate, "yyyyMMdd") + "_" + timeStr.replace(/:/g, "");

      const enrichedReports = reports.map((report: Record<string, unknown>, idx: number) => {
        const reportId = report._id || (reports.length > 1 ? `${tsStr}_${idx}` : tsStr);
        return {
          ...report,
          _id: reportId,
          date: report.date || dateStr,
          time: report.time || timeStr,
          timestamp: report.timestamp || new Date().toISOString(),
          metadata: {
            ...(typeof report.metadata === "object" && report.metadata !== null ? report.metadata : {}),
            fetch_method: selectedModel,
            model:
              MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label ||
              selectedModel,
          },
        };
      });

      console.log("[UpdateData] Submitting data to API...", {
        date: dateStr,
        model: selectedModel,
        count: enrichedReports.length,
      });

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          enrichedReports.length === 1 ? enrichedReports[0] : enrichedReports
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[UpdateData] API error:", data);
        setResult({
          type: "error",
          message: data.error || "Failed to update",
          details: data.details,
        });
        return;
      }

      console.log("[UpdateData] Success:", data);
      setResult({ type: "success", message: data.message });
      setJsonText("");

      // Refresh the dashboard after a short delay
      setTimeout(() => {
        onSuccess();
        setOpen(false);
        setResult(null);
        setPredictionDate(undefined);
        setSelectedModel("");
      }, 1500);
    } catch (err) {
      console.error("[UpdateData] Network error:", err);
      setResult({
        type: "error",
        message: "Network error",
        details: String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }, [jsonText, validateJson, onSuccess, predictionDate, selectedModel, lang]);

  const liveValidation = jsonText.trim() ? validateJson(jsonText) : null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-input bg-background px-3 hover:bg-accent hover:text-accent-foreground transition-colors text-xs font-medium"
        aria-label="Update Data"
      >
        <Upload className="h-3.5 w-3.5" />
        {lang === "hindi" ? "अपडेट" : "Update"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto border border-border shadow-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            {lang === "hindi" ? "रिपोर्ट डेटा अपडेट करें" : "Update Report Data"}
          </CardTitle>
          <button
            onClick={() => {
              setOpen(false);
              setResult(null);
              setJsonText("");
              setPredictionDate(undefined);
              setSelectedModel("");
            }}
            className="rounded-md p-1 hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date & Model selection row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Prediction Date picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "hindi" ? "पूर्वानुमान तारीख" : "Prediction Date"}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left font-normal h-9 text-xs"
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {predictionDate ? (
                      format(predictionDate, "dd MMM yyyy")
                    ) : (
                      <span className="text-muted-foreground">
                        {lang === "hindi" ? "तारीख चुनें..." : "Pick a date..."}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={predictionDate}
                    onSelect={(date) => {
                      setPredictionDate(date);
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Model/Source selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {lang === "hindi" ? "मॉडल / स्रोत" : "Model / Source"}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue
                    placeholder={
                      lang === "hindi" ? "मॉडल चुनें..." : "Select model..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* JSON textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">
                {lang === "hindi"
                  ? "अपना JSON रिपोर्ट डेटा नीचे पेस्ट करें"
                  : "Paste your JSON report data below"}
              </label>
              {liveValidation && (
                <Badge
                  variant={liveValidation.valid ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {liveValidation.valid ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />{" "}
                      {lang === "hindi" ? "वैध JSON" : "Valid JSON"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />{" "}
                      {lang === "hindi" ? "अमान्य" : "Invalid"}
                    </span>
                  )}
                </Badge>
              )}
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setResult(null);
              }}
              placeholder='{"current_prices": {...}, "news_items": [...], ...}'
              className="w-full h-52 rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              spellCheck={false}
            />
            {liveValidation && !liveValidation.valid && (
              <p className="text-[11px] text-destructive">
                {liveValidation.error}
              </p>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {lang === "hindi"
              ? "नोट: _id, date, time, और metadata स्वचालित रूप से चयनित तारीख और मॉडल से भरे जाएंगे। JSON में ये फ़ील्ड वैकल्पिक हैं।"
              : "Note: _id, date, time, and metadata will be auto-filled from the selected date and model. These fields are optional in your JSON."}
          </p>

          {/* Result message */}
          {result && (
            <div
              className={`rounded-md px-3 py-2 text-xs ${
                result.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
              }`}
            >
              <p className="font-medium">{result.message}</p>
              {result.details && (
                <p className="mt-1 text-[11px] opacity-80">{result.details}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
                setResult(null);
                setJsonText("");
                setPredictionDate(undefined);
                setSelectedModel("");
              }}
              className="text-xs"
            >
              {lang === "hindi" ? "रद्द करें" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !jsonText.trim() ||
                (liveValidation !== null && !liveValidation.valid)
              }
              className="text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {lang === "hindi" ? "भेज रहे हैं..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3" />
                  {lang === "hindi" ? "डेटा जमा करें" : "Submit Data"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
