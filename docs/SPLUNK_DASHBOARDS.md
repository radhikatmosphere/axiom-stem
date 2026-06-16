# AXIOM AI — Splunk Dashboard Studio Guide

Instrucciones para configurar dashboards en Splunk basados en los logs HEC que envía AXIOM.

## Prerequisites

1. **Splunk Cloud** — create index `axiom`
2. **HEC token** — scoped to index `axiom`
3. **Cloudflare Pages env vars** on `axiom-stem`:
   - `SPLUNK_HEC_URL` — e.g. `https://prd-p-vce8j.splunkcloud.com:8088`
   - `SPLUNK_HEC_TOKEN` — your HEC token
   - `SPLUNK_INDEX=axiom`
   - `SPLUNK_SOURCETYPE=_json`

Or use the RadhikaChain proxy: `SPLUNK_PROXY_URL=https://radhikachain.xyz/api/splunk/hec`

### Event schema

```json
{
  "event": "narrative_generated",
  "domain": "genetics",
  "severity": "info",
  "service": "axiom-stem",
  "metadata": {
    "model": "supergrok",
    "provider": "supergrok",
    "latency_ms": 1200
  }
}
```

| `event.event` | When |
|---------------|------|
| `decompose` | Layer 1 decompose completed |
| `narrative_generated` | Layer 2 narrative returned |
| `auth_connect` | User signed in |
| `error` | Client or API failure |

---

## 1. Use Dashboard Studio (recommended)

| Type | Notes |
|------|-------|
| Classic Dashboards (XML) | Legacy |
| **Dashboard Studio** | Modern, visual — **use this** |

---

## 2. Create a new dashboard

1. Splunk → **Dashboards**
2. **Create New Dashboard**
3. Select **Dashboard Studio**
4. Name: `AXIOM AI - Overview`
5. Index: `axiom`

---

## 3. Recommended dashboards

| Dashboard | Purpose | Priority |
|-----------|---------|----------|
| **AXIOM - Overview** | General usage | High |
| **AXIOM - Domain Usage** | STEM domain breakdown | High |
| **AXIOM - Narrative Insights** | Layer 2 AI analysis | Medium |
| **AXIOM - Errors & Health** | Error monitoring | High |

---

## 4. Base SPL query

Use as prefix for filtered panels:

```spl
index=axiom sourcetype=_json
| spath event
| spath event.event
| rename event.event as event_type
| rename event.domain as domain
| rename event.severity as severity
```

---

## 5. Dashboard panels

### Dashboard 1: AXIOM - Overview (start here)

**Total events (Single Value)**

```spl
index=axiom sourcetype=_json
| stats count as "Total Eventos"
```

**Events by type (Table or Pie)**

```spl
index=axiom sourcetype=_json
| spath event.event
| stats count by event.event
| sort -count
```

**Events by domain (Bar Chart)**

```spl
index=axiom sourcetype=_json
| spath event.domain
| stats count by event.domain
| sort -count
```

**Events over time (Line Chart)**

```spl
index=axiom sourcetype=_json
| timechart span=1h count by event.event
```

---

### Dashboard 2: AXIOM - Domain Usage

**Domain + event type (Table)**

```spl
index=axiom sourcetype=_json
| spath event.domain as domain
| spath event.event as event_type
| stats count by domain, event_type
| sort domain, -count
```

**Domain percentage (Table)**

```spl
index=axiom sourcetype=_json
| spath event.domain
| stats count by event.domain
| eventstats sum(count) as total
| eval percentage = round(count/total*100, 2)
| table event.domain, count, percentage
| sort -count
```

---

### Dashboard 3: AXIOM - Narrative Insights

**Narratives by model (supergrok vs demo vs agent-core)**

```spl
index=axiom sourcetype=_json event.event="narrative_generated"
| spath event.metadata.model as model
| stats count by model
```

**Narratives by domain**

```spl
index=axiom sourcetype=_json event.event="narrative_generated"
| spath event.domain
| stats count by event.domain
| sort -count
```

**Average narrative latency (Single Value)**

```spl
index=axiom sourcetype=_json event.event="narrative_generated"
| spath event.metadata.latency_ms as latency_ms
| stats avg(latency_ms) as "Avg Latency ms"
```

---

### Dashboard 4: AXIOM - Errors & Health

**Errors by severity**

```spl
index=axiom sourcetype=_json
| spath event.severity as severity
| stats count by severity
| sort -count
```

**Errors by domain**

```spl
index=axiom sourcetype=_json event.event="error"
| spath event.domain
| stats count by event.domain
| sort -count
```

**Error timeline (Line Chart, 15m)**

```spl
index=axiom sourcetype=_json event.event="error"
| timechart span=15m count
```

---

## 6. Add panels step-by-step

1. Open dashboard in **Dashboard Studio**
2. **+ Add Panel** → **Search**
3. Paste SPL query
4. Choose visualization:
   - **Single Value** — totals
   - **Bar Chart** — domain usage
   - **Line Chart** — time trends
   - **Pie Chart** — distributions
   - **Table** — detail rows
5. Add title and description
6. Repeat for each panel

---

## 7. Best practices

| Recommendation | Why |
|----------------|-----|
| Global **Time Range Picker** | Filter last hour / day / week |
| **Filters** (Domain, Event Type) | Explore subsets quickly |
| **Drilldown** | Click domain → detail search |
| Clear titles | e.g. "Uso de Dominios STEM — Últimas 24h" |
| Section grouping | Overview · Usage · Narratives · Errors |

---

## 8. Advanced SPL (filters + drilldown)

### Filter by domain (dashboard input `$domain$`)

```spl
index=axiom sourcetype=_json
| spath event
| search event.domain="$domain$"
| stats count by event.event, event.domain
```

### Filter by event type (`$event_type$`)

```spl
index=axiom sourcetype=_json
| spath event
| search event.event="$event_type$"
| timechart span=1h count
```

### Combined domain + model (narrative quality)

```spl
index=axiom sourcetype=_json event.event="narrative_generated"
| spath event.domain as domain
| spath event.metadata.model as model
| stats count by domain, model
| sort domain, -count
```

### Health: error rate %

```spl
index=axiom sourcetype=_json
| spath event.event as event_type
| stats count(eval(event_type="error")) as errors, count as total
| eval error_rate = round(errors/total*100, 2)
| table errors, total, error_rate
```

### Drilldown search (set on bar chart click)

```spl
index=axiom sourcetype=_json
| spath event
| search event.domain="$click.value$"
| table _time, event.event, event.severity, event.metadata
| sort -_time
```

---

## 9. Verify data is flowing

In Splunk Search:

```spl
index=axiom sourcetype=_json
| head 20
| table _time, event
```

Generate traffic: open https://axiom-stem.pages.dev → decompose all 4 domains.

---

## 10. Code reference

| File | Role |
|------|------|
| `lib/splunk-hec.ts` | HEC emitter |
| `app/api/telemetry/route.ts` | Client events (`decompose`, `auth_connect`, `error`) |
| `app/api/narrative/route.ts` | `narrative_generated` events |

Client telemetry from `app/page.tsx` after decompose and auth connect.