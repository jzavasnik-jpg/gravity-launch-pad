'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GradientButton } from '@/components/ui/gradient-button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronDown } from 'lucide-react';

type TabId = 'research' | 'create' | 'launch';

interface TabContent {
  headline: string;
  description: string;
  cards: {
    title: string;
    description: string;
    imageSrc?: string;
    icon?: React.ReactNode;
  }[];
}

const TAB_CONTENT: Record<TabId, TabContent> = {
  research: {
    headline: 'Deep customer intelligence',
    description:
      'Uncover the motivations, fears, and buying triggers that drive your ideal customers. AI-powered personas built from real market signals.',
    cards: [
      {
        title: 'Customer Avatars',
        description:
          'AI-generated personas that map your ideal customer\'s emotional landscape and decision patterns.',
        imageSrc: '/showcase/avatars.png',
      },
      {
        title: 'Market Intelligence',
        description:
          'Competitive analysis, trend insights, and positioning strategies powered by real-time data.',
        imageSrc: '/showcase/market-radar.png',
      },
    ],
  },
  create: {
    headline: 'Content that converts',
    description:
      'Generate high-impact content calibrated to your audience\'s emotional triggers. Every word engineered for resonance.',
    cards: [
      {
        title: 'Content Creation',
        description:
          'AI-crafted posts, emails, and copy that speak directly to your customer\'s core desires.',
        imageSrc: '/showcase/content.png',
      },
      {
        title: 'Thumbnails & Visuals',
        description:
          'Eye-catching visuals designed to stop the scroll and drive clicks on every platform.',
        imageSrc: '/showcase/thumbnails.png',
      },
    ],
  },
  launch: {
    headline: 'Launch with precision',
    description:
      'From landing pages to conversion funnels, deploy everything you need to bring your product to market with confidence.',
    cards: [
      {
        title: 'Landing Pages',
        description:
          'High-converting pages built on proven frameworks, optimized for your specific audience.',
        icon: (
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
        ),
      },
      {
        title: 'Conversion Optimization',
        description:
          'Data-driven refinements that maximize every touchpoint in your customer journey.',
        icon: (
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </div>
        ),
      },
    ],
  },
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'create', label: 'Create' },
  { id: 'launch', label: 'Launch' },
];

function ShowcaseCard({
  title,
  description,
  imageSrc,
  icon,
}: {
  title: string;
  description: string;
  imageSrc?: string;
  icon?: React.ReactNode;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = imageSrc && !imageError;

  return (
    <div className="victor-glass-card rounded-2xl overflow-hidden">
      <div className="aspect-[4/3] bg-background/50 flex items-center justify-center border-b border-white/5 relative overflow-hidden">
        {showImage ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover object-top"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center">
            {icon ?? (
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10" />
            )}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function LandingPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>('research');
  const [scrolled, setScrolled] = useState(false);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    document
      .querySelectorAll('.reveal-on-scroll')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Nav blur on scroll
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabContent = TAB_CONTENT[activeTab];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/60 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-lg font-display font-bold text-foreground">
            Launch
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="text-center">
          <h1 className="text-8xl sm:text-9xl font-display font-bold text-foreground hero-glow tracking-tight">
            Launch
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-md mx-auto">
            Where AI meets market validation
          </p>
          <div className="mt-10">
            <Link href="/auth">
              <GradientButton className="text-base px-8 py-4">
                Get Started
              </GradientButton>
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-scroll-hint">
          <span className="text-xs text-muted-foreground/60">
            Scroll to explore
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 px-6 reveal-on-scroll">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-1 mb-16">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: headline + description */}
            <div className="flex flex-col justify-center lg:pr-8">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                {tabContent.headline}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {tabContent.description}
              </p>
            </div>

            {/* Right: 2-column card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tabContent.cards.map((card) => (
                <ShowcaseCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  imageSrc={card.imageSrc}
                  icon={card.icon}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 reveal-on-scroll">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-display font-bold text-foreground mb-8">
            Start creating
          </h2>
          <Link href="/auth">
            <GradientButton className="text-base px-8 py-4">
              Get Started
            </GradientButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-background/80 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left */}
          <div>
            <span className="text-sm font-display font-semibold text-foreground">
              Launch by Gravity
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              AI-powered market validation
            </p>
          </div>

          {/* Center */}
          <div className="flex items-center justify-center gap-6">
            <a
              href="#capabilities"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector('section:nth-of-type(2)')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Right */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Gravity Culture Coaching LLC
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingContent() {
  return <LandingPageContent />;
}
