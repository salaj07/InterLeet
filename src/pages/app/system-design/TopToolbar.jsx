import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Layers as LayersIcon,
  AlertTriangle,
  Network as NetIcon,
  Circle,
} from "lucide-react";
import { clearCanvas, setSimulation } from "@/redux/slices/simulatorSlice";

export default function TopToolbar({
  onFitView,
  onToggleGrid,
  showGrid,
  onToggleMetrics,
  onInjectFailure,
}) {
  const dispatch = useDispatch();
  const simulation = useSelector((s) => s.simulator.simulation);

  const Btn = ({ icon: Icon, children, onClick, primary, active }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors ${
        primary
          ? "border-[#FF6500] bg-[#FF6500] text-white hover:bg-[#FF6500]/90"
          : active
            ? "border-[#FF6500]/60 bg-[#FF6500]/10 text-white"
            : "border-white/10 bg-[#161616] text-white/85 hover:border-white/25 hover:text-white"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />} {children}
    </button>
  );

  return (
    <div className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#111111] px-3">
      <div className="flex items-center gap-1.5">
        <div className="mr-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black">
            <NetIcon className="h-3.5 w-3.5 text-[#FF6500]" />
          </span>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold">System Design Simulator</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">
              challenge workspace
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Btn icon={Circle} active={showGrid} onClick={onToggleGrid}>
          Dots
        </Btn>
        <Btn icon={LayersIcon} onClick={onToggleMetrics}>
          Metrics
        </Btn>
        <Btn icon={Maximize2} onClick={onFitView}>
          Fit
        </Btn>
        <div className="mx-1 h-6 w-px bg-white/10" />
        <Btn icon={AlertTriangle} onClick={onInjectFailure}>
          Inject Failure
        </Btn>
        <Btn icon={RotateCcw} onClick={() => dispatch(clearCanvas())}>
          Reset
        </Btn>
        {simulation.running ? (
          <Btn icon={Pause} primary onClick={() => dispatch(setSimulation({ running: false }))}>
            Pause
          </Btn>
        ) : (
          <Btn icon={Play} primary onClick={() => dispatch(setSimulation({ running: true }))}>
            Start Simulation
          </Btn>
        )}
      </div>
    </div>
  );
}
