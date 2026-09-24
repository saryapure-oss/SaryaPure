"use client";
import { useEffect } from "react";

// global-error replaces the root layout entirely when it fires, so it must define its own
// <html>/<body> and cannot rely on globals.css, fonts, or the app's Tailwind classes.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#faf6ee",
          color: "#1f1a12",
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ marginTop: "0.75rem", maxWidth: 420, color: "#6b6355" }}>
          We&apos;re sorry, a critical error occurred. Please try again or return to the homepage.
        </p>
        <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => retry()}
            style={{
              borderRadius: 999,
              padding: "0.65rem 1.5rem",
              background: "#1f3d2b",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces the root layout/router tree entirely, so next/link's router context is not guaranteed here */}
          <a
            href="/"
            style={{
              borderRadius: 999,
              padding: "0.65rem 1.5rem",
              border: "1px solid #1f3d2b",
              color: "#1f3d2b",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
