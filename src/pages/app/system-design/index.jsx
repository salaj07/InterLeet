import React, { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import ChallengePicker from "./ChallengePicker";
import Workspace from "./Workspace";

export default function SystemDesignSimulator() {
  const [challenge, setChallenge] = useState(null);
  const [template, setTemplate] = useState(null);

  return (
    <ReactFlowProvider>
      {!challenge ? (
        <ChallengePicker
          onPick={(c) => {
            setTemplate(null);
            setChallenge(c);
          }}
          onPickTemplate={(t) => {
            setTemplate(t);
            setChallenge({
              id: `tpl-${t.id}`,
              title: t.name,
              difficulty: "Template",
              tags: ["Practice"],
              brief:
                t.description ||
                `Prebuilt ${t.name} reference architecture. Study it, tweak nodes, or simulate load.`,
              requirements: [],
              hints: [],
            });
          }}
        />
      ) : (
        <Workspace
          challenge={challenge}
          template={template}
          onExit={() => {
            setChallenge(null);
            setTemplate(null);
          }}
        />
      )}
    </ReactFlowProvider>
  );
}
