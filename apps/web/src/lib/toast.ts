export type ToastVariant = "success" | "error" | "info";

export type ToastPayload = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

const EVENT_NAME = "visohelp-toast";

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT_NAME, { detail: payload }));
}

export function getToastEventName() {
  return EVENT_NAME;
}
