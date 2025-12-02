import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { UploadStatus } from '../types';

interface ProgressModalProps {
  status: UploadStatus;
  isOpen: boolean;
  onClose: () => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ status, isOpen, onClose }) => {
  if (!isOpen) return null;

  const percentage = status.total > 0 ? Math.round(((status.success + status.failed) / status.total) * 100) : 0;
  
  // Determine title and action verb based on type
  const isUpload = status.type === 'upload';
  const actionText = isUpload ? 'Enviando' : 'Excluindo';
  const processingText = status.isProcessing ? `${actionText} Dados...` : 'Operação Concluída';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {processingText}
            </h3>
            {status.isProcessing && (
              <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {percentage}%
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div 
              className={`h-full transition-all duration-300 ease-out ${status.failed > 0 ? 'bg-orange-500' : 'bg-blue-600'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
              <p className="text-xl font-bold text-gray-800">{status.total}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Sucesso</p>
              <p className="text-xl font-bold text-green-700">{status.success}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Falhas</p>
              <p className="text-xl font-bold text-red-700">{status.failed}</p>
            </div>
          </div>

          {/* Error List */}
          {status.errors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Erros Encontrados
              </p>
              <div className="bg-red-50 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar text-xs space-y-2 border border-red-100">
                {status.errors.map((err, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="font-bold text-red-800 shrink-0">Item {err.row}:</span>
                    <span className="text-red-700">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            {status.isProcessing ? (
              <button disabled className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;