"use client";

import { getToastEventName, type ToastPayload } from "@/lib/toast";
import { useEffect, useMemo, useState } from "react";

type ToastItem = ToastPayload & { id: string };

function variantClasses(variant: ToastPayload["variant"]) {
  if (variant === "success") return "border-emerald-500/40 bg-emerald-500/10";
  if (variant === "error") return "border-red-500/40 bg-red-500/10";
  return "border-border bg-surface";
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const eventName = useMemo(() => getToastEventName(), []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      const payload = customEvent.detail;
      if (!payload?.title) return;

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = {
        id,
        durationMs: 3600,
        variant: "info",
        ...payload,
      };

      setToasts((prev) => [...prev, item]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, item.durationMs);
    };

    window.addEventListener(eventName, handler as EventListener);
    return () => window.removeEventListener(eventName, handler as EventListener);
  }, [eventName]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-200 flex w-[min(92vw,24rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-lg border px-3 py-2 shadow-lg ${variantClasses(t.variant)}`}
        >
          <p className="text-sm font-semibold text-foreground">{t.title}</p>
          {t.description ? <p className="mt-0.5 text-xs text-muted">{t.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
