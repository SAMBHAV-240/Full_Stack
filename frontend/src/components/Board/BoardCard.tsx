import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '../../types';
import { Avatar } from '../Common';
import { Users, LayoutList, ArrowUpRight, MoreHorizontal, Star, Copy, Trash2 } from 'lucide-react';

interface BoardCardProps {
  board: Board;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [starred, setStarred] = useState(false);

  return (
    <div
      onClick={() => navigate(`/board/${board.id}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 relative"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
      }}
    >
      {/* Gradient Header */}
      <div
        className="h-32 p-5 relative overflow-hidden"
        style={{ backgroundColor: board.background }}
      >
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Decorative geometry */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-700 ease-out" />
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-black/10 rounded-full group-hover:scale-110 transition-transform duration-700 ease-out" />

        {/* Top row — star + menu */}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setStarred((v) => !v); }}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100
              ${starred ? 'bg-amber-400/30 text-amber-300 opacity-100' : 'bg-white/15 text-white/70 hover:bg-white/25 hover:text-white'}`}
          >
            <Star className={`w-3.5 h-3.5 ${starred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            className="p-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/70 hover:bg-white/25 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
            />
            <div
              className="absolute top-10 right-3 z-30 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                <Star className="w-3.5 h-3.5 text-gray-400" />Add to favorites
              </button>
              <button className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                <Copy className="w-3.5 h-3.5 text-gray-400" />Duplicate board
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Delete board
              </button>
            </div>
          </>
        )}

        {/* Title */}
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <h3 className="text-base font-bold text-white truncate leading-tight drop-shadow">
            {board.name}
          </h3>
          {board.description && (
            <p className="text-xs text-white/75 mt-0.5 truncate">
              {board.description}
            </p>
          )}
        </div>

        {/* Arrow — slides in on hover */}
        <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="bg-white px-4 py-3.5 border-t border-gray-100/80">
        <div className="flex items-center justify-between">

          {/* Member avatars */}
          <div className="flex -space-x-2">
            {board.members.slice(0, 4).map((member) => (
              <Avatar
                key={member.id}
                name={member.user.name}
                src={member.user.avatar}
                size="sm"
                className="ring-2 ring-white hover:scale-110 hover:z-10 transition-transform duration-200"
              />
            ))}
            {board.members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 ring-2 ring-white">
                +{board.members.length - 4}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
              <Users className="w-3.5 h-3.5" />
              {board.members.length}
            </span>
            {board._count && (
              <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <LayoutList className="w-3.5 h-3.5" />
                {board._count.lists}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};