"use client";

import * as React from "react";
import { Download } from "lucide-react";

// Chrome/Edge fire `beforeinstallprompt`; Safari/iOS need manual guidance.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(true);
  const [showGuide, setShowGuide] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setVisible(false);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIos()) {
      setShowGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setVisible(false);
      setDeferredPrompt(null);
      return;
    }
    setShowGuide(true);
  };

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white shadow-md ring-1 ring-white/10 transition-colors hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <Download className="h-4 w-4" />
        تثبيت التطبيق
      </button>

      {showGuide && (
        <div
          dir="rtl"
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-sky-400/30 bg-slate-900/95 p-4 text-right text-sm text-slate-100 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-2 font-bold text-sky-400">
            {isIos() ? "لتثبيت التطبيق على iPhone:" : "لتثبيت التطبيق:"}
          </div>
          <ol className="list-inside list-decimal space-y-1 text-xs leading-relaxed text-slate-300">
            {isIos() ? (
              <>
                <li>اضغط زر المشاركة (مربع بسهم لأعلى).</li>
                <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
                <li>اضغط «إضافة» لتأكيد التثبيت.</li>
              </>
            ) : (
              <>
                <li>تأكد من فتح الموقع عبر HTTPS (أو localhost).</li>
                <li>من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
                <li>في Chrome/Edge يظهر الخيار تلقائيًا عند استيفاء شروط PWA.</li>
              </>
            )}
          </ol>
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="mt-3 w-full rounded-lg bg-black py-2 text-xs font-bold text-white hover:bg-neutral-900"
          >
            حسنًا
          </button>
        </div>
      )}
    </>
  );
}
