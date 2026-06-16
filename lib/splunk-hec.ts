import type { Domain } from "@/types";

export type AxiomEventType = "decompose" | "narrative_generated" | "auth_connect" | "error";
export type AxiomSeverity = "info" | "warn" | "error";

export interface AxiomSplunkEvent {
  event: AxiomEventType;
  domain?: Domain;
  severity?: AxiomSeverity;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

function hecEndpoint(): string | null {
  const direct = process.env.SPLUNK_HEC_URL;
  if (direct) {
    return `${direct.replace(/\/$/, "")}/services/collector/event`;
  }
  const proxy = process.env.SPLUNK_PROXY_URL;
  if (proxy) return proxy.replace(/\/$/, "");
  return null;
}

/** Fire-and-forget Splunk HEC — never throws to callers */
export function logAxiomEvent(payload: AxiomSplunkEvent): void {
  const url = hecEndpoint();
  if (!url) return;

  const token = process.env.SPLUNK_HEC_TOKEN;
  const body = JSON.stringify({
    time: Math.floor(Date.now() / 1000),
    index: process.env.SPLUNK_INDEX ?? "axiom",
    sourcetype: process.env.SPLUNK_SOURCETYPE ?? "_json",
    event: {
      ...payload,
      severity: payload.severity ?? "info",
      service: "axiom-stem",
    },
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token && !process.env.SPLUNK_PROXY_URL) {
    headers.Authorization = `Splunk ${token}`;
  }
  if (process.env.SPLUNK_SENSOR_KEY) {
    headers["X-Radh-Sensor-Key"] = process.env.SPLUNK_SENSOR_KEY;
  }

  fetch(url, { method: "POST", headers, body }).catch((e) => {
    console.error("[HEC] axiom log failed:", e);
  });
}