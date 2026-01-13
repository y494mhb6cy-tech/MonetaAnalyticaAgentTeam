"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { buildContextSummary, buildMockResponse, type AiContextSnapshot } from "../lib/ai-mock";
import { useMaosStore } from "../lib/maos-store";
import { Button } from "./ui";
import { logInteraction } from "../lib/action-helper";
import { logEvent } from "../lib/audit-logger";

const templates = [
  "Summarize today’s priorities",
  "Identify bottlenecks and risks",
  "Recommend next 5 actions"
];

type AiResponse = {
  mode: "real" | "mock";
  response: string;
  note?: string;
};

export function AIPreviewDrawer() {
  const { aiPanelOpen, setAiPanelOpen, aiContext, personnel, agents, tasks, mapState } = useMaosStore();
  const [prompt, setPrompt] = useState("");
  const [useContext, setUseContext] = useState(true);
  const [response, setResponse] = useState("");
  const [mode, setMode] = useState<AiResponse["mode"] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const streamTimer = useRef<number | null>(null);

  const contextSnapshot = useMemo<AiContextSnapshot | null>(() => {
    if (!aiContext) {
      return null;
    }
    if (aiContext.kind === "personnel") {
      const person = personnel.find((item) => item.id === aiContext.id);
      if (!person) {
        return null;
      }
      const relatedTasks = tasks.filter((task) => task.ownerType === "personnel" && task.ownerId === person.id);
      const node = mapState.nodes.find((item) => item.kind === "personnel" && item.refId === person.id);
      const connections = node
        ? mapState.edges
            .filter((edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id)
            .map((edge) => (edge.fromNodeId === node.id ? edge.toNodeId : edge.fromNodeId))
            .map((nodeId) => mapState.nodes.find((item) => item.id === nodeId))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) =>
              item.kind === "personnel"
                ? { name: personnel.find((personItem) => personItem.id === item.refId)?.name ?? "Unknown", kind: "personnel" as const }
                : { name: agents.find((agent) => agent.id === item.refId)?.name ?? "Unknown", kind: "agent" as const }
            )
        : [];
      return {
        entityName: person.name,
        entityKind: "personnel",
        titleOrPurpose: person.title,
        teamOrModule: person.team,
        status: person.status,
        tasks: relatedTasks.map((task) => ({ title: task.title, status: task.status, priority: task.priority })),
        connections
      };
    }
    const agent = agents.find((item) => item.id === aiContext.id);
    if (!agent) {
      return null;
    }
    const relatedTasks = tasks.filter((task) => task.ownerType === "agent" && task.ownerId === agent.id);
    const node = mapState.nodes.find((item) => item.kind === "agent" && item.refId === agent.id);
    const connections = node
      ? mapState.edges
          .filter((edge) => edge.fromNodeId === node.id || edge.toNodeId === node.id)
          .map((edge) => (edge.fromNodeId === node.id ? edge.toNodeId : edge.fromNodeId))
          .map((nodeId) => mapState.nodes.find((item) => item.id === nodeId))
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map((item) =>
            item.kind === "personnel"
              ? { name: personnel.find((personItem) => personItem.id === item.refId)?.name ?? "Unknown", kind: "personnel" as const }
              : { name: agents.find((agentItem) => agentItem.id === item.refId)?.name ?? "Unknown", kind: "agent" as const }
          )
      : [];
    return {
      entityName: agent.name,
      entityKind: "agent",
      titleOrPurpose: agent.purpose,
      teamOrModule: agent.module,
      status: agent.status,
      tasks: relatedTasks.map((task) => ({ title: task.title, status: task.status, priority: task.priority })),
      connections
    };
  }, [agents, aiContext, mapState.edges, mapState.nodes, personnel, tasks]);

  const contextSummary = useMemo(() => buildContextSummary(contextSnapshot ?? undefined), [contextSnapshot]);

  const startStreaming = useCallback((text: string) => {
    if (streamTimer.current) {
      window.clearInterval(streamTimer.current);
    }
    setResponse("");
    if (!text) {
      setIsRunning(false);
      return;
    }
    let index = 0;
    const step = Math.max(2, Math.ceil(text.length / 120));
    streamTimer.current = window.setInterval(() => {
      index = Math.min(text.length, index + step);
      setResponse(text.slice(0, index));
      if (index >= text.length) {
        if (streamTimer.current) {
          window.clearInterval(streamTimer.current);
        }
        setIsRunning(false);
      }
    }, 24);
  }, []);

  const runPrompt = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }
    setIsRunning(true);
    setNote(null);
    setMode(null);
    setResponse(""); // Clear previous response
    
    // Log the action
    logEvent('api_call', 'AIPreviewDrawer', 'RunPrompt', {
      promptLength: trimmed.length,
      hasContext: useContext,
      contextEntity: aiContext?.kind,
    });

    const payload = {
      prompt: trimmed,
      context: useContext ? contextSummary : ""
    };
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error("AI API unavailable");
      }
      const data = (await res.json()) as AiResponse;
      setMode(data.mode);
      setNote(data.note ?? null);
      startStreaming(data.response);
      
      // Log success
      logEvent('api_call', 'AIPreviewDrawer', 'RunPrompt', {
        mode: data.mode,
        responseLength: data.response.length,
      }, true);
    } catch (error) {
      const fallback = buildMockResponse(trimmed, useContext ? contextSummary : "");
      setMode("mock");
      setNote("API unavailable. Showing a local mock response.");
      startStreaming(fallback);
      
      // Log error
      const errorMessage = error instanceof Error ? error.message : String(error);
      logEvent('error', 'AIPreviewDrawer', 'RunPrompt', {
        error: errorMessage,
      }, false, errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, [contextSummary, prompt, startStreaming, useContext, aiContext]);

  useEffect(() => {
    if (aiPanelOpen) {
      setUseContext(Boolean(contextSummary));
    }
  }, [aiPanelOpen, contextSummary]);

  useEffect(() => () => {
    if (streamTimer.current) {
      window.clearInterval(streamTimer.current);
    }
  }, []);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aiPanelOpen) {
        setAiPanelOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [aiPanelOpen, setAiPanelOpen]);

  if (!aiPanelOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => setAiPanelOpen(false)} />
      <div className="relative h-full w-full max-w-md border-l border-[color:var(--border)] bg-[var(--panel)] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">AI Preview</div>
            <div className="text-sm text-[color:var(--text)]">MAOS embedded assistant</div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              logInteraction('AIPreviewDrawer', 'Close');
              setAiPanelOpen(false);
            }}
          >
            Close
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Prompt templates</div>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template}
                  type="button"
                  className={clsx(
                    "rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--text)] transition",
                    "bg-[var(--panel2)] hover:bg-[var(--hover)]"
                  )}
                  onClick={() => {
                    logInteraction('AIPreviewDrawer', 'SelectTemplate', { template });
                    setPrompt(template);
                  }}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-[120px] rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[color:var(--text)]"
              placeholder="Ask MAOS to summarize or recommend next steps…"
            />
          </label>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-xs text-[color:var(--muted)]">
            <label className="flex items-center gap-2 text-xs text-[color:var(--text)]">
              <input
                type="checkbox"
                checked={useContext}
                onChange={(event) => setUseContext(event.target.checked)}
              />
              Use context
            </label>
            <span>{contextSnapshot?.entityName ? `Using ${contextSnapshot.entityName}` : "No entity selected"}</span>
          </div>
          <Button 
            onClick={runPrompt} 
            disabled={isRunning || !prompt.trim()} 
            className="w-full" 
            size="lg"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Running…
              </span>
            ) : (
              "Run"
            )}
          </Button>
          <div className="rounded-xl border border-[color:var(--border)] bg-[var(--panel2)] p-4 text-xs text-[color:var(--muted)]">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Response</div>
              {mode ? (
                <span className="rounded-full border border-[color:var(--border)] bg-[var(--panel)] px-2 py-0.5 text-[10px] uppercase text-[color:var(--muted)]">
                  {mode === "mock" ? "Preview (Mock)" : "Live"}
                </span>
              ) : null}
            </div>
            {note ? <div className="mt-2 text-[11px] text-[color:var(--muted)]">{note}</div> : null}
            <div className="mt-3 min-h-[120px] whitespace-pre-wrap text-sm text-[color:var(--text)]">
              {response || "Run a prompt to see an AI preview."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
