import { useState } from 'react';
import { Trash2, Edit2, Pin, X, Check } from 'lucide-react';
import { createPost, updatePost, deletePost } from '../../lib/data';
import type { Post } from '../../types';

const emptyForm = { title: '', body: '', imageUrl: '', tag: '', badge: '' };

function PostForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  initial: typeof emptyForm;
  onCancel?: () => void;
  onSubmit: (data: typeof emptyForm) => void | Promise<void>;
  submitLabel: string;
  key?: string;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
        className="w-full px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-sm font-bold text-[var(--text-90)] placeholder:text-[var(--text-40)]"
      />
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        placeholder="Write-up shown in the What's New feed..."
        rows={3}
        className="w-full px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-sm font-medium text-[var(--text-80)] placeholder:text-[var(--text-40)] resize-none"
      />
      <input
        value={form.imageUrl}
        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        placeholder="Image URL (optional - required to appear in the carousel)"
        className="w-full px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-xs font-medium text-[var(--text-80)] placeholder:text-[var(--text-40)]"
      />
      <div className="flex gap-2">
        <input
          value={form.tag}
          onChange={(e) => setForm({ ...form, tag: e.target.value })}
          placeholder="Tag (e.g. GOVERNANCE)"
          className="flex-1 px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-xs font-medium text-[var(--text-80)] placeholder:text-[var(--text-40)]"
        />
        <input
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
          placeholder="Badge (e.g. Active)"
          className="flex-1 px-3 py-2.5 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-xs font-medium text-[var(--text-80)] placeholder:text-[var(--text-40)]"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !form.title.trim() || !form.body.trim()}
          className="flex-1 py-2.5 rounded-xl bg-[var(--invert-bg)] text-[var(--invert-text)] font-extrabold text-xs disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <Check size={14} /> {saving ? 'Saving\u2026' : submitLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface-70)] text-[var(--text-60)] font-bold text-xs flex items-center gap-1.5 border border-[var(--border-60)]"
          >
            <X size={14} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPosts({ posts }: { posts: Post[] }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="p-6 flex flex-col gap-4 max-w-2xl mx-auto">
      {showNewForm ? (
        <PostForm
          initial={emptyForm}
          submitLabel="Publish post"
          onCancel={() => setShowNewForm(false)}
          onSubmit={async (data) => {
            await createPost({ ...data, pinned: false });
            setShowNewForm(false);
          }}
        />
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full py-3.5 rounded-2xl bg-[var(--invert-bg)] text-[var(--invert-text)] font-extrabold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:opacity-90 transition-all"
        >
          + New Post
        </button>
      )}

      <div className="flex flex-col gap-2">
        {posts.length === 0 && (
          <p className="text-[var(--text-40)] text-sm text-center py-10 font-semibold">No posts yet.</p>
        )}
        {posts.map((post) =>
          editingId === post.id ? (
            <PostForm
              key={post.id}
              initial={{ title: post.title, body: post.body, imageUrl: post.imageUrl, tag: post.tag, badge: post.badge }}
              submitLabel="Save changes"
              onCancel={() => setEditingId(null)}
              onSubmit={async (data) => {
                await updatePost(post.id, data);
                setEditingId(null);
              }}
            />
          ) : (
            <div
              key={post.id}
              className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-extrabold text-[var(--text-90)]">{post.title}</p>
                {post.pinned && <Pin size={14} className="text-pink-500 shrink-0" />}
              </div>
              <p className="text-xs font-medium text-[var(--text-60)] line-clamp-2">{post.body}</p>
              {post.imageUrl && <p className="text-[10px] font-medium text-[var(--text-30)] truncate">{post.imageUrl}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => updatePost(post.id, { pinned: !post.pinned })}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-70)] border border-[var(--border-60)] transition-all flex items-center gap-1"
                >
                  <Pin size={12} /> {post.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => setEditingId(post.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-70)] border border-[var(--border-60)] transition-all flex items-center gap-1"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => { if (confirm('Delete this post?')) deletePost(post.id); }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] hover:bg-red-50 text-[var(--text-60)] hover:text-red-500 border border-[var(--border-60)] transition-all flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
