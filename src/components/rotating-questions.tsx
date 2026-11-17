"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";

const QUESTIONS = [
  { id: 1, text: "هل في عملاء طالبين تعديلات؟" },
  { id: 2, text: "هل في عملاء مطلوب نكمل شغلهم؟" },
  { id: 3, text: "هل في خطط أو طرق للانتشار ممكن ننفذها ونتابعها؟" },
  { id: 4, text: "هل في تطوير نقدر نعمله في المهارات الحالية والأدوات؟" },
];

const INTERVAL_MS = 7000;
const FADE_MS = 500;

export function RotatingQuestions() {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % QUESTIONS.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const current = QUESTIONS[index];

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-l from-sky-500/10 via-blue-500/5 to-transparent px-4 py-3 shadow-[0_0_20px_rgba(56,189,248,0.05)]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
          <Lightbulb className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-semibold text-foreground transition-all duration-500 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {current.text}
          </div>
        </div>
      </div>
    </div>
  );
}
