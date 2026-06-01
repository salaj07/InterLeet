import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Server, X } from "lucide-react";
import { updateNodeData, clearCanvas } from "@/redux/slices/simulatorSlice";
import { kindMap } from "@/lib/simulator/catalog";
import { SectionLabel, SubLabel, Toggle } from "./ui";

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const id = useSelector((s) => s.simulator.selectedNodeId);
  const node = useSelector((s) => s.simulator.nodes.find((n) => n.id === id));

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
            <div className="mt-1 text-[11px] text-white/35">
              Configure performance, cost, and component-specific parameters.
            </div>
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
    <input
      {...props}
      className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-[#FF6500]/50"
    />
  );
  const Select = ({ options, value, onChange }) => (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-[#FF6500]/50"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#111]">
          {o}
        </option>
      ))}
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
            <Row label="Client Type">
              <Select
                value={d.clientType || "web"}
                onChange={(e) => update({ clientType: e.target.value })}
                options={["web", "mobile", "iot", "desktop"]}
              />
            </Row>
            <Row label="Users">
              <Input
                type="number"
                value={d.concurrentUsers ?? 1000}
                onChange={(e) => update({ concurrentUsers: +e.target.value })}
              />
            </Row>
            <Row label="Req Rate">
              <Input
                type="number"
                value={d.requestRate ?? 5}
                onChange={(e) => update({ requestRate: +e.target.value })}
              />
            </Row>
            <Row label="Region">
              <Select
                value={d.region || "us-east-1"}
                onChange={(e) => update({ region: e.target.value })}
                options={["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"]}
              />
            </Row>
          </>
        );
      case "load-balancer":
        return (
          <>
            <Row label="Algorithm">
              <Select
                value={d.algorithm || "round-robin"}
                onChange={(e) => update({ algorithm: e.target.value })}
                options={["round-robin", "least-conn", "ip-hash", "weighted"]}
              />
            </Row>
            <Row label="SSL">
              <Toggle value={!!d.ssl} onChange={(v) => update({ ssl: v })} />
            </Row>
            <Row label="Sticky">
              <Toggle value={!!d.sticky} onChange={(v) => update({ sticky: v })} />
            </Row>
            <Row label="Max Conn">
              <Input
                type="number"
                value={d.maxConnections ?? 10000}
                onChange={(e) => update({ maxConnections: +e.target.value })}
              />
            </Row>
          </>
        );
      case "api-gateway":
        return (
          <>
            <Row label="Auth">
              <Toggle value={!!d.auth} onChange={(v) => update({ auth: v })} />
            </Row>
            <Row label="Rate Limit">
              <Input
                type="number"
                value={d.rateLimit ?? 1000}
                onChange={(e) => update({ rateLimit: +e.target.value })}
              />
            </Row>
            <Row label="Validation">
              <Toggle value={!!d.validation} onChange={(v) => update({ validation: v })} />
            </Row>
            <Row label="Version">
              <Input
                value={d.versioning ?? "v1"}
                onChange={(e) => update({ versioning: e.target.value })}
              />
            </Row>
            <Row label="Caching">
              <Toggle value={!!d.caching} onChange={(v) => update({ caching: v })} />
            </Row>
          </>
        );
      case "microservice":
        return (
          <>
            <Row label="Service">
              <Input
                value={d.serviceName ?? "service"}
                onChange={(e) => update({ serviceName: e.target.value })}
              />
            </Row>
            <Row label="Language">
              <Select
                value={d.language || "Node.js"}
                onChange={(e) => update({ language: e.target.value })}
                options={["Node.js", "Go", "Python", "Java", "Rust"]}
              />
            </Row>
            <Row label="Version">
              <Input
                value={d.version ?? "1.0.0"}
                onChange={(e) => update({ version: e.target.value })}
              />
            </Row>
            <Row label="Replicas">
              <Input
                type="number"
                value={d.replicas ?? 3}
                onChange={(e) => update({ replicas: +e.target.value })}
              />
            </Row>
            <Row label="Autoscale">
              <Toggle value={!!d.autoscaling} onChange={(v) => update({ autoscaling: v })} />
            </Row>
          </>
        );
      case "postgresql":
      case "mysql":
      case "mongodb":
        return (
          <>
            <Row label="Storage GB">
              <Input
                type="number"
                value={d.storage ?? 100}
                onChange={(e) => update({ storage: +e.target.value })}
              />
            </Row>
            <Row label="Replication">
              <Select
                value={d.replication || "primary-replica"}
                onChange={(e) => update({ replication: e.target.value })}
                options={["single", "primary-replica", "multi-primary", "replica-set"]}
              />
            </Row>
            <Row label="Backup">
              <Select
                value={d.backupStrategy || "daily"}
                onChange={(e) => update({ backupStrategy: e.target.value })}
                options={["none", "daily", "hourly", "continuous"]}
              />
            </Row>
            <Row label="Read Cap">
              <Input
                type="number"
                value={d.readCapacity ?? 2000}
                onChange={(e) => update({ readCapacity: +e.target.value })}
              />
            </Row>
            <Row label="Write Cap">
              <Input
                type="number"
                value={d.writeCapacity ?? 500}
                onChange={(e) => update({ writeCapacity: +e.target.value })}
              />
            </Row>
          </>
        );
      case "redis":
        return (
          <>
            <Row label="Memory GB">
              <Input
                type="number"
                value={d.memorySize ?? 4}
                onChange={(e) => update({ memorySize: +e.target.value })}
              />
            </Row>
            <Row label="TTL (s)">
              <Input
                type="number"
                value={d.ttl ?? 3600}
                onChange={(e) => update({ ttl: +e.target.value })}
              />
            </Row>
            <Row label="Replication">
              <Select
                value={d.replication || "primary-replica"}
                onChange={(e) => update({ replication: e.target.value })}
                options={["single", "primary-replica", "cluster"]}
              />
            </Row>
            <Row label="Eviction">
              <Select
                value={d.evictionPolicy || "allkeys-lru"}
                onChange={(e) => update({ evictionPolicy: e.target.value })}
                options={["noeviction", "allkeys-lru", "allkeys-lfu", "volatile-ttl"]}
              />
            </Row>
          </>
        );
      case "kafka":
        return (
          <>
            <Row label="Partitions">
              <Input
                type="number"
                value={d.partitions ?? 12}
                onChange={(e) => update({ partitions: +e.target.value })}
              />
            </Row>
            <Row label="Replication">
              <Input
                type="number"
                value={d.replicationFactor ?? 3}
                onChange={(e) => update({ replicationFactor: +e.target.value })}
              />
            </Row>
            <Row label="Retention (h)">
              <Input
                type="number"
                value={d.retentionPeriod ?? 168}
                onChange={(e) => update({ retentionPeriod: +e.target.value })}
              />
            </Row>
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="flex h-full flex-col overflow-y-auto font-sans">
      <SectionLabel
        right={
          <button
            className="text-white/50 hover:text-white"
            onClick={() => dispatch(clearCanvas())}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        }
      >
        Properties · {d.label}
      </SectionLabel>

      <div className="border-b border-white/[0.06] py-1">
        <Row label="Name">
          <Input value={d.label} onChange={(e) => update({ label: e.target.value })} />
        </Row>
        <Row label="Description">
          <Input
            value={d.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Notes…"
          />
        </Row>
        <Row label="Environment">
          <Select
            value={d.environment || "production"}
            onChange={(e) => update({ environment: e.target.value })}
            options={["development", "staging", "production"]}
          />
        </Row>
      </div>

      <div className="border-b border-white/[0.06] py-1">
        <SubLabel>Status</SubLabel>
        <Row label="Enabled">
          <Toggle value={d.enabled !== false} onChange={(v) => update({ enabled: v })} />
        </Row>
        <Row label="Health">
          <Select
            value={d.health || "healthy"}
            onChange={(e) => update({ health: e.target.value })}
            options={["healthy", "warning", "critical"]}
          />
        </Row>
        <Row label="Replicas">
          <Input
            type="number"
            value={d.replicas ?? 1}
            onChange={(e) => update({ replicas: +e.target.value })}
          />
        </Row>
      </div>

      <div className="border-b border-white/[0.06] py-1">
        <SubLabel>Performance</SubLabel>
        <Row label="Throughput">
          <Input
            type="number"
            value={d.throughput ?? 100}
            onChange={(e) => update({ throughput: +e.target.value })}
          />
        </Row>
        <Row label="Latency">
          <Input
            type="number"
            value={d.latency ?? 20}
            onChange={(e) => update({ latency: +e.target.value })}
          />
        </Row>
        <Row label="Error Rate">
          <Input
            type="number"
            step="0.1"
            value={d.errorRate ?? 0}
            onChange={(e) => update({ errorRate: +e.target.value })}
          />
        </Row>
      </div>

      <div className="border-b border-white/[0.06] py-1">
        <SubLabel>Cost</SubLabel>
        <Row label="Hourly $">
          <Input
            type="number"
            value={d.hourlyCost ?? 0}
            onChange={(e) => update({ hourlyCost: +e.target.value })}
          />
        </Row>
        <Row label="Monthly $">
          <div className="font-mono text-white/70">
            ${((d.hourlyCost ?? 0) * 24 * 30).toFixed(0)}
          </div>
        </Row>
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
