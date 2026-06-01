import React, { useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge as rfAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { Activity } from "lucide-react";
import InfraNode from "@/components/nodes/InfraNode";
import TrafficEdge from "@/components/edges/TrafficEdge";
import {
  setNodes as setNodesAction,
  setEdges as setEdgesAction,
  addNode,
  selectNode,
} from "@/redux/slices/simulatorSlice";
import { kindMap, defaultPropsFor } from "@/lib/simulator/catalog";
import SimulationDock from "./SimulationDock";

const nodeTypes = { infra: InfraNode };
const edgeTypes = { traffic: TrafficEdge };

export default function CanvasInner({ showGrid, showMetrics, suggestions }) {
  const dispatch = useDispatch();
  const nodes = useSelector((s) => s.simulator.nodes);
  const edges = useSelector((s) => s.simulator.edges);
  const simulation = useSelector((s) => s.simulator.simulation);
  const rf = useReactFlow();
  const wrapper = useRef(null);

  const onNodesChange = useCallback(
    (c) => dispatch(setNodesAction(applyNodeChanges(c, nodes))),
    [nodes, dispatch],
  );
  const onEdgesChange = useCallback(
    (c) => dispatch(setEdgesAction(applyEdgeChanges(c, edges))),
    [edges, dispatch],
  );
  const onConnect = useCallback(
    (p) =>
      dispatch(
        setEdgesAction(
          rfAddEdge({ ...p, type: "traffic", animated: true, data: { kind: "request" } }, edges),
        ),
      ),
    [edges, dispatch],
  );

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/x-simulator-kind");
    if (!kind) return;
    const meta = kindMap[kind];
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${kind}-${Date.now()}`;
    dispatch(
      addNode({
        id,
        type: "infra",
        position,
        data: { kind, label: meta.label, category: meta.category, ...defaultPropsFor(kind) },
      }),
    );
  };

  return (
    <div ref={wrapper} className="relative h-full w-full font-sans" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => dispatch(selectNode(n.id))}
        onPaneClick={() => dispatch(selectNode(null))}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        multiSelectionKeyCode="Shift"
        deleteKeyCode={["Backspace", "Delete"]}
        defaultEdgeOptions={{ type: "traffic", animated: true }}
        minZoom={0.2}
        maxZoom={2.5}
        style={{ background: "#0A0A0A" }}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="rgba(255,255,255,0.55)"
          />
        )}
        <Controls className="!bg-[#111111] !border !border-white/10 [&_button]:!bg-[#161616] [&_button]:!border-white/10 [&_button]:!text-white" />
        {showMetrics && (
          <MiniMap
            maskColor="rgba(0,0,0,0.6)"
            nodeColor={() => "#FF6500"}
            nodeStrokeColor={() => "#FF6500"}
            style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        )}
      </ReactFlow>

      <SimulationDock suggestions={suggestions} />

      {simulation.running && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
          <Activity className="h-3.5 w-3.5" /> Simulating · {simulation.pattern} ·{" "}
          {simulation.userLoad.toLocaleString()} req/s
        </div>
      )}
    </div>
  );
}
