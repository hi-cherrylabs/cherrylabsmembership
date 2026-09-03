import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  Users,
  MessageSquare,
  ShieldAlert,
  Briefcase,
  Newspaper,
  Settings,
  KeyRound,
} from 'lucide-react';
import {
  subscribeAllMembers,
  subscribeAllSuggestionThreads,
  subscribeApplications,
  subscribePosts,
  subscribeCommunityMessages,
} from '../../lib/data';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, SuggestionThread, Application, Post, CommunityMessage } from '../../types';
import AdminOverview from './AdminOverview';
import AdminMembers from './AdminMembers';
import AdminSuggestions from './AdminSuggestions';
import AdminChatModeration from './AdminChatModeration';
import AdminApplications from './AdminApplications';
import AdminPosts from './AdminPosts';
import AdminSettings from './AdminSettings';
import AdminManager from './AdminManager';

type Tab = 'overview' | 'members' | 'suggestions' | 'moderation' | 'applications' | 'posts' | 'settings' | 'admins';

const BASE_TABS: { id: Tab; label: string; desc: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', desc: 'Members, VIP passes & activity at a glance', icon: LayoutGrid },
  { id: 'members', label: 'Members', desc: 'Search, ban & manage VIP status', icon: Users },
  { id: 'suggestions', label: 'Suggestions', desc: 'Reply to member suggestion threads', icon: MessageSquare },
  { id: 'moderation', label: 'Chat Moderation', desc: 'Review & moderate the community chat', icon: ShieldAlert },
  { id: 'applications', label: 'Applications', desc: 'Review employee applications', icon: Briefcase },
  { id: 'posts', label: 'Posts', desc: 'Manage announcements & what\u2019s new', icon: Newspaper },
  { id: 'settings', label: 'Settings', desc: 'Admin account & benefits copy', icon: Settings },
];

const SUPER_ADMIN_TAB: { id: Tab; label: string; desc: string; icon: any } = {
  id: 'admins',
  label: 'Manage Admins',
  desc: 'Generate access tokens & manage admin privileges',
  icon: KeyRound,
};

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [threads, setThreads] = useState<SuggestionThread[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeAllMembers(setMembers),
      subscribeAllSuggestionThreads(setThreads),
      subscribeApplications(setApplications),
      subscribePosts(setPosts),
      subscribeCommunityMessages(setCommunityMessages),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const availableTabs = isSuperAdmin ? [...BASE_TABS, SUPER_ADMIN_TAB] : BASE_TABS;
  const unreadCount = threads.filter((t) => t.unreadByAdmin).length;
  const activeTabMeta = availableTabs.find((t) => t.id === activeTab);

  return (
    <motion.div
      key="dash_admin"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col w-full h-full bg-[var(--surface-70)] backdrop-blur-3xl"
    >
      <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border-50)] bg-[var(--surface-60)] backdrop-blur-2xl shrink-0">
        <button
          onClick={() => (activeTab ? setActiveTab(null) : onBack())}
          className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-all text-[var(--text-80)]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">
            {activeTabMeta ? activeTabMeta.label : 'Admin Panel'}
          </h2>
          {!activeTabMeta && <p className="text-[11px] font-bold text-[var(--text-50)]">cherrylabs.inc management</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait">
          {!activeTab ? (
            <motion.div
              key="admin_home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col w-full max-w-sm mx-auto gap-3 px-4 py-8"
            >
              {availableTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center justify-between p-4 bg-[var(--surface-25)] hover:bg-[var(--surface-55)] backdrop-blur-xl border border-[var(--border-50)] hover:border-[var(--border-80)] rounded-2xl transition-all duration-200 w-full text-left group shadow-[0_4px_16px_rgba(0,0,0,0.03)] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-60)] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-[var(--invert-bg)] group-hover:text-[var(--invert-text)] transition-all shrink-0 relative">
                      <t.icon className="text-[var(--text-100)] group-hover:text-[var(--invert-text)] transition-colors" size={22} strokeWidth={2.5} />
                      {t.id === 'suggestions' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[var(--invert-text)] text-[9px] font-bold flex items-center justify-center border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[var(--text-100)] font-extrabold text-[15px]">{t.label}</p>
                      <p className="text-[var(--text-50)] font-semibold text-xs">{t.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[var(--text-40)] group-hover:text-[var(--text-100)] group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="h-full p-4 sm:p-6"
            >
              {activeTab === 'overview' && <AdminOverview members={members} threads={threads} applications={applications} />}
              {activeTab === 'members' && <AdminMembers members={members} />}
              {activeTab === 'suggestions' && <AdminSuggestions threads={threads} />}
              {activeTab === 'moderation' && <AdminChatModeration messages={communityMessages} />}
              {activeTab === 'applications' && <AdminApplications applications={applications} />}
              {activeTab === 'posts' && <AdminPosts posts={posts} />}
              {activeTab === 'settings' && <AdminSettings />}
              {activeTab === 'admins' && isSuperAdmin && <AdminManager />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
