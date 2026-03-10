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

  // Hero blur-reveal on initial page load
  useEffect(() => {
    const heroItems = document.querySelectorAll<HTMLElement>('.hero-reveal');
    if (!heroItems.length) return;

    requestAnimationFrame(() => {
      heroItems.forEach((el) => el.classList.add('visible'));
    });
  }, []);

  // Scroll reveal for elements with stagger inside each section
  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .reveal-scroll'));
    if (!revealItems.length) return;

    // Precompute stagger delay by sibling order in each section.
    revealItems.forEach((el) => {
      const section = el.closest('section');
      if (!section) return;

      const siblings = Array.from(section.querySelectorAll<HTMLElement>('.reveal, .reveal-scroll'));
      const index = siblings.indexOf(el);
      const staggerRaw = getComputedStyle(el).getPropertyValue('--stagger').trim();
      const parsedStagger = Number(staggerRaw);

      // Feature cards: 0.1s, 0.2s, 0.3s, 0.4s
      if (el.classList.contains('feature-card') && Number.isFinite(parsedStagger)) {
        const featureDelayMs = (parsedStagger + 1) * 100;
        el.style.setProperty('--reveal-delay', `${featureDelayMs}ms`);
        return;
      }

      const staggerIndex = Number.isFinite(parsedStagger) ? parsedStagger : Math.max(index, 0);
      el.style.setProperty('--reveal-delay', `${staggerIndex * 90}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          requestAnimationFrame(() => el.classList.add('visible'));
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));
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

  // Dashboard animations trigger on visibility
  useEffect(() => {
    const dashboardMockup = document.querySelector('.dashboard-mockup');
    if (!dashboardMockup) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(dashboardMockup);
    return () => observer.disconnect();
  }, []);

  // Parallax movement for CTA background blobs
  useEffect(() => {
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldReduceMotion) return;

    const blobs = document.querySelectorAll<HTMLElement>('.cta-parallax-blob');
    if (!blobs.length) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        blobs.forEach((blob) => {
          const speed = Number(blob.dataset.speed || '0.08');
          blob.style.setProperty('--parallax-y', `${Math.round(scrollY * speed)}px`);
        });
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="landing-hero-bg with-photo relative overflow-hidden py-20 lg:py-32">
          {showSnowfall && SnowfallComponent ? <SnowfallComponent color="#82C3D9" /> : null}
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div
                className="hero-reveal hero-badge mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                <Sparkles className="h-4 w-4" />
                Build better habits, one day at a time
              </div>
              
              <h1
                className="hero-reveal hero-title mb-6 font-display text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
              >
                Transform your daily routine
                <span className="mt-2 block text-slate-700 dark:text-slate-50">
                  with{' '}
                  <span className="hero-gradient-text">
                    Habitly
                  </span>
                </span>
              </h1>
              
              <p
                className="hero-reveal hero-subtitle mb-10 text-lg text-slate-600 dark:text-slate-200 sm:text-xl"
              >
                The simple, beautiful habit tracker that helps you stay consistent, 
                build streaks, and achieve your goals. Start your journey today.
              </p>
              
              <div
                className="hero-reveal hero-buttons flex flex-col items-center justify-center gap-4 sm:flex-row"
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
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                No credit card required · Free forever for basic use
              </p>
              <a href="#next-section" className="scroll-btn scroll-btn--inline micro-link">
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
        <div className="wave-divider wave-divider--soft" aria-hidden="true">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wave-gradient-back" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(192 70% 60% / 0.08)" />
                <stop offset="50%" stopColor="hsl(192 70% 60% / 0.16)" />
                <stop offset="100%" stopColor="hsl(192 70% 60% / 0.08)" />
              </linearGradient>
              <linearGradient id="wave-gradient-front" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(192 70% 60% / 0.14)" />
                <stop offset="50%" stopColor="hsl(192 70% 60% / 0.22)" />
                <stop offset="100%" stopColor="hsl(192 70% 60% / 0.14)" />
              </linearGradient>
            </defs>
            <path
              d="M0,62 C240,38 420,94 640,72 C850,52 1060,18 1440,62 L1440,120 L0,120 Z"
              className="wave-path wave-path--back"
            />
            <path
              d="M0,72 C260,46 470,104 700,82 C940,58 1110,28 1440,72 L1440,120 L0,120 Z"
              className="wave-path wave-path--front"
            />
          </svg>
        </div>

        {/* Premium Feature Highlights */}
        <section className="saas-section section-tone-1 section-separator py-20">
          <div className="bg-gradient-saas pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="section-blob section-blob--light--1" aria-hidden="true" />
          <div className="section-blob section-blob--light--2" aria-hidden="true" />
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

            <div className="grid gap-10 md:grid-cols-2 lg:gap-12 lg:grid-cols-4">
              {mainFeatures.map((feature, idx) => (
                <div key={feature.title} className="feature-card reveal group" style={{ '--stagger': idx } as React.CSSProperties}>
                  <div className="feature-icon-wrapper">
                    <div className="feature-icon">
                      <feature.icon className="h-10 w-10" />
                    </div>
                  </div>
                  <h3 className="mt-8 font-display text-2xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-4 text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Showcase with Mockup */}
        <section className="section-tone-2 section-separator py-20 reveal">
          <div className="section-blob section-blob--1" aria-hidden="true" />
          <div className="container relative">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
              <div className="reveal-scroll space-y-6 lg:col-span-5">
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

              <div className="reveal-scroll showcase-mockup lg:col-span-7">
                <div className="dashboard-mockup">
                  {/* Dashboard Header */}
                  <div className="dashboard-header">
                    <div className="header-dots">
                      <div className="dot dot-1" />
                      <div className="dot dot-2" />
                      <div className="dot dot-3" />
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="dashboard-content">
                    {/* Today's Habits Card */}
                    <div className="dashboard-card card-1">
                      <h3 className="card-title">Today's Habits</h3>
                      <p className="card-subtitle">3 of 5 completed</p>
                      
                      <div className="space-y-3 mt-4">
                        {[
                          { title: 'Morning meditation', completed: true },
                          { title: 'Read for 30 minutes', completed: true },
                          { title: 'Exercise', completed: true },
                          { title: 'Learn new language', completed: false },
                          { title: 'Journal', completed: false },
                        ].map((habit, i) => (
                          <div key={i} className="habit-item">
                            <div className={`habit-checkbox ${habit.completed ? 'checked' : ''}`}>
                              {habit.completed && <Check className="h-3 w-3" />}
                            </div>
                            <span className={habit.completed ? 'line-through opacity-60' : ''}>
                              {habit.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Stats Card */}
                    <div className="dashboard-card card-2">
                      <h3 className="card-title">Weekly Progress</h3>
                      
                      <div className="space-y-4 mt-4">
                        {[
                          { label: 'Meditation', value: 75 },
                          { label: 'Reading', value: 60 },
                          { label: 'Exercise', value: 90 },
                        ].map((item, i) => (
                          <div key={item.label} className="progress-item" style={{ '--item-index': i } as React.CSSProperties}>
                            <div className="progress-label">
                              <span className="text-xs font-medium">{item.label}</span>
                              <span className="progress-value">{item.value}%</span>
                            </div>
                            <div className="progress-bar-wrapper">
                              <div className="progress-bar" style={{ '--progress-value': `${item.value}%` } as React.CSSProperties} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Streak Card */}
                    <div className="dashboard-card card-3">
                      <div className="flex items-center gap-3">
                        <Flame className="h-6 w-6 text-streak" />
                        <div>
                          <p className="text-xs text-muted-foreground">Current Streak</p>
                          <p className="text-3xl font-bold text-streak">12</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">days in a row</p>
                    </div>

                    {/* Mini Calendar Streaks */}
                    <div className="dashboard-card card-4">
                      <h3 className="card-title text-sm">This Month</h3>
                      <div className="mini-calendar mt-3">
                        {Array.from({ length: 28 }).map((_, i) => {
                          const isActive = Math.random() > 0.3;
                          return (
                            <div
                              key={i}
                              className={`cal-day ${isActive ? 'active' : 'inactive'}`}
                              style={{ '--cal-index': i } as React.CSSProperties}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Habits Matter - Visual Highlights */}
        <section className="section-tone-3 section-separator py-20 reveal">
          <div className="section-blob section-blob--2" aria-hidden="true" />
          <div className="container relative">
            <div className="mb-20 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                Why habits matter
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {benefitSlides.slice(0, 3).map((slide, idx) => (
                <div key={slide.title} className="highlight-block reveal-scroll" style={{ '--stagger': idx } as React.CSSProperties}>
                  <div className="highlight-icon">
                    <slide.icon className="h-12 w-12" />
                  </div>
                  <h3 className="highlight-title">{slide.title}</h3>
                  <p className="highlight-description">{slide.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="section-tone-4 section-separator py-20 reveal">
          <div className="container">
            <div className="stats-group grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, idx) => (
                <div key={stat.label} className="stat-card reveal-scroll text-center" style={{ '--stagger': idx } as React.CSSProperties}>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="stat-counter" data-value={stat.value.replace(/[^\d]/g, '')}>
                        0
                      </span>
                      <span className="stat-suffix text-3xl sm:text-4xl font-semibold text-primary">
                        {stat.value.replace(/\d+/g, '')}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Streak Grid Visualization */}
        <section className="section-tone-5 section-separator py-20 reveal">
          <div className="container">
            <div className="reveal-scroll mb-12 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                Build your streak
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Consistency builds momentum. Watch your streak grow every day.
              </p>
            </div>
            <div className="mx-auto max-w-5xl">
              {/* Heatmap Legend */}
              <div className="mb-8 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-3 w-3 rounded-sm heatmap-intensity-${level}`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">More</span>
                </div>
              </div>

              <div className="streak-grid-wrapper reveal">
                <div className="streak-grid">
                  {Array.from({ length: 35 }).map((_, i) => {
                    // Generate activity levels (0-4) for variety
                    const activityLevel = Math.floor(Math.random() * 5);
                    // Calculate date (35 days ago to today)
                    const date = new Date();
                    date.setDate(date.getDate() - (34 - i));
                    const dateStr = date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    // Determine if we show flame (arbitrary: last 3 days have high activity)
                    const hasFlame = i >= 32 && activityLevel >= 2;

                    return (
                      <div
                        key={i}
                        className={`streak-cell heatmap-intensity-${activityLevel} relative group`}
                        style={{
                          '--delay': `${i * 30}ms`,
                          '--activity': activityLevel,
                        } as React.CSSProperties}
                        title={dateStr}
                        tabIndex={0}
                      >
                        {/* Tooltip */}
                        <div className="streak-tooltip">
                          <div className="tooltip-date">{dateStr}</div>
                          <div className="tooltip-activity">
                            {activityLevel === 0 && 'No activity'}
                            {activityLevel === 1 && '1 completion'}
                            {activityLevel === 2 && '2 completions'}
                            {activityLevel === 3 && '3 completions'}
                            {activityLevel === 4 && '4 completions'}
                          </div>
                        </div>

                        {/* Flame Icon for High Streaks */}
                        {hasFlame && (
                          <div className="streak-flame">
                            <Flame className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA */}
        <section className="section-tone-3 section-separator relative overflow-hidden py-20 reveal">
          <div className="cta-parallax-blob cta-parallax-blob--1" data-speed="0.06" aria-hidden="true" />
          <div className="cta-parallax-blob cta-parallax-blob--2" data-speed="0.1" aria-hidden="true" />
          <div className="cta-parallax-blob cta-parallax-blob--3" data-speed="0.14" aria-hidden="true" />
          <div className="cta-blur-shape cta-blur-shape--1" aria-hidden="true" />
          <div className="cta-blur-shape cta-blur-shape--2" aria-hidden="true" />
          <div className="cta-float-shape cta-float-shape--1" aria-hidden="true" />
          <div className="cta-float-shape cta-float-shape--2" aria-hidden="true" />
          <div className="container relative">
            <div className="reveal-scroll cta-card-premium">
              <div className="cta-content">
                <h2 className="font-display text-4xl font-bold text-primary-foreground sm:text-5xl">
                  Ready to transform your habits?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/90">
                  Join thousands building better lives. Start tracking your habits today.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button size="xl" variant="landing" className="cta-primary-btn" asChild>
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

