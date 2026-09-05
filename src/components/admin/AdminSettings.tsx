import { useEffect, useState } from 'react';
import { subscribeBenefitParagraphs, saveBenefitParagraphs } from '../../lib/data';
import type { BenefitParagraph } from '../../lib/data';
import { ADMIN_EMAIL } from '../../lib/constants';

export default function AdminSettings() {
  const [paragraphs, setParagraphs] = useState<BenefitParagraph[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = subscribeBenefitParagraphs(setParagraphs);
    return unsub;
  }, []);

  const updateParagraph = (id: number, field: 'title' | 'content', value: string) => {
    setParagraphs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBenefitParagraphs(paragraphs);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <p className="text-xs font-bold text-[var(--text-50)] uppercase tracking-wider mb-1">System Account</p>
        <p className="text-sm font-extrabold text-[var(--text-90)]">Supreme Admin Authorized</p>
        <p className="text-xs font-medium text-[var(--text-40)] mt-1">Signing in with an authorized account unlocks management tools.</p>
      </div>

      <div>
        <p className="text-xs font-bold text-[var(--text-50)] uppercase tracking-wider mb-1">Membership Benefits Copy</p>
        <p className="text-xs font-medium text-[var(--text-40)] mb-3">Shown on the pre-signup "why join" scroll screen before someone becomes a member.</p>
        <div className="flex flex-col gap-3">
          {paragraphs.map((p) => (
            <div key={p.id} className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
              <input
                value={p.title}
                onChange={(e) => updateParagraph(p.id, 'title', e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-sm font-bold text-[var(--text-90)]"
              />
              <textarea
                value={p.content}
                onChange={(e) => updateParagraph(p.id, 'content', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-xs font-medium text-[var(--text-70)] resize-none"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || paragraphs.length === 0}
          className="mt-4 w-full py-3.5 rounded-2xl bg-[var(--invert-bg)] text-[var(--invert-text)] font-extrabold text-sm disabled:opacity-40 shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:opacity-90 transition-all"
        >
          {saving ? 'Saving\u2026' : saved ? 'Saved \u2713' : 'Save benefits copy'}
        </button>
      </div>
    </div>
  );
}
