import React from 'react';
import { ChecklistData } from '../services/gemini';
import { Plus, FileText, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  checklists: ChecklistData[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  checklists,
  activeId,
  onSelect,
  onDelete,
  onNew
}) => {
  return (
    <div className="w-80 h-screen bg-white border-r border-zinc-200 flex flex-col sticky top-0">
      <div className="p-6 border-b border-zinc-100">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-sm shadow-indigo-200"
        >
          <Plus size={18} />
          New Checklist
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
          Your Checklists ({checklists.length})
        </h3>
        
        <AnimatePresence mode="popLayout">
          {checklists.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-400 italic">No checklists yet</p>
            </div>
          ) : (
            checklists.map((checklist) => (
              <motion.div
                key={checklist.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`
                  group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${activeId === checklist.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900'}
                `}
                onClick={() => onSelect(checklist.id)}
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${activeId === checklist.id ? 'bg-indigo-100' : 'bg-zinc-100 group-hover:bg-zinc-200'}
                `}>
                  <FileText size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {checklist.title}
                  </p>
                  <p className="text-[10px] opacity-60 truncate">
                    {new Date(checklist.createdAt).toLocaleDateString()} • {checklist.steps.length} steps
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(checklist.id);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={14} className={`opacity-40 ${activeId === checklist.id ? 'opacity-100' : ''}`} />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
            RA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-900 truncate">Roseman Aquino</p>
            <p className="text-[10px] text-zinc-500 truncate">rosemanaquino18@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
