import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image, Video, FileText, Link, Plus, Trash2, Save, Check, RefreshCw } from 'lucide-react';
import { EMPLOYEE_ROLES } from '../../lib/constants';
import { subscribeRoleContent, saveRoleContent } from '../../lib/data';
import type { RoleFieldContent, RoleResource, RoleTask } from '../../types';

export default function AdminRoleContentManager() {
  const [selectedRole, setSelectedRole] = useState(EMPLOYEE_ROLES[0]);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [resources, setResources] = useState<RoleResource[]>([]);
  const [tasks, setTasks] = useState<RoleTask[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeRoleContent(selectedRole, (data) => {
      if (data) {
        setBannerImageUrl(data.bannerImageUrl || '');
        setVideoUrl(data.videoUrl || '');
        setTitle(data.title || `${selectedRole} Portal`);
        setDescription(data.description || `Official workspace for ${selectedRole} team members.`);
        setAnnouncement(data.announcement || '');
        setResources(data.resources || []);
        setTasks(data.tasks || []);
      } else {
        // Fallbacks
        setBannerImageUrl('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000');
        setVideoUrl('');
        setTitle(`${selectedRole} Portal`);
        setDescription(`Welcome to the Cherry Labs internal ${selectedRole} dashboard.`);
        setAnnouncement('Stay connected with the admin team for upcoming directives.');
        setResources([
          { id: '1', label: 'Guidelines Document', url: 'https://cherrylabs.inc/docs', type: 'document' },
        ]);
        setTasks([
          { id: '1', title: 'Onboarding Checklist', description: 'Complete your profile setup and review team protocols.', status: 'Open' },
        ]);
      }
    });
    return () => unsub();
  }, [selectedRole]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: RoleFieldContent = {
        role: selectedRole,
        bannerImageUrl,
        videoUrl,
        title,
        description,
        announcement,
        resources,
        tasks,
      };
      await saveRoleContent(selectedRole, payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const addResource = () => {
    setResources((prev) => [
      ...prev,
      { id: Date.now().toString(), label: 'New Resource', url: 'https://', type: 'link' },
    ]);
  };

  const removeResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: 'New Field Task', description: 'Task instructions...', status: 'Open' },
    ]);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-100)] tracking-tight">
            Role Field Page Customizer
          </h2>
          <p className="text-xs font-bold text-[var(--text-60)]">
            Configure header images, videos, announcements, guidelines and tools for each employment field.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[var(--invert-bg)] text-[var(--invert-text)] font-extrabold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : savedSuccess ? (
            <Check size={16} className="text-emerald-400" />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving...' : savedSuccess ? 'Saved Live!' : 'Save Role Page'}
        </button>
      </div>

      {/* ROLE SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        {EMPLOYEE_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all border shrink-0 ${
              selectedRole === role
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-[var(--surface-50)] text-[var(--text-70)] border-[var(--border-60)] hover:bg-[var(--surface-80)]'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* EDITOR FORM */}
      <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-[var(--text-70)] flex items-center gap-1.5">
              <Image size={14} className="text-amber-500" /> Banner Image URL
            </label>
            <input
              type="text"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-xs font-bold outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-[var(--text-70)] flex items-center gap-1.5">
              <Video size={14} className="text-amber-500" /> Header Video URL (MP4 / WebM / Embed)
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://assets.mixkit.co/videos/..."
              className="px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-xs font-bold outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-[var(--text-70)]">Page Heading Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-xs font-bold outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-[var(--text-70)]">Announcement Banner</label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="e.g. Next team briefing schedule..."
              className="px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-xs font-bold outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase text-[var(--text-70)]">Role Description & Directives</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-xs font-medium outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>

        {/* CUSTOM RESOURCES SECTION */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-50)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-[var(--text-90)] flex items-center gap-2">
              <Link size={16} className="text-amber-500" />
              Custom Tools & Resource Links ({resources.length})
            </h4>
            <button
              onClick={addResource}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={14} /> Add Link
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {resources.map((res, index) => (
              <div
                key={res.id}
                className="p-3.5 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col sm:flex-row items-center gap-3"
              >
                <input
                  type="text"
                  value={res.label}
                  onChange={(e) => {
                    const next = [...resources];
                    next[index].label = e.target.value;
                    setResources(next);
                  }}
                  placeholder="Link Title"
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-60)] border border-[var(--border-50)] text-xs font-bold text-[var(--text-100)] outline-none"
                />
                <input
                  type="text"
                  value={res.url}
                  onChange={(e) => {
                    const next = [...resources];
                    next[index].url = e.target.value;
                    setResources(next);
                  }}
                  placeholder="URL (https://...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-60)] border border-[var(--border-50)] text-xs font-mono font-bold text-[var(--text-100)] outline-none"
                />
                <button
                  onClick={() => removeResource(res.id)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CUSTOM TASKS SECTION */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-50)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-[var(--text-90)] flex items-center gap-2">
              <FileText size={16} className="text-amber-500" />
              Active Tasks & Directives ({tasks.length})
            </h4>
            <button
              onClick={addTask}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => {
                      const next = [...tasks];
                      next[index].title = e.target.value;
                      setTasks(next);
                    }}
                    placeholder="Task Heading"
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-60)] border border-[var(--border-50)] text-xs font-bold text-[var(--text-100)] outline-none"
                  />
                  <select
                    value={task.status}
                    onChange={(e) => {
                      const next = [...tasks];
                      next[index].status = e.target.value as any;
                      setTasks(next);
                    }}
                    className="px-3 py-2 rounded-xl bg-[var(--surface-60)] border border-[var(--border-50)] text-xs font-extrabold text-[var(--text-100)] outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={task.description}
                  onChange={(e) => {
                    const next = [...tasks];
                    next[index].description = e.target.value;
                    setTasks(next);
                  }}
                  placeholder="Task Description"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-60)] border border-[var(--border-50)] text-xs font-medium text-[var(--text-80)] outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
