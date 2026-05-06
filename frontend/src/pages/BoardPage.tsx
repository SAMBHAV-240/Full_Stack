import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchBoard,
  clearCurrentBoard,
  moveTask,
  createList,
  optimisticMoveTask,
} from '../store/slices/boardSlice';
import { ListColumn, TaskCard, TaskModal, AddMemberModal } from '../components/Board';
import { Button, Loading, Input, Avatar, ThemeToggle } from '../components/Common';
import { Task } from '../types';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Users,
  Activity,
  Settings,
  Layers,
  X,
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { openAddMemberModal } from '../store/slices/uiSlice';

export const BoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentBoard, isLoading, error } = useAppSelector((state) => state.boards);
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const canManageMembers = (): boolean => {
    if (!user || !currentBoard) return false;
    if (currentBoard.ownerId === user.id) return true;
    const userMember = currentBoard.members.find((m) => m.userId === user.id);
    return userMember?.role === 'admin' || userMember?.role === 'owner';
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  useEffect(() => {
    if (id) dispatch(fetchBoard(id));
    setTimeout(() => setMounted(true), 50);
    return () => { dispatch(clearCurrentBoard()); };
  }, [id, dispatch]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    for (const list of currentBoard?.lists || []) {
      const task = list.tasks.find((t) => t.id === taskId);
      if (task) { setActiveTask(task); break; }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !currentBoard?.lists) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    let sourceListId = '';
    let sourceIndex = -1;
    for (const list of currentBoard.lists) {
      const index = list.tasks.findIndex((t) => t.id === activeId);
      if (index !== -1) { sourceListId = list.id; sourceIndex = index; break; }
    }
    if (!sourceListId) return;

    let targetListId = '';
    let targetIndex = 0;
    if (overId.startsWith('list-')) {
      targetListId = overId.replace('list-', '');
      const targetList = currentBoard.lists.find((l) => l.id === targetListId);
      targetIndex = targetList?.tasks.length || 0;
    } else {
      for (const list of currentBoard.lists) {
        const index = list.tasks.findIndex((t) => t.id === overId);
        if (index !== -1) { targetListId = list.id; targetIndex = index; break; }
      }
    }
    if (!targetListId || sourceListId === targetListId) return;
    dispatch(optimisticMoveTask({ taskId: activeId, sourceListId, targetListId, sourceIndex, targetIndex }));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !currentBoard?.lists) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    let targetListId = '';
    let targetIndex = 0;
    let sourceListId = '';

    if (overId.startsWith('list-')) {
      targetListId = overId.replace('list-', '');
      const targetList = currentBoard.lists.find((l) => l.id === targetListId);
      targetIndex = targetList?.tasks.findIndex((t) => t.id === activeId) ?? 0;
    } else {
      for (const list of currentBoard.lists) {
        const index = list.tasks.findIndex((t) => t.id === activeId);
        if (index !== -1) { targetListId = list.id; targetIndex = index; break; }
      }
    }
    if (!targetListId) return;
    for (const list of currentBoard.lists) {
      if (list.id !== targetListId) { sourceListId = activeTask?.listId || ''; break; }
    }
    if (!sourceListId) sourceListId = targetListId;

    try {
      await dispatch(moveTask({ id: activeId, sourceListId, targetListId, position: targetIndex })).unwrap();
    } catch (error) {
      toast.error('Failed to move task');
      if (id) dispatch(fetchBoard(id));
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim() || !id) return;
    try {
      await dispatch(createList({ name: newListName.trim(), boardId: id })).unwrap();
      setNewListName('');
      setIsAddingList(false);
      toast.success('List created');
    } catch (error) {
      toast.error('Failed to create list');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (isLoading) return <Loading fullScreen />;

  if (error || !currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Board not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'The board you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')}>Go back home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          30%  { transform: translateY(-22px) translateX(10px) scale(1.03); }
          60%  { transform: translateY(-10px) translateX(-8px) scale(0.98); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0) translateX(0); }
          40%  { transform: translateY(-30px) translateX(-12px); }
          70%  { transform: translateY(-14px) translateX(8px); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%  { border-radius: 40% 60% 55% 45% / 45% 55% 45% 55%; }
          50%  { border-radius: 55% 45% 65% 35% / 35% 65% 35% 65%; }
          75%  { border-radius: 30% 70% 40% 60% / 50% 40% 60% 50%; }
        }
        @keyframes particleRise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-90px) translateX(15px); opacity: 0; }
        }
        @keyframes spinCW  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes spinCCW { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes shimmerBeam {
          0%   { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
          8%   { opacity: 0.5; }
          92%  { opacity: 0.5; }
          100% { transform: translateX(250%) skewX(-12deg); opacity: 0; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.04; }
          50%       { opacity: 0.09; }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 2px 12px rgba(255,255,255,0.2); }
          50%       { box-shadow: 0 2px 24px rgba(255,255,255,0.45), 0 0 40px rgba(255,255,255,0.1); }
        }
        @keyframes dragPop {
          0%   { transform: rotate(0deg)   scale(1); }
          50%  { transform: rotate(2.5deg) scale(1.06); }
          100% { transform: rotate(2deg)   scale(1.05); }
        }

        /* Utility */
        .board-fade-up   { animation: fadeInUp  0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .board-fade-down { animation: fadeInDown 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .board-scale-in  { animation: scaleIn   0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .board-slide-down{ animation: slideDown 0.2s ease-out both; }
        .float-a  { animation: floatA  10s ease-in-out infinite; }
        .float-b  { animation: floatB  13s ease-in-out infinite; }
        .float-c  { animation: floatC  8s  ease-in-out infinite; }
        .morph    { animation: morphBlob 14s ease-in-out infinite; }
        .spin-cw  { animation: spinCW  30s linear infinite; }
        .spin-ccw { animation: spinCCW 24s linear infinite; }
        .logo-glow-white { animation: logoGlow 3s ease-in-out infinite; }
        .grid-pulse { animation: gridPulse 6s ease-in-out infinite; }
        .drag-pop { animation: dragPop 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }

        /* Board scroll */
        .board-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; }
        .board-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .board-scroll::-webkit-scrollbar-track { background: transparent; }
        .board-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .board-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }

        /* Animate list columns in */
        .animate-fade-in-up {
          animation: fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }
        .animate-scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* Particle dots */
        .bg-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        /* Header glass */
        .header-glass {
          background: rgba(0,0,0,0.28);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dark .header-glass {
          background: rgba(0,0,0,0.50);
        }

        /* Add list button */
        .add-list-btn {
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .add-list-btn:hover {
          background: rgba(255,255,255,0.28) !important;
          border-color: rgba(255,255,255,0.6) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .add-list-btn:active { transform: scale(0.97); }

        /* Header icon buttons */
        .hdr-btn {
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .hdr-btn:hover {
          background: rgba(255,255,255,0.22) !important;
          transform: scale(1.06);
        }
        .hdr-btn:active { transform: scale(0.95); }

        /* Back button */
        .back-btn {
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.18) !important;
          transform: translateX(-2px);
        }
        .back-btn:active { transform: scale(0.95); }
      `}</style>

      <div
        className="min-h-screen flex flex-col relative overflow-hidden dark:bg-gray-950"
        style={{ backgroundColor: currentBoard.background }}
      >
        {/* ══════════════════════════════════════
            BACKGROUND DECORATIONS
        ══════════════════════════════════════ */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">

          {/* Animated dot grid */}
          <div
            className="absolute inset-0 grid-pulse"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
              opacity: 0.05,
            }}
          />

          {/* Morphing blobs — tinted white/light */}
          <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-white/8 morph float-a blur-3xl" />
          <div className="absolute top-1/3 -right-52 w-[440px] h-[440px] bg-white/6 morph float-b blur-3xl" style={{ animationDelay: '5s' }} />
          <div className="absolute -bottom-40 left-1/3 w-[380px] h-[380px] bg-white/7 morph float-c blur-3xl" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-2/3 right-1/3 w-[260px] h-[260px] bg-white/5 morph float-a blur-2xl" style={{ animationDelay: '7s' }} />

          {/* Spinning rings */}
          <div className="absolute top-16 right-16 w-80 h-80 border border-white/10 rounded-full spin-cw" />
          <div className="absolute top-16 right-16 w-56 h-56 mt-12 mr-12 border border-white/8 rounded-full spin-ccw" />
          <div className="absolute bottom-24 left-12 w-64 h-64 border border-white/10 rounded-full spin-ccw" />
          <div className="absolute bottom-24 left-12 w-40 h-40 mt-12 ml-12 border border-white/6 rounded-full spin-cw" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/5 rounded-full spin-cw"
            style={{ animationDuration: '60s' }}
          />

          {/* Floating particles */}
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="bg-particle bg-white/25"
              style={{
                width:  `${2 + (i % 4) * 2}px`,
                height: `${2 + (i % 4) * 2}px`,
                bottom: `${4 + (i * 5.2) % 78}%`,
                left:   `${3 + (i * 5.7) % 94}%`,
                animation: `particleRise ${9 + (i % 5) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}

          {/* Subtle horizontal shimmer beam */}
          <div
            className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ animation: 'shimmerBeam 18s ease-in-out infinite', animationDelay: '4s' }}
          />

          {/* Corner radial glows */}
          <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-white/4 blur-3xl translate-x-1/4 translate-y-1/4" />
        </div>

        {/* ══════════════════════════════════════
            HEADER
        ══════════════════════════════════════ */}
        <header className="board-fade-down header-glass sticky top-0 z-40 border-b border-white/10 dark:border-white/5">
          <div className="px-3 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">

              {/* Left */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => navigate('/')}
                  className="back-btn p-2 sm:p-2.5 text-white/80 hover:text-white rounded-xl flex-shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="hidden sm:block p-2 bg-white/12 rounded-lg flex-shrink-0 logo-glow-white">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs">
                      {currentBoard.name}
                    </h1>
                    {currentBoard.description && (
                      <p className="hidden sm:block text-xs text-white/60 truncate max-w-xs">
                        {currentBoard.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ThemeToggle />

                {/* Members dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMembersDropdown(!showMembersDropdown)}
                    className="hdr-btn p-2 text-white/80 hover:text-white rounded-lg flex items-center gap-1 active:scale-95"
                    title="View board members"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">{currentBoard.members.length}</span>
                  </button>

                  {showMembersDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMembersDropdown(false)} />
                      <div className="board-slide-down absolute right-0 mt-2 w-64
                                      bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl
                                      border border-white/15 dark:border-white/10
                                      rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-white/10">
                          <h3 className="text-sm font-semibold text-white">
                            Board Members ({currentBoard.members.length})
                          </h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {currentBoard.members.map((member) => (
                            <div
                              key={member.id}
                              className="p-3 hover:bg-white/8 flex items-center gap-3 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                            >
                              <Avatar name={member.user.name} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{member.user.name}</p>
                                <p className="text-xs text-white/55 truncate">{member.user.email}</p>
                              </div>
                              <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full text-white/90 capitalize">
                                {member.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Add Member */}
                <button
                  onClick={() => dispatch(openAddMemberModal())}
                  className="hdr-btn p-2 text-white/80 hover:text-white rounded-lg active:scale-95"
                  title="Add member to board"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* User chip */}
                <div className="flex items-center gap-2 bg-white/12 hover:bg-white/18 transition-colors rounded-xl px-2 sm:px-3 py-2 cursor-default">
                  <Avatar name={user?.name || 'User'} size="sm" showStatus status="online" />
                  <span className="text-sm font-medium text-white hidden md:block">
                    {user?.name?.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════
            BOARD CONTENT
        ══════════════════════════════════════ */}
        <main className="relative z-10 flex-1 overflow-y-auto md:overflow-x-auto md:overflow-y-hidden p-4 sm:p-6 board-scroll">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:h-full">

              {/* Lists */}
              {currentBoard.lists?.map((list, index) => (
                <div
                  key={list.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <ListColumn list={list} />
                </div>
              ))}

              {/* Add List */}
              <div className="flex-shrink-0 w-full md:w-80 board-fade-up" style={{ animationDelay: `${(currentBoard.lists?.length || 0) * 55 + 60}ms` }}>
                {isAddingList ? (
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-4 space-y-3 shadow-xl border border-white/20 animate-scale-in">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Enter list name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') { setIsAddingList(false); setNewListName(''); }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddList} className="flex-1">
                        Add List
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setIsAddingList(false); setNewListName(''); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingList(true)}
                    className="add-list-btn w-full p-4 bg-white/15 backdrop-blur-sm rounded-2xl
                               text-white font-medium flex items-center justify-center gap-2.5
                               border-2 border-dashed border-white/30"
                  >
                    <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                    Add another list
                  </button>
                )}
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask && (
                <div className="drag-pop opacity-95 shadow-2xl">
                  <TaskCard task={activeTask} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </main>

        <TaskModal />
        <AddMemberModal />
      </div>
    </>
  );
};