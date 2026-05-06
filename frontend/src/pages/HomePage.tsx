import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBoards } from '../store/slices/boardSlice';
import { openCreateBoardModal } from '../store/slices/uiSlice';
import { BoardCard, CreateBoardModal } from '../components/Board';
import { Button, Loading, ThemeToggle } from '../components/Common';
import { Avatar } from '../components/Common';
import {
  Plus, Search, LayoutGrid, Layers, LogOut,
  ChevronDown, Grid, List, TrendingUp, Users, Sparkles
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { boards, isLoading } = useAppSelector((state) => state.boards);
  const { user }              = useAppSelector((state) => state.auth);

  const [searchQuery,  setSearchQuery]  = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => {
    dispatch(fetchBoards());
    setTimeout(() => setMounted(true), 50);
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchBoards({ query: searchQuery }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const filteredBoards = searchQuery
    ? boards.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : boards;

  const totalLists   = boards.reduce((acc, b) => acc + (b._count?.lists   ?? 0), 0);
  const totalMembers = boards.reduce((acc, b) => acc + (b.members?.length ?? 0), 0);

  return (
    <>
      <style>{`
        /* ── Keyframes ─────────────────────────────────── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          from { background-position: -600px 0; }
          to   { background-position:  600px 0; }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.12); }
          50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          25%  { transform: translateY(-22px) translateX(10px) scale(1.03); }
          50%  { transform: translateY(-12px) translateX(-6px) scale(0.98); }
          75%  { transform: translateY(-28px) translateX(4px) scale(1.02); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%  { transform: translateY(-18px) translateX(-12px); }
          66%  { transform: translateY(-32px) translateX(8px); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%  { transform: translateY(-20px) rotate(8deg); }
        }
        @keyframes morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          20%  { border-radius: 40% 60% 55% 45% / 45% 55% 45% 55%; }
          40%  { border-radius: 55% 45% 65% 35% / 35% 65% 35% 65%; }
          60%  { border-radius: 30% 70% 40% 60% / 50% 40% 60% 50%; }
          80%  { border-radius: 45% 55% 50% 50% / 60% 40% 60% 40%; }
        }
        @keyframes particleDrift {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
        }
        @keyframes spinCW {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spinCCW {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
          50%       { box-shadow: 0 4px 28px rgba(99,102,241,0.65), 0 0 50px rgba(99,102,241,0.2); }
        }
        @keyframes gridLineFade {
          0%, 100% { opacity: 0.025; }
          50%       { opacity: 0.06; }
        }
        @keyframes beamSweep {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
        }

        /* ── Utility classes ────────────────────────────── */
        .fade-up      { animation: fadeInUp  0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-down    { animation: fadeInDown 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .slide-down   { animation: slideDown 0.2s ease-out both; }
        .pulse-ring   { animation: pulseRing 2.8s ease-in-out infinite; }
        .float-a      { animation: floatA 9s ease-in-out infinite; }
        .float-b      { animation: floatB 12s ease-in-out infinite; }
        .float-c      { animation: floatC 8s ease-in-out infinite; }
        .morph        { animation: morphBlob 14s ease-in-out infinite; }
        .spin-cw      { animation: spinCW  28s linear infinite; }
        .spin-ccw     { animation: spinCCW 22s linear infinite; }
        .logo-glow    { animation: logoGlow 3s ease-in-out infinite; }
        .grid-breathe { animation: gridLineFade 6s ease-in-out infinite; }

        .skeleton-shimmer {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
          background-size: 600px 100%;
          animation: shimmer 1.6s infinite;
        }
        .dark .skeleton-shimmer,
        .dark.skeleton-shimmer {
          background: linear-gradient(90deg, #1f2937 25%, #283244 50%, #1f2937 75%);
          background-size: 600px 100%;
          animation: shimmer 1.6s infinite;
        }

        /* ── Component transitions ──────────────────────── */
        .search-wrap { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
        .search-wrap:focus-within { transform: scale(1.015); }

        .new-board-btn {
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1) !important;
        }
        .new-board-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(99,102,241,0.4) !important;
        }
        .new-board-btn:active { transform: scale(0.97) !important; }

        .view-btn { transition: all 0.18s ease; }
        .view-btn:hover { transform: scale(1.1); }

        .user-btn { transition: all 0.2s ease; }
        .user-btn:hover { background: rgba(0,0,0,0.04); }
        .dark .user-btn:hover { background: rgba(255,255,255,0.06); }

        /* particle dots */
        .particle-dot {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>

      <div className="min-h-screen relative overflow-x-hidden
                      bg-[radial-gradient(ellipse_at_top_left,_#eef2ff_0%,_#f8fafc_40%,_#f0f4ff_100%)]
                      dark:bg-[radial-gradient(ellipse_at_top_left,_#1e1b4b_0%,_#0f172a_45%,_#0c1329_100%)]">

        {/* ══════════════════════════════════════════════════
            BACKGROUND LAYER  (light + dark)
        ══════════════════════════════════════════════════ */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">

          {/* — Animated dot grid — */}
          <div className="absolute inset-0 grid-breathe"
            style={{
              backgroundImage:  'radial-gradient(circle, #6366f1 1px, transparent 1px)',
              backgroundSize:   '36px 36px',
              opacity: 0.04,
            }}
          />
          {/* dark override */}
          <div className="absolute inset-0 hidden dark:block grid-breathe"
            style={{
              backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)',
              backgroundSize:  '36px 36px',
              opacity: 0.07,
            }}
          />

          {/* — Large morphing blobs (light) — */}
          <div className="dark:hidden">
            <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-indigo-200/40 morph float-a blur-3xl" />
            <div className="absolute top-1/3 -right-48 w-[420px] h-[420px] bg-purple-200/30 morph float-b blur-3xl" style={{ animationDelay: '5s' }} />
            <div className="absolute -bottom-32 left-1/4 w-[360px] h-[360px] bg-sky-200/35 morph float-c blur-3xl" style={{ animationDelay: '2.5s' }} />
            <div className="absolute top-2/3 right-1/4 w-[280px] h-[280px] bg-violet-200/25 morph float-a blur-2xl" style={{ animationDelay: '7s' }} />
          </div>

          {/* — Large morphing blobs (dark) — */}
          <div className="hidden dark:block">
            <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-indigo-600/15 morph float-a blur-3xl" />
            <div className="absolute top-1/3 -right-48 w-[420px] h-[420px] bg-purple-700/12 morph float-b blur-3xl" style={{ animationDelay: '5s' }} />
            <div className="absolute -bottom-32 left-1/4 w-[360px] h-[360px] bg-blue-700/12 morph float-c blur-3xl" style={{ animationDelay: '2.5s' }} />
            <div className="absolute top-2/3 right-1/4 w-[280px] h-[280px] bg-violet-600/10 morph float-a blur-2xl" style={{ animationDelay: '7s' }} />
          </div>

          {/* — Spinning rings (light) — */}
          <div className="dark:hidden">
            <div className="absolute top-24 right-24 w-72 h-72 border-2 border-indigo-300/20 rounded-full spin-cw" />
            <div className="absolute top-24 right-24 w-52 h-52 mt-10 mr-10 border border-purple-300/15 rounded-full spin-ccw" />
            <div className="absolute bottom-32 left-16 w-56 h-56 border-2 border-sky-300/20 rounded-full spin-ccw" />
            <div className="absolute bottom-32 left-16 w-36 h-36 mt-10 ml-10 border border-indigo-300/15 rounded-full spin-cw" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] border border-indigo-200/10 rounded-full spin-cw" style={{ animationDuration: '55s' }} />
          </div>

          {/* — Spinning rings (dark) — */}
          <div className="hidden dark:block">
            <div className="absolute top-24 right-24 w-72 h-72 border-2 border-indigo-500/15 rounded-full spin-cw" />
            <div className="absolute top-24 right-24 w-52 h-52 mt-10 mr-10 border border-purple-500/10 rounded-full spin-ccw" />
            <div className="absolute bottom-32 left-16 w-56 h-56 border-2 border-blue-500/15 rounded-full spin-ccw" />
            <div className="absolute bottom-32 left-16 w-36 h-36 mt-10 ml-10 border border-indigo-400/10 rounded-full spin-cw" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] border border-indigo-700/10 rounded-full spin-cw" style={{ animationDuration: '55s' }} />
          </div>

          {/* — Floating particle dots — */}
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`particle-dot ${i % 2 === 0
                ? 'bg-indigo-400/30 dark:bg-indigo-400/20'
                : 'bg-purple-400/25 dark:bg-purple-400/15'
              }`}
              style={{
                width:  `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                bottom: `${5 + (i * 5.8) % 70}%`,
                left:   `${3 + (i * 6.3) % 94}%`,
                animation: `particleDrift ${8 + (i % 5) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}

          {/* — Light-mode subtle beam sweep — */}
          <div className="dark:hidden absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            style={{ animation: 'beamSweep 14s ease-in-out infinite', animationDelay: '3s' }}
          />

          {/* — Corner glows — */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-indigo-300/20 dark:from-indigo-600/10 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-purple-300/20 dark:from-purple-600/10 to-transparent rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        {/* ══════════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════════ */}
        <header className="fade-down sticky top-0 z-40
                           bg-white/80 dark:bg-gray-900/80
                           backdrop-blur-xl
                           border-b border-gray-200/60 dark:border-gray-800/50
                           shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-gradient-to-br from-primary-600 to-primary-500 p-2 rounded-xl logo-glow
                              hover:scale-110 hover:rotate-6 transition-all duration-300 cursor-pointer">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight hidden sm:inline">
                TaskCollab
              </span>
            </div>

            {/* Search — desktop */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
              <div className="search-wrap relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-sm
                             bg-gray-50 dark:bg-gray-800/80
                             border border-gray-200 dark:border-gray-700
                             rounded-xl placeholder-gray-400 dark:placeholder-gray-500
                             text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500/25
                             focus:border-primary-400 focus:bg-white dark:focus:bg-gray-700
                             transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >×</button>
                )}
              </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">

              {/* View toggle */}
              <div className="hidden sm:flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg gap-0.5">
                {(['grid', 'list'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={`${mode} view`}
                    className={`view-btn p-1.5 rounded-md transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {mode === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <ThemeToggle />

              {/* New Board */}
              <Button
                onClick={() => dispatch(openCreateBoardModal())}
                className="new-board-btn hidden sm:flex items-center gap-1.5
                           !bg-gradient-to-r !from-primary-600 !to-primary-500
                           hover:!from-primary-700 hover:!to-primary-600
                           !shadow-md !shadow-primary-500/25
                           !text-sm !font-semibold !px-4 !rounded-xl"
              >
                <Plus className="w-4 h-4" />
                New Board
              </Button>
              <Button onClick={() => dispatch(openCreateBoardModal())} size="sm" className="sm:hidden">
                <Plus className="w-5 h-5" />
              </Button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="user-btn flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-xl transition-colors duration-200"
                >
                  <Avatar name={user?.name || 'User'} showStatus status="online" />
                  <span className="hidden sm:block text-sm font-medium text-gray-800 dark:text-gray-200">
                    {user?.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="slide-down absolute right-0 top-full mt-2 w-56
                                    bg-white dark:bg-gray-800 rounded-2xl
                                    shadow-xl shadow-gray-200/80 dark:shadow-black/40
                                    border border-gray-100/80 dark:border-gray-700/80
                                    py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400
                                   hover:bg-red-50/80 dark:hover:bg-red-950/30
                                   flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════
            MAIN
        ══════════════════════════════════════════════════ */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="md:hidden fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="search-wrap relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm
                           bg-white dark:bg-gray-800
                           border border-gray-200 dark:border-gray-700 rounded-xl
                           placeholder-gray-400 dark:placeholder-gray-500
                           text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500/25
                           focus:border-primary-400 dark:focus:border-primary-500
                           transition-all shadow-sm"
              />
            </div>
          </form>

          {/* Section heading */}
          <div className="flex items-center justify-between fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <LayoutGrid className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Your Boards</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {filteredBoards.length} {filteredBoards.length === 1 ? 'board' : 'boards'}
                  {searchQuery && <span className="text-primary-500 dark:text-primary-400"> · "{searchQuery}"</span>}
                </p>
              </div>
            </div>
          </div>

          {/* ── BOARDS GRID ─────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 fade-up shadow-sm"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="h-32 skeleton-shimmer dark:skeleton-shimmer" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 skeleton-shimmer rounded-full w-3/4" />
                    <div className="h-2.5 skeleton-shimmer rounded-full w-1/2" />
                    <div className="flex gap-1.5 pt-1">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-7 h-7 skeleton-shimmer rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : filteredBoards.length > 0 ? (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'flex flex-col gap-3'
            }>
              {filteredBoards.map((board, index) => (
                <div
                  key={board.id}
                  className="fade-up"
                  style={{ animationDelay: `${0.12 + index * 0.06}s` }}
                >
                  <BoardCard board={board} />
                </div>
              ))}

              {/* Create new board */}
              <button
                onClick={() => dispatch(openCreateBoardModal())}
                className={`pulse-ring rounded-2xl border-2 border-dashed
                            border-gray-200 dark:border-gray-700
                            hover:border-primary-400 dark:hover:border-primary-500
                            hover:bg-primary-50/40 dark:hover:bg-primary-950/20
                            bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm
                            transition-all duration-300
                            flex flex-col items-center justify-center gap-3
                            text-gray-400 dark:text-gray-500
                            hover:text-primary-600 dark:hover:text-primary-400
                            group hover:-translate-y-1 active:scale-95 fade-up
                            ${viewMode === 'list' ? 'py-5' : 'h-44'}`}
                style={{ animationDelay: `${0.12 + filteredBoards.length * 0.06}s` }}
              >
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700
                                group-hover:bg-primary-100 dark:group-hover:bg-primary-950
                                group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="text-sm font-semibold">Create new board</span>
              </button>
            </div>

          ) : (
            /* Empty state */
            <div className="fade-up text-center py-24">
              <div className="inline-flex items-center justify-center w-20 h-20
                              bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm
                              border border-gray-100 dark:border-gray-700
                              rounded-3xl mb-6 shadow-lg">
                {searchQuery
                  ? <Search className="w-9 h-9 text-primary-400 dark:text-primary-500" />
                  : <Sparkles className="w-9 h-9 text-primary-500 dark:text-primary-400" />
                }
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No boards found' : 'No boards yet'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search or create a new board.`
                  : 'Create your first board to start collaborating with your team.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => dispatch(openCreateBoardModal())} size="lg" className="new-board-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Create your first board
                </Button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline underline-offset-2 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </main>

        <CreateBoardModal />
      </div>
    </>
  );
};