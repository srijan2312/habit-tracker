import cron from 'node-cron';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from '../utils/email.js';

const db = supabaseAdmin || supabase;
const NOTIFICATIONS_TIMEZONE = process.env.NOTIFICATIONS_TIMEZONE || 'UTC';

const formatDate = (date) => date.toISOString().slice(0, 10);

const isScheduledToday = (habit, dayOfWeek) => {
  const frequency = habit.frequency;
  const customDays = habit.custom_days || [];

  if ((frequency === 'custom' || frequency === 'weekly') && Array.isArray(customDays) && customDays.length > 0) {
    return customDays.includes(dayOfWeek);
  }

  return true;
};

const buildDailyReminderEmail = (name, pendingHabits) => {
  const list = pendingHabits.map((habit) => `<li>${habit.title}</li>`).join('');
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>Daily Habit Reminder</h2>
      <p>Hi ${name || 'there'},</p>
      <p>You still have <strong>${pendingHabits.length}</strong> habit${pendingHabits.length === 1 ? '' : 's'} to complete today:</p>
      <ul>${list}</ul>
      <p>Stay consistent — small steps add up!</p>
      <p>— Habitly</p>
    </div>
  `;
};

const buildWeeklyDigestEmail = (name, stats) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>Your Weekly Habit Digest</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Here’s your progress from the last 7 days:</p>
      <ul>
        <li><strong>Total habits:</strong> ${stats.totalHabits}</li>
        <li><strong>Completed habit logs:</strong> ${stats.completedLogs}</li>
        <li><strong>Active days:</strong> ${stats.activeDays}</li>
      </ul>
      <p>Keep the momentum going — you’re building great habits.</p>
      <p>— Habitly</p>
    </div>
  `;
};

export const sendDailyReminders = async () => {
  if (!db) throw new Error('Supabase client is not configured.');

  const today = new Date();
  const todayStr = formatDate(today);
  const dayOfWeek = today.getDay();

  const { data: users, error: usersError } = await db
    .from('users')
    .select('id, email, name, email_reminders')
    .eq('email_reminders', true);

  if (usersError) throw usersError;
  if (!users || users.length === 0) return;

  for (const user of users) {
    if (!user.email) continue;

    const { data: habits, error: habitsError } = await db
      .from('habits')
      .select('id, title, frequency, custom_days')
      .eq('user_id', user.id);

    if (habitsError) {
      console.error('❌ Habit fetch error:', habitsError);
      continue;
    }

    if (!habits || habits.length === 0) continue;

    const { data: logs, error: logsError } = await db
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .eq('completed', true);

    if (logsError) {
      console.error('❌ Logs fetch error:', logsError);
      continue;
    }

    const completedSet = new Set((logs || []).map((log) => log.habit_id));
    const pendingHabits = habits.filter(
      (habit) => isScheduledToday(habit, dayOfWeek) && !completedSet.has(habit.id)
    );

    if (pendingHabits.length === 0) continue;

    const html = buildDailyReminderEmail(user.name, pendingHabits);

    try {
      await sendEmail({
        to: user.email,
        subject: 'Habitly Daily Reminder',
        html,
      });
      console.log(`✅ Daily reminder sent to ${user.email}`);
    } catch (err) {
      console.error('❌ Daily reminder send failed:', err);
    }
  }
};

export const sendWeeklyDigest = async () => {
  if (!db) throw new Error('Supabase client is not configured.');

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const { data: users, error: usersError } = await db
    .from('users')
    .select('id, email, name, email_digest')
    .eq('email_digest', true);

  if (usersError) throw usersError;
  if (!users || users.length === 0) return;

  for (const user of users) {
    if (!user.email) continue;

    const { data: habits, error: habitsError } = await db
      .from('habits')
      .select('id')
      .eq('user_id', user.id);

    if (habitsError) {
      console.error('❌ Habits fetch error:', habitsError);
      continue;
    }

    const { data: logs, error: logsError } = await db
      .from('habit_logs')
      .select('date')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', startStr)
      .lte('date', endStr);

    if (logsError) {
      console.error('❌ Logs fetch error:', logsError);
      continue;
    }

    const completedLogs = (logs || []).length;
    const activeDays = new Set((logs || []).map((log) => log.date)).size;
    const totalHabits = (habits || []).length;

    if (totalHabits === 0) continue;

    const html = buildWeeklyDigestEmail(user.name, {
      totalHabits,
      completedLogs,
      activeDays,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your Habitly Weekly Digest',
        html,
      });
      console.log(`✅ Weekly digest sent to ${user.email}`);
    } catch (err) {
      console.error('❌ Weekly digest send failed:', err);
    }
  }
};

export const scheduleNotificationJobs = () => {
  cron.schedule(
    '0 8 * * *',
    () => {
      sendDailyReminders().catch((err) => console.error('❌ Daily reminder job failed:', err));
    },
    { timezone: NOTIFICATIONS_TIMEZONE }
  );

  cron.schedule(
    '0 8 * * 1',
    () => {
      sendWeeklyDigest().catch((err) => console.error('❌ Weekly digest job failed:', err));
    },
    { timezone: NOTIFICATIONS_TIMEZONE }
  );

  console.log(`✅ Notification jobs scheduled (timezone: ${NOTIFICATIONS_TIMEZONE})`);
};
