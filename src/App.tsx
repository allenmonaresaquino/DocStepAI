import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { Checklist } from './components/Checklist';
import { Sidebar } from './components/Sidebar';
import { extractStepsFromDocument, Step, ChecklistData } from './services/gemini';
import { Sparkles, LayoutGrid, FileCheck, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as mammoth from 'mammoth';

const STORAGE_KEY = 'docstep_checklists';

export default function App() {
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChecklists(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved checklists", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
  }, [checklists]);

  const activeChecklist = checklists.find(c => c.id === activeId);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
      const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      let extractedSteps: Step[] = [];

      if (isDocx) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedSteps = await extractStepsFromDocument({ text: result.value });
      } else if (isText) {
        const text = await file.text();
        extractedSteps = await extractStepsFromDocument({ text });
      } else if (isPdf) {
        const reader = new FileReader();
        const pdfPromise = new Promise<Step[]>((resolve, reject) => {
          reader.onload = async (e) => {
            const base64Data = e.target?.result?.toString().split(',')[1];
            if (base64Data) {
              try {
                const steps = await extractStepsFromDocument({ fileData: base64Data, mimeType: file.type });
                resolve(steps);
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error("Failed to read file data."));
            }
          };
          reader.onerror = () => reject(new Error("Error reading file."));
          reader.readAsDataURL(file);
        });
        extractedSteps = await pdfPromise;
      } else {
        throw new Error("Unsupported file type. Please upload a PDF, TXT, or DOCX file.");
      }

      const newChecklist: ChecklistData = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        createdAt: Date.now(),
        steps: extractedSteps,
        completedSteps: [],
        completedSubSteps: []
      };

      setChecklists(prev => [newChecklist, ...prev]);
      setActiveId(newChecklist.id);
      setIsProcessing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while processing the document.");
      setIsProcessing(false);
    }
  };

  const handleToggleStep = (id: string) => {
    setChecklists(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const newCompleted = c.completedSteps.includes(id)
        ? c.completedSteps.filter(sid => sid !== id)
        : [...c.completedSteps, id];
      return { ...c, completedSteps: newCompleted };
    }));
  };

  const handleToggleSubStep = (id: string) => {
    setChecklists(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const newCompleted = c.completedSubSteps.includes(id)
        ? c.completedSubSteps.filter(sid => sid !== id)
        : [...c.completedSubSteps, id];
      return { ...c, completedSubSteps: newCompleted };
    }));
  };

  const handleDeleteChecklist = (id: string) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const handleNewChecklist = () => {
    setActiveId(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      {/* Sidebar */}
      <Sidebar
        checklists={checklists}
        activeId={activeId}
        onSelect={setActiveId}
        onDelete={handleDeleteChecklist}
        onNew={handleNewChecklist}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileCheck size={20} />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">DocStep</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline">
                Powered by Gemini
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {!activeId && !isProcessing ? (
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4"
                >
                  <Sparkles size={14} />
                  AI-Powered Document Analysis
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4"
                >
                  Turn any document into a <br />
                  <span className="text-indigo-600">smart checklist.</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-zinc-600 max-w-2xl mx-auto mb-12"
                >
                  Upload your instructions, manuals, or guides. We'll extract the steps 
                  and create an interactive checklist to help you get things done.
                </motion.p>

                <FileUploader
                  onFileSelect={handleFileSelect}
                  selectedFile={null}
                  onClear={() => {}}
                  isProcessing={isProcessing}
                />

                <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto opacity-50">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid size={24} className="text-zinc-500" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-2">Upload</h3>
                    <p className="text-sm text-zinc-600">Drop any document with instructions</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={24} className="text-zinc-500" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-2">Analyze</h3>
                    <p className="text-sm text-zinc-600">AI extracts actionable steps automatically</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-4">
                      <FileCheck size={24} className="text-zinc-500" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-2">Execute</h3>
                    <p className="text-sm text-zinc-600">Track your progress step-by-step</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {isProcessing ? (
                  <Checklist steps={[]} isProcessing={true} completedSteps={new Set()} completedSubSteps={new Set()} onToggleStep={() => {}} onToggleSubStep={() => {}} />
                ) : activeChecklist ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-zinc-900">{activeChecklist.title}</h2>
                        <p className="text-sm text-zinc-500 mt-1">Source: {activeChecklist.fileName}</p>
                      </div>
                    </div>
                    <Checklist
                      steps={activeChecklist.steps}
                      isProcessing={false}
                      completedSteps={new Set(activeChecklist.completedSteps)}
                      completedSubSteps={new Set(activeChecklist.completedSubSteps)}
                      onToggleStep={handleToggleStep}
                      onToggleSubStep={handleToggleSubStep}
                    />
                  </div>
                ) : null}
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </div>
        </main>

        <footer className="py-8 border-t border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} DocStep. Built with Gemini AI.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
