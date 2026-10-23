---
name: be-more-ambitious
description: Apply Felix Rieseberg's "How to be more ambitious" framework (Speed / Altitude / Depth / Range) to any task given to an AI model. Use when the user wants to be "more ambitious", upgrade a prompt, go beyond the obvious ask, level up a task from execution to outcome, demand expert-level depth, bring in cross-disciplinary techniques, or says "we're not ambitious enough". Includes the "deeper version of this task" rewrite prompt and concrete techniques for each ambition type.
---

# Be More Ambitious

A skill for turning ordinary AI tasks into ambitious ones, based on Felix Rieseberg's tutorial (Anthropic, Oct 2026): https://felixrieseberg.com/how-to-be-more-ambitious-a-tutorial-for-humans-with-models/

Ambition has four types. Speed is the default (same work in less time) and needs no guidance — skip it. The other three are where models are underused:

- **Altitude:** go up in abstraction; aim at the outcome, not the task.
- **Depth:** work the way a field-leading expert would; touch the raw data, tools, and methods.
- **Range:** draw on multiple fields, not just the one the task mentions.

## When to apply

Activate when the user asks to:
- Make a task/prompt "more ambitious", bigger, deeper, or expert-level
- Upgrade from "do X" to "achieve Y" (outcome framing)
- Redesign a deliverable (deck, report, review, dashboard, workflow) rather than fill a template
- Cross disciplines or "bring in other fields/roles"
- Says "we're not ambitious enough"

Also apply proactively when a request is clearly underspecified relative to the real goal (e.g., "update these numbers in the QBR template" when the actual purpose is for leadership to catch problems early).

## Altitude — aim at the goal beyond the goal

Ask: **what do you want to happen next?** The task is the user's best guess at how to get the outcome; improve on that guess.

Escalation ladder (QBR deck example):
1. Give the model as much raw data as possible and ask the real question: "Tell me what changed this quarter, why, and what we should do about it."
2. Ask for decisions, not slides: "Work out which three decisions are most urgent given everything you've learned, and start on potential directions with for/against arguments."
3. Redesign the institution itself: "The review exists so leadership catches problems early and moves money and people to the right places. Design a better way to do that than a quarterly deck, show from our history that it would have caught things sooner, and run it beside the current one for a quarter."

Techniques:
- Identify the ultimate outcome and state it explicitly; frame the task as a means.
- Durable workflows take the human out of the loop — this often requires changing the workflow first (give the model access to crash reports, data sources, the machines needed to verify fixes).
- Best tell-tale sign altitude is right: you would schedule meetings to discuss the work. Works less well for purely creative endeavors.
- Push abstraction upward over time: "fix this crash" → "keep the app crash-free".

## Depth — the instruments of the best in the field

- **Insist on the same instruments the best use.** Models switch vocabulary without switching methods. When they reach for markdown tables, insist on databases and statistical models. You don't need to know the experts' tools — the model usually does.
- **Pick unreasonable goals and call them reasonable.** Need 5s → 200ms. If the model says it's impossible, reiterate that it's solvable and it should keep going.
- **Challenge what you know.** Give raw information and ask it to adversarially check assumptions: "We believe churn is an onboarding problem. Try to reproduce that from the raw data."
- **Produce new knowledge.** "Build a simulation of our customers that reproduces the last year from our logs. Find the earliest churn signal we don't know about yet, and show it predicts on data it has not seen."
- **Use an outside judge.** Never let the model grade itself. Require outside validation — ideally a tool the model can run for immediate feedback.

The deeper-version rewrite prompt (run this before rewriting any task):

> I want a deeper version of this task, not a bigger one. Before rewriting it: (1) say what a top professional in this field would do here that I'm not asking for; (2) name the rawest material they would start from instead of what has already been digested for me; (3) name the specific methods and tools they would use; (4) say what, other than you or me, would show the result is right. Then rewrite my prompt to ask for exactly that.

## Range — assemble the crew from other fields

- **Replace nouns with verbs** (from *The Art of Innovation*). A quarterly review isn't "a deck" — it's "getting busy people to believe a story about cause and effect, and to decide under uncertainty, in 30 minutes". Verbs reveal which fields bring a useful perspective.
- **Assemble the crew.** For that deck: an analyst, a journalist, an editor; if presented, a motion and audio designer; for adversarial scrutiny, a short seller and a forensic accountant. Use multi-agent threads/subagents where available.
- **Avoid role-play theater.** Use the method to find fields and techniques, not personalities. Don't ask the model to *write* like a short seller — ask it to *do* what a short seller *does* to research a position.

## Prerequisites

All three forms work best when the model has a computer with the ability to install software and access to relevant data (MCP connectors or equivalent). If access is missing, ask for it or scope the ambition to what's reachable.

## Why this works (brief)

- Self-efficacy: people given specific hard goals outperform those told to do their best (Locke & Latham, 35 years of goal-setting research).
- Believing a hard thing is possible, watching someone else do it, and permission to fail are documented hacks (Dantzig's unsolved problems; the four-minute mile broken then immediately repeated; Linux as "just a hobby").
- Models are "astounding in some directions, inadequate in others" (Terence Tao) — ambition is how you pilot the astounding parts.
