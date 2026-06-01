import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setNodes as setNodesAction,
  setEdges as setEdgesAction,
  setMetrics,
} from "@/redux/slices/simulatorSlice";

export function useSimulationEngine() {
  const dispatch = useDispatch();
  const sim = useSelector((s) => s.simulator.simulation);
  const nodes = useSelector((s) => s.simulator.nodes);
  const edges = useSelector((s) => s.simulator.edges);
  const failure = useSelector((s) => s.simulator.failure);

  // Refs keep the interval callback reading the latest state without
  // re-creating the interval (which would otherwise overwrite positions
  // mid-drag with a stale snapshot).
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const simRef = useRef(sim);
  const failureRef = useRef(failure);
  
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  useEffect(() => {
    simRef.current = sim;
  }, [sim]);
  useEffect(() => {
    failureRef.current = failure;
  }, [failure]);

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

      let totalLatency = 0,
        weighted = 0,
        errors = 0,
        costHr = 0;
      const updated = currentNodes.map((n) => {
        const cap = (n.data.throughput || 100) * (n.data.replicas || 1);
        const isFailed = f && f.nodeId === n.id;
        const traffic = activeLoad;
        let load01 = cap > 0 ? traffic / cap : 0;
        if (isFailed) load01 = 1.5;
        const cpu = Math.min(100, Math.round(load01 * 90 + (running ? 8 : 4)));
        const memory = Math.min(100, Math.round(load01 * 70 + 20));
        const baseLat = n.data.latency || 20;
        const latency = Math.round(
          baseLat * (1 + Math.max(0, load01 - 0.7) * 4) + (isFailed ? 500 : 0),
        );
        const health = isFailed || load01 > 1.1 ? "critical" : load01 > 0.8 ? "warning" : "healthy";
        const errRate = isFailed ? 80 : load01 > 1 ? (load01 - 1) * 40 : 0;
        costHr += n.data.hourlyCost || 0;
        weighted += traffic;
        totalLatency += latency * traffic;
        errors += errRate * traffic;
        // IMPORTANT: preserve position, type and everything else on the node
        return { ...n, data: { ...n.data, cpu, memory, latency, health } };
      });

      const avgLatency = weighted > 0 ? Math.round(totalLatency / weighted) : 0;
      const errorRate = weighted > 0 ? errors / weighted : 0;
      const health =
        errorRate > 5 || updated.some((n) => n.data.health === "critical")
          ? "Critical"
          : updated.some((n) => n.data.health === "warning")
            ? "Warning"
            : "Healthy";

      dispatch(setNodesAction(updated));
      dispatch(
        setEdgesAction(
          currentEdges.map((e) => {
            const target = updated.find((n) => n.id === e.target);
            const h = target?.data.health || "healthy";
            return {
              ...e,
              animated: running,
              data: {
                ...e.data,
                health: h,
                metric: running
                  ? Math.round(
                      activeLoad /
                        Math.max(1, currentEdges.filter((x) => x.target === e.target).length),
                    )
                  : 0,
              },
            };
          }),
        ),
      );
      dispatch(
        setMetrics({
          throughput: Math.round(running ? activeLoad : 0),
          latency: avgLatency,
          errorRate,
          costHr,
          health,
        }),
      );
    }, 900);
    return () => clearInterval(id);
  }, [sim.running, !!failure, dispatch]);
}
