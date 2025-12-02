import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, selectedFile, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      onFileSelect(file);
    } else {
      alert('Por favor, selecione um arquivo .CSV válido.');
    }
  };

  if (selectedFile) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
          title="Remover arquivo"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept=".csv"
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'} transition-colors duration-300`}>
          <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-700">
            Clique para upload ou arraste e solte
          </p>
          <p className="text-sm text-gray-500">
            Apenas arquivos CSV são permitidos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
