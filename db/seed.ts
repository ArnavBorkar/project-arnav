/**
 * Idempotent seed.
 * - Inserts the full habit catalog from PROJECT_ARNAV.md §4.
 * - Inserts the 5 identity statements from §7.
 * - Inserts the app_state singleton (phase=1, started=today).
 *
 * Re-running upserts by slug / display_order; never duplicates.
 */
import 'dotenv/config';
import { sql, eq } from 'drizzle-orm';
import { db } from './client';
import {
  appState,
  habits,
  identityStatements,
} from './schema';

type SeedHabit = {
  slug: string;
  name: string;
  area: string;
  cadence: 'daily' | 'weekdays' | 'weekly' | 'custom' | 'monthly';
  targetValue?: number | null;
  unit?: string | null;
  phaseEnabled: number;
  displayOrder: number;
  description?: string;
};

// Full habit catalog. phase_enabled follows PROJECT_ARNAV.md §9.
const HABITS: SeedHabit[] = [
  // ---- Phase 1: Keystone — sleep + wind-down ----
  { slug: 'wake_7am', name: 'Wake by 7:00', area: 'sleep', cadence: 'daily', phaseEnabled: 1, displayOrder: 10, description: 'Alarm across the room. Out of bed within 5 min.' },
  { slug: 'sunlight_10min', name: 'Sunlight 10 min', area: 'sleep', cadence: 'daily', phaseEnabled: 1, displayOrder: 20, description: 'Outside or on balcony, no phone.' },
  { slug: 'hydrate_morning', name: 'Hydrate on wake (500ml)', area: 'hydration', cadence: 'daily', phaseEnabled: 1, displayOrder: 30, description: '1L bottle next to bed the night before.' },
  { slug: 'phone_away_until_8', name: 'Phone away until 8:00', area: 'screen', cadence: 'daily', phaseEnabled: 1, displayOrder: 40 },
  { slug: 'startup_evening_block', name: 'Startup evening block', area: 'startup', cadence: 'weekdays', phaseEnabled: 1, displayOrder: 50, description: '7:30 PM – 11:30 PM block on weekdays.' },
  { slug: 'evening_reset_11pm', name: 'Evening reset (5 min)', area: 'env', cadence: 'daily', phaseEnabled: 1, displayOrder: 60, description: '11:00 PM — clothes, desk, bottle, phone in drawer.' },
  { slug: 'hard_stop_1130pm', name: 'Hard stop 11:30 PM', area: 'startup', cadence: 'daily', phaseEnabled: 1, displayOrder: 70 },
  { slug: 'bed_by_12', name: 'Bed by 12:00', area: 'sleep', cadence: 'daily', phaseEnabled: 1, displayOrder: 80 },
  { slug: 'felt_rested_rating', name: 'Felt-rested rating', area: 'sleep', cadence: 'daily', targetValue: 5, unit: 'rating', phaseEnabled: 1, displayOrder: 90, description: 'Self-rate 1-5 on waking.' },

  // ---- Phase 2: Body ----
  { slug: 'gym_session', name: 'Gym session', area: 'gym', cadence: 'weekdays', phaseEnabled: 2, displayOrder: 110, description: 'M/T/Th/F — 4-5x/week target.' },
  { slug: 'mobility_10min', name: 'Mobility 10 min', area: 'gym', cadence: 'daily', phaseEnabled: 2, displayOrder: 120, description: 'Before bed: hip flexors, T-spine, shoulders.' },
  { slug: 'breakfast_protein_hit', name: 'Breakfast — protein hit', area: 'food', cadence: 'daily', phaseEnabled: 2, displayOrder: 130 },
  { slug: 'lunch_on_time', name: 'Lunch on time (1 PM)', area: 'food', cadence: 'daily', phaseEnabled: 2, displayOrder: 140 },
  { slug: 'dinner_by_830', name: 'Dinner by 8:30', area: 'food', cadence: 'daily', phaseEnabled: 2, displayOrder: 150 },
  { slug: 'protein_target_hit', name: 'Protein target (1.6-2g/kg)', area: 'food', cadence: 'daily', phaseEnabled: 2, displayOrder: 160 },
  { slug: 'no_food_after_10', name: 'No food after 10 PM', area: 'food', cadence: 'daily', phaseEnabled: 2, displayOrder: 170 },
  { slug: 'water_intake_3L', name: 'Water — 3L', area: 'hydration', cadence: 'daily', targetValue: 3, unit: 'L', phaseEnabled: 2, displayOrder: 180 },
  { slug: 'posture_checks_done', name: 'Posture checks (45-min pings)', area: 'posture', cadence: 'weekdays', targetValue: 6, unit: 'pings', phaseEnabled: 2, displayOrder: 190 },
  { slug: 'office_or_coworking_day', name: 'Office or coworking visit', area: 'work', cadence: 'weekly', phaseEnabled: 2, displayOrder: 200, description: '~1x every 10 days, or coworking 1x/week.' },
  { slug: 'hard_stop_office_7pm', name: 'Hard stop office at 7 PM', area: 'work', cadence: 'weekdays', phaseEnabled: 2, displayOrder: 210 },
  { slug: 'deep_work_blocks', name: 'Deep-work blocks', area: 'work', cadence: 'weekdays', targetValue: 3, unit: 'blocks', phaseEnabled: 2, displayOrder: 220 },
  { slug: 'sunday_tidy', name: 'Sunday tidy (15 min)', area: 'env', cadence: 'weekly', phaseEnabled: 2, displayOrder: 230 },
  { slug: 'ig_under_30min', name: 'Instagram under 30 min', area: 'screen', cadence: 'daily', phaseEnabled: 2, displayOrder: 240 },
  { slug: 'phone_free_hours', name: 'Phone-free hours', area: 'screen', cadence: 'daily', targetValue: 4, unit: 'hours', phaseEnabled: 2, displayOrder: 250 },

  // ---- Phase 3: Mind + Connection ----
  { slug: 'prayer_meditation_5min', name: 'Prayer + meditation 5 min', area: 'spirit', cadence: 'daily', phaseEnabled: 3, displayOrder: 310 },
  { slug: 'pages_read', name: 'Read 20 pages', area: 'reading', cadence: 'daily', targetValue: 20, unit: 'pages', phaseEnabled: 3, displayOrder: 320 },
  { slug: 'parents_call', name: 'Call parents', area: 'social', cadence: 'daily', phaseEnabled: 3, displayOrder: 330, description: 'Target: 5x/week (post-dinner walk).' },
  { slug: 'family_call_week', name: 'Family call (sibling/grandparent)', area: 'social', cadence: 'weekly', targetValue: 1, unit: 'calls', phaseEnabled: 3, displayOrder: 340 },
  { slug: 'friends_contacted_week', name: 'Friends contacted (top 5-7)', area: 'social', cadence: 'weekly', targetValue: 2, unit: 'contacts', phaseEnabled: 3, displayOrder: 350 },
  { slug: 'skincare_am', name: 'Skincare AM', area: 'looks', cadence: 'daily', phaseEnabled: 3, displayOrder: 360 },
  { slug: 'skincare_pm', name: 'Skincare PM', area: 'looks', cadence: 'daily', phaseEnabled: 3, displayOrder: 370 },
  { slug: 'grooming_weekly_check', name: 'Grooming weekly check', area: 'looks', cadence: 'weekly', phaseEnabled: 3, displayOrder: 380 },

  // ---- Phase 4: Optimize + Sharpen ----
  { slug: 'weekly_review_done', name: 'Sunday weekly review', area: 'work', cadence: 'weekly', phaseEnabled: 4, displayOrder: 410 },
  { slug: 'monthly_snapshot', name: 'Monthly finance snapshot', area: 'finance', cadence: 'monthly', phaseEnabled: 4, displayOrder: 420, description: '1st of every month — 15 min.' },
];

const IDENTITY_STATEMENTS = [
  'I am someone who wakes at 7.',
  'I am a builder who ships on Sundays.',
  "I am present for my family — they don't have to chase me.",
  'I treat my body like it has to last 80 more years.',
  "I read. Builders who don't read get out-thought by builders who do.",
];

async function upsertHabits() {
  for (const h of HABITS) {
    const existing = await db.select().from(habits).where(eq(habits.slug, h.slug)).limit(1);
    if (existing.length > 0) {
      await db
        .update(habits)
        .set({
          name: h.name,
          area: h.area,
          cadence: h.cadence,
          targetValue: h.targetValue != null ? (h.targetValue as never) : null,
          unit: h.unit ?? null,
          phaseEnabled: h.phaseEnabled,
          displayOrder: h.displayOrder,
          description: h.description ?? null,
        })
        .where(eq(habits.slug, h.slug));
    } else {
      await db.insert(habits).values({
        slug: h.slug,
        name: h.name,
        area: h.area,
        cadence: h.cadence,
        targetValue: h.targetValue != null ? (h.targetValue as never) : null,
        unit: h.unit ?? null,
        phaseEnabled: h.phaseEnabled,
        displayOrder: h.displayOrder,
        description: h.description ?? null,
      });
    }
  }
}

async function upsertIdentity() {
  for (let i = 0; i < IDENTITY_STATEMENTS.length; i++) {
    const text = IDENTITY_STATEMENTS[i];
    const existing = await db
      .select()
      .from(identityStatements)
      .where(eq(identityStatements.text, text))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(identityStatements).values({
        text,
        active: true,
        displayOrder: i + 1,
      });
    } else {
      await db
        .update(identityStatements)
        .set({ active: true, displayOrder: i + 1 })
        .where(eq(identityStatements.text, text));
    }
  }
}

async function ensureAppState() {
  const existing = await db.select().from(appState).limit(1);
  if (existing.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(appState).values({
      id: 1,
      currentPhase: 1,
      phaseStartedAt: today,
    });
  }
}

async function main() {
  console.log('Seeding habits...');
  await upsertHabits();
  console.log('Seeding identity statements...');
  await upsertIdentity();
  console.log('Ensuring app_state...');
  await ensureAppState();

  const counts = {
    habits: (await db.select({ c: sql<number>`count(*)` }).from(habits))[0]?.c,
    identity: (await db.select({ c: sql<number>`count(*)` }).from(identityStatements))[0]?.c,
    appState: (await db.select({ c: sql<number>`count(*)` }).from(appState))[0]?.c,
  };
  console.log('Seed complete:', counts);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
