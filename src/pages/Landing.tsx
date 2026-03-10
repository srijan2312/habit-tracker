import { Link } from 'react-router-dom';
import { useEffect, useState, type ComponentType } from 'react';

import { 
  Check, 
  Flame, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  Target,
  Shield,
  TrendingUp,
  Zap,
  GitBranch,
  Users,
  Award,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { HabitlyLogo } from '@/components/HabitlyLogo';

const mainFeatures = [
  {
    icon: Target,
    title: 'Smart Habit Tracking',
    description: 'Create and track habits with intelligent reminders and insights.',
  },
  {
    icon: Flame,
    title: 'Build Unstoppable Streaks',
    description: 'Stay motivated with visual streak tracking and celebrations.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Insights',
    description: 'Understand your patterns with detailed completion analytics.',
  },
  {
    icon: Calendar,
    title: 'Calendar View',
    description: 'Visualize your progress over time with an interactive calendar.',
  },
];

const benefitSlides = [
  {
    icon: Target,
    title: 'Track Easily',
    description: 'Simple one-tap habit tracking with beautiful UI.',
  },
  {
    icon: Zap,
    title: 'Stay Consistent',
    description: 'Smart reminders keep you on track every single day.',
  },
  {
    icon: TrendingUp,
    title: 'See Progress',
    description: 'Visual analytics show your improvement over time.',
  },
  {
    icon: Award,
    title: 'Celebrate Wins',
    description: 'Earn badges and celebrate your streak milestones.',
  },
];

const stats = [
  { value: '50K+', label: 'Habits Tracked' },
  { value: '10K+', label: 'Active Users' },
  { value: '92%', label: 'Consistency Rate' },
  { value: '150K+', label: 'Tasks Completed' },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    title: 'Product Manager',
    quote: 'Habitly transformed my morning routine. The streak feature keeps me motivated every single day.',
    avatar: '👩‍💼',
  },
  {
    name: 'Marcus Johnson',
    title: 'Fitness Coach',
    quote: 'My clients love the visual progress tracking. It makes habit building feel achievable and rewarding.',
    avatar: '👨‍🏫',
  },
  {
    name: 'Elena Rodriguez',
    title: 'Student',
    quote: 'Finally, an app that understands habits. The analytics help me understand what actually works for me.',
    avatar: '👩‍🎓',
  },
];

export default function Landing() {
  const [showSnowfall, setShowSnowfall] = useState(false);
  const [SnowfallComponent, setSnowfallComponent] = useState<ComponentType<{ color?: string }> | null>(null);

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 1024;

    const loadSnowfall = async () => {
      if (shouldReduceMotion || !isDesktop) return;
      const mod = await import('react-snowfall');
      setSnowfallComponent(() => mod.default);
      setShowSnowfall(true);
    };

    const snowTimer = window.setTimeout(() => {
      void loadSnowfall();
    }, 1400);

    return () => {
      window.clearTimeout(snowTimer);
    };
  }, []);

  // Scroll-based reveal via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 }
    );
    document.querySelectorAll('.reveal-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Counter animation for stats
  useEffect(() => {
    const counters = document.querySelectorAll('.stat-counter');
    const observerCounter = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const finalValue = parseInt(el.dataset.value || '0', 10);
            let currentValue = 0;
            const increment = Math.ceil(finalValue / 30);
            const interval = setInterval(() => {
              currentValue += increment;
              if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(interval);
              }
              el.textContent = currentValue.toLocaleString();
            }, 30);
            observerCounter.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => observerCounter.observe(el));
    return () => observerCounter.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="landing-hero-bg with-photo relative overflow-hidden py-20 lg:py-32">
          {showSnowfall && SnowfallComponent ? <SnowfallComponent color="#82C3D9" /> : null}
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-up">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Build better habits, one day at a time
                </div>
              </div>
              
              <div className="animate-fade-up">
                <h1 className="mb-6 font-display text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Transform your daily routine
                  <span className="mt-2 block text-slate-700 dark:text-slate-50">
                    with{' '}
                    <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                      Habitly
                    </span>
                  </span>
                </h1>
              </div>
              
              <div className="animate-fade-up">
                <p className="mb-10 text-lg text-slate-600 dark:text-slate-200 sm:text-xl">
                  The simple, beautiful habit tracker that helps you stay consistent, 
                  build streaks, and achieve your goals. Start your journey today.
                </p>
              </div>
              
              <div className="animate-fade-up flex flex-col items-center justify-center gap-4 sm:flex-row">
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
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                No credit card required · Free forever for basic use
              </p>
              <a href="#next-section" className="scroll-btn scroll-btn--inline">
                <span></span>
                <span></span>
                <span></span>
                Scroll
              </a>
            </div>

            {/* Hero Image/Preview */}
            <div className="mt-16 animate-fade-up lg:mt-24">
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
            </div>
          </div>
        </section>

        {/* Wave divider */}
        <div className="wave-divider" aria-hidden="true">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,50 Q360,0 720,50 T1440,50 L1440,100 L0,100 Z" className="wave-path" />
          </svg>
        </div>

        {/* Premium Feature Highlights */}
        <section className="saas-section py-24 lg:py-32">
          <div className="bg-gradient-saas pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="container relative">
            <div className="reveal-scroll mx-auto mb-20 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Powerful Features
              </div>
              <h2 className="mb-4 font-display text-4xl font-bold text-foreground sm:text-5xl">
                Everything you need to master your habits
              </h2>
              <p className="text-lg text-muted-foreground">
                Built for consistency. Designed for success.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {mainFeatures.map((feature, idx) => (
                <div key={feature.title} className="feature-card reveal-scroll group" style={{ '--stagger': idx } as React.CSSProperties}>
                  <div className="feature-icon">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Showcase with Mockup */}
        <section className="py-24 lg:py-32">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="reveal-scroll space-y-6">
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  See your progress unfold
                </h2>
                <p className="text-lg text-muted-foreground">
                  Watch your habits come to life with real-time progress tracking, beautiful visualizations, and meaningful insights that celebrate your consistency.
                </p>
                <ul className="space-y-4">
                  {[
                    'Daily habit reminders',
                    'Automatic streak tracking',
                    'Rich analytics dashboard',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-success" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="reveal-scroll showcase-mockup">
                <div className="mockup-card">
                  <div className="mockup-header" />
                  <div className="mockup-content space-y-4">
                    <div className="mockup-bar" style={{ '--width': '75%' } as React.CSSProperties} />
                    <div className="mockup-bar" style={{ '--width': '60%' } as React.CSSProperties} />
                    <div className="mockup-bar" style={{ '--width': '90%' } as React.CSSProperties} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefit Slider */}
        <section className="py-24 lg:py-32">
          <div className="container">
            <div className="mb-16 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                Why habits matter
              </h2>
            </div>
            <div className="benefit-slider">
              <div className="slider-track">
                {benefitSlides.map((slide, idx) => (
                  <div key={slide.title} className="benefit-slide reveal-scroll" style={{ '--stagger': idx } as React.CSSProperties}>
                    <div className="slide-icon">
                      <slide.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">{slide.title}</h3>
                    <p className="text-muted-foreground">{slide.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 lg:py-32">
          <div className="container">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card reveal-scroll text-center">
                  <div>
                    <span className="stat-counter text-4xl font-bold text-primary sm:text-5xl" data-value={stat.value.replace(/[^\d]/g, '')}>
                      0
                    </span>
                    <span className="ml-1 text-4xl font-bold text-primary sm:text-5xl">
                      {stat.value.replace(/\d+/g, '')}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Streak Grid Visualization */}
        <section className="py-24 lg:py-32">
          <div className="container">
            <div className="reveal-scroll mb-12 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                Build your streak
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Every day counts. Watch your consistency grow.
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <div className="streak-grid">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="streak-cell" style={{ '--delay': `${i * 30}ms` } as React.CSSProperties} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 lg:py-32">
          <div className="container">
            <div className="reveal-scroll mb-16 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                Loved by our users
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, idx) => (
                <div key={testimonial.name} className="testimonial-card reveal-scroll" style={{ '--stagger': idx } as React.CSSProperties}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                  <p className="text-foreground italic">"{testimonial.quote}"</p>
                  <div className="mt-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA */}
        <section className="py-24 lg:py-32">
          <div className="container">
            <div className="reveal-scroll cta-card-premium">
              <div className="cta-content">
                <h2 className="font-display text-4xl font-bold text-primary-foreground sm:text-5xl">
                  Ready to transform your habits?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/90">
                  Join thousands building better lives. Start tracking your habits today.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button size="xl" variant="landing" asChild>
                    <Link to="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    <Link to="/signin">
                      Already have an account
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <HabitlyLogo size="sm" />
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
