import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateTask, deleteTask } from '../../store/slices/boardSlice';
import { closeTaskModal } from '../../store/slices/uiSlice';
import { Modal, Button, Avatar } from '../Common';
import { api } from '../../services/api';
import { Task, Comment } from '../../types';
import toast from 'react-hot-toast';
import {
  Calendar, Users, MessageSquare, Trash2, Flag,
  Send, CheckCircle2, AlertCircle, AlertTriangle,
  Zap, FileText, UserPlus, X,
} from 'lucide-react';

/* ── Priority config ───────────────────────────────────── */
const priorityOptions = [
  { value: 'low',    label: 'Low',    icon: CheckCircle2,  bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-400' },
  { value: 'medium', label: 'Medium', icon: AlertCircle,   bar: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 border-blue-200',           ring: 'ring-blue-400'    },
  { value: 'high',   label: 'High',   icon: AlertTriangle, bar: 'bg-orange-500',  pill: 'bg-orange-50 text-orange-700 border-orange-200',      ring: 'ring-orange-400'  },
  { value: 'urgent', label: 'Urgent', icon: Zap,           bar: 'bg-red-500',     pill: 'bg-red-50 text-red-700 border-red-200',               ring: 'ring-red-400'     },
];

export const TaskModal: React.FC = () => {
  const dispatch       = useAppDispatch();
  const { taskModalOpen, selectedTask } = useAppSelector((s) => s.ui);
  const currentBoard   = useAppSelector((s) => s.boards.currentBoard);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState('medium');
  const [dueDate,     setDueDate]     = useState('');
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [newComment,  setNewComment]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      setPriority(selectedTask.priority);
      setDueDate(selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '');
      fetchTaskDetails();
    }
  }, [selectedTask]);

  const fetchTaskDetails = async () => {
    if (!selectedTask) return;
    try {
      const task = await api.getTask(selectedTask.id);
      setComments(task.comments || []);
    } catch { /* silent */ }
  };

  const handleClose = () => dispatch(closeTaskModal());

  const handleSave = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await dispatch(updateTask({
        id: selectedTask.id,
        data: { title: title.trim(), description: description.trim() || null, priority, dueDate: dueDate || null },
      })).unwrap();
      toast.success('Task updated');
    } catch { toast.error('Failed to update task'); }
    finally   { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedTask || !confirm('Delete this task?')) return;
    try {
      await dispatch(deleteTask({ id: selectedTask.id, listId: selectedTask.listId })).unwrap();
      toast.success('Task deleted');
      handleClose();
    } catch { toast.error('Failed to delete task'); }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    setIsLoading(true);
    try {
      const comment = await api.addComment(selectedTask.id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
    } catch { toast.error('Failed to add comment'); }
    finally   { setIsLoading(false); }
  };

  const handleAssign = async (userId: string) => {
    if (!selectedTask) return;
    try {
      await api.assignTask(selectedTask.id, userId);
      toast.success('User assigned');
      fetchTaskDetails();
    } catch { toast.error('Failed to assign user'); }
  };

  if (!selectedTask) return null;

  const currentPriority = priorityOptions.find((p) => p.value === priority) ?? priorityOptions[1];
  const PriorityIcon    = currentPriority.icon;

  const dueDateObj   = dueDate ? new Date(dueDate) : null;
  const today        = new Date(); today.setHours(0,0,0,0);
  const dueDiffDays  = dueDateObj ? Math.ceil((dueDateObj.getTime() - today.getTime()) / 86400000) : null;
  const dueDateColor = dueDiffDays === null ? '' : dueDiffDays < 0 ? 'text-red-600' : dueDiffDays <= 1 ? 'text-orange-600' : 'text-gray-600';

  return (
    <Modal isOpen={taskModalOpen} onClose={handleClose} size="lg">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .modal-fade-up { animation: fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="modal-fade-up flex flex-col max-h-[90vh] overflow-hidden rounded-2xl">

        {/* ── Priority color bar at very top ──────────────── */}
        <div className={`h-1 w-full ${currentPriority.bar} transition-colors duration-300`} />

        {/* ── Header ──────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold text-gray-900 w-full bg-transparent border-0
                         focus:outline-none placeholder-gray-300
                         border-b-2 border-transparent hover:border-gray-200 focus:border-primary-400
                         pb-1 transition-colors duration-200"
              placeholder="Task title"
            />
            {/* Breadcrumb badges */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <FileText className="w-3 h-3" />
                {selectedTask.list?.name ?? 'Unknown list'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${currentPriority.pill}`}>
                <PriorityIcon className="w-3 h-3" />
                {currentPriority.label}
              </span>
              {dueDateObj && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 ${dueDateColor}`}>
                  <Calendar className="w-3 h-3" />
                  {dueDiffDays === 0 ? 'Due today' : dueDiffDays === 1 ? 'Due tomorrow' : dueDiffDays! < 0 ? 'Overdue' : `Due ${dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </span>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-150 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">

            {/* Left: description + comments */}
            <div className="md:col-span-2 p-6 space-y-5">

              {/* Description */}
              <section>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  <FileText className="w-3.5 h-3.5" /> Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description…"
                  rows={4}
                  className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800
                             resize-none placeholder-gray-400 transition-all duration-200
                             focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 focus:bg-white"
                />
              </section>

              {/* Comments */}
              <section>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments
                  {comments.length > 0 && (
                    <span className="ml-1 px-1.5 py-px text-[10px] font-bold bg-gray-200 text-gray-600 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </label>

                {/* Composer */}
                <div className="relative mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment…"
                    rows={2}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                    className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30
                               focus:border-primary-400 focus:bg-white transition-all duration-200 pr-14"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isLoading}
                    className="absolute right-2.5 bottom-2.5 p-2 bg-primary-600 hover:bg-primary-700
                               disabled:opacity-40 disabled:cursor-not-allowed
                               text-white rounded-lg transition-all duration-150 active:scale-95 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 -mt-2.5 mb-4">⌘ + Enter to send</p>

                {/* Comment list */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2.5">
                        <MessageSquare className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-400 font-medium">No comments yet</p>
                    </div>
                  ) : comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar name={comment.user.name} size="sm" className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-gray-900">{comment.user.name}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: sidebar */}
            <div className="p-6 space-y-5 bg-gray-50/40">

              {/* Priority */}
              <section>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  <Flag className="w-3.5 h-3.5" /> Priority
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {priorityOptions.map((opt) => {
                    const Icon    = opt.icon;
                    const active  = priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPriority(opt.value)}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-150 ${
                          active
                            ? `${opt.pill} ring-2 ${opt.ring} ring-offset-1`
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Due Date */}
              <section>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400
                             transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                />
                {dueDate && (
                  <button
                    onClick={() => setDueDate('')}
                    className="mt-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    × Clear date
                  </button>
                )}
              </section>

              {/* Assignees */}
              <section>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  <Users className="w-3.5 h-3.5" /> Assignees
                  {(selectedTask.assignees?.length ?? 0) > 0 && (
                    <span className="ml-auto px-1.5 py-px text-[10px] font-bold bg-gray-200 text-gray-600 rounded-full">
                      {selectedTask.assignees!.length}
                    </span>
                  )}
                </label>

                {/* Current assignees */}
                {(selectedTask.assignees?.length ?? 0) > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {selectedTask.assignees!.map((a) => (
                      <div key={a.id} className="flex items-center gap-2.5 px-2.5 py-2 bg-white rounded-xl border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <Avatar name={a.user.name} size="sm" />
                        <span className="text-[13px] font-medium text-gray-700 truncate">{a.user.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-5 mb-3 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <UserPlus className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">No assignees</p>
                    </div>
                  </div>
                )}

                {/* Add member dropdown */}
                {currentBoard?.members && currentBoard.members.filter(
                  (m) => !selectedTask.assignees?.some((a) => a.userId === m.userId)
                ).length > 0 && (
                  <select
                    onChange={(e) => { if (e.target.value) { handleAssign(e.target.value); e.target.value = ''; } }}
                    defaultValue=""
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600
                               focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400
                               transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer"
                  >
                    <option value="" disabled>+ Assign a member…</option>
                    {currentBoard.members
                      .filter((m) => !selectedTask.assignees?.some((a) => a.userId === m.userId))
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>{m.user.name}</option>
                      ))}
                  </select>
                )}
              </section>

              {/* Actions */}
              <section className="pt-1 space-y-2">
                <Button
                  variant="primary"
                  className="w-full justify-center !bg-gradient-to-r !from-primary-600 !to-primary-500
                             hover:!from-primary-700 hover:!to-primary-600 !shadow-md !shadow-primary-500/20
                             hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !duration-200"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                             text-red-500 border border-red-100 bg-white hover:bg-red-50 hover:border-red-200
                             transition-all duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};