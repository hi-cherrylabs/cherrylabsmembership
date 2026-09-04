import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Award,
  Terminal,
  Code2,
  Megaphone,
  Camera,
  Users,
} from 'lucide-react';
import { subscribeRoleContent } from '../../lib/data';
import type { RoleFieldContent } from '../../types';

interface RoleFieldPageProps {
  role: string;
  userName: string;
  onBack: () => void;
}

const ROLE_ICONS: Record<string, any> = {
  Developer: Code2,
  Influencer: Sparkles,
  Model: Camera,
  Advertiser: Megaphone,
  'Brand Ambassador': Award,
};

export default function RoleFieldPage({ role, userName, onBack }: RoleFieldPageProps) {
  const [content, setContent] = useState<RoleFieldContent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'tools'>('overview');

  useEffect(() => {
    const unsub = subscribeRoleContent(role, setContent);
    return () => unsub();
  }, [role]);

  const IconComp = ROLE_ICONS[role] || Briefcase;

  const bannerImg =
    content?.bannerImageUrl ||
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200';
  const videoUrl = content?.videoUrl || '';
  const title = content?.title || `${role} Portal`;
  const description =
    content?.description ||
    `Official internal workstation and collaboration space for authorized Cherry Labs ${role}s.`;
  const announcement =
    content?.announcement ||
    `Welcome aboard! Keep an eye on this space for live updates and new tasks.`;
  const resources = content?.resources || [];
  const tasks = content?.tasks || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="absolute inset-0 z-30 flex flex-col w-full h-full bg-[var(--surface-70)] backdrop-blur-3xl overflow-y-auto"
    >
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-50)] bg-[var(--surface-60)] backdrop-blur-2xl shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-all text-[var(--text-80)]"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <IconComp size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-90)] leading-tight">{title}</h2>
              <p className="text-[11px] font-bold text-[var(--text-50)]">Authorized Team Member: {userName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)]">
          {(['overview', 'tasks', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] shadow-sm'
                  : 'text-[var(--text-60)] hover:text-[var(--text-100)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col gap-8 pb-16">
        {/* BANNER / VIDEO MEDIA CARD */}
        <div className="relative rounded-3xl overflow-hidden border border-[var(--border-70)] bg-black shadow-xl group">
          {videoUrl ? (
            <div className="relative w-full aspect-video max-h-[360px] bg-black flex items-center justify-center">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com') ? (
                <iframe
                  src={videoUrl}
                  title="Field Video"
                  className="w-full h-full rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover rounded-2xl"
                  poster={bannerImg}
                />
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 sm:h-80 overflow-hidden">
              <img src={bannerImg} alt={role} className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider self-start mb-2 shadow-md">
                  Official Workstation
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
                <p className="text-xs sm:text-sm font-medium text-white/80 max-w-xl mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          )}
        </div>

        {/* ANNOUNCEMENT BANNER */}
        {announcement && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 border border-amber-500/20 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-black shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Latest Directive
              </span>
              <p className="text-xs font-bold text-[var(--text-90)]">{announcement}</p>
            </div>
          </div>
        )}

        {/* SPECIALIZED ROLE WORKSPACE CONTENT */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* ROLE SPECIFIC INTERACTIVE CONCEPT BOARDS */}
            {role === 'Developer' && (
              <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] flex flex-col gap-4">
                <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
                  <Terminal size={18} className="text-emerald-500" /> API Environment & Repositories
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-50)]">Main API Endpoint</span>
                    <span className="font-mono text-xs font-bold text-[var(--text-100)]">https://api.cherrylabs.inc/v1/dev</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-50)]">Build Pipeline Status</span>
                    <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Production Operational
                    </span>
                  </div>
                </div>
              </div>
            )}

            {role === 'Influencer' && (
              <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] flex flex-col gap-4">
                <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-500" /> Campaign & Referral Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Your Referral Code</span>
                    <span className="font-mono text-sm font-black text-pink-500">{userName.slice(0, 4).toUpperCase()}-VIP</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Tracked Conversions</span>
                    <span className="text-sm font-black text-[var(--text-100)]">24 Member Signups</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Commission Rate</span>
                    <span className="text-sm font-black text-emerald-500">15% Tier 1</span>
                  </div>
                </div>
              </div>
            )}

            {role === 'Model' && (
              <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] flex flex-col gap-4">
                <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
                  <Camera size={18} className="text-purple-500" /> Model Portfolio & Casting Calls
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Lookbook Spring', 'Brand Campaign', 'Runway Show', 'Studio Shoot'].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-center flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-extrabold text-[var(--text-90)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {role === 'Advertiser' && (
              <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] flex flex-col gap-4">
                <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
                  <Megaphone size={18} className="text-blue-500" /> Ad Placements & Campaign Performance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Active Campaigns</span>
                    <span className="text-sm font-black text-[var(--text-100)]">2 Placements Running</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Total Impressions</span>
                    <span className="text-sm font-black text-blue-500">14,200 Hits</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Average CTR</span>
                    <span className="text-sm font-black text-emerald-500">4.8% CTR</span>
                  </div>
                </div>
              </div>
            )}

            {role === 'Brand Ambassador' && (
              <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] flex flex-col gap-4">
                <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
                  <Users size={18} className="text-amber-500" /> Ambassador Community & Event Radar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Representing Region</span>
                    <span className="text-sm font-black text-[var(--text-100)]">East Africa Hub</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Upcoming Events</span>
                    <span className="text-sm font-black text-amber-500">3 Regional Meets</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-50)]">Ambassador Rank</span>
                    <span className="text-sm font-black text-purple-500">Gold Tier</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> Active Directives & Tasks ({tasks.length})
            </h3>
            {tasks.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] text-center text-xs font-bold text-[var(--text-50)]">
                No open tasks assigned at the moment.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--border-70)] flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-extrabold text-[var(--text-100)]">{task.title}</span>
                      <p className="text-xs font-medium text-[var(--text-60)]">{task.description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase shrink-0 ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : task.status === 'In Progress'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase text-[var(--text-90)] flex items-center gap-2">
              <Layers size={18} className="text-amber-500" /> Authorized Tools & External Resources ({resources.length})
            </h3>
            {resources.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] text-center text-xs font-bold text-[var(--text-50)]">
                No external resources attached yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--border-70)] hover:bg-[var(--surface-80)] transition-all flex items-center justify-between gap-3 shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[var(--surface-20)] text-[var(--text-80)] group-hover:bg-[var(--invert-bg)] group-hover:text-[var(--invert-text)] transition-colors">
                        <ExternalLink size={16} />
                      </div>
                      <span className="text-xs font-extrabold text-[var(--text-100)]">{res.label}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
