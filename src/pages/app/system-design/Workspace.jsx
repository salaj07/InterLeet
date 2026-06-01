import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactFlow } from "reactflow";
import { ArrowLeft, X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { loadTemplate, clearCanvas, setFailure } from "@/redux/slices/simulatorSlice";
import TopToolbar from "./TopToolbar";
import ComponentLibrary from "./ComponentLibrary";
import CanvasInner from "./CanvasInner";
import MetricsPanel from "./MetricsPanel";
import PropertiesPanel from "./PropertiesPanel";
import { useSimulationEngine } from "./useSimulationEngine";
import { useSuggestions } from "./useSuggestions";
import { Panel } from "./ui";

export default function Workspace({ challenge, template, onExit }) {
  const dispatch = useDispatch();
  const rf = useReactFlow();
  const nodes = useSelector((s) => s.simulator.nodes);
  const [showGrid, setShowGrid] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [briefOpen, setBriefOpen] = useState(true);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Load template architecture, otherwise start with an empty canvas.
  useEffect(() => {
    if (template) dispatch(loadTemplate({ nodes: template.nodes, edges: template.edges }));
    else dispatch(clearCanvas());
  }, [challenge?.id, template, dispatch]);

  useSimulationEngine();
  const suggestions = useSuggestions();

  const injectFailure = () => {
    const candidates = nodes.filter((n) => !["client", "mobile", "web"].includes(n.data.kind));
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    dispatch(setFailure({ nodeId: pick.id, type: "outage" }));
    setTimeout(() => dispatch(setFailure(null)), 8000);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-white font-sans">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0d0d0d] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#161616] px-2 py-1 text-[11px] text-white/80 hover:border-white/25 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="ml-2 truncate text-[12px] font-semibold">{challenge.title}</div>

          <span className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/55">
            {challenge.difficulty}
          </span>
        </div>

        <button
          onClick={() => setBriefOpen((o) => !o)}
          className="text-[11px] text-white/60 hover:text-white"
        >
          {briefOpen ? "Hide brief" : "Show brief"}
        </button>
      </div>

      <TopToolbar
        onFitView={() => rf.fitView({ padding: 0.25, duration: 300 })}
        onToggleGrid={() => setShowGrid((g) => !g)}
        showGrid={showGrid}
        onToggleMetrics={() => setShowMetrics((m) => !m)}
        onInjectFailure={injectFailure}
      />

      <div className="flex min-h-0 flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <div
          className="relative flex shrink-0 h-full transition-all duration-300 z-10"
          style={{ width: isLeftCollapsed ? 0 : 320 }}
        >
          <div
            className="h-full overflow-hidden transition-all duration-300"
            style={{ width: isLeftCollapsed ? 0 : 320 }}
          >
            <ComponentLibrary />
          </div>
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 z-30 flex h-8 w-6 items-center justify-center rounded-md border border-white/10 bg-[#161616] text-white hover:bg-[#FF6500] hover:border-[#FF6500] transition-all cursor-pointer shadow-lg ${
              isLeftCollapsed ? "left-0" : "-right-3"
            }`}
          >
            {isLeftCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="relative min-w-0 flex-1 h-full">
          <CanvasInner showGrid={showGrid} showMetrics={showMetrics} suggestions={suggestions} />

          <AnimatePresence>
            {briefOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="pointer-events-auto absolute left-4 top-4 z-20 w-[340px] rounded-xl border border-white/10 bg-[#111111]/95 backdrop-blur p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                    Challenge Brief
                  </div>

                  <button
                    onClick={() => setBriefOpen(false)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 text-[13px] font-semibold text-white">{challenge.title}</div>

                <div className="mt-1 text-[12px] text-white/65">{challenge.brief}</div>

                {challenge.requirements?.length > 0 && (
                  <div className="mt-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                      Requirements
                    </div>

                    <ul className="mt-1 space-y-1 text-[12px] text-white/75">
                      {challenge.requirements.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[#FF6500]">›</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {challenge.hints?.length > 0 && (
                  <div className="mt-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                      Hints
                    </div>

                    <ul className="mt-1 space-y-1 text-[12px] text-white/60">
                      {challenge.hints.map((h, i) => (
                        <li key={i} className="flex gap-2">
                          <Sparkles className="mt-0.5 h-3 w-3 text-[#FF6500]" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {nodes.length === 0 && (
                  <div className="mt-3 rounded-md border border-dashed border-white/15 bg-black/30 p-2 text-[11px] text-white/55">
                    Drag any component from the left panel onto the empty canvas to begin. Connect
                    them by dragging from the orange dots on each node.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar */}
        <div
          className="relative flex shrink-0 h-full transition-all duration-300 z-10"
          style={{ width: isRightCollapsed ? 0 : 320 }}
        >
          <div
            className="h-full overflow-hidden transition-all duration-300"
            style={{ width: isRightCollapsed ? 0 : 320 }}
          >
            <Panel className="w-[320px] shrink-0 border-l h-full">
              <div className="flex h-full flex-col">
                <div className="border-b border-white/[0.08]">
                  <MetricsPanel />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <PropertiesPanel />
                </div>
              </div>
            </Panel>
          </div>
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 z-30 flex h-8 w-6 items-center justify-center rounded-md border border-white/10 bg-[#161616] text-white hover:bg-[#FF6500] hover:border-[#FF6500] transition-all cursor-pointer shadow-lg ${
              isRightCollapsed ? "right-0" : "-left-3"
            }`}
          >
            {isRightCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
