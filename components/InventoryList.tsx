import React, { useState, useMemo } from 'react';
import { InventoryRecord } from '../types';
import { Trash2, RefreshCw, Search, CheckSquare, Square, AlertTriangle, X } from 'lucide-react';

interface InventoryListProps {
  items: InventoryRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteSelected: (ids: (number | string)[]) => void;
  onDeleteSingle?: (id: number | string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, isLoading, onRefresh, onDeleteSelected, onDeleteSingle }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for single delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: number | string | null }>({
    isOpen: false,
    id: null
  });

  // Helper to safely get ID from item, checking multiple common fields
  const getRowId = (item: InventoryRecord): number | string | undefined => {
    if (item.id !== undefined && item.id !== null) return item.id;
    if (item.inventario_id !== undefined && item.inventario_id !== null) return item.inventario_id;
    
    // Fallback: try to find any key ending in 'id' if generic types
    // Note: This is less safe, but helpful if Xano returns custom ID field names
    const keys = Object.keys(item);
    const idKey = keys.find(k => k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id'));
    
    if (idKey) {
        const val = item[idKey];
        if (typeof val === 'string' || typeof val === 'number') return val;
    }
    return undefined;
  };

  // Robustly determine headers
  const headers = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    // Safely extract all keys
    const allKeys = Array.from(new Set(items.flatMap(item => item ? Object.keys(item) : []))) as string[];
    
    // Filter out ID-like fields from display columns if desired, but keeping 'id' visible is usually good
    // Just ensure 'id' is first if it exists
    const idField = allKeys.find(k => k === 'id') || 'id';
    const otherKeys = allKeys.filter(k => k !== 'id' && !k.startsWith('_') && k !== 'inventario_id');
    
    return [idField, ...otherKeys].filter(k => allKeys.includes(k));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchTerm) return items;
    
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(item => 
      Object.values(item).some(val => 
        val && String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [items, searchTerm]);

  const toggleSelection = (id: number | string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    const validIds = filteredItems
      .map(getRowId)
      .filter((id): id is number | string => id !== undefined);

    if (validIds.every(id => selectedIds.has(id)) && validIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validIds));
    }
  };

  const handleDeleteClick = () => {
    if (confirm(`Tem certeza que deseja excluir ${selectedIds.size} itens selecionados?`)) {
      onDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const promptSingleDelete = (id: number | string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmSingleDelete = () => {
    if (deleteConfirmation.id !== null && onDeleteSingle) {
      onDeleteSingle(deleteConfirmation.id);
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  const cancelSingleDelete = () => {
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  if (isLoading && (!items || items.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-gray-200">
        <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-500" />
        <p>Carregando inventário...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-in fade-in duration-500">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => { setSelectedIds(new Set()); onRefresh(); }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 group"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-5 h-5 group-hover:text-blue-600 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                Excluir ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
          {!filteredItems || filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <p>{searchTerm ? 'Nenhum resultado para a busca.' : 'O inventário está vazio.'}</p>
            </div>
          ) : (
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-200 w-12 text-center bg-gray-50">
                      <button onClick={toggleAll} className="text-gray-500 hover:text-blue-600 pt-1">
                        {filteredItems.length > 0 && selectedIds.size > 0 && selectedIds.size >= filteredItems.filter(i => getRowId(i) !== undefined).length ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    {headers.map((header) => (
                      <th key={header} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap bg-gray-50">
                        {header}
                      </th>
                    ))}
                    <th className="px-4 py-3 border-b border-gray-200 w-12 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item, idx) => {
                    const id = getRowId(item);
                    const rowKey = id !== undefined ? id : `idx-${idx}`;
                    const isSelected = id !== undefined && selectedIds.has(id);
                    const hasId = id !== undefined;
                    
                    return (
                      <tr 
                        key={rowKey} 
                        className={`transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 border-r border-gray-100 text-center">
                          <button 
                            onClick={() => hasId && toggleSelection(id!)} 
                            className={`pt-1 ${hasId ? 'text-gray-400 hover:text-blue-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                            disabled={!hasId}
                            title={!hasId ? "Item sem ID válido" : ""}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        {headers.map((header) => (
                          <td key={`${rowKey}-${header}`} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                            {item[header]?.toString() || <span className="text-gray-300 italic">-</span>}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                           {hasId && (
                             <button
                               onClick={() => promptSingleDelete(id!)}
                               className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                               title="Excluir item"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>Total: {items ? items.length : 0} itens</span>
            <span>Selecionados: {selectedIds.size}</span>
          </div>
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja remover o item com ID <span className="font-mono font-bold text-gray-800">{deleteConfirmation.id}</span>?
                  </p>
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={cancelSingleDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSingleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Item
                </button>
              </div>
            </div>
            
            <button 
              onClick={cancelSingleDelete}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryList;