import { useMemo } from "react";
import { useSelector } from "react-redux";

export function useSuggestions() {
  const nodes = useSelector((s) => s.simulator.nodes);
  const edges = useSelector((s) => s.simulator.edges);
  const metrics = useSelector((s) => s.simulator.metrics);

  return useMemo(() => {
    const out = [];
    const has = (kind) => nodes.some((n) => n.data.kind === kind);
    if (!has("load-balancer"))
      out.push({
        title: "Add Load Balancer",
        detail: "Distribute traffic to prevent single-instance overload.",
        impact: { latency: "-30%", throughput: "+2x", cost: "+$8/hr" },
      });
    if (
      !has("redis") &&
      nodes.some((n) => ["postgresql", "mysql", "mongodb"].includes(n.data.kind))
    )
      out.push({
        title: "Add Redis Cache",
        detail: "Cache hot reads in front of the database.",
        impact: { latency: "-60%", throughput: "+3x", cost: "+$10/hr" },
      });
    if (!has("cdn") && nodes.some((n) => n.data.kind === "client"))
      out.push({
        title: "Add CDN",
        detail: "Serve static assets from the edge.",
        impact: { latency: "-40%", throughput: "+5x", cost: "+$6/hr" },
      });
    if (!has("kafka") && !has("queue"))
      out.push({
        title: "Introduce Kafka",
        detail: "Decouple services with an event log for spiky workloads.",
        impact: { latency: "neutral", throughput: "+4x", cost: "+$25/hr" },
      });
    nodes.forEach((n) => {
      if (
        ["microservice", "app-server", "web-server"].includes(n.data.kind) &&
        (n.data.replicas || 1) < 3
      ) {
        out.push({
          title: `Scale ${n.data.label}`,
          detail: `Increase replicas to handle bursts and remove SPOFs.`,
          impact: {
            latency: "-20%",
            throughput: "+2x",
            cost: `+$${(n.data.hourlyCost || 10) * 2}/hr`,
          },
        });
      }
    });
    if (metrics.errorRate > 1)
      out.push({
        title: "Investigate hot bottleneck",
        detail: "Error rate above target — focus on critical nodes.",
        impact: { latency: "TBD", throughput: "TBD", cost: "TBD" },
      });
    return out.slice(0, 6);
  }, [nodes, edges, metrics.errorRate]);
}
