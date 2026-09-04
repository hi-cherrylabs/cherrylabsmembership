import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { MessageCircle, User, Lightbulb, Briefcase, Newspaper, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { ScrollOption } from '../Shared';
import type { Post, UserProfile } from '../../types';

export type DashboardSubView = 'community' | 'profile' | 'suggest' | 'employee' | 'news' | 'admin' | string;

const BASE_DASHBOARD_OPTIONS: { icon: any; label: string; desc: string; view: DashboardSubView }[] = [
  { icon: MessageCircle, label: 'Get in touch', desc: 'Direct channel with Cherry Labs coordinators', view: 'community' },
  { icon: User, label: 'Membership details', desc: 'View ID, VIP status & ownership score', view: 'profile' },
  { icon: Lightbulb, label: 'Offer a suggestion', desc: 'Propose new features & platform tweaks', view: 'suggest' },
  { icon: Briefcase, label: 'Be an employee', desc: 'Apply for internal developer & design roles', view: 'employee' },
  { icon: Newspaper, label: "See what's new", desc: 'Changelog, roadmap & release notes', view: 'news' },
];

// Shown only until the admin has posted real content via the Admin Panel's
// Posts tab - matches the original design's default announcement set so the
// carousel still rotates out of the box instead of looking like a single
// static card.
const FALLBACK_SLIDES = [
  {
    id: 'fallback-1',
    tag: 'WELCOME PASS',
    title: '3-Month VIP All-Access Active',
    desc: 'Unrestricted entry across all Cherry Labs digital tools & private servers.',
    badge: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'fallback-2',
    tag: 'STAKEHOLDER POOL',
    title: '5% Indirect Asset Ownership',
    desc: 'Annual profit distributions calculated by community engagement scores.',
    badge: 'Q4 Distribution',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'fallback-3',
    tag: 'GOVERNANCE',
    title: 'Real-Time Ecosystem Voting',
    desc: 'Submit platform proposals and vote on upcoming platform architecture.',
    badge: 'Vote Open',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'fallback-4',
    tag: 'INTERNAL CAREERS',
    title: 'Direct Employment Pathways',
    desc: 'Official paid opportunities within Cherry Labs internal engineering teams.',
    badge: 'Hiring',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
  },
];

// Vertical space the fixed header (logo + hamburger button) occupies -
// matches the top-8 offset + title/button block used in App.tsx.
const HEADER_CLEARANCE = 130;
// Gap between the carousel and the first option card, preserved when the
// carousel is fully expanded (matches the original design's mb-12 gap).
const CAROUSEL_GAP = 48;

export default function DashboardMain({
  posts,
  profile,
  onNavigate,
}: {
  posts: Post[];
  profile?: UserProfile | null;
  onNavigate: (view: DashboardSubView) => void;
  key?: string;
}) {
  const userRoles = profile && Array.isArray(profile.employeeRoles) ? profile.employeeRoles : [];
  const unlockedRoleOptions = userRoles.map((r) => ({
    icon: Award,
    label: `${r} Workstation`,
    desc: `Official workstation & directives for ${r}`,
    view: `role_${r}`,
  }));

  const allDashboardOptions = [...unlockedRoleOptions, ...BASE_DASHBOARD_OPTIONS];
  const dashboardScrollRef = useRef<HTMLDivElement>(null);
  const carouselMeasureRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(260);
  const [carouselInteractive, setCarouselInteractive] = useState(true);

  const slides = posts.filter((p) => !!p.imageUrl).slice(0, 8);
  const displaySlides = slides.length > 0 ? slides : (FALLBACK_SLIDES as any[]);

  // Measure the carousel's real rendered height (responsive across mobile
  // and desktop breakpoints) so the collapse math below always matches.
  useEffect(() => {
    const el = carouselMeasureRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) setCarouselHeight(height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % displaySlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  useEffect(() => {
    if (carouselIndex >= displaySlides.length) setCarouselIndex(0);
  }, [displaySlides.length, carouselIndex]);

  // Drives the collapse: as the options list scrolls, the carousel zooms
  // out & fades away completely, and the space it reserved (the spacer below)
  // shrinks so the options rise up to sit cleanly right below the header clearance.
  const { scrollY } = useScroll({ container: dashboardScrollRef });
  const collapseRange = Math.max(carouselHeight, 1);
  const carouselScale = useTransform(scrollY, [0, collapseRange * 0.8], [1, 0.75]);
  const carouselOpacity = useTransform(scrollY, [0, collapseRange * 0.65], [1, 0]);
  const carouselTranslateY = useTransform(scrollY, [0, collapseRange], [0, -32]);
  const carouselVisibility = useTransform(scrollY, (latest) => (latest >= collapseRange * 0.65 ? 'hidden' : 'visible'));
  const spacerHeight = useTransform(scrollY, [0, collapseRange], [carouselHeight + CAROUSEL_GAP, 0]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const shouldBeInteractive = latest < collapseRange * 0.4;
    setCarouselInteractive((prev) => (prev === shouldBeInteractive ? prev : shouldBeInteractive));
  });

  return (
    <motion.div
      key="dash_main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-20 w-full h-full"
    >
      {/* Fixed, scroll-collapsing announcement carousel - zooms out and fades
          to complete hidden state as the options list is scrolled, then zooms
          back in when scrolled back to the top. */}
      <motion.div
        ref={carouselMeasureRef}
        style={{
          scale: carouselScale,
          opacity: carouselOpacity,
          y: carouselTranslateY,
          visibility: carouselVisibility,
          pointerEvents: carouselInteractive ? 'auto' : 'none',
          top: `${HEADER_CLEARANCE}px`,
        }}
        className="fixed left-0 right-0 z-30 w-full max-w-5xl mx-auto px-4 sm:px-8 transition-visibility duration-200"
      >
        <div className="relative group">
          <motion.div
            className="flex"
            animate={{ x: `-${carouselIndex * 100}%` }}
            transition={{ type: 'spring', stiffness: 250, damping: 30 }}
          >
            {displaySlides.map((item: any, idx) => (
              <div key={item.id || idx} className="w-full shrink-0">
                <div className="w-full h-[220px] sm:h-[300px] md:h-[400px] lg:h-[480px] shrink-0 bg-black/40 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.2)] relative flex flex-col justify-between border border-[var(--border-20)] cursor-pointer">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                    {item.tag && (
                      <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                        {item.tag}
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] sm:text-[11px] font-bold text-pink-300 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-pink-400/30 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1.5 drop-shadow-md">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-white/80 leading-relaxed line-clamp-2">
                      {item.desc || item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {displaySlides.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCarouselIndex((prev) => (prev - 1 + displaySlides.length) % displaySlides.length); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-[var(--border-20)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 shadow-lg"
              >
                <ChevronLeft className="text-white" size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCarouselIndex((prev) => (prev + 1) % displaySlides.length); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-[var(--border-20)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 shadow-lg"
              >
                <ChevronRight className="text-white" size={20} strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Scrollable options list. A dynamic spacer at the top reserves room
          for the carousel and shrinks as the user scrolls, so the options
          rise up and settle right below the hamburger button once the
          carousel has fully collapsed. */}
      <div
        ref={dashboardScrollRef}
        className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: HEADER_CLEARANCE }}
      >
        <motion.div style={{ height: spacerHeight }} />
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col w-full max-w-sm gap-3 px-4 pb-40 shrink-0">
            {allDashboardOptions.map((opt) => (
              <ScrollOption key={opt.view} containerRef={dashboardScrollRef}>
                <button
                  onClick={() => onNavigate(opt.view)}
                  className="flex items-center justify-between p-4 bg-[var(--surface-25)] hover:bg-[var(--surface-55)] backdrop-blur-xl border border-[var(--border-50)] hover:border-[var(--border-80)] rounded-2xl transition-all duration-200 w-full text-left group shadow-[0_4px_16px_rgba(0,0,0,0.03)] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-60)] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-[var(--invert-bg)] group-hover:text-[var(--invert-text)] transition-all">
                      <opt.icon className="text-[var(--text-100)] group-hover:text-[var(--invert-text)] transition-colors" size={22} strokeWidth={2.5} />
                    </div>
                    <span className="text-[var(--text-100)] font-extrabold text-[15px]">{opt.label}</span>
                  </div>
                  <ChevronRight size={20} className="text-[var(--text-40)] group-hover:text-[var(--text-100)] group-hover:translate-x-1 transition-all" />
                </button>
              </ScrollOption>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
