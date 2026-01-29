import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ: FAQItem[] = [
  {
    id: 'what-is-habit',
    question: 'What is a Habit?',
    answer: 'A habit is a daily action or activity you want to build a streak for. For example: "Drink 8 glasses of water", "Exercise for 30 minutes", or "Read for 20 minutes". You can mark habits as completed each day to build your streak.',
  },
  {
    id: 'what-is-streak',
    question: 'What is a Streak?',
    answer: 'A streak is the number of consecutive days you\'ve completed a habit. If you miss a day, your streak resets to zero. Your goal is to build the longest streak possible! For example, if you complete "Exercise" for 10 days in a row, your Exercise habit has a 10-day streak.',
  },
  {
    id: 'what-is-freeze',
    question: 'What are Freeze Tokens?',
    answer: 'Freeze tokens allow you to protect your habit streaks. If you miss completing a habit on a day, you can use a freeze token to keep your streak intact as if you had completed it. You start with 3 freeze tokens per habit. You can earn more through referrals (5 tokens per successful referral).',
  },
  {
    id: 'how-to-create-habit',
    question: 'How do I create a new habit?',
    answer: 'Click the "Create Habit" button on the Dashboard. Fill in the habit name, description (optional), category, and frequency (daily, weekly, or monthly). Then click "Create". Your new habit will appear on your dashboard.',
  },
  {
    id: 'how-to-complete-habit',
    question: 'How do I complete a habit?',
    answer: 'On the Dashboard, find the habit you want to complete and click the checkmark or "Mark as Complete" button. If it\'s for today, your habit will be marked as completed and count towards your streak. You can also view past completions on the Calendar view.',
  },
  {
    id: 'how-to-referral',
    question: 'How does the referral system work?',
    answer: 'Go to the "Invite Friends" page and share your referral code or link with friends. When your friend signs up using your code, you both get a bonus! You receive 5 freeze tokens, and they get to start their habit-building journey. You can track all your referrals on the Invite page.',
  },
  {
    id: 'what-is-journal',
    question: 'What is the Journal?',
    answer: 'The Journal is where you can add personal notes and reflections for each habit completion. When you complete a habit, you can optionally add a note (e.g., "Great workout today, ran 5km!"). These notes help you remember your progress and stay motivated. Visit the Journal page to view all your notes.',
  },
  {
    id: 'how-to-search',
    question: 'How do I search and filter habits?',
    answer: 'Go to the "Search" page to find and filter your habits. You can search by name or description, sort by name, frequency, or longest streak, and filter by category or completion status. This helps you organize and discover your habits more easily.',
  },
  {
    id: 'what-is-analytics',
    question: 'What can I learn from Analytics?',
    answer: 'The Analytics page shows your completion rate, average and best streaks, weekly and monthly trends, and breakdown by category. This helps you understand your habit patterns, identify your strongest categories, and see where you can improve.',
  },
  {
    id: 'how-to-notifications',
    question: 'How do I enable notifications?',
    answer: 'Go to Settings > Notification Preferences. You can enable email reminders for daily habits, weekly digests of your progress, and opt-in to push notifications. Configure these settings based on your preference.',
  },
  {
    id: 'how-to-export',
    question: 'Can I export my data?',
    answer: 'Yes! Go to your History page where you can view all your completions and export them as CSV or JSON. This lets you backup your data or analyze it externally.',
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Danger Zone > Delete Account. Enter your password to confirm. This will permanently delete your account and all associated data. This action cannot be undone.',
  },
];

export default function HelpPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-4xl px-4 sm:px-6 space-y-8 sm:space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">Support</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Help & FAQ</h1>
            <p className="text-muted-foreground max-w-2xl">
              Learn how to use Habitly and build lasting habits.
            </p>
          </div>

          {/* Getting Started Section */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Everything you need to know to start building habits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  Create Your First Habit
                </h4>
                <p className="text-sm text-muted-foreground">
                  Click "Create Habit" on the Dashboard and give it a name, description, category, and frequency.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  Complete Daily
                </h4>
                <p className="text-sm text-muted-foreground">
                  Mark habits as complete each day to build your streak. The longer your streak, the more motivated you'll become!
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  Add Notes
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add optional notes when completing habits. Document how you felt, what you accomplished, or tips for next time.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                  Track & Analyze
                </h4>
                <p className="text-sm text-muted-foreground">
                  Check your Analytics to see completion rates, trends, and which categories you're strongest in.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                  Share & Earn
                </h4>
                <p className="text-sm text-muted-foreground">
                  Share your referral code with friends. When they join, you both get rewards!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Concepts */}
          <Card>
            <CardHeader>
              <CardTitle>Key Concepts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">Streak</h4>
                <p className="text-sm text-muted-foreground">
                  Consecutive days you've completed a habit. Reset to 0 if you miss a day (unless you use a freeze token).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Freeze Token</h4>
                <p className="text-sm text-muted-foreground">
                  A one-time use token that protects your streak for a day. You get 3 per habit, earn more through referrals.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Category</h4>
                <p className="text-sm text-muted-foreground">
                  Organize habits into groups like Health, Learning, Fitness, etc. Helps track progress by area.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Journal</h4>
                <p className="text-sm text-muted-foreground">
                  Personal notes attached to habit completions. Reflects on progress and motivations.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Referral</h4>
                <p className="text-sm text-muted-foreground">
                  Share your code with friends. Get 5 freeze tokens when they sign up and complete habits.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Dashboard showing completion rates, trends, and insights about your habit performance.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Click any question to expand the answer</p>
          </div>

          {FAQ.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => toggleExpanded(item.id)}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold pr-4">{item.question}</h3>
                    {expandedId === item.id ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-1" />
                    )}
                  </div>
                  {expandedId === item.id && (
                    <>
                      <Separator />
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>Can't find the answer you're looking for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We're here to help! If you have questions not covered in this FAQ, you can:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Check your Settings for notification and preference options</li>
                <li>Review your completed habits and streaks on the Dashboard</li>
                <li>Visit the Journal to see all your notes and reflections</li>
                <li>Use the Search page to organize and find specific habits</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
