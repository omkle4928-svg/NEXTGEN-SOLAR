import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  required?: boolean;
  value: string; // Base64 string
  onChange: (base64: string) => void;
  id: string;
}

export default function ImageUploader({ label, required = false, value, onChange, id }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const compressImage = (file: File) => {
    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress quality to 0.7 to keep file size around 30-50KB
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          onChange(compressedDataUrl);
        }
        setIsCompressing(false);
      };
    };
    reader.onerror = () => {
      setIsCompressing(false);
    };
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        compressImage(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        compressImage(file);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
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
          accept="image/*"
          className="hidden"
        />

        {value ? (
          <div className="w-full flex flex-col items-center space-y-2">
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-emerald-500/20 shadow-sm bg-slate-950">
              <img 
                src={value} 
                alt="Upload preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center text-xs text-emerald-400 font-medium space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Photo Attached Successfully</span>
            </div>
          </div>
        ) : isCompressing ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Compressing photo...</span>
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
            <p className="text-[10px] text-slate-500 font-medium">Supported: JPG, PNG, WEBP (auto-compressed)</p>
          </div>
        )}
      </div>
    </div>
  );
}
