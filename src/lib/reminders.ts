/**
 * Reminder schedule (per PRD §9).
 * Each reminder has:
 *   - key: unique id used to dedupe in reminder_log
 *   - timeHHmm: time of day in app timezone (HH:mm). For every-N-min reminders, use `everyMinutes` instead.
 *   - dayOfWeek: 0-6 (Sun-Sat). undefined = every day.
 *   - habitSlug: when set, skip the push if today's daily_logs row is already completed
 *   - guardMonthDayOne: only fire on the 1st of the month
 *   - guardSunday: only fire on Sundays
 *   - everyMinutes: fire every N minutes within the [windowStart, windowEnd) window
 */
export interface ReminderDef {
  key: string;
  title: string;
  body: string;
  timeHHmm?: string;
  habitSlug?: string;
  dayOfWeek?: number;
  guardMonthDayOne?: boolean;
  guardSunday?: boolean;
  everyMinutes?: number;
  windowStart?: string;
  windowEnd?: string;
  url?: string;
}

export const REMINDERS: ReminderDef[] = [
  { key: 'wake_7am', title: 'Wake up', body: 'Sunlight, water, no phone.', timeHHmm: '07:00', habitSlug: 'wake_7am', url: '/' },
  { key: 'phone_allowed_8am', title: 'Phone allowed', body: '8:00 AM — phone is fair game now.', timeHHmm: '08:00', url: '/' },
  { key: 'lunch_1255', title: 'Lunch in 5', body: 'Real meal. Away from desk.', timeHHmm: '12:55', habitSlug: 'lunch_on_time', url: '/' },
  {
    key: 'posture_pings',
    title: 'Posture check',
    body: 'Stand, walk 2 min, reset.',
    everyMinutes: 45,
    windowStart: '10:00',
    windowEnd: '18:00',
    habitSlug: 'posture_checks_done',
    url: '/',
  },
  { key: 'snack_430', title: 'Snack — protein in', body: 'Greek yogurt / whey / fruit + nuts.', timeHHmm: '16:30', url: '/' },
  { key: 'hard_stop_office_7pm', title: 'Hard stop office', body: 'Day-job ends now. Walk + call parents.', timeHHmm: '19:00', habitSlug: 'hard_stop_office_7pm', url: '/' },
  { key: 'dinner_window', title: 'Dinner window closes 8:30', body: 'Eat now or eat lighter.', timeHHmm: '20:00', habitSlug: 'dinner_by_830', url: '/' },
  { key: 'evening_reset', title: 'Evening reset (5 min)', body: 'Clothes hung, desk cleared, phone in drawer.', timeHHmm: '23:00', habitSlug: 'evening_reset_11pm', url: '/' },
  { key: 'hard_stop_1130pm', title: 'Hard stop startup work', body: 'Save state. Lights out in 30.', timeHHmm: '23:30', habitSlug: 'hard_stop_1130pm', url: '/' },
  { key: 'no_screens_1145', title: 'No screens.', body: 'Kindle or sleep.', timeHHmm: '23:45', url: '/' },
  { key: 'weekly_review_sun', title: 'Weekly review time', body: 'One hour — five questions.', timeHHmm: '17:00', guardSunday: true, url: '/review/weekly' },
  { key: 'monthly_finance', title: 'Finance snapshot', body: '15 minutes — net worth, spend, savings rate.', timeHHmm: '10:00', guardMonthDayOne: true, url: '/log' },
];

export function isInQuietWindow(hhmm: string, start = '00:30', end = '06:55') {
  if (start <= end) return hhmm >= start && hhmm <= end;
  return hhmm >= start || hhmm <= end;
}
