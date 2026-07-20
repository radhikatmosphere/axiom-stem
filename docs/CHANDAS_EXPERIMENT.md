# Chandas experimental-module design

## Current status

Disabled. The AXIOM repository did not contain a source-validated Sanskrit prosody implementation or a licensed, traceable fixture set suitable for a submission claim. AXIOM therefore does **not** analyze Sanskrit meter, generate translations, or make academic claims about prosody.

## What is required before enabling it

1. A documented transliteration input contract, initially IAST with an explicit normalization policy.
2. Source-backed fixtures that record the source text, transliteration, expected syllable boundaries, laghu/guru labels, and the rule supporting each label.
3. Expert review of sandhi, final consonants, anusvāra/visarga handling, optionality, and meter identification.
4. Deterministic output that includes:
   - syllable segmentation;
   - laghu/guru labels and rule traces;
   - gaṇa grouping when applicable;
   - candidate meter with uncertainty rather than a single authoritative label.
5. Separate interfaces for deterministic scansion and optional AI translation or interpretation. Translation must be labeled non-deterministic and non-authoritative.
6. A license review for every corpus and fixture.

## Proposed interface

    type ChandasResult = {
      status: "experimental";
      transliterationScheme: "IAST";
      syllables: Array<{ text: string; weight: "laghu" | "guru"; ruleId: string }>;
      ganas: string[];
      candidateMeters: Array<{ name: string; confidence: "low" | "medium"; evidence: string[] }>;
      warnings: string[];
    };

No UI control should enable this module until those fixtures, rules, tests, and expert validation exist.

