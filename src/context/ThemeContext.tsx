import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode, MouseEvent } from 'react';

interface ThemeContextValue {
  dark: boolean;
  toggle: (e?: MouseEvent) => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light is the default theme, matching the site's current look.
  const [dark, setDark] = useState(false);

  // Load persisted preference on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cherry-theme');
      if (stored === 'light') setDark(false);
      else if (stored === 'dark') setDark(true);
    } catch {
      // localStorage unavailable - fall back to the default.
    }
  }, []);

  // Apply .dark class + persist whenever it changes.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('cherry-theme', dark ? 'dark' : 'light');
    } catch {
      // Best-effort persistence only.
    }
  }, [dark]);

  const toggle = useCallback((e?: MouseEvent) => {
    const doIt = () => setDark((v) => !v);
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    // No click event or no browser support - just flip instantly.
    if (!doc.startViewTransition || !e) {
      doIt();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => doIt());

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 900,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }, []);

  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('useTheme must be used within ThemeProvider');
  return c;
}
