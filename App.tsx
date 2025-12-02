import React, { useState, useCallback, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import PreviewTable from './components/PreviewTable';
import ProgressModal from './components/ProgressModal';
import InventoryList from './components/InventoryList';
import { parseCSV } from './utils/csvParser';
import { uploadItem, getInventory, deleteItem } from './services/api';
import { InventoryItem, InventoryRecord, UploadStatus } from './types';
import { Send, Database, AlertCircle, Info, Upload, List, FileDown, ExternalLink } from 'lucide-react';

type Tab = 'import' | 'manage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('import');
  
  // Import State
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<InventoryItem[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Manage State
  const [inventoryItems, setInventoryItems] = useState<InventoryRecord[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Shared Modal State
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    total: 0,
    success: 0,
    failed: 0,
    isProcessing: false,
    errors: [],
    type: 'upload',
  });
  const [showModal, setShowModal] = useState(false);

  // --- Fetch Data Logic ---
  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const items = await getInventory();
      setInventoryItems(items);
    } catch (e) {
      console.error("Erro ao carregar inventário no App:", e);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchInventory();
    }
  }, [activeTab, fetchInventory]);

  // --- CSV Logic ---
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setData([]);
    setHeaders([]);

    try {
      const result = await parseCSV(selectedFile);
      if (result.error) {
        setError(result.error);
        setFile(null);
      } else {
        setData(result.data);
        setHeaders(result.headers);
      }
    } catch (err) {
      setError('Falha inesperada ao processar o arquivo.');
      setFile(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setData([]);
    setHeaders([]);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    // Define headers and sample data
    const headers = "descricao,codigo,EAN,embalagem";
    const rows = [
      "Produto Teste A,PROD001,7891234567890,UN",
      "Caixa Organizadora,PROD002,7891234567891,CX",
      "Kit Ferramentas,PROD003,7891234567892,KT"
    ];
    
    const csvContent = [headers, ...rows].join("\n");
    
    // Add BOM for Excel compatibility with UTF-8
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Batch Operation Logic (Upload & Delete) ---
  const executeBatchOperation = async (
    items: any[], 
    operation: (item: any) => Promise<{ success: boolean; error?: string }>,
    type: 'upload' | 'delete'
  ) => {
    setUploadStatus({
      total: items.length,
      success: 0,
      failed: 0,
      isProcessing: true,
      errors: [],
      type: type,
    });
    setShowModal(true);

    // Reduced concurrency from 5 to 1 to prevent 429 Rate Limit errors on Xano Free Tier.
    // Xano often limits to 10 requests / 10 seconds on free plans.
    const CONCURRENCY_LIMIT = 1; 
    let currentIndex = 0;

    const processItem = async (index: number) => {
      if (index >= items.length) return;
      const item = items[index];
      
      const result = await operation(item);

      setUploadStatus(prev => ({
        ...prev,
        success: prev.success + (result.success ? 1 : 0),
        failed: prev.failed + (result.success ? 0 : 1),
        errors: result.success 
          ? prev.errors 
          : [...prev.errors, { row: index + 1, message: result.error || 'Erro' }]
      }));
    };

    const workers = Array(Math.min(CONCURRENCY_LIMIT, items.length))
      .fill(null)
      .map(async () => {
        while (currentIndex < items.length) {
          const index = currentIndex++;
          await processItem(index);
          // Optional: Add small delay between items if strict serial processing (concurrency=1) is still too fast
          // await new Promise(r => setTimeout(r, 200)); 
        }
      });

    await Promise.all(workers);

    setUploadStatus(prev => ({ ...prev, isProcessing: false }));
    
    // Refresh list if we just deleted items. Using await to ensure UI updates correctly.
    if (type === 'delete') {
      await fetchInventory();
    }
  };

  const handleUpload = () => {
    if (data.length === 0) return;
    executeBatchOperation(data, uploadItem, 'upload');
  };

  const handleBulkDelete = (ids: (number | string)[]) => {
    if (ids.length === 0) return;
    executeBatchOperation(ids, deleteItem, 'delete');
  };

  const handleSingleDelete = (id: number | string) => {
    handleBulkDelete([id]);
  };

  const closeModal = () => {
    if (!uploadStatus.isProcessing) {
      setShowModal(false);
      
      // Redirect ONLY if the operation was an upload
      if (uploadStatus.type === 'upload') {
        window.location.href = "https://caltecnologia.com.br/ivt_home/";
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 hidden sm:block">
              Gestor de Inventário
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="https://caltecnologia.com.br/ivt_home/"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95 text-sm"
            >
              Ir para Inventário
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'import' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'manage' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Gerenciar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {activeTab === 'import' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Intro */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Importação em Massa</h2>
                <p className="text-slate-500 max-w-2xl">
                  Faça upload de um arquivo CSV. O sistema processará linha por linha para inclusão.
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 font-medium rounded-lg transition-colors shadow-sm text-sm"
              >
                <FileDown className="w-4 h-4" />
                Baixar Modelo CSV
              </button>
            </div>

            {/* Upload Area */}
            <section>
              <Dropzone 
                onFileSelect={handleFileSelect} 
                selectedFile={file} 
                onClear={handleClear} 
              />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </section>

            {/* Data Preview & Action Area */}
            {data.length > 0 && (
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Verifique as colunas antes de enviar</p>
                    <p className="opacity-90">
                      Certifique-se de que os cabeçalhos do CSV correspondem aos campos do Xano.
                    </p>
                  </div>
                </div>

                <div className="h-[400px]">
                  <PreviewTable data={data} headers={headers} />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={handleUpload}
                    className="
                      group flex items-center gap-2 px-8 py-3 
                      bg-blue-600 hover:bg-blue-700 text-white 
                      font-semibold rounded-xl shadow-lg shadow-blue-600/20 
                      transition-all active:scale-[0.98]
                    "
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Iniciar Importação ({data.length} itens)
                  </button>
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Gerenciar Inventário</h2>
              <p className="text-slate-500 max-w-2xl">
                Visualize os itens atuais do banco de dados e exclua registros se necessário.
              </p>
            </div>
            
            <InventoryList 
              items={inventoryItems} 
              isLoading={loadingInventory}
              onRefresh={fetchInventory}
              onDeleteSelected={handleBulkDelete}
              onDeleteSingle={handleSingleDelete}
            />
          </div>
        )}
      </main>

      <ProgressModal 
        isOpen={showModal} 
        status={uploadStatus} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default App;