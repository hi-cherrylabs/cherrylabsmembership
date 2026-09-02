import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleButton() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={(e) => toggle(e)}
      title="Toggle theme"
      aria-label="Toggle light and dark theme"
      className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--surface-25)] backdrop-blur-xl border border-[var(--border-60)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-[var(--surface-50)] transition-all duration-300 text-[var(--text-70)]"
    >
      {dark ? <Sun size={19} strokeWidth={2.25} /> : <Moon size={19} strokeWidth={2.25} />}
    </button>
  );
}
