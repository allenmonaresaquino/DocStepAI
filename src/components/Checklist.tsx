import React, { useState } from 'react';
import { CheckCircle2, Circle, ListTodo, Sparkles, AlertTriangle, Info, Lightbulb, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Step, ContentBlock } from '../services/gemini';

interface ChecklistProps {
  steps: Step[];
  isProcessing: boolean;
  completedSteps: Set<string>;
  completedSubSteps: Set<string>;
  onToggleStep: (id: string) => void;
  onToggleSubStep: (id: string) => void;
}

const ContentBlockRenderer: React.FC<{ blocks?: ContentBlock[] }> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 min-w-0">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'code':
            return (
              <div key={i} className="relative group/code min-w-0">
                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-zinc-800 rounded-full" />
                <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto border border-zinc-800 shadow-inner scrollbar-thin scrollbar-thumb-zinc-700">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <Terminal size={12} />
                    <span className="uppercase tracking-widest text-[10px]">{block.language || 'code'}</span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all"><code>{block.content}</code></pre>
                </div>
              </div>
            );
          case 'warning':
            return (
              <div key={i} className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 min-w-0 overflow-hidden">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed break-words min-w-0 flex-1">
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Warning</span>
                  {block.content}
                </div>
              </div>
            );
          case 'info':
            return (
              <div key={i} className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 min-w-0 overflow-hidden">
                <Info size={18} className="shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed break-words min-w-0 flex-1">
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Information</span>
                  {block.content}
                </div>
              </div>
            );
          case 'reminder':
            return (
              <div key={i} className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 min-w-0 overflow-hidden">
                <Lightbulb size={18} className="shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed break-words min-w-0 flex-1">
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Reminder</span>
                  {block.content}
                </div>
              </div>
            );
          default:
            return (
              <p key={i} className="text-sm text-zinc-600 leading-relaxed pl-4 border-l-2 border-zinc-100 break-words">
                {block.content}
              </p>
            );
        }
      })}
    </div>
  );
};

export const Checklist: React.FC<ChecklistProps> = ({ 
  steps, 
  isProcessing,
  completedSteps,
  completedSubSteps,
  onToggleStep,
  onToggleSubStep
}) => {
  const toggleStep = (id: string) => {
    onToggleStep(id);
  };

  const toggleSubStep = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleSubStep(id);
  };

  if (isProcessing) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 space-y-4">
        <div className="flex items-center gap-3 text-indigo-600 animate-pulse mb-6">
          <Sparkles size={24} />
          <h2 className="text-xl font-semibold">Analyzing document...</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white border border-zinc-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (steps.length === 0) return null;

  const totalItems = steps.length + steps.reduce((acc, s) => acc + (s.subSteps?.length || 0), 0);
  const completedItems = completedSteps.size + completedSubSteps.size;
  const progress = Math.round((completedItems / totalItems) * 100) || 0;

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 pb-24">
      <div className="sticky top-0 z-30 bg-zinc-50/95 backdrop-blur-md py-6 mb-8 border-b border-zinc-200/50 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ListTodo size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Your Checklist</h2>
              <p className="text-sm text-zinc-500">
                {completedItems} of {totalItems} items completed
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600 tabular-nums">{progress}%</div>
            <div className="w-32 h-2 bg-zinc-200 rounded-full mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  group p-8 rounded-3xl border transition-all duration-300
                  ${isCompleted 
                    ? 'bg-zinc-50 border-zinc-100' 
                    : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'}
                `}
              >
                <div 
                  className="flex items-start gap-5 cursor-pointer"
                  onClick={() => toggleStep(step.id)}
                >
                  <div className={`
                    mt-1 transition-all duration-300 transform
                    ${isCompleted ? 'text-indigo-600 scale-110' : 'text-zinc-300 group-hover:text-indigo-400 group-hover:scale-105'}
                  `}>
                    {isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`
                      text-xl font-bold transition-all duration-300 tracking-tight
                      ${isCompleted ? 'text-zinc-400 line-through decoration-indigo-200' : 'text-zinc-900'}
                    `}>
                      {step.title}
                    </h3>
                    {step.description && (
                      <p className={`
                        mt-2 text-base transition-all duration-300 leading-relaxed
                        ${isCompleted ? 'text-zinc-400' : 'text-zinc-600'}
                      `}>
                        {step.description}
                      </p>
                    )}
                    
                    <ContentBlockRenderer blocks={step.contentBlocks} />
                  </div>
                </div>

                {/* Sub-steps */}
                {step.subSteps && step.subSteps.length > 0 && (
                  <div className="mt-8 ml-12 space-y-6 border-l-2 border-zinc-100 pl-8">
                    {step.subSteps.map((subStep) => {
                      const isSubCompleted = completedSubSteps.has(subStep.id);
                      return (
                        <div key={subStep.id} className="space-y-3">
                          <div
                            onClick={(e) => toggleSubStep(e, subStep.id)}
                            className="flex items-center gap-4 cursor-pointer group/sub"
                          >
                            <div className={`
                              transition-all duration-300
                              ${isSubCompleted ? 'text-indigo-500 scale-110' : 'text-zinc-300 group-hover/sub:text-indigo-400 group-hover/sub:scale-105'}
                            `}>
                              {isSubCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`
                                text-base font-medium transition-all duration-300
                                ${isSubCompleted ? 'text-zinc-400 line-through' : 'text-zinc-800'}
                                ${subStep.isAdditional ? 'italic text-indigo-600/80' : ''}
                              `}>
                                {subStep.title}
                              </span>
                              {subStep.isAdditional && (
                                <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                  AI
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-9">
                            <ContentBlockRenderer blocks={subStep.contentBlocks} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
