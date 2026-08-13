# Product Overview — v6

## 1. What This Is

A tool that takes any link to online content — a video, an image, an
article — and does two things people currently have to do manually with a
dozen open tabs: **understand it fast**, and **create something new inspired
by it**. Paste a link, get a clear breakdown of what it is and why it works,
then turn that understanding into a ready-to-use creative brief you can
render right in the app or take anywhere else.

**One-line pitch:** paste a link, understand it instantly, create your own
version of it.

## 2. Who It's For

Anyone who consumes content for inspiration and wants to move faster from
"I like this" to "I made something like this" — marketers studying
competitor ads, creators reverse-engineering a viral format, students
digesting a long article, designers analyzing a visual style. The common
thread: they don't just want a summary, they want to *do something* with
what they learned.

## 3. Core Loop

```
Paste link → Understand → (Advanced Insight) → Creative Brief → Generate/Export
```

Every session moves through the same four phases regardless of content type.
The phases are equally important — this isn't an insight tool with
generation bolted on, or a generator with a summary bolted on. Both halves
are the product.

---

## 4. Phase-by-Phase Flow

### Phase 0 — Input & Focus Selection
Two ways in: **paste a URL**, or **upload a file directly** (image, video,
or document file). Either way, the app auto-detects content type — video,
image, or article/blog (v1 scope — see Section 7) — but the user also has
an explicit type selector (**Video / Image / Article**) right next to the
input, so they can declare focus themselves rather than relying on
detection. This is optional, not mandatory — casual "paste and go" use
still works with zero clicks — but it's what solves the multi-item-page
problem cleanly: instead of the app guessing which item on a page to
analyze and showing a "we focused on X" note, the user simply tells it what
to focus on up front. This removes the need for any auto-disambiguation
logic in v1, and can still be revisited with smarter multi-item detection
in v2 if useful.

### Phase 1 — Understand (Basic Insight)
A fast, type-aware summary — this is the "get your bearings in 10 seconds"
layer, tuned per content type rather than one generic template:

| Type    | Basic insight covers |
|---------|------------------------|
| Video   | What it's about, who's in it, format/pacing, main takeaway |
| Image   | Subject, style, composition, mood |
| Article | Thesis, key points, tone |

### Phase 1.5 — Advanced Insights (on-demand)
One click deeper. This is the real analytical layer, and its output is the
raw material Phase 2 builds from — not just something to read:

| Type    | Advanced insight covers |
|---------|------------------------|
| Video   | Shot structure, pacing/edit rhythm, VO tone, editing techniques, what makes it work |
| Image   | Composition rules, color palette, lighting, style references |
| Article | Argument structure, rhetorical techniques, structural patterns |

### Phase 2 — Direct (Creative Brief)
The app converts the advanced insight into a generation brief, framed as
**"inspired by," never "identical to."** This matters for two reasons: it
avoids reproducing someone else's actual copyrighted content, and it
produces a genuinely better prompt — *"a 15-second product demo, fast cuts,
upbeat VO, bold text overlays"* generalizes into something generatable;
*"recreate this exact TikTok"* doesn't. The user then refines the brief
conversationally — *"no logo," "have them speak Chinese," "warmer color
grade"* — same refinement loop regardless of content type, until they're
happy with the final brief.

### Phase 3 — Generate

User chooses per-session, every time:
- **Render in-app** — the app generates the content directly via a
  connected generation provider (text/copy natively; image/video/audio via
  the model the user selects — see 4.1 below)
- **Export the prompt** — a clean, copy-ready brief to paste into whatever
  external AI tool the user prefers. Model-agnostic by nature; no provider
  selection needed on this path.

Both paths end at the same finished brief. Generation is a "where," not a
"what" — the brief itself is the product's output either way.

#### 4.1 — Model Selection (Render In-App only)

When a user chooses to render in-app, they select which generation model to
use for that content type, from a small curated list per type — not an open
marketplace. Text/copy has no selector; it's always generated natively.

| Content type | Example model options (v1, placeholder — finalize once providers are picked) |
|---|---|
| Image | Model A, Model B |
| Video | Model A, Model B |
| Audio (if applicable) | Model A |

- Selection can default to a saved preference in the user's settings, with
  a per-session override always available at the point of rendering — same
  spirit as the existing "user chooses per-session, every time" principle
  for render-vs-export.
- **Brief/model mismatch (open question, not decided for v1):** not every
  model supports every element of a brief — e.g. a specific spoken
  language, a custom aspect ratio, or a style constraint. Rather than
  silently dropping unsupported elements, the app should show a lightweight
  warning before generating (e.g. *"Model X doesn't support custom aspect
  ratio — this will render at default"*), based on a static
  capability table per model (built once, maintained as models are added).
  True brief-adaptation per model (auto-adjusting the prompt to fit each
  model's actual capabilities) is a v2 upgrade, not a v1 commitment.

---

## 5. Access & Monetization Flow

The guiding principle: **prove the value before asking for anything.**

### Anonymous trial (no signup, no card)
A first-time visitor gets **one full run through all four phases** —
paste, basic insight, advanced insight, creative brief, and prompt
copy-out — completely free, no account required. This is the "wow" moment:
they experience the entire loop, not a teaser of it. The one thing gated
even during the trial is **in-app rendering** — actual generation costs
real money per call, so trying the brief on an external tool is free, but
rendering it in-app always requires an account.

### The wall — signup and payment as two separate, lightweight moments

Signup and payment should **not** be chained into one forced sequence.
Each step should return the user to their own work before asking for the
next commitment — this is what makes the wall feel like "it saved my
work," not "start over."

**Step 1 — Signup.**
Triggered by requesting a second link, or by a first attempt to render
in-app. Their trial session (link, insights, brief) carries over
automatically into the new account the moment they sign up. Immediately
after signup, the user lands back on their project/brief — not on a
payment screen. This lets them feel the product still has their work
before anything is asked of them.

**Step 2 — Payment.**
Only triggered when the (now logged-in) user clicks "Render in-app" again.
Presented as a lightweight modal/overlay on top of the project screen —
not a full page redirect — so it reads as "adding a payment method here,"
not "leaving the app." On success, generation starts immediately, same
screen, no further redirect.

```
Render click → Signup (if needed) → back to project automatically
Render click again → Payment modal (if needed) → success → renders right there
```

**Optional lever worth deciding later:** if Free tier includes even one
in-app render before payment is ever required (see Imprompto's daily
free-generation-quota pattern, Section 5.3), the payment ask can be
delayed even further — pure signup becomes the only wall for a while,
which tends to convert better.

### Plans (post-signup)
- **Free:** limited insight runs per month, unlimited prompt export,
  minimal/no in-app rendering, full saved history
- **Paid:** higher/unlimited insight runs, in-app rendering credits,
  priority processing

*(Exact limits/pricing are a business decision to finalize later — the
important product commitment here is: insight and understanding stay cheap
and generous, rendering is the metered, paid layer.)*

### 5.1 — Rendering credits are model-weighted, not flat

Different generation models cost meaningfully different amounts to run
(e.g. a 4K video call vs. a low-cost image call). Treating "rendering
credits" as one flat metered pool risks losing money on users who
consistently pick expensive models, and undercharging is just as real a
risk as overcharging.

**Approach: single internal credit currency, per-model credit cost.**
- Users buy/receive **credits** (one pool per plan), not "renders."
- Each supported model has its own **credit cost per unit** (e.g. per
  image, per 4 seconds of video), reflecting its real cost to run.
- Cost is shown **before** the user commits to a render (e.g. *"Render
  in-app — ~15 credits with Model A"*) so there's no surprise deduction —
  this also nudges cost-conscious users toward cheaper models naturally.
- A small always-free daily/monthly quota on the cheapest model per plan
  tier is worth considering as a way to make paid plans feel generous
  without exposing the priciest models for free.

*(This pattern is already proven in the market — e.g. Imprompto's pricing
page sells a single monthly credit pool per plan, with each model/resolution
combination priced at its own credit cost, plus a separate free-generation
quota on specific low-cost models per tier.)*

### 5.2 — Payment processor: Paddle

Paddle (Merchant of Record) will handle checkout, subscriptions, credit-pack
purchases, tax/VAT compliance, and fraud/failed-payment recovery.

**What Paddle does *not* do:** track or deduct usage-based credits. That
logic is owned internally, not by Paddle. Paddle is the cashier; the app is
the ledger.

**What gets built alongside Paddle:**
1. A `credits` balance on each user's account.
2. A `credit_costs` table mapping each model (and resolution/variant) to
   its credit cost — the pricing table from 5.1.
3. A webhook listener on successful Paddle payment events → adds the
   purchased credit amount to the user's balance.
4. A pre-render check: verify sufficient balance → deduct on render → block
   and prompt top-up if insufficient.

This is standard practice for credit-based products on Paddle (and would be
required with most processors, not a Paddle-specific gap) — Paddle sells
the credit pack or subscription; the app's own database is the source of
truth for how many credits a user has and what each action costs.

---

## 6. History & Saved Sessions

Every completed run (link → insights → brief → any generated output) is
saved to the user's account as a session, browsable later — this is what
turns the app from a one-shot utility into a workspace people return to.
History is available to any signed-up user regardless of plan tier; it is
the retention mechanism, so it should never be paywalled.

---

## 7. V1 Scope vs. Later

**In v1:**
- Content types: video (YouTube, TikTok), images, articles/blogs
- Single dominant item per link (no multi-item disambiguation)
- Full 4-phase loop, anonymous trial, saved history
- One default/small curated model list per content type, with static
  per-model capability warnings (not full brief-adaptation)
- Paddle-based payments with an internal model-weighted credit ledger

**Explicitly deferred to v2+:**
- PDFs/documents, podcasts/audio, code repositories
- Multi-item detection and "which one do you want to focus on?" prompting
- Any collaborative/team features (shared sessions, comments)
- Automatic brief-adaptation per model (auto-adjusting prompts to fit each
  model's actual capabilities, rather than warning the user)
- Expanded/open model marketplace beyond the initial curated list

---

## 8. What Success Looks Like

A first-time anonymous user should be able to go from pasting a link to
holding a finished, usable creative brief in under a couple of minutes,
with zero friction — and the moment they hit the signup wall, it should
feel like an upgrade to something they already love, not a paywall blocking
something they haven't tried yet.