"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#fbfbfd] px-5 font-sans text-[#1a1a1f]">
        <div className="w-full max-w-md rounded-2xl border border-[#ececf0] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-[#52525b]">
            The app hit an unexpected error and couldn&apos;t recover. Try
            reloading the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#3f6f57] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#315844] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6f57]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
