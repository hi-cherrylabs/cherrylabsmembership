import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { Post } from '../../types';

function relativeDate(post: Post): string {
  if (!post.createdAt) return 'Just now';
  const ms = Date.now() - post.createdAt.toMillis();
  const day = 24 * 60 * 60 * 1000;
  if (ms < day) return 'Today';
  if (ms < 2 * day) return 'Yesterday';
  if (ms < 7 * day) return 'This week';
  return post.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const DOT_COLORS = ['bg-pink-500', 'bg-violet-500', 'bg-[var(--text-40)]'];

export default function NewsView({ posts, onBack }: { posts: Post[]; onBack: () => void }) {
  const carouselPosts = posts.filter((p) => !!p.imageUrl);
  const loopPosts = carouselPosts.length > 0 ? [...carouselPosts, ...carouselPosts] : [];

  return (
    <motion.div
      key="dash_news"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col w-full h-full bg-[var(--surface-90)] backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black hover:text-white transition-all text-white shadow-lg"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="w-full h-[50vh] relative shrink-0 bg-[#050505] overflow-hidden">
        {loopPosts.length > 0 ? (
          <motion.div
            className="flex h-full"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ ease: 'linear', duration: 30, repeat: Infinity }}
            style={{ width: `${loopPosts.length * 100}vw` }}
          >
            {loopPosts.map((item, idx) => (
              <div key={idx} className="h-full w-screen shrink-0 relative flex items-center justify-center">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-12 left-8 md:left-12 right-8 md:right-12 z-10">
                  {item.tag && (
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/70 mb-2 block">{item.tag}</span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">{item.title}</h2>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white/40 text-sm font-semibold">No announcements yet</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 [&::-webkit-scrollbar]:hidden">
        <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-20">
          {posts.length === 0 && (
            <p className="text-center text-sm font-semibold text-[var(--text-40)] mt-10">Nothing posted yet — check back soon.</p>
          )}
          {posts.map((post, idx) => (
            <div key={post.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${DOT_COLORS[idx % DOT_COLORS.length]}`} />
                <span className="text-[11px] font-extrabold text-[var(--text-40)] uppercase tracking-widest">{relativeDate(post)}</span>
              </div>
              <h3 className="text-xl font-black text-[var(--text-100)]">{post.title}</h3>
              <p className="text-[15px] font-medium text-[var(--text-70)] leading-relaxed">{post.body}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
