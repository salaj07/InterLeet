import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Play, Pause, Sparkles } from "lucide-react";
import { setSimulation } from "@/redux/slices/simulatorSlice";
import OptimizationAssistant from "./OptimizationAssistant";

export default function SimulationDock({ suggestions }) {
  const dispatch = useDispatch();
  const sim = useSelector((s) => s.simulator.simulation);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-[#111111]/95 px-3 py-2.5 backdrop-blur font-sans"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              User Load
            </span>
            <input
              type="range"
              min={1}
              max={100000}
              step={100}
              value={sim.userLoad}
              onChange={(e) => dispatch(setSimulation({ userLoad: +e.target.value }))}
              className="w-56 accent-[#FF6500]"
            />
            <span className="w-20 text-right font-mono text-[12px] text-white tabular-nums">
              {sim.userLoad.toLocaleString()} <span className="text-white/40">req/s</span>
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Pattern
            </span>
            <select
              value={sim.pattern}
              onChange={(e) => dispatch(setSimulation({ pattern: e.target.value }))}
              className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none"
            >
              {["constant", "burst", "peak-hours", "random", "ddos"].map((p) => (
                <option key={p} value={p} className="bg-[#111]">
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Duration
            </span>
            <select
              value={sim.duration}
              onChange={(e) => dispatch(setSimulation({ duration: e.target.value }))}
              className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none"
            >
              {["1m", "5m", "15m", "1h"].map((p) => (
                <option key={p} value={p} className="bg-[#111]">
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            {sim.running ? (
              <button
                onClick={() => dispatch(setSimulation({ running: false }))}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#161616] px-2.5 py-1.5 text-[12px] text-white hover:border-white/25"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
            ) : (
              <button
                onClick={() => dispatch(setSimulation({ running: true }))}
                className="inline-flex items-center gap-1 rounded-md border border-[#FF6500] bg-[#FF6500] px-2.5 py-1.5 text-[12px] text-white hover:bg-[#FF6500]/90"
              >
                <Play className="h-3.5 w-3.5" /> Start
              </button>
            )}
            <button
              onClick={() => setAssistantOpen((o) => !o)}
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors ${
                assistantOpen
                  ? "border-[#FF6500]/60 bg-[#FF6500]/10 text-white"
                  : "border-white/10 bg-[#161616] text-white hover:border-white/25"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF6500]" /> Optimization Assistant
            </button>
          </div>
        </div>
      </motion.div>

      <OptimizationAssistant
        suggestions={suggestions}
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </>
  );
}
