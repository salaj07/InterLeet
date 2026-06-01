import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlowProvider,
  addEdge as rfAddEdge, applyEdgeChanges, applyNodeChanges, useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Search, Save, FolderOpen, Download, FileJson,
  FileImage, Image as ImageIcon, Layers as LayersIcon, Maximize2, Grid3x3,
  Activity, AlertTriangle, ZapOff, Sparkles, ChevronDown, ChevronUp, Trash2,
  Network as NetIcon, Plus, Server, Bot, X, Circle, BookOpen, ArrowLeft,
} from "lucide-react";
import InfraNode from "@/components/nodes/InfraNode";
import TrafficEdge from "@/components/edges/TrafficEdge";
import {
  setNodes as setNodesAction, setEdges as setEdgesAction, addNode, addEdge as addEdgeAction,
  updateNodeData, selectNode, setSimulation, setMetrics, setFailure, resetAll, loadTemplate, clearCanvas,
} from "@/redux/slices/simulatorSlice";
import { catalog, kindMap, defaultPropsFor } from "@/lib/simulator/catalog";
import { templates } from "@/lib/simulator/templates";
import { challenges, blankChallenge } from "@/lib/simulator/challenges";

const nodeTypes = { infra: InfraNode };
const edgeTypes = { traffic: TrafficEdge };

const Panel = ({ children, className = "" }) => (
  <div className={`flex flex-col bg-[#111111] border-white/[0.08] ${className}`} style={{ borderColor: "rgba(255,255,255,0.08)" }}>
    {children}
  </div>
);

const SectionLabel = ({ children, right }) => (
  <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5">
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{children}</div>
    {right}
  </div>
);

// ---------- Left: component library ----------
function ComponentLibrary() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog.map(c => ({ ...c, items: c.items.filter(i => !term || i.label.toLowerCase().includes(term) || i.kind.includes(term)) })).filter(c => c.items.length);
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
            value={q} onChange={e => setQ(e.target.value)} placeholder="Search components"
            className="w-full rounded-md border border-white/10 bg-black/40 pl-8 pr-2 py-1.5 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#FF6500]/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map(group => (
          <div key={group.category}>
            <div className="sticky top-0 z-10 bg-[#111111] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 border-b border-white/[0.06]">
              {group.category}
            </div>
            <div className="p-2 grid gap-1.5">
              {group.items.map(item => (
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

// ---------- Top toolbar ----------
function TopToolbar({ onFitView, onToggleGrid, showGrid, onToggleMetrics, onInjectFailure }) {
  const dispatch = useDispatch();
  const simulation = useSelector(s => s.simulator.simulation);

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
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">challenge workspace</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Btn icon={Circle} active={showGrid} onClick={onToggleGrid}>Dots</Btn>
        <Btn icon={LayersIcon} onClick={onToggleMetrics}>Metrics</Btn>
        <Btn icon={Maximize2} onClick={onFitView}>Fit</Btn>
        <div className="mx-1 h-6 w-px bg-white/10" />
        <Btn icon={AlertTriangle} onClick={onInjectFailure}>Inject Failure</Btn>
        <Btn icon={RotateCcw} onClick={() => dispatch(resetAll())}>Reset</Btn>
        {simulation.running ? (
          <Btn icon={Pause} primary onClick={() => dispatch(setSimulation({ running: false }))}>Pause</Btn>
        ) : (
          <Btn icon={Play} primary onClick={() => dispatch(setSimulation({ running: true }))}>Start Simulation</Btn>
        )}
      </div>
    </div>
  );
}

// ---------- Right: metrics + properties ----------
function MetricsPanel() {
  const metrics = useSelector(s => s.simulator.metrics);
  const nodes = useSelector(s => s.simulator.nodes);
  const edges = useSelector(s => s.simulator.edges);
  const monthly = (metrics.costHr * 24 * 30).toFixed(0);

  const Stat = ({ label, value, hint, status }) => {
    const statusColor = status === "Critical" ? "text-red-400" : status === "Warning" ? "text-amber-400" : "text-emerald-400";
    return (
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/45">
          <span>{label}</span>{hint && <span>{hint}</span>}
        </div>
        <div className={`mt-1 text-[18px] font-semibold tabular-nums ${status ? statusColor : "text-white"}`}>{value}</div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <SectionLabel right={<span className={`inline-flex items-center gap-1.5 text-[10px] ${metrics.health === "Critical" ? "text-red-400" : metrics.health === "Warning" ? "text-amber-400" : "text-emerald-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${metrics.health === "Critical" ? "bg-red-500" : metrics.health === "Warning" ? "bg-amber-500" : "bg-emerald-500"}`} />{metrics.health}</span>}>System Metrics</SectionLabel>
      <Stat label="Throughput" value={`${metrics.throughput} req/s`} />
      <Stat label="Avg Latency" value={`${metrics.latency} ms`} status={metrics.latency > 250 ? "Critical" : metrics.latency > 150 ? "Warning" : "Healthy"} />
      <Stat label="Error Rate" value={`${metrics.errorRate.toFixed(2)}%`} status={metrics.errorRate > 5 ? "Critical" : metrics.errorRate > 1 ? "Warning" : "Healthy"} />
      <Stat label="Cost / hour" value={`$${metrics.costHr.toFixed(2)}`} hint={`$${monthly}/mo`} />
      <div className="grid grid-cols-2 border-b border-white/[0.06]">
        <div className="px-4 py-3 border-r border-white/[0.06]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">Nodes</div>
          <div className="text-[18px] font-semibold tabular-nums">{nodes.length}</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">Connections</div>
          <div className="text-[18px] font-semibold tabular-nums">{edges.length}</div>
        </div>
      </div>
    </div>
  );
}

function PropertiesPanel() {
  const dispatch = useDispatch();
  const id = useSelector(s => s.simulator.selectedNodeId);
  const node = useSelector(s => s.simulator.nodes.find(n => n.id === id));

  if (!node) {
    return (
      <div className="flex h-full flex-col">
        <SectionLabel>Properties</SectionLabel>
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-black">
              <Server className="h-4 w-4 text-white/50" />
            </div>
            <div className="mt-3 text-[12px] text-white/60">Select a node to inspect</div>
            <div className="mt-1 text-[11px] text-white/35">Configure performance, cost, and component-specific parameters.</div>
          </div>
        </div>
      </div>
    );
  }

  const d = node.data;
  const update = (patch) => dispatch(updateNodeData({ id: node.id, data: patch }));

  const Row = ({ label, children }) => (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 px-4 py-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">{label}</div>
      <div className="text-[12px] text-white">{children}</div>
    </div>
  );
  const Input = (props) => (
    <input {...props} className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-[#FF6500]/50" />
  );
  const Select = ({ options, value, onChange }) => (
    <select value={value} onChange={onChange} className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-[#FF6500]/50">
      {options.map(o => <option key={o} value={o} className="bg-[#111]">{o}</option>)}
    </select>
  );

  const specific = (() => {
    switch (d.kind) {
      case "client":
      case "mobile":
      case "web":
      case "client-cluster":
        return (
          <>
            <Row label="Client Type"><Select value={d.clientType || "web"} onChange={e => update({ clientType: e.target.value })} options={["web","mobile","iot","desktop"]} /></Row>
            <Row label="Users"><Input type="number" value={d.concurrentUsers ?? 1000} onChange={e => update({ concurrentUsers: +e.target.value })} /></Row>
            <Row label="Req Rate"><Input type="number" value={d.requestRate ?? 5} onChange={e => update({ requestRate: +e.target.value })} /></Row>
            <Row label="Region"><Select value={d.region || "us-east-1"} onChange={e => update({ region: e.target.value })} options={["us-east-1","us-west-2","eu-west-1","ap-south-1"]} /></Row>
          </>
        );
      case "load-balancer":
        return (
          <>
            <Row label="Algorithm"><Select value={d.algorithm || "round-robin"} onChange={e => update({ algorithm: e.target.value })} options={["round-robin","least-conn","ip-hash","weighted"]} /></Row>
            <Row label="SSL"><Toggle value={!!d.ssl} onChange={v => update({ ssl: v })} /></Row>
            <Row label="Sticky"><Toggle value={!!d.sticky} onChange={v => update({ sticky: v })} /></Row>
            <Row label="Max Conn"><Input type="number" value={d.maxConnections ?? 10000} onChange={e => update({ maxConnections: +e.target.value })} /></Row>
          </>
        );
      case "api-gateway":
        return (
          <>
            <Row label="Auth"><Toggle value={!!d.auth} onChange={v => update({ auth: v })} /></Row>
            <Row label="Rate Limit"><Input type="number" value={d.rateLimit ?? 1000} onChange={e => update({ rateLimit: +e.target.value })} /></Row>
            <Row label="Validation"><Toggle value={!!d.validation} onChange={v => update({ validation: v })} /></Row>
            <Row label="Version"><Input value={d.versioning ?? "v1"} onChange={e => update({ versioning: e.target.value })} /></Row>
            <Row label="Caching"><Toggle value={!!d.caching} onChange={v => update({ caching: v })} /></Row>
          </>
        );
      case "microservice":
        return (
          <>
            <Row label="Service"><Input value={d.serviceName ?? "service"} onChange={e => update({ serviceName: e.target.value })} /></Row>
            <Row label="Language"><Select value={d.language || "Node.js"} onChange={e => update({ language: e.target.value })} options={["Node.js","Go","Python","Java","Rust"]} /></Row>
            <Row label="Version"><Input value={d.version ?? "1.0.0"} onChange={e => update({ version: e.target.value })} /></Row>
            <Row label="Replicas"><Input type="number" value={d.replicas ?? 3} onChange={e => update({ replicas: +e.target.value })} /></Row>
            <Row label="Autoscale"><Toggle value={!!d.autoscaling} onChange={v => update({ autoscaling: v })} /></Row>
          </>
        );
      case "postgresql":
      case "mysql":
      case "mongodb":
        return (
          <>
            <Row label="Storage GB"><Input type="number" value={d.storage ?? 100} onChange={e => update({ storage: +e.target.value })} /></Row>
            <Row label="Replication"><Select value={d.replication || "primary-replica"} onChange={e => update({ replication: e.target.value })} options={["single","primary-replica","multi-primary","replica-set"]} /></Row>
            <Row label="Backup"><Select value={d.backupStrategy || "daily"} onChange={e => update({ backupStrategy: e.target.value })} options={["none","daily","hourly","continuous"]} /></Row>
            <Row label="Read Cap"><Input type="number" value={d.readCapacity ?? 2000} onChange={e => update({ readCapacity: +e.target.value })} /></Row>
            <Row label="Write Cap"><Input type="number" value={d.writeCapacity ?? 500} onChange={e => update({ writeCapacity: +e.target.value })} /></Row>
          </>
        );
      case "redis":
        return (
          <>
            <Row label="Memory GB"><Input type="number" value={d.memorySize ?? 4} onChange={e => update({ memorySize: +e.target.value })} /></Row>
            <Row label="TTL (s)"><Input type="number" value={d.ttl ?? 3600} onChange={e => update({ ttl: +e.target.value })} /></Row>
            <Row label="Replication"><Select value={d.replication || "primary-replica"} onChange={e => update({ replication: e.target.value })} options={["single","primary-replica","cluster"]} /></Row>
            <Row label="Eviction"><Select value={d.evictionPolicy || "allkeys-lru"} onChange={e => update({ evictionPolicy: e.target.value })} options={["noeviction","allkeys-lru","allkeys-lfu","volatile-ttl"]} /></Row>
          </>
        );
      case "kafka":
        return (
          <>
            <Row label="Partitions"><Input type="number" value={d.partitions ?? 12} onChange={e => update({ partitions: +e.target.value })} /></Row>
            <Row label="Replication"><Input type="number" value={d.replicationFactor ?? 3} onChange={e => update({ replicationFactor: +e.target.value })} /></Row>
            <Row label="Retention (h)"><Input type="number" value={d.retentionPeriod ?? 168} onChange={e => update({ retentionPeriod: +e.target.value })} /></Row>
          </>
        );
      default: return null;
    }
  })();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <SectionLabel right={<button className="text-white/50 hover:text-white" onClick={() => dispatch(selectNode(null))}><X className="h-3.5 w-3.5" /></button>}>Properties · {d.label}</SectionLabel>

      <div className="border-b border-white/[0.06] py-1">
        <Row label="Name"><Input value={d.label} onChange={e => update({ label: e.target.value })} /></Row>
        <Row label="Description"><Input value={d.description ?? ""} onChange={e => update({ description: e.target.value })} placeholder="Notes…" /></Row>
        <Row label="Environment"><Select value={d.environment || "production"} onChange={e => update({ environment: e.target.value })} options={["development","staging","production"]} /></Row>
      </div>

      <div className="border-b border-white/[0.06] py-1">
        <SubLabel>Status</SubLabel>
        <Row label="Enabled"><Toggle value={d.enabled !== false} onChange={v => update({ enabled: v })} /></Row>
        <Row label="Health"><Select value={d.health || "healthy"} onChange={e => update({ health: e.target.value })} options={["healthy","warning","critical"]} /></Row>
        <Row label="Replicas"><Input type="number" value={d.replicas ?? 1} onChange={e => update({ replicas: +e.target.value })} /></Row>
      </div>

      <div className="border-b border-white/[0.06] py-1">
        <SubLabel>Performance</SubLabel>
        <Row label="Throughput"><Input type="number" value={d.throughput ?? 100} onChange={e => update({ throughput: +e.target.value })} /></Row>
        <Row label="Latency"><Input type="number" value={d.latency ?? 20} onChange={e => update({ latency: +e.target.value })} /></Row>
        <Row label="Error Rate"><Input type="number" step="0.1" value={d.errorRate ?? 0} onChange={e => update({ errorRate: +e.target.value })} /></Row>
      </div>

      <div className="border-b border-white/[0.06] py-1">
        <SubLabel>Cost</SubLabel>
        <Row label="Hourly $"><Input type="number" value={d.hourlyCost ?? 0} onChange={e => update({ hourlyCost: +e.target.value })} /></Row>
        <Row label="Monthly $"><div className="font-mono text-white/70">${((d.hourlyCost ?? 0) * 24 * 30).toFixed(0)}</div></Row>
      </div>

      {specific && (
        <div className="border-b border-white/[0.06] py-1">
          <SubLabel>{kindMap[d.kind]?.label} settings</SubLabel>
          {specific}
        </div>
      )}
    </div>
  );
}

const SubLabel = ({ children }) => (
  <div className="px-4 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-white/35">{children}</div>
);

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-[#FF6500]" : "bg-white/15"}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
  </button>
);

// ---------- Bottom: simulation control ----------
function SimulationDock() {
  const dispatch = useDispatch();
  const sim = useSelector(s => s.simulator.simulation);
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-[#111111]/95 px-3 py-2.5 backdrop-blur"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">User Load</span>
          <input
            type="range" min={1} max={100000} step={100} value={sim.userLoad}
            onChange={e => dispatch(setSimulation({ userLoad: +e.target.value }))}
            className="w-56 accent-[#FF6500]"
          />
          <span className="w-20 text-right font-mono text-[12px] text-white tabular-nums">{sim.userLoad.toLocaleString()} <span className="text-white/40">req/s</span></span>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Pattern</span>
          <select value={sim.pattern} onChange={e => dispatch(setSimulation({ pattern: e.target.value }))} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none">
            {["constant","burst","peak-hours","random","ddos"].map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Duration</span>
          <select value={sim.duration} onChange={e => dispatch(setSimulation({ duration: e.target.value }))} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none">
            {["1m","5m","15m","1h"].map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
          </select>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          {sim.running ? (
            <button onClick={() => dispatch(setSimulation({ running: false }))} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#161616] px-2.5 py-1.5 text-[12px] text-white hover:border-white/25"><Pause className="h-3.5 w-3.5" /> Pause</button>
          ) : (
            <button onClick={() => dispatch(setSimulation({ running: true }))} className="inline-flex items-center gap-1 rounded-md border border-[#FF6500] bg-[#FF6500] px-2.5 py-1.5 text-[12px] text-white hover:bg-[#FF6500]/90"><Play className="h-3.5 w-3.5" /> Start</button>
          )}
          <button onClick={() => dispatch(resetAll())} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#161616] px-2.5 py-1.5 text-[12px] text-white hover:border-white/25"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Optimization Assistant (floating) ----------
function OptimizationAssistant({ suggestions }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pointer-events-auto absolute right-4 bottom-4 z-20 w-80 rounded-xl border border-white/10 bg-[#111111]/95 backdrop-blur">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between px-3 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#FF6500]" />
          <span className="text-[12px] font-semibold">Optimization Assistant</span>
        </div>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-white/50" /> : <ChevronUp className="h-3.5 w-3.5 text-white/50" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="max-h-72 overflow-y-auto p-2">
              {suggestions.length === 0 && (
                <div className="px-2 py-4 text-[12px] text-white/45">System is healthy — no recommendations.</div>
              )}
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-md border border-white/10 bg-[#161616] p-2.5 mb-2 last:mb-0">
                  <div className="text-[12px] font-semibold text-white">{s.title}</div>
                  <div className="mt-0.5 text-[11px] text-white/55">{s.detail}</div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                    <Pill label="Latency" value={s.impact.latency} positive />
                    <Pill label="Throughput" value={s.impact.throughput} positive />
                    <Pill label="Cost" value={s.impact.cost} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
const Pill = ({ label, value, positive }) => (
  <div className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1">
    <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">{label}</div>
    <div className={`font-mono ${positive ? "text-emerald-400" : "text-amber-400"}`}>{value}</div>
  </div>
);

// ---------- Templates bar ----------
function TemplatesStrip() {
  const dispatch = useDispatch();
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.08] bg-[#111111] px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/45 pr-2">Templates</span>
      {templates.map(t => (
        <button key={t.id} onClick={() => dispatch(loadTemplate({ nodes: t.nodes, edges: t.edges }))}
          className="whitespace-nowrap rounded-md border border-white/10 bg-[#161616] px-2.5 py-1 text-[11px] text-white/85 hover:border-white/25 hover:text-white">
          {t.name}
        </button>
      ))}
    </div>
  );
}

// ---------- Canvas ----------
function CanvasInner({ showGrid, showMetrics }) {
  const dispatch = useDispatch();
  const nodes = useSelector(s => s.simulator.nodes);
  const edges = useSelector(s => s.simulator.edges);
  const simulation = useSelector(s => s.simulator.simulation);
  const rf = useReactFlow();
  const wrapper = useRef(null);

  const onNodesChange = useCallback((c) => dispatch(setNodesAction(applyNodeChanges(c, nodes))), [nodes, dispatch]);
  const onEdgesChange = useCallback((c) => dispatch(setEdgesAction(applyEdgeChanges(c, edges))), [edges, dispatch]);
  const onConnect = useCallback((p) => dispatch(setEdgesAction(rfAddEdge({ ...p, type: "traffic", animated: true, data: { kind: "request" } }, edges))), [edges, dispatch]);

  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/x-simulator-kind");
    if (!kind) return;
    const meta = kindMap[kind];
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${kind}-${Date.now()}`;
    dispatch(addNode({
      id, type: "infra", position,
      data: { kind, label: meta.label, category: meta.category, ...defaultPropsFor(kind) },
    }));
  };

  return (
    <div ref={wrapper} className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onNodeClick={(_, n) => dispatch(selectNode(n.id))}
        onPaneClick={() => dispatch(selectNode(null))}
        fitView fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        multiSelectionKeyCode="Shift" deleteKeyCode={["Backspace","Delete"]}
        defaultEdgeOptions={{ type: "traffic", animated: true }}
        minZoom={0.2} maxZoom={2.5}
        style={{ background: "#0A0A0A" }}
      >
        {showGrid && <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="rgba(255,255,255,0.55)" />}
        <Controls className="!bg-[#111111] !border !border-white/10 [&_button]:!bg-[#161616] [&_button]:!border-white/10 [&_button]:!text-white" />
        {showMetrics && <MiniMap maskColor="rgba(0,0,0,0.6)" nodeColor={() => "#FF6500"} nodeStrokeColor={() => "#FF6500"} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }} />}
      </ReactFlow>
      <SimulationDock />
      {simulation.running && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
          <Activity className="h-3.5 w-3.5" /> Simulating · {simulation.pattern} · {simulation.userLoad.toLocaleString()} req/s
        </div>
      )}
    </div>
  );
}

// ---------- Simulation engine ----------
function useSimulationEngine() {
  const dispatch = useDispatch();
  const sim = useSelector(s => s.simulator.simulation);
  const nodes = useSelector(s => s.simulator.nodes);
  const edges = useSelector(s => s.simulator.edges);
  const failure = useSelector(s => s.simulator.failure);

  // Refs keep the interval callback reading the latest state without
  // re-creating the interval (which would otherwise overwrite positions
  // mid-drag with a stale snapshot).
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const simRef = useRef(sim);
  const failureRef = useRef(failure);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { simRef.current = sim; }, [sim]);
  useEffect(() => { failureRef.current = failure; }, [failure]);

  useEffect(() => {
    if (!sim.running && !failure) return;
    const id = setInterval(() => {
      const s = simRef.current;
      const f = failureRef.current;
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      let load = s.userLoad;
      if (s.pattern === "burst") load = load * (0.6 + Math.random() * 1.8);
      else if (s.pattern === "peak-hours") load = load * (0.9 + 0.4 * Math.sin(Date.now() / 5000));
      else if (s.pattern === "random") load = load * (0.4 + Math.random() * 1.2);
      else if (s.pattern === "ddos") load = load * (3 + Math.random() * 2);

      const running = s.running;
      const activeLoad = running ? load : 0;

      let totalLatency = 0, weighted = 0, errors = 0, costHr = 0;
      const updated = currentNodes.map(n => {
        const cap = (n.data.throughput || 100) * (n.data.replicas || 1);
        const isFailed = f && f.nodeId === n.id;
        const traffic = activeLoad;
        let load01 = cap > 0 ? traffic / cap : 0;
        if (isFailed) load01 = 1.5;
        const cpu = Math.min(100, Math.round(load01 * 90 + (running ? 8 : 4)));
        const memory = Math.min(100, Math.round(load01 * 70 + 20));
        const baseLat = n.data.latency || 20;
        const latency = Math.round(baseLat * (1 + Math.max(0, load01 - 0.7) * 4) + (isFailed ? 500 : 0));
        const health = isFailed || load01 > 1.1 ? "critical" : load01 > 0.8 ? "warning" : "healthy";
        const errRate = isFailed ? 80 : load01 > 1 ? (load01 - 1) * 40 : 0;
        costHr += n.data.hourlyCost || 0;
        weighted += traffic; totalLatency += latency * traffic; errors += errRate * traffic;
        // IMPORTANT: preserve position, type and everything else on the node
        return { ...n, data: { ...n.data, cpu, memory, latency, health } };
      });

      const avgLatency = weighted > 0 ? Math.round(totalLatency / weighted) : 0;
      const errorRate = weighted > 0 ? errors / weighted : 0;
      const health = errorRate > 5 || updated.some(n => n.data.health === "critical") ? "Critical" :
        updated.some(n => n.data.health === "warning") ? "Warning" : "Healthy";

      dispatch(setNodesAction(updated));
      dispatch(setEdgesAction(currentEdges.map(e => {
        const target = updated.find(n => n.id === e.target);
        const h = target?.data.health || "healthy";
        return { ...e, animated: running, data: { ...e.data, health: h, metric: running ? Math.round(activeLoad / Math.max(1, currentEdges.filter(x => x.target === e.target).length)) : 0 } };
      })));
      dispatch(setMetrics({
        throughput: Math.round(running ? activeLoad : 0),
        latency: avgLatency, errorRate, costHr, health,
      }));
    }, 900);
    return () => clearInterval(id);
  }, [sim.running, !!failure, dispatch]);
}

// ---------- Suggestions ----------
function useSuggestions() {
  const nodes = useSelector(s => s.simulator.nodes);
  const edges = useSelector(s => s.simulator.edges);
  const metrics = useSelector(s => s.simulator.metrics);

  return useMemo(() => {
    const out = [];
    const has = (kind) => nodes.some(n => n.data.kind === kind);
    if (!has("load-balancer")) out.push({ title: "Add Load Balancer", detail: "Distribute traffic to prevent single-instance overload.", impact: { latency: "-30%", throughput: "+2x", cost: "+$8/hr" }});
    if (!has("redis") && nodes.some(n => ["postgresql","mysql","mongodb"].includes(n.data.kind))) out.push({ title: "Add Redis Cache", detail: "Cache hot reads in front of the database.", impact: { latency: "-60%", throughput: "+3x", cost: "+$10/hr" }});
    if (!has("cdn") && nodes.some(n => n.data.kind === "client")) out.push({ title: "Add CDN", detail: "Serve static assets from the edge.", impact: { latency: "-40%", throughput: "+5x", cost: "+$6/hr" }});
    if (!has("kafka") && !has("queue")) out.push({ title: "Introduce Kafka", detail: "Decouple services with an event log for spiky workloads.", impact: { latency: "neutral", throughput: "+4x", cost: "+$25/hr" }});
    nodes.forEach(n => {
      if (["microservice","app-server","web-server"].includes(n.data.kind) && (n.data.replicas || 1) < 3) {
        out.push({ title: `Scale ${n.data.label}`, detail: `Increase replicas to handle bursts and remove SPOFs.`, impact: { latency: "-20%", throughput: "+2x", cost: `+$${(n.data.hourlyCost || 10) * 2}/hr` }});
      }
    });
    if (metrics.errorRate > 1) out.push({ title: "Investigate hot bottleneck", detail: "Error rate above target — focus on critical nodes.", impact: { latency: "TBD", throughput: "TBD", cost: "TBD" }});
    return out.slice(0, 6);
  }, [nodes, edges, metrics.errorRate]);
}

// ---------- Challenge picker ----------
function ChallengePicker({ onPick }) {
  const all = [blankChallenge, ...challenges];
  const diffColor = (d) => d === "Easy" ? "text-emerald-400 border-emerald-500/30" : d === "Medium" ? "text-amber-400 border-amber-500/30" : d === "Hard" ? "text-red-400 border-red-500/30" : "text-white/60 border-white/15";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black">
            <NetIcon className="h-4 w-4 text-[#FF6500]" />
          </span>
          <div>
            <div className="text-[20px] font-semibold">System Design Challenges</div>
            <div className="text-[12px] text-white/55">Pick a question — you'll get an empty canvas to drag, drop and wire components yourself.</div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {all.map(ch => (
            <button
              key={ch.id}
              onClick={() => onPick(ch)}
              className="group text-left rounded-xl border border-white/10 bg-[#111111] p-4 hover:border-[#FF6500]/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${diffColor(ch.difficulty)}`}>
                  {ch.difficulty}
                </div>
                <Plus className="h-4 w-4 text-white/30 group-hover:text-[#FF6500]" />
              </div>
              <div className="mt-3 text-[14px] font-semibold">{ch.title}</div>
              <div className="mt-1 line-clamp-3 text-[12px] text-white/55">{ch.brief}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {ch.tags.map(t => (
                  <span key={t} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/55">{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function SystemDesignSimulator() {
  const [challenge, setChallenge] = useState(null);
  return (
    <ReactFlowProvider>
      {!challenge ? (
        <ChallengePicker onPick={(c) => setChallenge(c)} />
      ) : (
        <Workspace challenge={challenge} onExit={() => setChallenge(null)} />
      )}
    </ReactFlowProvider>
  );
}

function Workspace({ challenge, onExit }) {
  const dispatch = useDispatch();
  const rf = useReactFlow();
  const nodes = useSelector(s => s.simulator.nodes);
  const edges = useSelector(s => s.simulator.edges);
  const [showGrid, setShowGrid] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [briefOpen, setBriefOpen] = useState(true);
  // Always start with an empty canvas when entering a challenge.
  useEffect(() => { dispatch(clearCanvas()); }, [challenge?.id, dispatch]);
  useSimulationEngine();
  const suggestions = useSuggestions();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "architecture.json"; a.click(); URL.revokeObjectURL(url);
  };
  const importJson = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (d.nodes && d.edges) dispatch(loadTemplate({ nodes: d.nodes, edges: d.edges })); } catch {} };
    r.readAsText(file);
  };
  const exportSvg = () => {
    const svg = document.querySelector(".react-flow__renderer svg") || document.querySelector(".react-flow svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "architecture.svg"; a.click(); URL.revokeObjectURL(url);
  };
  const exportPng = async () => {
    // Lightweight SVG → PNG without extra deps
    const svgEl = document.querySelector(".react-flow svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.clientWidth * 2; canvas.height = svgEl.clientHeight * 2;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "#0A0A0A"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "architecture.png"; a.click(); URL.revokeObjectURL(u); });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const injectFailure = () => {
    const candidates = nodes.filter(n => !["client","mobile","web"].includes(n.data.kind));
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    dispatch(setFailure({ nodeId: pick.id, type: "outage" }));
    setTimeout(() => dispatch(setFailure(null)), 8000);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0d0d0d] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onExit} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#161616] px-2 py-1 text-[11px] text-white/80 hover:border-white/25 hover:text-white">
            <ChevronUp className="h-3.5 w-3.5 -rotate-90" /> Challenges
          </button>
          <div className="ml-2 truncate text-[12px] font-semibold">{challenge.title}</div>
          <span className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/55">{challenge.difficulty}</span>
        </div>
        <button onClick={() => setBriefOpen(o => !o)} className="text-[11px] text-white/60 hover:text-white">
          {briefOpen ? "Hide brief" : "Show brief"}
        </button>
      </div>
      <TopToolbar
        onExportPng={exportPng} onExportSvg={exportSvg} onExportJson={exportJson} onImportJson={importJson}
        onFitView={() => rf.fitView({ padding: 0.25, duration: 300 })}
        onToggleGrid={() => setShowGrid(g => !g)} onToggleMetrics={() => setShowMetrics(m => !m)}
        onInjectFailure={injectFailure}
      />
      <TemplatesStrip />
      <div className="flex min-h-0 flex-1">
        <ComponentLibrary />
        <div className="relative min-w-0 flex-1">
          <CanvasInner showGrid={showGrid} showMetrics={showMetrics} />
          <OptimizationAssistant suggestions={suggestions} />
          <AnimatePresence>
            {briefOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="pointer-events-auto absolute left-4 top-4 z-20 w-[340px] rounded-xl border border-white/10 bg-[#111111]/95 backdrop-blur p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">Challenge Brief</div>
                  <button onClick={() => setBriefOpen(false)} className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-2 text-[13px] font-semibold">{challenge.title}</div>
                <div className="mt-1 text-[12px] text-white/65">{challenge.brief}</div>
                {challenge.requirements?.length > 0 && (
                  <div className="mt-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">Requirements</div>
                    <ul className="mt-1 space-y-1 text-[12px] text-white/75">
                      {challenge.requirements.map((r, i) => (
                        <li key={i} className="flex gap-2"><span className="text-[#FF6500]">›</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {challenge.hints?.length > 0 && (
                  <div className="mt-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">Hints</div>
                    <ul className="mt-1 space-y-1 text-[12px] text-white/60">
                      {challenge.hints.map((h, i) => (
                        <li key={i} className="flex gap-2"><Sparkles className="mt-0.5 h-3 w-3 text-[#FF6500]" />{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {nodes.length === 0 && (
                  <div className="mt-3 rounded-md border border-dashed border-white/15 bg-black/30 p-2 text-[11px] text-white/55">
                    Drag any component from the left panel onto the empty canvas to begin. Connect them by dragging from the orange dots on each node.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    </div>
  );
}
