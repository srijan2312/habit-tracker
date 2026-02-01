import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  Check, 
  Flame, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  Target,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';

const features = [
  {
    icon: Target,
    title: 'Track Daily Habits',
    description: 'Create and monitor your habits with a beautiful, intuitive interface.',
  },
  {
    icon: Flame,
    title: 'Build Streaks',
    description: 'Stay motivated with streak tracking that celebrates your consistency.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    description: 'Visualize your progress over time with an interactive calendar.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Understand your patterns with detailed completion statistics.',
  },
];

const MotionDiv = motion.div;

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="landing-hero-bg relative overflow-hidden py-20 lg:py-32">
          
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Build better habits, one day at a time
                </div>
              </MotionDiv>
              
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h1 className="mb-6 font-display text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Transform your daily routine
                  <span className="mt-2 block text-foreground/90">
                    with{' '}
                    <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                      Habitly
                    </span>
                  </span>
                </h1>
              </MotionDiv>
              
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
                  The simple, beautiful habit tracker that helps you stay consistent, 
                  build streaks, and achieve your goals. Start your journey today.
                </p>
              </MotionDiv>
              
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  size="xl"
                  variant="hero"
                  className="h-12 px-8 shadow-md shadow-primary/25"
                  asChild
                >
                  <Link to="/signup">
                    Start for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="h-11 border-primary/40 text-foreground/80 hover:bg-primary/5"
                  asChild
                >
                  <Link to="/signin">
                    I already have an account
                  </Link>
                </Button>
              </MotionDiv>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required · Free forever for basic use
              </p>
            </div>

            {/* Hero Image/Preview */}
            <a href="#next-section" className="scroll-btn">
              <span></span>
              <span></span>
              <span></span>
              Scroll
            </a>
            <MotionDiv
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 lg:mt-24"
            >
              <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-xl">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-missed/50" />
                    <div className="h-3 w-3 rounded-full bg-warning/50" />
                    <div className="h-3 w-3 rounded-full bg-success/50" />
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold">Today's Habits</h3>
                      <p className="text-sm text-muted-foreground">3 of 5 completed</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-streak-light px-3 py-1">
                      <Flame className="h-4 w-4 text-streak" />
                      <span className="text-sm font-semibold text-streak">12 day streak</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { title: 'Morning meditation', completed: true },
                      { title: 'Read for 30 minutes', completed: true },
                      { title: 'Exercise', completed: true },
                      { title: 'Learn new language', completed: false },
                      { title: 'Journal', completed: false },
                    ].map((habit, i) => (
                      <div 
                        key={i}
                        className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                          habit.completed ? 'border-success/30 bg-success-light/30' : 'bg-card'
                        }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          habit.completed 
                            ? 'border-success bg-success text-primary-foreground' 
                            : 'border-muted-foreground/30'
                        }`}>
                          {habit.completed && <Check className="h-4 w-4" />}
                        </div>
                        <span className={habit.completed ? 'line-through opacity-60' : ''}>
                          {habit.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MotionDiv>
          </div>
        </section>

        {/* Features Section */}
        <section id="next-section" className="border-t bg-muted/30 py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Everything you need to build lasting habits
              </h2>
              <p className="text-lg text-muted-foreground">
                Simple tools designed to help you stay consistent and motivated.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <MotionDiv
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </MotionDiv>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-center sm:p-12">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20">
                <Leaf className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
                Ready to build better habits?
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/80">
                Join thousands of people who are transforming their lives, one habit at a time.
              </p>
              <Button size="xl" variant="landing" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">Habitly</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your data is secure and private</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
