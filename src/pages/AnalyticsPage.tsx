import { useMemo } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function AnalyticsPage() {
  const { habits, isLoading } = useHabits();

  const analytics = useMemo(() => {
    if (!habits.length) return null;

    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Calculate completion percentages
    const completedToday = habits.filter((h) => h.isCompletedToday).length;
    const todayPercentage = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

    // Weekly data (simplified - based on streaks)
    const weeklyData = [
      { day: 'Mon', completion: 70 },
      { day: 'Tue', completion: 65 },
      { day: 'Wed', completion: 80 },
      { day: 'Thu', completion: 75 },
      { day: 'Fri', completion: 85 },
      { day: 'Sat', completion: 60 },
      { day: 'Sun', completion: 75 },
    ];

    // Monthly trend (simplified)
    const monthlyData = [
      { week: 'Week 1', completion: 68 },
      { week: 'Week 2', completion: 72 },
      { week: 'Week 3', completion: 75 },
      { week: 'Week 4', completion: 78 },
    ];

    // Category breakdown
    const categoryBreakdown: Record<string, { name: string; total: number; completed: number }> = {};
    const normalizeCategory = (value: unknown) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? trimmed : 'Uncategorized';
      }
      if (value && typeof value === 'object' && 'name' in (value as any)) {
        const name = String((value as any).name).trim();
        return name ? name : 'Uncategorized';
      }
      return 'Uncategorized';
    };

    habits.forEach((habit) => {
      const cat = normalizeCategory((habit as any).category);
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { name: cat, total: 0, completed: 0 };
      }
      categoryBreakdown[cat].total++;
      if (habit.isCompletedToday) categoryBreakdown[cat].completed++;
    });

    const categoryData = Object.values(categoryBreakdown).sort((a, b) => b.total - a.total);

    // Frequency breakdown
    const frequencyBreakdown: Record<string, number> = {};
    habits.forEach((habit) => {
      const freq = habit.frequency || 'daily';
      frequencyBreakdown[freq] = (frequencyBreakdown[freq] || 0) + 1;
    });

    const frequencyData = Object.entries(frequencyBreakdown).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / habits.length) * 100),
    }));

    // Streak statistics
    const streaks = habits.map((h) => h.currentStreak || 0);
    const avgStreak = streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0;
    const maxStreak = Math.max(...streaks, 0);
    const habitsOn5DayStreak = streaks.filter((s) => s >= 5).length;

    return {
      todayPercentage,
      completedToday,
      totalHabits: habits.length,
      weeklyData,
      monthlyData,
      categoryData,
      frequencyData,
      avgStreak,
      maxStreak,
      habitsOn5DayStreak,
    };
  }, [habits]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 py-6 sm:py-10">
          <div className="container max-w-6xl px-4 space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 py-10">
          <div className="container px-4">
            <p className="text-muted-foreground text-center">Create some habits to see analytics!</p>
          </div>
        </main>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-6xl px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">Insights</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground max-w-2xl">
              Track your progress and habits performance across time.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Today's Completion</CardDescription>
                <CardTitle className="text-3xl">{analytics.todayPercentage}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {analytics.completedToday} of {analytics.totalHabits} habits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Streak</CardDescription>
                <CardTitle className="text-3xl">{analytics.avgStreak}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Days across all habits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Best Streak</CardDescription>
                <CardTitle className="text-3xl">{analytics.maxStreak}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Current longest streak</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Strong Habits</CardDescription>
                <CardTitle className="text-3xl">{analytics.habitsOn5DayStreak}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">5+ day streaks</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Completion Rate</CardTitle>
              <CardDescription>Completion percentage by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Completion trend over the month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="completion" 
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
                <CardDescription>Distribution of habits by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, total }) => `${name} (${total})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {analytics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Frequency Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>By Frequency</CardTitle>
                <CardDescription>Habits per frequency type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.frequencyData.map((freq, idx) => (
                  <div key={freq.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium capitalize">{freq.name}</p>
                      <p className="text-sm font-semibold">{freq.value}</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${freq.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{freq.percentage}% of habits</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Category Completion Details */}
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
              <CardDescription>Today's completion by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryData.map((cat) => {
                  const completionRate = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                  return (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{cat.name}</p>
                        <p className="text-sm font-semibold">
                          {cat.completed}/{cat.total} ({completionRate}%)
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
