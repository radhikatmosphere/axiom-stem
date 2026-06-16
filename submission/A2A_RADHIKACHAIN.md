# Protocolo A2A (Agent-to-Agent) — AXIOM en RadhikaChain

## Definición

**A2A** permite que agentes especializados deleguen tareas, coordinen flujos multi-paso y mantengan **soberanía del usuario** (ContextToken / wallet identity).

AXIOM implementa el patrón dual-engine como delegación A2A conceptual:

```
Usuario
   │
   ▼
┌─────────────────────┐
│  AXIOM UI (Pages)   │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────────┐
│ Layer 1 │ │   Layer 2    │
│ Decomp. │ │  Narrative   │  ← agent-core /agent/educate
│ (local) │ │  SuperGrok   │
└────┬────┘ └──────┬───────┘
     │             │
     └──────┬──────┘
            ▼
     exact JSON payload
     (never recalculated)
```

## Mensaje A2A recomendado (educación)

```json
{
  "protocol": "A2A",
  "version": "1.0",
  "message_id": "a2a_axiom_narrative_001",
  "timestamp": "2026-06-15T19:41:00Z",
  "sender": {
    "agent_id": "axiom-decomposer",
    "type": "compute_agent"
  },
  "receiver": {
    "agent_id": "axiom-narrative",
    "type": "narrative_agent"
  },
  "task": {
    "type": "education_narrative",
    "description": "Explain verified STEM decomposition for ages 13-18",
    "priority": "normal"
  },
  "payload": {
    "domain": "genetics",
    "decompose_result": { },
    "required_capabilities": ["socratic_explanation", "markdown_output"],
    "age_range": "13-18"
  },
  "constraints": {
    "ephemeral": false,
    "must_not_recalculate": true,
    "max_tokens": 600
  }
}
```

## Integración actual (hackathon)

| Componente | Rol A2A |
|------------|---------|
| `lib/decomposers.ts` | Agente de cómputo (Layer 1) |
| `app/api/narrative/route.ts` | Orquestador local → SuperGrok |
| `agent-core /agent/educate` | Agente narrativo fallback |
| `axiom.worker` | Persistencia XP (D1) |
| Splunk `axiom` index | Trazabilidad / PoI-style audit |

## Objetivos alineados

| Objetivo | AXIOM |
|----------|-------|
| Delegación segura | JSON verificado es el único input de Layer 2 |
| Coordinación multi-agente | SuperGrok → agent-core → demo |
| Trazabilidad | Splunk events: `decompose`, `narrative_generated` |
| Resiliencia | 3-tier fallback sin perder Layer 1 |

## Roadmap (post-hackathon)

- ContextToken.sol para contexto soberano del estudiante  
- AgentCoreDispatcher on-chain delegation  
- Firma criptográfica de resultados Layer 1  
- Recompensas $PRANA por sesiones de aprendizaje verificadas  

---

*Part of A.L.I.C.E. / Antigravity 2.0 vision · RadhikaChain ecosystem*