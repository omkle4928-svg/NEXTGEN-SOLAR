import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  required?: boolean;
  value: string; // Base64 string
  onChange: (base64: string) => void;
  id: string;
  accept?: string;
  placeholderText?: string;
}

export default function FileUploader({
  label,
  required = false,
  value,
  onChange,
  id,
  accept = "application/pdf,image/*",
  placeholderText = "Supported: PDF, JPG, PNG"
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive if the base64 value is a PDF or Image
  const isPdf = value.startsWith('data:application/pdf');
  const isImage = value.startsWith('data:image/');

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setError('');
    
    // Check file size (limit to e.g. 2.5MB for Base64 storage in Firestore safely)
    if (file.size > 2.5 * 1024 * 1024) {
      setError('File is too large. Please select a file smaller than 2.5MB.');
      setIsProcessing(false);
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange(dataUrl);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setIsProcessing(false);
    };
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      
      <div
        id={id}
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer min-h-[140px] ${
          value 
            ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' 
            : isDragging 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-950/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />

        {value ? (
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="relative flex items-center justify-center w-32 h-20 rounded-lg overflow-hidden border border-emerald-500/20 shadow-sm bg-slate-950">
              {isImage ? (
                <img 
                  src={value} 
                  alt="Upload preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-rose-400 space-y-1">
                  <FileText className="w-8 h-8" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PDF Document</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center text-xs text-emerald-400 font-medium space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>File Attached Successfully</span>
              </div>
              {fileName && <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{fileName}</p>}
            </div>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Processing file...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-2.5 bg-slate-900 rounded-lg text-slate-400 border border-slate-800">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold">
              <span className="text-indigo-400">Click to upload</span>
              <span className="text-slate-400"> or drag and drop</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">{placeholderText}</p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 flex items-center mt-1">
          <AlertCircle className="w-3.5 h-3.5 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}
