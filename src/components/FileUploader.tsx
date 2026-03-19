import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  isProcessing
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: isProcessing
  } as any);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12
              transition-all duration-200 ease-in-out cursor-pointer
              flex flex-col items-center justify-center gap-4
              ${isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-900">
                {isDragActive ? 'Drop your document here' : 'Upload your document'}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                PDF, TXT, or DOCX up to 10MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="selected-file"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
