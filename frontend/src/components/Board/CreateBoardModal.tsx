import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createBoard } from '../../store/slices/boardSlice';
import { closeCreateBoardModal } from '../../store/slices/uiSlice';
import { Modal, Button, Input } from '../Common';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Palette, FileText, Type, Sparkles, Check, X } from 'lucide-react';

/* ── Color palette — same values, just added gradient pairs ── */
const backgroundColors = [
  { color: '#1e3a5f', name: 'Navy',     gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d5580 100%)' },
  { color: '#2d5a3d', name: 'Forest',   gradient: 'linear-gradient(135deg, #2d5a3d 0%, #3d7a52 100%)' },
  { color: '#5a2d2d', name: 'Burgundy', gradient: 'linear-gradient(135deg, #5a2d2d 0%, #7a3d3d 100%)' },
  { color: '#4a3d5a', name: 'Purple',   gradient: 'linear-gradient(135deg, #4a3d5a 0%, #6a5a7a 100%)' },
  { color: '#3d4a5a', name: 'Slate',    gradient: 'linear-gradient(135deg, #3d4a5a 0%, #556070 100%)' },
  { color: '#5a4a3d', name: 'Brown',    gradient: 'linear-gradient(135deg, #5a4a3d 0%, #7a6455 100%)' },
  { color: '#2d4a5a', name: 'Teal',     gradient: 'linear-gradient(135deg, #2d4a5a 0%, #3d6575 100%)' },
  { color: '#5a3d4a', name: 'Rose',     gradient: 'linear-gradient(135deg, #5a3d4a 0%, #7a5566 100%)' },
  { color: '#0f766e', name: 'Emerald',  gradient: 'linear-gradient(135deg, #0f766e 0%, #15998e 100%)' },
  { color: '#7c3aed', name: 'Violet',   gradient: 'linear-gradient(135deg, #7c3aed 0%, #9d5cf5 100%)' },
];

export const CreateBoardModal: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { createBoardModalOpen } = useAppSelector((s) => s.ui);

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [background,  setBackground]  = useState(backgroundColors[0].color);
  const [isLoading,   setIsLoading]   = useState(false);

  const handleClose = () => {
    dispatch(closeCreateBoardModal());
    setName('');
    setDescription('');
    setBackground(backgroundColors[0].color);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Board name is required'); return; }
    setIsLoading(true);
    try {
      const board = await dispatch(
        createBoard({ name: name.trim(), description: description.trim() || undefined, background })
      ).unwrap();
      toast.success('Board created!');
      handleClose();
      navigate(`/board/${board.id}`);
    } catch {
      toast.error('Failed to create board');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBg = backgroundColors.find((b) => b.color === background) ?? backgroundColors[0];

  return (
    <Modal isOpen={createBoardModalOpen} onClose={handleClose}>
      <style>{`
        @keyframes modalFadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes previewShift {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }
        .modal-enter   { animation: modalFadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        .preview-shift { animation: previewShift 0.25s ease-out both; }
      `}</style>

      <form onSubmit={handleSubmit} className="modal-enter overflow-hidden rounded-2xl">

        {/* ── Live Preview ────────────────────────────── */}
        <div
          key={background}
          className="preview-shift h-36 relative overflow-hidden flex flex-col justify-end px-6 pb-5 transition-all duration-500"
          style={{ background: selectedBg.gradient }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute top-4 right-24 w-16 h-16 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 left-6 w-24 h-24 bg-black/10 rounded-full" />

          {/* Board name preview */}
          <div className="relative z-10">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Preview</p>
            <h3 className="text-white font-bold text-xl leading-tight drop-shadow truncate">
              {name || <span className="opacity-40">Board name</span>}
            </h3>
            {description && (
              <p className="text-white/70 text-sm mt-0.5 truncate">{description}</p>
            )}
          </div>

          {/* Sparkle deco */}
          <Sparkles className="absolute top-4 right-5 w-5 h-5 text-white/20" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/35 text-white rounded-lg transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Form body ───────────────────────────────── */}
        <div className="px-6 py-5 space-y-5">

          {/* Board name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <Type className="w-3.5 h-3.5" /> Board name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Q3, Sprint 12…"
              required
              autoFocus
              className="text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Description
              <span className="normal-case font-normal text-gray-400 tracking-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this board for?"
              rows={2}
              className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30
                         focus:border-primary-400 focus:bg-white hover:border-gray-300 transition-all duration-200"
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5" /> Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {backgroundColors.map((bg) => {
                const active = background === bg.color;
                return (
                  <button
                    key={bg.color}
                    type="button"
                    onClick={() => setBackground(bg.color)}
                    title={bg.name}
                    className={`relative w-9 h-9 rounded-xl transition-all duration-200 flex items-center justify-center
                                ${active
                                  ? 'scale-110 shadow-lg ring-2 ring-offset-2 ring-gray-400'
                                  : 'hover:scale-105 hover:shadow-md opacity-80 hover:opacity-100'
                                }`}
                    style={{ background: bg.gradient }}
                  >
                    {active && (
                      <Check className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected color name */}
            <p className="text-[11px] text-gray-400 font-medium">
              Selected: <span className="text-gray-600">{selectedBg.name}</span>
            </p>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800
                       hover:bg-gray-100 rounded-xl transition-all duration-150"
          >
            Cancel
          </button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!name.trim()}
            className="!bg-gradient-to-r !from-primary-600 !to-primary-500 hover:!from-primary-700
                       hover:!to-primary-600 !shadow-md !shadow-primary-500/20 hover:!shadow-lg
                       hover:!-translate-y-0.5 !transition-all !duration-200 disabled:!opacity-50
                       disabled:!cursor-not-allowed disabled:!translate-y-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
};