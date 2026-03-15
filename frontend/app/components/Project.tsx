"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X, Plus, Loader2, FileText, Maximize,
  Layers, Scissors, CheckCircle2, ArrowRight,
  Pentagon
} from 'lucide-react';
import axiosInstance from '../hooks/axiosInstance';

// --- Configuration & Types ---

export interface Project {
  id: string;
  name: string;
  task_type: string;
}

// Only icon/color mapping here
export const TOOL_ICON_CONFIG = {
  'document-parsing': {
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    activeRing: 'ring-blue-600/10',
    available: true
  },
  'object-detection': {
    icon: Maximize,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    activeRing: 'ring-purple-600/10',
    available: true
  },
  'document-classification': {
    icon: Layers,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    activeRing: 'ring-emerald-600/10',
    available: true
  },
  'image-segmentation': {
    icon: Pentagon,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    activeRing: 'ring-rose-600/10',
    available: false
  }
};

// --- Sub-Component: ProjectCard ---

export const ProjectCard = ({ project }: { project: Project }) => {
  const config = TOOL_ICON_CONFIG[project.task_type as keyof typeof TOOL_ICON_CONFIG] || TOOL_ICON_CONFIG['document-parsing'];
  const Icon = config.icon;

  return (
    <Link
      href={`/dashboard/${project.id}`}
      className="group relative flex items-center gap-4 overflow-hidden bg-white border border-slate-200 p-3 pr-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300"
    >
      {/* Subtle Internal Glow */}
      <div className={`absolute inset-0 ${config.bg} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />

      {/* Icon - Scaled down for compactness */}
      <div className={`relative z-10 p-2.5 rounded-xl ${config.bg} ${config.color} shrink-0 transition-transform group-hover:scale-105`}>
        <Icon size={18} />
      </div>

      {/* Text Content - Flex-1 takes up remaining space */}
      <div className="relative z-10 flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
          {project.name}
        </h2>
      </div>

      {/* Compact Arrow - Only moves 2px for subtlety */}
      <ArrowRight
        className="relative z-10 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
        size={16}
      />
    </Link>
  );
};

// --- Main Component: CreateProjectModal ---

interface CreateProjectModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  handleCreateProject: (project: { name: string; task_type: string }) => Promise<void>;
}

export default function CreateProjectModal({
  showModal,
  setShowModal,
  handleCreateProject
}: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', task_type: '' });
  const [taskTypes, setTaskTypes] = useState<{id: string, label: string}[]>([]);

  // Fetch task types from backend
  useEffect(() => {
    axiosInstance.get('/task-types/')
      .then(res => setTaskTypes(res.data.task_types || []));
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowModal]);

  if (!showModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.task_type || !newProject.name.trim()) return;

    setLoading(true);
    try {
      await handleCreateProject(newProject);
      setNewProject({ name: '', task_type: '' });
      setShowModal(false);
    } catch (error) {
      console.error("Creation failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => !loading && setShowModal(false)}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="relative flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Project</h2>
            <p className="text-slate-500 text-sm mt-1">Ready to start labeling? Pick your tool below.</p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-all hover:rotate-90"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="relative space-y-10">
          {/* Project Name */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Project Name
            </label>
            <input
              autoFocus
              className="w-full px-0 py-2 border-b-2 border-slate-100 bg-transparent focus:border-blue-600 transition-all outline-none text-2xl font-semibold placeholder:text-slate-200"
              placeholder="e.g., Summer Invoice Batch"
              value={newProject.name}
              onChange={e => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
          </div>
          {/* Tile Selection */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Labeling Interface
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taskTypes.map(({ id, label }) => {
                const config = TOOL_ICON_CONFIG[id as keyof typeof TOOL_ICON_CONFIG] || TOOL_ICON_CONFIG['document-parsing'];
                const Icon = config.icon;
                const isSelected = newProject.task_type === id;
                return (
                    <button
                    key={id}
                    type="button"
                    onClick={() => config.available && setNewProject({ ...newProject, task_type: id })}
                    disabled={!config.available}
                    className={`relative flex items-center gap-5 p-5 rounded-3xl border-2 text-left transition-all duration-300 ${
                      isSelected
                      ? `border-blue-600 bg-blue-50/30 ring-4 ${config.activeRing}`
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                    } ${!config.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    <div className={`shrink-0 p-4 rounded-2xl ${config.bg} ${config.color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="pr-4">
                      <h3 className={`font-bold text-base ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {label}
                      </h3>
                      {!config.available && (
                      <span className="block text-xs text-slate-400 mt-1 font-semibold">Coming soon</span>
                      )}
                    </div>
                    {isSelected && config.available && (
                      <div className="absolute top-4 right-4 text-blue-600 animate-in zoom-in">
                      <CheckCircle2 size={20} />
                      </div>
                    )}
                    </button>
                );
              })}
            </div>
          </div>
          {/* Action Bar */}
          <div className="flex items-center gap-4 pt-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-8 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newProject.task_type || !newProject.name.trim()}
              className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all disabled:opacity-20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}