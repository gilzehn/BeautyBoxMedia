// AI tool generators for the console's "AI powered" screens.
//
// Every generator is `async (TypedInput) => Promise<TypedOutput>` and currently
// produces a deterministic template draft locally. To upgrade a tool to a real
// model, replace its function body with something like
//   supabase.functions.invoke('ai-tools', { body: { tool: 'deck', input } })
// returning the SAME output type — the screens never need to change.
// `estimateProfitability` is intentionally pure math (sync): the numbers are
// permanent; only its commentary could ever become model-generated.

// --- Deck Creator ----------------------------------------------------------
export interface DeckInput {
  brand: string;
  audience: string;
  objective: string;
  keyPoints: string[];
}

export interface DeckSlide {
  title: string;
  bullets: string[];
}

export interface DeckOutline {
  title: string;
  slides: DeckSlide[];
}

export async function generateDeckOutline(input: DeckInput): Promise<DeckOutline> {
  const brand = input.brand.trim() || 'The brand';
  const audience = input.audience.trim() || 'the audience';
  const objective = input.objective.trim() || 'grow the brand on Amazon';
  const slides: DeckSlide[] = [
    {
      title: brand,
      bullets: [`Prepared for ${audience}`, `Objective: ${objective}`, 'Presented by Beauty Box Media'],
    },
    {
      title: `Who is ${brand}?`,
      bullets: [
        'Positioning, hero products, and current channels',
        'Where the brand wins today — and where it leaves money on the table',
        'Why now is the moment to act',
      ],
    },
    {
      title: `Understanding ${audience}`,
      bullets: [
        'Who they are and how they buy',
        'The messages that resonate with them',
        'Where they discover products like these',
      ],
    },
    {
      title: 'The objective',
      bullets: [objective, 'What success looks like in 90 days', 'How we will measure it'],
    },
    ...input.keyPoints
      .map((p) => p.trim())
      .filter(Boolean)
      .map((point) => ({
        title: point,
        bullets: [
          `Why "${point}" matters for ${brand}`,
          'Proof points and quick wins',
          'What we need to execute',
        ],
      })),
    {
      title: 'Why Beauty Box Media',
      bullets: [
        'Marketplace management across NRG, RMR, and The Beauty Box',
        'Full-funnel: listings, advertising, brand presence, and analytics',
        'A team that already operates in this category every day',
      ],
    },
    {
      title: 'Next steps',
      bullets: ['Align on scope and timeline', 'Kick-off and access checklist', 'First-30-days plan'],
    },
  ];
  return { title: `${brand} — ${objective}`, slides };
}

// --- Proposal Builder --------------------------------------------------------
export interface ProposalInput {
  client: string;
  services: string[];
  scopeNotes: string;
  monthlyFee: string;
}

export interface ProposalSection {
  heading: string;
  body: string;
}

export interface ProposalDraft {
  title: string;
  sections: ProposalSection[];
}

export async function generateProposal(input: ProposalInput): Promise<ProposalDraft> {
  const client = input.client.trim() || 'the client';
  const services = input.services.length > 0 ? input.services : ['Full Marketplace Management'];
  const fee = input.monthlyFee.trim();
  const sections: ProposalSection[] = [
    {
      heading: 'Overview',
      body:
        `This proposal outlines how Beauty Box Media will support ${client} across ` +
        `${services.length > 1 ? `${services.length} service areas` : services[0].toLowerCase()}. ` +
        'Our goal is simple: profitable, sustainable growth with full transparency into every lever we pull.',
    },
    {
      heading: 'Scope of work',
      body:
        services.map((s) => `• ${s}`).join('\n') +
        (input.scopeNotes.trim() ? `\n\nNotes:\n${input.scopeNotes.trim()}` : ''),
    },
    {
      heading: 'Deliverables',
      body: services
        .map((s) => `• ${s}: onboarding audit, execution plan, weekly progress reporting`)
        .join('\n'),
    },
    {
      heading: 'Pricing',
      body: fee
        ? `Monthly engagement fee: ${fee}. Billed monthly, no long-term lock-in — we earn the renewal.`
        : 'Pricing to be confirmed based on final scope. Billed monthly, no long-term lock-in.',
    },
    {
      heading: 'Next steps',
      body:
        '1. Review and sign this proposal\n2. Access checklist and kick-off call\n' +
        '3. Onboarding audit delivered within the first two weeks',
    },
  ];
  return { title: `Proposal — ${client}`, sections };
}

// --- Roadmap Builder ----------------------------------------------------------
export interface RoadmapInput {
  brand: string;
  objective: string;
  timeframe: 30 | 60 | 90;
}

export interface RoadmapPhase {
  title: string;
  items: string[];
}

export interface Roadmap {
  title: string;
  phases: RoadmapPhase[];
}

export async function generateRoadmap(input: RoadmapInput): Promise<Roadmap> {
  const brand = input.brand.trim() || 'the brand';
  const objective = input.objective.trim() || 'grow marketplace revenue';
  const allPhases: RoadmapPhase[] = [
    {
      title: 'Phase 1 — Foundation (days 1–30)',
      items: [
        `Full audit of ${brand}: listings, pricing, reviews, and ad account health`,
        'Fix conversion blockers: content, images, A+ pages, keyword coverage',
        `Baseline metrics tied to the objective: ${objective}`,
      ],
    },
    {
      title: 'Phase 2 — Growth (days 31–60)',
      items: [
        'Restructure advertising around profitable keywords and defended branded terms',
        'Launch tests: pricing, main images, and promotions',
        'Weekly review cadence against the baseline',
      ],
    },
    {
      title: 'Phase 3 — Scale (days 61–90)',
      items: [
        'Double down on what the tests proved out',
        'Expand: new ASINs, bundles, or channels where the data supports it',
        `Report against the objective (${objective}) and set the next quarter's targets`,
      ],
    },
  ];
  const phaseCount = input.timeframe / 30;
  return {
    title: `${brand} — ${input.timeframe}-day roadmap`,
    phases: allPhases.slice(0, phaseCount),
  };
}

// --- Email Drafter --------------------------------------------------------------
export type EmailType = 'cold-outreach' | 'follow-up' | 'partnership' | 'renewal';
export type EmailTone = 'professional' | 'friendly' | 'direct';

export interface EmailInput {
  type: EmailType;
  recipientName: string;
  company: string;
  contextPoints: string[];
  tone: EmailTone;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

const EMAIL_SUBJECTS: Record<EmailType, (company: string) => string> = {
  'cold-outreach': (c) => `Growing ${c} on Amazon — a quick idea`,
  'follow-up': (c) => `Following up — next steps for ${c}`,
  partnership: (c) => `Partnership idea: Beauty Box Media × ${c}`,
  renewal: (c) => `Continuing our work together — ${c}`,
};

const EMAIL_OPENERS: Record<EmailType, string> = {
  'cold-outreach':
    "I'll keep this short: we manage beauty brands on Amazon end-to-end, and I think there's clear headroom for {company}.",
  'follow-up':
    'Circling back on my last note — I know inboxes get busy, so here are the key points again.',
  partnership:
    'We work with beauty brands across Amazon and DTC, and I believe there is a genuinely good fit between us.',
  renewal:
    "As we approach the end of the current term, I wanted to recap what we've achieved together and what comes next.",
};

export async function generateEmailDraft(input: EmailInput): Promise<EmailDraft> {
  const name = input.recipientName.trim() || 'there';
  const company = input.company.trim() || 'your brand';
  const greeting =
    input.tone === 'friendly' ? `Hi ${name},` : input.tone === 'direct' ? `${name} —` : `Hello ${name},`;
  const signoff =
    input.tone === 'friendly' ? 'Talk soon,' : input.tone === 'direct' ? 'Best,' : 'Kind regards,';
  const points = input.contextPoints.map((p) => p.trim()).filter(Boolean);
  const body = [
    greeting,
    '',
    EMAIL_OPENERS[input.type].replace('{company}', company),
    ...(points.length > 0 ? ['', 'A few specifics:', ...points.map((p) => `• ${p}`)] : []),
    '',
    input.type === 'renewal'
      ? 'Could we grab 20 minutes this week to walk through the renewal?'
      : 'Would a 20-minute call this week make sense? Happy to share exactly what we would do first.',
    '',
    signoff,
    'The Beauty Box Media team',
  ].join('\n');
  return { subject: EMAIL_SUBJECTS[input.type](company), body };
}

// --- Profitability Estimator ------------------------------------------------------
export interface ProfitabilityInput {
  unitPrice: number;
  cogs: number;
  amazonFeePct: number;
  fulfillmentCost: number;
  adSpendPerUnit: number;
  monthlyUnits: number;
}

export interface ProfitabilityResult {
  referralFee: number;
  unitMarginPreAd: number;
  unitMarginPostAd: number;
  marginPctPreAd: number;
  marginPctPostAd: number;
  breakEvenAcosPct: number;
  monthly: {
    revenue: number;
    cogs: number;
    fees: number;
    fulfillment: number;
    adSpend: number;
    profit: number;
  };
  commentary: string[];
}

export function estimateProfitability(i: ProfitabilityInput): ProfitabilityResult {
  const price = i.unitPrice || 0;
  const referralFee = price * (i.amazonFeePct / 100);
  const unitMarginPreAd = price - i.cogs - referralFee - i.fulfillmentCost;
  const unitMarginPostAd = unitMarginPreAd - i.adSpendPerUnit;
  const marginPctPreAd = price > 0 ? (unitMarginPreAd / price) * 100 : 0;
  const marginPctPostAd = price > 0 ? (unitMarginPostAd / price) * 100 : 0;
  const breakEvenAcosPct = price > 0 ? (unitMarginPreAd / price) * 100 : 0;
  const units = i.monthlyUnits || 0;

  const commentary: string[] = [];
  if (unitMarginPostAd <= 0) {
    commentary.push(
      'The unit is unprofitable after advertising at these numbers — reduce COGS, raise the price, or cut ad spend per unit before scaling.'
    );
  } else if (marginPctPostAd < 10) {
    commentary.push(
      'Post-ad margin is under 10% — workable for velocity plays, but thin. Small fee or COGS changes will swing this to a loss.'
    );
  } else if (marginPctPostAd < 20) {
    commentary.push('Post-ad margin is in a healthy 10–20% band for marketplace brands.');
  } else {
    commentary.push('Post-ad margin is above 20% — strong. There may be room to buy growth with more ad spend.');
  }
  if (breakEvenAcosPct > 0) {
    commentary.push(
      `Break-even ACOS is ${breakEvenAcosPct.toFixed(1)}%. Typical beauty campaigns run 25–35% — ` +
        (breakEvenAcosPct >= 35
          ? 'you have comfortable headroom.'
          : breakEvenAcosPct >= 25
            ? 'watch campaigns closely; the headroom is tight.'
            : 'ads must beat the category average just to break even.')
    );
  }
  if (units > 0 && unitMarginPostAd > 0) {
    commentary.push(
      `At ${units.toLocaleString()} units/month this configuration nets ${(unitMarginPostAd * units).toLocaleString(
        'en-US',
        { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }
      )} per month.`
    );
  }

  return {
    referralFee,
    unitMarginPreAd,
    unitMarginPostAd,
    marginPctPreAd,
    marginPctPostAd,
    breakEvenAcosPct,
    monthly: {
      revenue: price * units,
      cogs: i.cogs * units,
      fees: referralFee * units,
      fulfillment: i.fulfillmentCost * units,
      adSpend: i.adSpendPerUnit * units,
      profit: unitMarginPostAd * units,
    },
    commentary,
  };
}
