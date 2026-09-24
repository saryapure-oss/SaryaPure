"use client";
import { useEffect } from "react";

/** Fire-and-forget analytics beacon (first-party, anonymous). */
export function TrackView({ type, productId }: { type: "product_view"; productId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ type, productId });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    else fetch("/api/analytics", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }, [type, productId]);
  return null;
}
