"use client";

import { DEMO_MODE, installDemoFetch, resetDemoData } from "@/lib/demo";

// Runs at module load, before any page effect fires its first fetch.
installDemoFetch();

export default function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="w-full bg-indigo-950 text-indigo-100 text-xs sm:text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
      <span>
        <strong className="font-semibold">Demo mode</strong>: no sign-up, no API keys. Chats stay in this browser and
        replies are scripted, not from an AI model.
      </span>
      <a
        className="underline underline-offset-2 hover:text-white"
        href="https://github.com/KushagraKanaujia/mini-companion#run-it-for-real"
        target="_blank"
        rel="noreferrer"
      >
        Run with a real model
      </a>
      <button
        className="underline underline-offset-2 hover:text-white"
        onClick={() => {
          if (confirm("Delete all demo companions and chats in this browser?")) {
            resetDemoData();
            window.location.href = "/";
          }
        }}
      >
        Reset demo
      </button>
    </div>
  );
}
