# Political Will Strategy Engine (PWSE)

A diagnostic tool for policy advocates and community organizers to score political will and generate AI-powered strategic analysis.

**Live:** [pwse-6q3.pages.dev](https://pwse-6q3.pages.dev)

---

## The Formula

```
P.W. = (V × S × C) / (O × F)
```

| Variable | Name | What It Measures |
|---|---|---|
| **V** | Visibility of Harm | How visible is the problem to the public and decision-makers? |
| **S** | Size of Affected Constituency | How many people are materially harmed? |
| **C** | Cost of Inaction | What is the electoral or economic risk to leaders who do nothing? |
| **O** | Organized Opposition Power | How strong is the lobbying and institutional resistance? |
| **F** | Availability of Alternative Frames | How many distraction narratives exist to dilute attention? |

The numerator captures the **drivers** of political will. The denominator captures the **resistors**. The engine scores each variable 1–10 and computes a composite Political Will score.

---

## What It Does

- **Score any policy issue** — enter a free-text issue and the AI auto-scores all five variables with reasoning
- **Load preset scenarios** — pre-calibrated for Climate Action, Housing Crisis, Labor Rights, AI Regulation, and the Racial Wealth Gap
- **Run full strategic analysis** — AI generates a landscape assessment, primary bottleneck identification, 3 strategic options with timeframes and tradeoffs, a highest-leverage priority move, and a denominator insight
- **Adjust manually** — sliders let you model scenario shifts in real time

---

## The Denominator Trap

Reducing **Opposition Power** from 10 to 5 is mathematically identical to doubling your entire numerator. This is the core insight the engine is built to surface: most advocates spend energy on numerator growth when the highest-leverage move is often denominator reduction — peeling away opposition allies, discrediting distraction frames, or splitting organized resistance.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, vanilla JavaScript |
| Backend | Cloudflare Workers |
| AI | Cloudflare Worker AI |
| Hosting | Cloudflare Pages |

---

## Repo Structure

```
PWSE/
├── index.html        # Frontend — formula UI, sliders, scenario presets
├── worker.js         # Cloudflare Worker — AI scoring and analysis endpoints
├── wrangler.toml     # Cloudflare deployment config
└── functions/        # Pages Functions (if applicable)
```

---

## Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api` | POST | Run full strategic analysis |
| `/score` | POST | Auto-score a policy issue |

Both endpoints require a `passphrase` field for access control.

---

## Preset Scenarios

| Scenario | Key Insight |
|---|---|
| 🌍 Climate Action | High constituency, massive opposition and frame competition |
| 🏠 Housing Crisis | Moderate visibility, strong opposition infrastructure |
| ✊ Labor Rights | Large constituency, powerful organized opposition |
| 🤖 AI Regulation | Low visibility, extreme alternative framing availability |
| 💰 Racial Wealth Gap | High opposition, maximum frame dilution |

---

## Background

PWSE operationalizes a Political Will formula as an analytical instrument for community organizing strategy. It is part of the [Liberation Logic](https://blackvotewatch.org) civic education ecosystem — a framework connecting cooperative economics, nested control systems, and political power.

---

## License

MIT
