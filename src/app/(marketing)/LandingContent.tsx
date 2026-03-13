'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GradientButton } from '@/components/ui/gradient-button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronDown } from 'lucide-react';

// ─── Mosaic tile data (real product screenshots + avatar photos) ───

interface MosaicTile {
  src: string;
  alt: string;
  type: 'image' | 'video';
  span?: 'col' | 'row' | 'both';
}

const MOSAIC_TILES: MosaicTile[] = [
  { src: '/showcase/real/dashboard-logged-in.png', alt: 'Dashboard with real customer avatars', type: 'image', span: 'col' },
  { src: '/avatars/female/Middle_aged_black_woman1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/showcase/real/market-radar-results.png', alt: 'Market Radar intelligence results', type: 'image', span: 'col' },
  { src: '/avatars/male/Young_south_asian_man2.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/showcase/hero-ambient.mp4', alt: 'Ambient product video', type: 'video' },
  { src: '/avatars/female/Middle_aged_east_asian_woman1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/showcase/real/avatar-review.png', alt: 'ICP Review with all 14 questions', type: 'image', span: 'row' },
  { src: '/avatars/male/Middle_aged_caucasian_man1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/showcase/truck_right.mp4', alt: 'Product showcase video', type: 'video' },
  { src: '/avatars/female/Middle_aged_south_asian_woman1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/avatars/male/Middle_aged_black_man1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/showcase/real/market-radar.png', alt: 'Market Radar scanning', type: 'image' },
  { src: '/avatars/female/Middle_aged_european_woman1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/avatars/male/Older_european_man1.jpg', alt: 'Customer avatar', type: 'image' },
  { src: '/showcase/truck_left.mp4', alt: 'Product showcase video', type: 'video' },
  { src: '/avatars/female/Middle_aged_latinx_woman1.jpg', alt: 'Customer avatar', type: 'image' },
];

// ─── Avatar strip for CTA section ───

const AVATAR_STRIP = [
  '/avatars/male/Young_caucasian_man1.jpg',
  '/avatars/female/Middle_aged_black_woman2.jpg',
  '/avatars/male/Middle_aged_south_asian_man1.jpg',
  '/avatars/female/Middle_aged_east_asian_woman2.jpg',
  '/avatars/male/Middle_aged_latinx_man1.jpg',
  '/avatars/female/Middle_aged_black_woman3.jpg',
  '/avatars/male/Middle_aged_east_asian_man1.jpg',
  '/avatars/female/Young_south_asian_woman1.jpg',
];

// ─── Section IDs for nav ───

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'cta', label: 'Get Started' },
] as const;

// ─── Mosaic Tile Component ───

function MosaicTileComponent({ tile }: { tile: MosaicTile }) {
  const [imageError, setImageError] = useState(false);

  const spanClass =
    tile.span === 'col' ? 'col-span-2' :
    tile.span === 'row' ? 'row-span-2' :
    tile.span === 'both' ? 'col-span-2 row-span-2' : '';

  return (
    <div className={`mosaic-tile rounded-xl overflow-hidden relative ${spanClass}`}>
      {tile.type === 'video' ? (
        <video
          src={tile.src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover min-h-[120px]"
        />
      ) : imageError ? (
        <div className="w-full h-full min-h-[120px] bg-white/5" />
      ) : (
        <Image
          src={tile.src}
          alt={tile.alt}
          width={400}
          height={300}
          className="w-full h-full object-cover min-h-[120px]"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

// ─── Feature Section Component ───

interface FeatureSection {
  id: string;
  headline: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  revealClass: string;
  backgroundAvatars?: string[];
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'know-customer',
    headline: 'Know your customer',
    description: 'AI-powered personas built from real market signals. Map your ideal customer\'s emotional landscape, decision patterns, and buying triggers with the 14-question ICP interview framework.',
    imageSrc: '/showcase/real/dashboard-logged-in.png',
    imageAlt: 'Real customer avatars on the Launch dashboard — James Bennett and Ananya Kapoor with AI-generated photos, pain points, and insights',
    reverse: false,
    revealClass: 'reveal-left',
    backgroundAvatars: [
      '/avatars/male/Young_south_asian_man2.jpg',
      '/avatars/female/Middle_aged_black_woman1.jpg',
      '/avatars/male/Middle_aged_caucasian_man1.jpg',
      '/avatars/female/Middle_aged_east_asian_woman1.jpg',
      '/avatars/male/Middle_aged_black_man1.jpg',
      '/avatars/female/Middle_aged_south_asian_woman1.jpg',
      '/avatars/male/Older_european_man1.jpg',
      '/avatars/female/Middle_aged_latinx_woman1.jpg',
      '/avatars/male/Middle_aged_latinx_man1.jpg',
    ],
  },
  {
    id: 'read-market',
    headline: 'Read the market',
    description: 'Six S Emotional Analysis, voice of customer insights, content angles, and strategic recommendations — all generated from scanning real conversations in your target audience.',
    imageSrc: '/showcase/real/market-radar-results.png',
    imageAlt: 'Market Radar results showing Six S Emotional Analysis, Voice of Customer quotes, and Strategic Insights',
    reverse: true,
    revealClass: 'reveal-right',
  },
  {
    id: 'create-converts',
    headline: 'Create what converts',
    description: 'Generate high-impact content calibrated to your audience\'s emotional triggers. Scene-by-scene scripting with HOOK, PAIN, SOLUTION, CTA frameworks — every word engineered for resonance.',
    imageSrc: '/showcase/real/avatar-review.png',
    imageAlt: 'ICP Review showing 14 completed questions with real market intelligence answers',
    reverse: false,
    revealClass: 'reveal-left',
  },
  {
    id: 'launch-precision',
    headline: 'Launch with precision',
    description: 'From landing pages to conversion funnels, deploy everything you need to bring your product to market. High-converting pages built on proven frameworks, optimized for your specific audience.',
    imageSrc: '/showcase/real/market-radar.png',
    imageAlt: 'Market Radar scanning — discovering content angles for your target audience',
    reverse: true,
    revealClass: 'reveal-right',
  },
];

// ─── Main Component ───

function LandingPageContent() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Scroll reveal observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    document
      .querySelectorAll('.reveal-on-scroll, .reveal-blur, .reveal-scale, .reveal-left, .reveal-right')
      .forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // Active section tracking for nav
  useEffect(() => {
    sectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActiveSection(e.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserverRef.current?.observe(el);
    });

    return () => sectionObserverRef.current?.disconnect();
  }, []);

  // Nav blur on scroll
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navigation ─── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/60 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-lg font-display font-bold text-foreground">
            Launch
          </span>

          {/* Section jump links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-6">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`text-sm transition-colors ${
                  activeSection === id
                    ? 'text-foreground nav-link-active'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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

      {/* ─── Hero: Full-Bleed Content Mosaic ─── */}
      <section id="overview" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Mosaic grid background */}
        <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 grid-rows-4 gap-2 p-2 opacity-40">
          {MOSAIC_TILES.map((tile, i) => (
            <MosaicTileComponent key={i} tile={tile} />
          ))}
        </div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background/50 pointer-events-none" />

        {/* Hero content */}
        <div className="text-center relative z-10 px-6">
          <h1 className="text-8xl sm:text-9xl font-display font-bold text-foreground hero-glow tracking-tight">
            Launch
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-lg mx-auto">
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
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-scroll-hint z-10">
          <span className="text-xs text-muted-foreground/60">
            Scroll to explore
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </section>

      {/* ─── Video Showcase: "Starts with insight" ─── */}
      <section className="py-24 sm:py-32 px-6 relative overflow-hidden">
        {/* Background mosaic at low opacity */}
        <div className="absolute inset-0 grid grid-cols-4 gap-3 p-4 opacity-10 pointer-events-none">
          {AVATAR_STRIP.concat(AVATAR_STRIP).map((src, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <Image src={src} alt="" width={200} height={200} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="reveal-blur rounded-3xl overflow-hidden victor-glass-card">
            <div className="relative aspect-video">
              <video
                src="/showcase/hero-ambient.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Overlay with headline */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-12 sm:pb-16">
                <h2 className="text-4xl sm:text-6xl font-display font-bold text-white hero-glow">
                  Starts with insight
                </h2>
                <p className="text-white/60 mt-3 text-sm sm:text-base max-w-md text-center">
                  Answer 14 questions. Get AI-generated customer avatars, market intelligence, and a content strategy built on real data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Sections: Full-Width, Content-First ─── */}
      <div id="features">
        {FEATURE_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="py-20 sm:py-28 px-6 relative overflow-hidden"
          >
            {/* Background avatars grid (if provided) */}
            {section.backgroundAvatars && (
              <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8 opacity-[0.06] pointer-events-none">
                {section.backgroundAvatars.map((src, i) => (
                  <div key={i} className="rounded-lg overflow-hidden">
                    <Image src={src} alt="" width={200} height={200} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            <div
              className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center relative z-10 ${
                section.reverse ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Image — takes 3 of 5 columns */}
              <div
                className={`lg:col-span-3 ${section.revealClass} ${
                  section.reverse ? 'lg:col-start-3' : ''
                }`}
              >
                <div className="rounded-2xl overflow-hidden victor-glass-card">
                  <Image
                    src={section.imageSrc}
                    alt={section.imageAlt}
                    width={900}
                    height={600}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Text — takes 2 of 5 columns */}
              <div
                className={`lg:col-span-2 ${
                  section.reverse ? 'lg:col-start-1 lg:row-start-1 reveal-left' : 'reveal-right'
                }`}
              >
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground mb-6">
                  {section.headline}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ─── Final CTA ─── */}
      <section id="cta" className="py-32 px-6 reveal-blur">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-display font-bold text-foreground mb-6">
            Ready to launch?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
            Join founders who use AI-powered market validation to launch with confidence.
          </p>
          <Link href="/auth">
            <GradientButton className="text-base px-10 py-5">
              Get Started Free
            </GradientButton>
          </Link>

          {/* Avatar strip */}
          <div className="mt-12 flex items-center justify-center gap-[-8px]">
            {AVATAR_STRIP.map((src, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0"
              >
                <Image src={src} alt="User avatar" width={40} height={40} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
            <span className="ml-3 text-sm text-muted-foreground">
              Real avatars, real insights
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
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
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
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
              Built by Gravity Culture Coaching LLC
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              &copy; {new Date().getFullYear()} All rights reserved.
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
