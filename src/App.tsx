import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ArrowRight,
  Search,
  Check,
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { MiniLoader } from './components/Shared';
import { COUNTRIES, TANZANIA_REGIONS } from './lib/constants';
import type { Country } from './lib/constants';
import { updateProfileFields, subscribeBenefitParagraphs, subscribePosts } from './lib/data';
import type { BenefitParagraph } from './lib/data';
import type { Post } from './types';

import SignInScreen from './components/auth/SignInScreen';
import Toast from './components/Toast';
import ThemeToggleButton from './components/ThemeToggleButton';
import DashboardMain from './components/dashboard/DashboardMain';
import type { DashboardSubView } from './components/dashboard/DashboardMain';
import CommunityView from './components/dashboard/CommunityView';
import SuggestView from './components/dashboard/SuggestView';
import ProfileView from './components/dashboard/ProfileView';
import EmployeeView from './components/dashboard/EmployeeView';
import NewsView from './components/dashboard/NewsView';
import AdminPanel from './components/admin/AdminPanel';

type Screen =
  | 'loading'
  | 'signin'
  | 'banned'
  | 'reading'
  | 'onboard_name'
  | 'onboard_gender'
  | 'onboard_phone'
  | 'onboard_nationality'
  | 'onboard_region'
  | 'onboard_saving'
  | 'onboard_success'
  | 'onboard_start'
  | 'dashboard';

export default function App() {
  const { user, profile, isAdmin, authLoading, profileLoading, logout } = useAuth();

  const [screen, setScreen] = useState<Screen>('loading');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2600);
  };
  const [dashboardView, setDashboardView] = useState<'main' | DashboardSubView>('main');

  // Derive which screen to show from real auth/profile state, without
  // yanking the user out of an in-progress local flow (e.g. the onboarding
  // success animation, which also flips profile.onboarded to true).
  // The admin account goes through the exact same flow as any member -
  // onboarding, dashboard, everything - the only difference is the extra
  // "Admin Panel" entry that shows up in their hamburger menu.
  useEffect(() => {
    if (authLoading) { setScreen('loading'); return; }
    if (!user) { setScreen('signin'); setDashboardView('main'); return; }
    if (profileLoading || !profile) { setScreen('loading'); return; }
    if (profile.banned) { setScreen('banned'); return; }

    setScreen((prev) => {
      if (profile.onboarded) {
        if (prev === 'signin' || prev === 'loading' || prev === 'banned') return 'dashboard';
        return prev;
      }
      if (prev === 'signin' || prev === 'loading') return 'reading';
      return prev;
    });
  }, [authLoading, user, profileLoading, profile]);

  /* ------------------------------ Reading view ------------------------------ */
  const [isAutoScrolling] = useState(true);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [benefitParagraphs, setBenefitParagraphs] = useState<BenefitParagraph[]>([]);

  useEffect(() => {
    if (screen !== 'reading') return;
    const unsub = subscribeBenefitParagraphs(setBenefitParagraphs);
    return unsub;
  }, [screen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (screen === 'reading') timer = setTimeout(() => setShowScrollDownBtn(true), 3000);
    return () => clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== 'reading' || !isAutoScrolling || hasReachedBottom) return;
    let animId: number;
    let lastTime = performance.now();
    const step = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      const el = scrollContainerRef.current;
      if (el) {
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (el.scrollTop >= maxScroll - 15) {
          setHasReachedBottom(true);
          setIsFastForwarding(false);
          return;
        }
        const speed = isFastForwarding ? 0.9 : 0.045;
        el.scrollTop += speed * Math.min(delta, 32);
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [screen, isAutoScrolling, hasReachedBottom, isFastForwarding]);

  const handleContainerScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) setScrollProgress(el.scrollTop / maxScroll);
    if (el.scrollTop >= maxScroll - 15) {
      setHasReachedBottom(true);
      setIsFastForwarding(false);
    }
  };

  /* ------------------------------ Onboarding -------------------------------- */
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');

  // Resume partially-filled answers if the member left mid-onboarding.
  useEffect(() => {
    if (!profile) return;
    setUserName((prev) => prev || profile.name || '');
    setUserGender((prev) => prev || profile.gender || '');
    setPhoneNumber((prev) => prev || profile.phoneNumber || '');
    setSelectedRegion((prev) => prev || profile.region || '');
  }, [profile]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.includes(q));
  }, [countrySearch]);

  const filteredRegions = useMemo(() => {
    if (!regionSearch.trim()) return TANZANIA_REGIONS;
    const q = regionSearch.toLowerCase();
    return TANZANIA_REGIONS.filter((r) => r.toLowerCase().includes(q));
  }, [regionSearch]);

  // Finalize onboarding once the member reaches the "saving" step.
  useEffect(() => {
    if (screen !== 'onboard_saving' || !user) return;
    (async () => {
      await updateProfileFields(user.uid, { onboarded: true });
      setScreen('onboard_success');
      setTimeout(() => setScreen('onboard_start'), 3000);
    })();
  }, [screen, user]);

  /* -------------------------------- Dashboard -------------------------------- */
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    if (screen !== 'dashboard') return;
    const unsub = subscribePosts(setPosts);
    return unsub;
  }, [screen]);

  const showHeader = screen !== 'dashboard' || dashboardView === 'main';

  return (
    <div className="relative w-full h-screen bg-[var(--bg-page)] overflow-hidden flex flex-col items-center justify-center font-sans select-none transition-colors duration-300">
      <style>{`
        @keyframes gridDraw {
          0% { mask-position: 0% -100%; }
          100% { mask-position: 0% 200%; }
        }
      `}</style>

      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-100"
        style={{
          maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.3) 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.3) 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
            maskImage: 'linear-gradient(135deg, transparent 35%, rgba(0,0,0,1) 50%, transparent 65%)',
            WebkitMaskImage: 'linear-gradient(135deg, transparent 35%, rgba(0,0,0,1) 50%, transparent 65%)',
            maskSize: '300% 300%',
            WebkitMaskSize: '300% 300%',
            animation: 'gridDraw 8s linear infinite',
          }}
        />
      </div>

      {/* Top Left Header & Navigation Menu */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 left-8 z-50 flex flex-col items-start gap-5"
          >
            <h1 className="text-[32px] font-bold tracking-tighter text-[var(--text-85)]">cherrylabs.inc</h1>

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-12 h-12 rounded-full flex flex-col items-center justify-center gap-[5px] bg-[var(--surface-30)] backdrop-blur-xl border border-[var(--border-60)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-[var(--surface-50)] transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span
                  className="w-[18px] h-[2px] bg-[var(--text-70)] rounded-full z-10 transition-transform duration-300"
                  style={{ transform: isMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }}
                />
                <span
                  className="w-[18px] h-[2px] bg-[var(--text-70)] rounded-full z-10 transition-opacity duration-300"
                  style={{ opacity: isMenuOpen ? 0 : 1 }}
                />
                <span
                  className="w-[18px] h-[2px] bg-[var(--text-70)] rounded-full z-10 transition-transform duration-300"
                  style={{ transform: isMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }}
                />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[60px] left-0 w-52 bg-[var(--surface-40)] backdrop-blur-2xl border border-[var(--border-70)] shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-[20px] overflow-hidden flex flex-col p-1.5 z-50"
                  >
                    {isAdmin && (
                      <button
                        onClick={() => { setDashboardView('admin'); setIsMenuOpen(false); }}
                        className="text-left px-4 py-2.5 text-sm font-extrabold text-pink-600 hover:bg-[var(--surface-60)] rounded-xl transition-all"
                      >
                        Admin Panel
                      </button>
                    )}
                    {['Membership', 'Privacy and policy', 'Help'].map((item) => (
                      <button
                        key={item}
                        onClick={() => { setIsMenuOpen(false); showToast(`${item} is coming soon`); }}
                        className="text-left px-4 py-2.5 text-sm font-semibold text-[var(--text-80)] hover:bg-[var(--surface-60)] hover:text-[var(--text-100)] rounded-xl transition-all"
                      >
                        {item}
                      </button>
                    ))}
                    {user && (
                      <button
                        onClick={() => { setIsMenuOpen(false); logout(); }}
                        className="text-left px-4 py-2.5 text-sm font-semibold text-[var(--text-60)] hover:bg-[var(--surface-60)] hover:text-[var(--text-100)] rounded-xl transition-all border-t border-black/5 mt-1 pt-2.5"
                      >
                        Sign out
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right Theme Toggle */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 right-8 z-50"
          >
            <ThemeToggleButton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Flow Content Area */}
      <AnimatePresence mode="wait">
        {screen === 'loading' && <MiniLoader key="loading" />}

        {screen === 'signin' && <SignInScreen key="signin" />}

        {screen === 'banned' && (
          <motion.div
            key="banned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-20 flex flex-col items-center justify-center h-[50vh] px-8 text-center gap-4"
          >
            <h2 className="text-2xl font-black text-[var(--text-90)]">Access restricted</h2>
            <p className="text-sm font-semibold text-[var(--text-60)] max-w-sm">
              Your posting privileges have been restricted by Cherry Labs. Contact support for details.
            </p>
            <button onClick={() => logout()} className="mt-2 px-6 py-3 bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-full font-bold text-sm">
              Sign out
            </button>
          </motion.div>
        )}

        {/* READING VIEW */}
        {screen === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-20 w-full max-w-2xl h-[65vh] flex flex-col mt-4"
          >
            <div
              ref={scrollContainerRef}
              onScroll={handleContainerScroll}
              className="w-full h-full overflow-y-auto relative z-20 px-8 pb-[60vh] pt-[36%] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="flex flex-col space-y-3">
                {benefitParagraphs.map((item, idx) => {
                  const targetFraction = idx / Math.max(1, benefitParagraphs.length - 1);
                  const dist = Math.abs(scrollProgress - targetFraction);
                  const isHighlighted = dist < 0.16;
                  const isFaded = dist > 0.45;

                  return (
                    <div
                      key={item.id}
                      style={{
                        transform: `scale(${isHighlighted ? 1 : isFaded ? 0.9 : 0.96})`,
                        opacity: isFaded ? 0.35 : 1,
                        backgroundColor: isHighlighted ? 'rgba(245, 222, 179, 0.85)' : 'transparent',
                        transition: 'background-color 0.25s ease, transform 0.25s ease, opacity 0.25s ease',
                      }}
                      className="p-3 rounded-xl origin-center mb-4 will-change-transform"
                    >
                      {idx === 0 ? (
                        <p className="text-sm font-bold text-[var(--text-90)] mb-1">{item.title}</p>
                      ) : (
                        <h2 className="text-sm font-extrabold text-[var(--text-90)] mb-1">{item.title}</h2>
                      )}
                      <p className="text-xs font-bold text-[var(--text-80)] leading-relaxed">{item.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {showScrollDownBtn && !hasReachedBottom && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsFastForwarding(true)}
                  className="fixed bottom-12 right-12 z-50 w-14 h-14 bg-[var(--surface-50)] backdrop-blur-2xl border border-[var(--border-70)] shadow-[0_8px_32px_rgba(255,255,255,0.4)] rounded-full flex items-center justify-center text-[var(--text-80)] hover:bg-[var(--surface-70)] transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronDown strokeWidth={2.5} size={28} />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hasReachedBottom && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  className="absolute -bottom-16 w-full flex justify-center py-6 z-40 pointer-events-none"
                >
                  <button
                    onClick={() => setScreen('onboard_name')}
                    className="pointer-events-auto px-10 py-5 bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] shadow-[0_16px_40px_rgba(255,255,255,0.4)] rounded-3xl text-[var(--text-100)] font-extrabold text-[15px] hover:bg-[var(--surface-65)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 active:scale-95"
                  >
                    Yes, I want to become a member
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ONBOARDING 1: NAME */}
        {screen === 'onboard_name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className="relative z-20 flex flex-col items-center gap-6 mt-12"
          >
            <h2 className="text-[22px] font-bold text-[var(--text-85)] tracking-tight">What is your name?</h2>
            <div className="group relative flex items-center bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] rounded-full p-2 hover:bg-[var(--invert-bg)] focus-within:bg-[var(--invert-bg)] transition-colors duration-150 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
              <input
                autoFocus
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userName.trim() && user) {
                    updateProfileFields(user.uid, { name: userName.trim() });
                    setScreen('onboard_gender');
                  }
                }}
                placeholder="Enter your full name"
                className="bg-transparent outline-none text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] px-5 py-3 w-72 placeholder:text-[var(--text-40)] group-hover:placeholder:text-white/40 group-focus-within:placeholder:text-white/40 font-semibold transition-colors duration-150"
              />
              <button
                onClick={() => {
                  if (userName.trim() && user) {
                    updateProfileFields(user.uid, { name: userName.trim() });
                    setScreen('onboard_gender');
                  }
                }}
                className="w-12 h-12 rounded-full bg-[var(--surface-60)] flex items-center justify-center group-hover:bg-[var(--surface-20)] group-focus-within:bg-[var(--surface-20)] text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ONBOARDING 2: GENDER */}
        {screen === 'onboard_gender' && (
          <motion.div
            key="gender"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className="relative z-20 flex flex-col items-center gap-6 mt-12"
          >
            <h2 className="text-[22px] font-bold text-[var(--text-85)] tracking-tight mb-2">What gender are you?</h2>
            <div className="flex flex-col gap-3">
              {['Male', 'Female', 'Bisexual', 'Rather not to say'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => {
                    setUserGender(gender);
                    if (user) updateProfileFields(user.uid, { gender });
                    setScreen('onboard_phone');
                  }}
                  className="w-72 py-4 bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] rounded-2xl text-[var(--text-100)] font-bold hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-colors duration-150 shadow-[0_8px_24px_rgba(0,0,0,0.05)] active:scale-95"
                >
                  {gender}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ONBOARDING 3: PHONE */}
        {screen === 'onboard_phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className="relative z-20 flex flex-col items-center gap-6 mt-12"
          >
            <h2 className="text-[22px] font-bold text-[var(--text-85)] tracking-tight">Enter your phone number</h2>

            <div className="relative">
              <div className="group relative flex items-center bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] rounded-full p-2 hover:bg-[var(--invert-bg)] focus-within:bg-[var(--invert-bg)] transition-colors duration-150 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-3 rounded-full text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] font-bold border-r border-[var(--border-black-10)] group-hover:border-[var(--border-20)] group-focus-within:border-[var(--border-20)] transition-colors duration-150"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-extrabold">{selectedCountry.code}</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <input
                  autoFocus
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && phoneNumber.trim() && user) {
                      updateProfileFields(user.uid, {
                        countryCode: selectedCountry.code,
                        countryName: selectedCountry.name,
                        countryFlag: selectedCountry.flag,
                        phoneNumber: phoneNumber.trim(),
                      });
                      setScreen('onboard_nationality');
                    }
                  }}
                  placeholder="Phone number"
                  className="bg-transparent outline-none text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] px-4 py-3 w-48 placeholder:text-[var(--text-40)] group-hover:placeholder:text-white/40 group-focus-within:placeholder:text-white/40 font-semibold transition-colors duration-150"
                />

                <button
                  onClick={() => {
                    if (phoneNumber.trim() && user) {
                      updateProfileFields(user.uid, {
                        countryCode: selectedCountry.code,
                        countryName: selectedCountry.name,
                        countryFlag: selectedCountry.flag,
                        phoneNumber: phoneNumber.trim(),
                      });
                      setScreen('onboard_nationality');
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-[var(--surface-60)] flex items-center justify-center group-hover:bg-[var(--surface-20)] group-focus-within:bg-[var(--surface-20)] text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] transition-all shrink-0 hover:scale-105 active:scale-95"
                >
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              </div>

              <AnimatePresence>
                {isCountryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[70px] left-0 w-80 bg-black text-white border border-white/20 rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.5)] p-4 z-50 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 bg-[var(--surface-10)] px-3.5 py-2.5 rounded-2xl border border-[var(--border-15)]">
                      <Search size={16} className="text-white/50" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country or code..."
                        className="bg-transparent outline-none text-[var(--invert-text)] text-xs w-full placeholder:text-white/40 font-medium"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto flex flex-col gap-1 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--surface-20)] [&::-webkit-scrollbar-thumb]:rounded-full">
                      {filteredCountries.map((c) => {
                        const isSelected = selectedCountry.code === c.code && selectedCountry.name === c.name;
                        return (
                          <button
                            key={c.name}
                            onClick={() => {
                              setSelectedCountry(c);
                              setIsCountryDropdownOpen(false);
                              setCountrySearch('');
                            }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${
                              isSelected ? 'bg-[var(--surface-25)] text-[var(--invert-text)] font-bold' : 'hover:bg-[var(--surface-10)] text-white/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{c.flag}</span>
                              <span className="text-xs font-semibold">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono opacity-60">{c.code}</span>
                              {isSelected && <Check size={14} className="text-green-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ONBOARDING 4: NATIONALITY */}
        {screen === 'onboard_nationality' && (
          <motion.div
            key="nat"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className="relative z-20 flex flex-col items-center gap-6 mt-12"
          >
            <h2 className="text-[22px] font-bold text-[var(--text-85)] tracking-tight">Are you a Tanzanian?</h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (user) updateProfileFields(user.uid, { isTanzanian: true });
                  setScreen('onboard_region');
                }}
                className="w-32 py-4 bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] rounded-2xl text-[var(--text-100)] font-bold hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-colors duration-150 shadow-[0_8px_24px_rgba(0,0,0,0.05)] active:scale-95"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  if (user) updateProfileFields(user.uid, { isTanzanian: false, region: '' });
                  setScreen('onboard_saving');
                }}
                className="w-32 py-4 bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] rounded-2xl text-[var(--text-100)] font-bold hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-colors duration-150 shadow-[0_8px_24px_rgba(0,0,0,0.05)] active:scale-95"
              >
                No
              </button>
            </div>
          </motion.div>
        )}

        {/* ONBOARDING 5: REGION */}
        {screen === 'onboard_region' && (
          <motion.div
            key="region"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className="relative z-20 flex flex-col items-center gap-6 mt-12"
          >
            <h2 className="text-[22px] font-bold text-[var(--text-85)] tracking-tight">Place of residency</h2>

            <div className="relative">
              <div className="group relative flex items-center bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-70)] rounded-full p-2 hover:bg-[var(--invert-bg)] focus-within:bg-[var(--invert-bg)] transition-colors duration-150 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                <button
                  type="button"
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className="flex items-center justify-between px-5 py-3 w-72 text-left rounded-full text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] font-bold transition-colors duration-150"
                >
                  <span className={`text-sm ${selectedRegion ? 'font-bold' : 'opacity-40'}`}>
                    {selectedRegion || 'Select a region...'}
                  </span>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    if (selectedRegion && user) {
                      updateProfileFields(user.uid, { region: selectedRegion });
                      setScreen('onboard_saving');
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-[var(--surface-60)] flex items-center justify-center group-hover:bg-[var(--surface-20)] group-focus-within:bg-[var(--surface-20)] text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] transition-all shrink-0 hover:scale-105 active:scale-95 mr-2"
                >
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              </div>

              <AnimatePresence>
                {isRegionDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[70px] left-0 w-80 bg-black text-white border border-white/20 rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.5)] p-4 z-50 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 bg-[var(--surface-10)] px-3.5 py-2.5 rounded-2xl border border-[var(--border-15)]">
                      <Search size={16} className="text-white/50" />
                      <input
                        type="text"
                        value={regionSearch}
                        onChange={(e) => setRegionSearch(e.target.value)}
                        placeholder="Search Tanzanian region..."
                        className="bg-transparent outline-none text-[var(--invert-text)] text-xs w-full placeholder:text-white/40 font-medium"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto flex flex-col gap-1 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--surface-20)] [&::-webkit-scrollbar-thumb]:rounded-full">
                      {filteredRegions.map((region) => {
                        const isSelected = selectedRegion === region;
                        return (
                          <button
                            key={region}
                            onClick={() => {
                              setSelectedRegion(region);
                              setIsRegionDropdownOpen(false);
                              setRegionSearch('');
                            }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${
                              isSelected ? 'bg-[var(--surface-25)] text-[var(--invert-text)] font-bold' : 'hover:bg-[var(--surface-10)] text-white/80'
                            }`}
                          >
                            <span className="text-xs font-semibold">{region}</span>
                            {isSelected && <Check size={14} className="text-green-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {screen === 'onboard_saving' && <MiniLoader key="saving" />}

        {screen === 'onboard_success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.6 }}
            className="relative z-20 flex items-center justify-center h-[50vh] px-8 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-100)] tracking-tight max-w-md leading-tight">
              You are now an official member of cherrylabs.inc.
            </h2>
          </motion.div>
        )}

        {screen === 'onboard_start' && (
          <motion.div
            key="startbtn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="relative z-20 flex flex-col items-center justify-center h-[50vh]"
          >
            <button
              onClick={() => setScreen('dashboard')}
              className="px-14 py-5 bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-full font-extrabold text-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
            >
              Start
            </button>
          </motion.div>
        )}

        {/* DASHBOARD */}
        {screen === 'dashboard' && profile && user && (
          <>
            {dashboardView === 'main' && (
              <DashboardMain key="dash_main" posts={posts} onNavigate={(v) => setDashboardView(v)} />
            )}
            {dashboardView === 'community' && (
              <CommunityView
                uid={user.uid}
                userName={profile.name}
                banned={profile.banned}
                onBack={() => setDashboardView('main')}
              />
            )}
            {dashboardView === 'suggest' && (
              <SuggestView uid={user.uid} userName={profile.name} onBack={() => setDashboardView('main')} />
            )}
            {dashboardView === 'profile' && (
              <ProfileView profile={profile} onBack={() => setDashboardView('main')} />
            )}
            {dashboardView === 'employee' && (
              <EmployeeView profile={profile} onBack={() => setDashboardView('main')} />
            )}
            {dashboardView === 'news' && (
              <NewsView posts={posts} onBack={() => setDashboardView('main')} />
            )}
            {dashboardView === 'admin' && isAdmin && (
              <AdminPanel onBack={() => setDashboardView('main')} />
            )}
          </>
        )}
      </AnimatePresence>

      {dashboardView === 'main' && (
        <div
          className="absolute bottom-[-120px] left-0 w-full h-[400px] flex justify-center items-end z-10 pointer-events-none"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        >
          <div className="relative w-[1200px] h-full flex justify-center">
            <div className="absolute w-[450px] h-[320px] rounded-[140px] opacity-80 blur-[80px]" style={{ background: '#FF007F', bottom: '20px', left: '5%', transform: 'rotate(-5deg)' }} />
            <div className="absolute w-[500px] h-[300px] rounded-[160px] opacity-70 blur-[90px]" style={{ background: '#F4C2C2', bottom: '10px', left: '25%', transform: 'rotate(2deg)' }} />
            <div className="absolute w-[480px] h-[340px] rounded-[150px] opacity-75 blur-[85px]" style={{ background: '#8F00FF', bottom: '30px', left: '45%', transform: 'rotate(-3deg)' }} />
            <div className="absolute w-[520px] h-[280px] rounded-[130px] opacity-65 blur-[100px]" style={{ background: '#00FF00', bottom: '15px', left: '65%', transform: 'rotate(8deg)' }} />
            <div className="absolute w-[380px] h-[250px] rounded-[120px] opacity-90 blur-[60px]" style={{ background: 'linear-gradient(135deg, #FF1493, #F4C2C2)', bottom: '40px', left: '15%' }} />
            <div className="absolute w-[420px] h-[260px] rounded-[120px] opacity-80 blur-[70px]" style={{ background: 'linear-gradient(135deg, #8A2BE2, #32CD32)', bottom: '35px', right: '15%' }} />
          </div>
        </div>
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
