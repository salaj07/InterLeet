import React from "react";
import { useSelector } from "react-redux";
import { SectionLabel } from "./ui";

export default function MetricsPanel() {
  const metrics = useSelector((s) => s.simulator.metrics);
  const nodes = useSelector((s) => s.simulator.nodes);
  const edges = useSelector((s) => s.simulator.edges);
  const monthly = (metrics.costHr * 24 * 30).toFixed(0);

  const Stat = ({ label, value, hint, status }) => {
    const statusColor =
      status === "Critical"
        ? "text-red-400"
        : status === "Warning"
          ? "text-amber-400"
          : "text-emerald-400";
    return (
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/45">
          <span>{label}</span>
          {hint && <span>{hint}</span>}
        </div>
        <div
          className={`mt-1 text-[18px] font-semibold tabular-nums ${status ? statusColor : "text-white"}`}
        >
          {value}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <SectionLabel
        right={
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] ${metrics.health === "Critical" ? "text-red-400" : metrics.health === "Warning" ? "text-amber-400" : "text-emerald-400"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${metrics.health === "Critical" ? "bg-red-500" : metrics.health === "Warning" ? "bg-amber-500" : "bg-emerald-500"}`}
            />
            {metrics.health}
          </span>
        }
      >
        System Metrics
      </SectionLabel>
      <Stat label="Throughput" value={`${metrics.throughput} req/s`} />
      <Stat
        label="Avg Latency"
        value={`${metrics.latency} ms`}
        status={metrics.latency > 250 ? "Critical" : metrics.latency > 150 ? "Warning" : "Healthy"}
      />
      <Stat
        label="Error Rate"
        value={`${metrics.errorRate.toFixed(2)}%`}
        status={metrics.errorRate > 5 ? "Critical" : metrics.errorRate > 1 ? "Warning" : "Healthy"}
      />
      <Stat label="Cost / hour" value={`$${metrics.costHr.toFixed(2)}`} hint={`$${monthly}/mo`} />
      <div className="grid grid-cols-2 border-b border-white/[0.06]">
        <div className="px-4 py-3 border-r border-white/[0.06]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">Nodes</div>
          <div className="text-[18px] font-semibold tabular-nums">{nodes.length}</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">
            Connections
          </div>
          <div className="text-[18px] font-semibold tabular-nums">{edges.length}</div>
        </div>
      </div>
    </div>
  );
}
