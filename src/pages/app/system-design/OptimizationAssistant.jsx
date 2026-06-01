import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Pill } from "./ui";

export default function OptimizationAssistant({ suggestions, open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="pointer-events-auto absolute right-4 bottom-24 z-30 w-96 rounded-xl border border-white/10 bg-[#111111]/95 backdrop-blur font-sans"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF6500]" />
              <span className="font-semibold text-white">Optimization Assistant</span>
            </div>

            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3">
            {suggestions.length === 0 ? (
              <div className="text-[12px] text-white/45">
                System is healthy — no recommendations.
              </div>
            ) : (
              suggestions.map((s, i) => (
                <div key={i} className="mb-2 rounded-md border border-white/10 bg-[#161616] p-3 text-left">
                  <div className="text-[13px] font-semibold text-white">{s.title}</div>
                  <div className="mt-1 text-[11px] text-white/55">{s.detail}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Pill label="Latency" value={s.impact.latency} positive />
                    <Pill label="Throughput" value={s.impact.throughput} positive />
                    <Pill label="Cost" value={s.impact.cost} />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
