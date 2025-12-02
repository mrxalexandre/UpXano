import React from 'react';
import { InventoryItem } from '../types';
import { AlertCircle } from 'lucide-react';

interface PreviewTableProps {
  data: InventoryItem[];
  headers: string[];
}

const PreviewTable: React.FC<PreviewTableProps> = ({ data, headers }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">Nenhum dado para visualizar.</p>
      </div>
    );
  }

  // Limit preview to first 100 rows for performance
  const previewData = data.slice(0, 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[500px]">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          Pré-visualização dos Dados
          <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {data.length} itens encontrados
          </span>
        </h3>
        {data.length > 100 && (
          <span className="text-xs text-orange-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Mostrando primeiros 100
          </span>
        )}
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12 text-center">
                #
              </th>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewData.map((row, index) => (
              <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400 text-center font-mono border-r border-gray-100">
                  {index + 1}
                </td>
                {headers.map((header) => (
                  <td key={`${index}-${header}`} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                    {row[header]?.toString() || <span className="text-gray-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreviewTable;
