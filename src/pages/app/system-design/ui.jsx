import React from "react";

export const Panel = ({ children, className = "" }) => (
  <div
    className={`flex flex-col bg-[#111111] border-white/[0.08] ${className}`}
    style={{ borderColor: "rgba(255,255,255,0.08)" }}
  >
    {children}
  </div>
);

export const SectionLabel = ({ children, right }) => (
  <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5">
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
      {children}
    </div>
    {right}
  </div>
);

export const SubLabel = ({ children }) => (
  <div className="px-4 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-white/35">
    {children}
  </div>
);

export const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-[#FF6500]" : "bg-white/15"}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-1"}`}
    />
  </button>
);

export const Pill = ({ label, value, positive }) => (
  <div className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1">
    <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">{label}</div>
    <div className={`font-mono ${positive ? "text-emerald-400" : "text-amber-400"}`}>{value}</div>
  </div>
);
