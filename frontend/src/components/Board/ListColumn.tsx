import React, { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { List as ListType, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { useAppDispatch } from '../../store';
import { createTask, updateList, deleteList } from '../../store/slices/boardSlice';
import { openTaskModal } from '../../store/slices/uiSlice';
import { Button, Input } from '../Common';
import { Plus, MoreHorizontal, Trash2, Edit2, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface ListColumnProps {
  list: ListType;
}

export const ListColumn: React.FC<ListColumnProps> = ({ list }) => {
  const dispatch = useAppDispatch();
  const [isAddingTask,  setIsAddingTask]  = useState(false);
  const [newTaskTitle,  setNewTaskTitle]  = useState('');
  const [isEditing,     setIsEditing]     = useState(false);
  const [editedName,    setEditedName]    = useState(list.name);
  const [showMenu,      setShowMenu]      = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list', listId: list.id },
  });

  /* ─── Handlers — unchanged ────────────────────────────── */
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || isTaskLoading) return;
    setIsTaskLoading(true);
    try {
      await dispatch(createTask({ title: newTaskTitle.trim(), listId: list.id })).unwrap();
      setNewTaskTitle('');
      setIsAddingTask(false);
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editedName.trim() || editedName === list.name) {
      setIsEditing(false);
      setEditedName(list.name);
      return;
    }
    try {
      await dispatch(updateList({ id: list.id, data: { name: editedName.trim() } })).unwrap();
      setIsEditing(false);
      toast.success('List updated');
    } catch {
      toast.error('Failed to update list');
      setEditedName(list.name);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Are you sure you want to delete this list and all its tasks?')) return;
    try {
      await dispatch(deleteList(list.id)).unwrap();
      toast.success('List deleted');
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const handleTaskClick = (task: Task) => dispatch(openTaskModal(task));

  /* ─── Render ──────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .list-menu-enter { animation: slideIn 0.18s cubic-bezier(0.16,1,0.3,1) both; }
        .add-task-enter  { animation: fadeUp 0.2s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div
        className={`
          flex-shrink-0 w-full md:w-72 rounded-2xl flex flex-col md:max-h-full
          bg-[#f1f2f4] dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60
          transition-all duration-200 ease-out
          ${isOver
            ? 'ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-gray-950 shadow-lg shadow-primary-200/50 dark:shadow-primary-900/30 scale-[1.01]'
            : 'shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-black/20'
          }
        `}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
          {isEditing ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateName();
                if (e.key === 'Escape') { setIsEditing(false); setEditedName(list.name); }
              }}
              onBlur={handleUpdateName}
              autoFocus
              className="text-sm font-semibold py-1 flex-1 bg-white dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <>
              {/* Drag handle + title */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-[13px] font-bold text-gray-700 dark:text-gray-200 truncate">
                  {list.name}
                </h3>
                {/* Task count badge */}
                <span className={`
                  shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center
                  text-[11px] font-semibold rounded-full
                  ${list.tasks.length > 0
                    ? 'bg-gray-300/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    : 'bg-gray-200/60 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {list.tasks.length}
                </span>
              </div>

              {/* 3-dot menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-150"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="list-menu-enter absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-700 rounded-xl shadow-xl shadow-gray-200/80 dark:shadow-black/40 border border-gray-100 dark:border-gray-600 py-1 z-20">
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full px-3 py-2 text-left text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        Rename list
                      </button>
                      <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-600" />
                      <button
                        onClick={() => { handleDeleteList(); setShowMenu(false); }}
                        className="w-full px-3 py-2 text-left text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete list
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Tasks ───────────────────────────────────────── */}
        <div
          ref={setNodeRef}
          className={`
            flex-1 overflow-y-auto px-2 py-1 space-y-2 min-h-[60px]
            transition-colors duration-150
            ${isOver ? 'bg-primary-50/40 dark:bg-primary-950/20 rounded-xl mx-1' : ''}
          `}
        >
          <SortableContext
            items={list.tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {list.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </SortableContext>

          {/* Empty drop target hint */}
          {list.tasks.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-10 text-xs text-gray-400 dark:text-gray-500 rounded-xl border-2 border-dashed border-gray-200/80 dark:border-gray-700/80">
              No tasks yet
            </div>
          )}
          {isOver && list.tasks.length === 0 && (
            <div className="h-14 rounded-xl bg-primary-100/60 dark:bg-primary-950/30 border-2 border-dashed border-primary-300 dark:border-primary-800 flex items-center justify-center">
              <span className="text-xs text-primary-500 dark:text-primary-400 font-medium">Drop here</span>
            </div>
          )}
        </div>

        {/* ── Add Task ────────────────────────────────────── */}
        <div className="px-2 pb-2 pt-1">
          {isAddingTask ? (
            <div className="add-task-enter bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-black/20 overflow-hidden">
              <textarea
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (isTaskLoading) return;
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(); }
                  if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskTitle(''); }
                }}
                placeholder="What needs to be done?"
                className="w-full px-3 pt-3 pb-2 text-sm resize-none focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed dark:bg-gray-700"
                rows={2}
                autoFocus
                disabled={isTaskLoading}
              />
              <div className="flex items-center gap-2 px-3 pb-2.5 pt-1 border-t border-gray-100/80 dark:border-gray-600/80 bg-gray-50/60 dark:bg-gray-800">
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || isTaskLoading}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                             text-white text-[13px] font-semibold rounded-lg transition-all duration-150
                             shadow-sm hover:shadow active:scale-95"
                >
                  {isTaskLoading ? 'Adding…' : 'Add card'}
                </button>
                <button
                  onClick={() => { setIsAddingTask(false); setNewTaskTitle(''); }}
                  disabled={isTaskLoading}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 rounded-lg transition-all duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] font-medium text-gray-500 dark:text-gray-400
                         hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 rounded-xl
                         transition-all duration-150 group"
            >
              <Plus className="w-4 h-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
              Add a card
            </button>
          )}
        </div>
      </div>
    </>
  );
};