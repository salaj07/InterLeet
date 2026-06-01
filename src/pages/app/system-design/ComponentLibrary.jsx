import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { catalog } from "@/lib/simulator/catalog";
import { Panel } from "./ui";

export default function ComponentLibrary() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) => !term || i.label.toLowerCase().includes(term) || i.kind.includes(term),
        ),
      }))
      .filter((c) => c.items.length);
  }, [q]);

  const onDragStart = (e, kind) => {
    e.dataTransfer.setData("application/x-simulator-kind", kind);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Panel className="w-[320px] shrink-0 border-r h-full">
      <div className="border-b border-white/[0.08] px-4 py-3">
        <div className="text-[13px] font-semibold">Components</div>
        <div className="text-[11px] text-white/50">Drag onto the canvas</div>
      </div>
      <div className="border-b border-white/[0.08] p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search components"
            className="w-full rounded-md border border-white/10 bg-black/40 pl-8 pr-2 py-1.5 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#FF6500]/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((group) => (
          <div key={group.category}>
            <div className="sticky top-0 z-10 bg-[#111111] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 border-b border-white/[0.06]">
              {group.category}
            </div>
            <div className="p-2 grid gap-1.5">
              {group.items.map((item) => (
                <div
                  key={item.kind}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.kind)}
                  className="cursor-grab active:cursor-grabbing rounded-md border border-white/10 bg-[#161616] px-3 py-2 hover:border-white/25 transition-colors"
                >
                  <div className="text-[12px] font-medium text-white">{item.label}</div>
                  <div className="text-[10px] text-white/45">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
