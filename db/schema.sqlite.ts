import {
  sqliteTable,
  integer,
  text,
  real,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const appState = sqliteTable('app_state', {
  id: integer('id').primaryKey().notNull(),
  currentPhase: integer('current_phase').notNull().default(1),
  phaseStartedAt: text('phase_started_at').notNull(),
  currentBookId: integer('current_book_id'),
  pinHash: text('pin_hash'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: text('locked_until'),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).default(true),
  quietHoursStart: text('quiet_hours_start').default('00:30'),
  quietHoursEnd: text('quiet_hours_end').default('06:55'),
});

export const habits = sqliteTable(
  'habits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    area: text('area').notNull(),
    cadence: text('cadence').notNull(),
    targetValue: real('target_value'),
    unit: text('unit'),
    phaseEnabled: integer('phase_enabled').notNull().default(1),
    archived: integer('archived', { mode: 'boolean' }).default(false),
    displayOrder: integer('display_order'),
    description: text('description'),
  },
  (t) => ({
    slugIdx: uniqueIndex('habits_slug_idx').on(t.slug),
  })
);

export const dailyLogs = sqliteTable(
  'daily_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    habitId: integer('habit_id').references(() => habits.id, { onDelete: 'cascade' }),
    completed: integer('completed', { mode: 'boolean' }).default(false),
    value: real('value'),
    notes: text('notes'),
    loggedAt: text('logged_at').default('CURRENT_TIMESTAMP'),
  },
  (t) => ({
    dateHabitIdx: uniqueIndex('daily_logs_date_habit_idx').on(t.date, t.habitId),
  })
);

export const sleepLogs = sqliteTable(
  'sleep_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    bedtime: text('bedtime'),
    wakeTime: text('wake_time'),
    durationMinutes: integer('duration_minutes'),
    quality15: integer('quality_1_5'),
    notes: text('notes'),
  },
  (t) => ({
    dateIdx: uniqueIndex('sleep_logs_date_idx').on(t.date),
  })
);

export const gymSessions = sqliteTable('gym_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  type: text('type'),
  notes: text('notes'),
  durationMinutes: integer('duration_minutes'),
});

export const exerciseSets = sqliteTable('exercise_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').references(() => gymSessions.id, { onDelete: 'cascade' }),
  exercise: text('exercise').notNull(),
  weightKg: real('weight_kg'),
  reps: integer('reps'),
  setNumber: integer('set_number'),
  rpe: real('rpe'),
});

export const bodyMetrics = sqliteTable('body_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  weightKg: real('weight_kg'),
  waistCm: real('waist_cm'),
  notes: text('notes'),
});

export const meals = sqliteTable('meals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  datetime: text('datetime').notNull(),
  type: text('type'),
  onTime: integer('on_time', { mode: 'boolean' }),
  proteinHit: integer('protein_hit', { mode: 'boolean' }),
  description: text('description'),
});

export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  relationship: text('relationship'),
  cadenceDays: integer('cadence_days').notNull(),
  lastContactedAt: text('last_contacted_at'),
  birthday: text('birthday'),
  notes: text('notes'),
  archived: integer('archived', { mode: 'boolean' }).default(false),
});

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author'),
  category: text('category'),
  totalPages: integer('total_pages'),
  currentPage: integer('current_page').default(0),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
  abandoned: integer('abandoned', { mode: 'boolean' }).default(false),
  wishlist: integer('wishlist', { mode: 'boolean' }).default(false),
});

export const readingSessions = sqliteTable('reading_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  bookId: integer('book_id').references(() => books.id, { onDelete: 'set null' }),
  pagesRead: integer('pages_read').notNull(),
});

export const financeSnapshots = sqliteTable(
  'finance_snapshots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    month: text('month').notNull(),
    netWorth: real('net_worth'),
    monthlySpend: real('monthly_spend'),
    savingsRate: real('savings_rate'),
    notes: text('notes'),
  },
  (t) => ({
    monthIdx: uniqueIndex('finance_snapshots_month_idx').on(t.month),
  })
);

export const weeklyReviews = sqliteTable(
  'weekly_reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    weekStarting: text('week_starting').notNull(),
    q1Worked: text('q1_worked'),
    q2DidntWork: text('q2_didnt_work'),
    q3StreakAtRisk: text('q3_streak_at_risk'),
    q4ShipTarget: text('q4_ship_target'),
    q5CallOverdue: text('q5_call_overdue'),
    submittedAt: text('submitted_at').default('CURRENT_TIMESTAMP'),
  },
  (t) => ({
    weekIdx: uniqueIndex('weekly_reviews_week_idx').on(t.weekStarting),
  })
);

export const quarterlyReviews = sqliteTable(
  'quarterly_reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    quarterStarting: text('quarter_starting').notNull(),
    photoFrontUrl: text('photo_front_url'),
    photoSideUrl: text('photo_side_url'),
    weightKg: real('weight_kg'),
    waistCm: real('waist_cm'),
    netWorth: real('net_worth'),
    reflection: text('reflection'),
    nextQuarterTheme: text('next_quarter_theme'),
    submittedAt: text('submitted_at').default('CURRENT_TIMESTAMP'),
  },
  (t) => ({
    quarterIdx: uniqueIndex('quarterly_reviews_quarter_idx').on(t.quarterStarting),
  })
);

export const identityStatements = sqliteTable('identity_statements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  displayOrder: integer('display_order'),
});

export const pushSubscriptions = sqliteTable(
  'push_subscriptions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    deviceLabel: text('device_label'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  },
  (t) => ({
    endpointIdx: uniqueIndex('push_subs_endpoint_idx').on(t.endpoint),
  })
);

export const screenTimeLogs = sqliteTable(
  'screen_time_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    instagramMinutes: integer('instagram_minutes'),
    whatsappMinutes: integer('whatsapp_minutes'),
    totalPhoneMinutes: integer('total_phone_minutes'),
  },
  (t) => ({
    dateIdx: uniqueIndex('screen_time_logs_date_idx').on(t.date),
  })
);

export const moodLogs = sqliteTable(
  'mood_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    mood15: integer('mood_1_5').notNull(),
    notes: text('notes'),
    loggedAt: text('logged_at').default('CURRENT_TIMESTAMP'),
  },
  (t) => ({
    dateIdx: uniqueIndex('mood_logs_date_idx').on(t.date),
  })
);

export const reminderLog = sqliteTable('reminder_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reminderKey: text('reminder_key').notNull(),
  firedAt: text('fired_at').default('CURRENT_TIMESTAMP'),
  habitSlug: text('habit_slug'),
});
