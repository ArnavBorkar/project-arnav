import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  date,
  timestamp,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Singleton — only ever has id=1
export const appState = pgTable('app_state', {
  id: integer('id').primaryKey().default(1),
  currentPhase: integer('current_phase').notNull().default(1),
  phaseStartedAt: date('phase_started_at').notNull(),
  currentBookId: integer('current_book_id'),
  pinHash: text('pin_hash'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  quietHoursStart: text('quiet_hours_start').default('00:30'),
  quietHoursEnd: text('quiet_hours_end').default('06:55'),
});

export const habits = pgTable(
  'habits',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    area: text('area').notNull(),
    cadence: text('cadence').notNull(),
    targetValue: numeric('target_value'),
    unit: text('unit'),
    phaseEnabled: integer('phase_enabled').notNull().default(1),
    archived: boolean('archived').default(false),
    displayOrder: integer('display_order'),
    description: text('description'),
  },
  (t) => ({
    slugIdx: uniqueIndex('habits_slug_idx').on(t.slug),
  })
);

export const dailyLogs = pgTable(
  'daily_logs',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    habitId: integer('habit_id').references(() => habits.id, { onDelete: 'cascade' }),
    completed: boolean('completed').default(false),
    value: numeric('value'),
    notes: text('notes'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    dateHabitIdx: uniqueIndex('daily_logs_date_habit_idx').on(t.date, t.habitId),
  })
);

export const sleepLogs = pgTable(
  'sleep_logs',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    bedtime: timestamp('bedtime', { withTimezone: true }),
    wakeTime: timestamp('wake_time', { withTimezone: true }),
    durationMinutes: integer('duration_minutes'),
    quality15: integer('quality_1_5'),
    notes: text('notes'),
  },
  (t) => ({
    dateIdx: uniqueIndex('sleep_logs_date_idx').on(t.date),
  })
);

export const gymSessions = pgTable('gym_sessions', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  type: text('type'),
  notes: text('notes'),
  durationMinutes: integer('duration_minutes'),
});

export const exerciseSets = pgTable('exercise_sets', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => gymSessions.id, { onDelete: 'cascade' }),
  exercise: text('exercise').notNull(),
  weightKg: numeric('weight_kg'),
  reps: integer('reps'),
  setNumber: integer('set_number'),
  rpe: numeric('rpe'),
});

export const bodyMetrics = pgTable('body_metrics', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  weightKg: numeric('weight_kg'),
  waistCm: numeric('waist_cm'),
  notes: text('notes'),
});

export const meals = pgTable('meals', {
  id: serial('id').primaryKey(),
  datetime: timestamp('datetime', { withTimezone: true }).notNull(),
  type: text('type'),
  onTime: boolean('on_time'),
  proteinHit: boolean('protein_hit'),
  description: text('description'),
});

export const people = pgTable('people', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  relationship: text('relationship'),
  cadenceDays: integer('cadence_days').notNull(),
  lastContactedAt: date('last_contacted_at'),
  birthday: date('birthday'),
  notes: text('notes'),
  archived: boolean('archived').default(false),
});

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author'),
  category: text('category'),
  totalPages: integer('total_pages'),
  currentPage: integer('current_page').default(0),
  startedAt: date('started_at'),
  finishedAt: date('finished_at'),
  abandoned: boolean('abandoned').default(false),
  wishlist: boolean('wishlist').default(false),
});

export const readingSessions = pgTable('reading_sessions', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  bookId: integer('book_id').references(() => books.id, { onDelete: 'set null' }),
  pagesRead: integer('pages_read').notNull(),
});

export const financeSnapshots = pgTable(
  'finance_snapshots',
  {
    id: serial('id').primaryKey(),
    month: date('month').notNull(),
    netWorth: numeric('net_worth'),
    monthlySpend: numeric('monthly_spend'),
    savingsRate: numeric('savings_rate'),
    notes: text('notes'),
  },
  (t) => ({
    monthIdx: uniqueIndex('finance_snapshots_month_idx').on(t.month),
  })
);

export const weeklyReviews = pgTable(
  'weekly_reviews',
  {
    id: serial('id').primaryKey(),
    weekStarting: date('week_starting').notNull(),
    q1Worked: text('q1_worked'),
    q2DidntWork: text('q2_didnt_work'),
    q3StreakAtRisk: text('q3_streak_at_risk'),
    q4ShipTarget: text('q4_ship_target'),
    q5CallOverdue: text('q5_call_overdue'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    weekIdx: uniqueIndex('weekly_reviews_week_idx').on(t.weekStarting),
  })
);

export const quarterlyReviews = pgTable(
  'quarterly_reviews',
  {
    id: serial('id').primaryKey(),
    quarterStarting: date('quarter_starting').notNull(),
    photoFrontUrl: text('photo_front_url'),
    photoSideUrl: text('photo_side_url'),
    weightKg: numeric('weight_kg'),
    waistCm: numeric('waist_cm'),
    netWorth: numeric('net_worth'),
    reflection: text('reflection'),
    nextQuarterTheme: text('next_quarter_theme'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    quarterIdx: uniqueIndex('quarterly_reviews_quarter_idx').on(t.quarterStarting),
  })
);

export const identityStatements = pgTable('identity_statements', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  active: boolean('active').default(true),
  displayOrder: integer('display_order'),
});

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: serial('id').primaryKey(),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    deviceLabel: text('device_label'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    endpointIdx: uniqueIndex('push_subs_endpoint_idx').on(t.endpoint),
  })
);

export const screenTimeLogs = pgTable(
  'screen_time_logs',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    instagramMinutes: integer('instagram_minutes'),
    whatsappMinutes: integer('whatsapp_minutes'),
    totalPhoneMinutes: integer('total_phone_minutes'),
  },
  (t) => ({
    dateIdx: uniqueIndex('screen_time_logs_date_idx').on(t.date),
  })
);

export const moodLogs = pgTable(
  'mood_logs',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    mood15: integer('mood_1_5').notNull(),
    notes: text('notes'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    dateIdx: uniqueIndex('mood_logs_date_idx').on(t.date),
  })
);

export const reminderLog = pgTable('reminder_log', {
  id: serial('id').primaryKey(),
  reminderKey: text('reminder_key').notNull(),
  firedAt: timestamp('fired_at', { withTimezone: true }).defaultNow(),
  habitSlug: text('habit_slug'),
});
