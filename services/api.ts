import { InventoryItem, InventoryRecord } from '../types';

const API_BASE = "https://x8ki-letl-twmt.n7.xano.io/api:ApcIvSpa/inventario";

// Helper function to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch with retry logic for 429 errors
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      if (retries > 0) {
        console.warn(`[API] Rate limit hit (429). Retrying in ${backoff}ms...`);
        await delay(backoff);
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      } else {
        console.error("[API] Rate limit exceeded and retries exhausted.");
      }
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[API] Network error. Retrying in ${backoff}ms...`, error);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const uploadItem = async (item: InventoryItem): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetchWithRetry(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Status ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido de rede" };
  }
};

export const getInventory = async (): Promise<InventoryRecord[]> => {
  try {
    const response = await fetchWithRetry(API_BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar dados: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if data is array (standard) or object with items (paginated)
    let items: InventoryRecord[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
      items = data.items;
    } else {
      console.warn("API retornou formato inesperado (não é array):", data);
      items = [];
    }

    console.log(`Carregados ${items.length} itens.`);
    return items;
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    return [];
  }
};

export const deleteItem = async (id: number | string): Promise<{ success: boolean; error?: string }> => {
  try {
    const url = `${API_BASE}/${id}`;
    console.log(`[DELETE] Excluindo item ${id} via ${url}`);
    
    // NOTE: Removed 'Content-Type': 'application/json' because DELETE requests 
    // without a body often fail with this header in some CORS/Server configurations.
    const response = await fetchWithRetry(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DELETE] Falha ao excluir ${id}: ${response.status} - ${errorText}`);
      return { success: false, error: `Status ${response.status}: ${errorText}` };
    }

    console.log(`[DELETE] Sucesso ao excluir ${id}`);
    return { success: true };
  } catch (error) {
    console.error(`[DELETE] Erro de exceção ao excluir ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido de rede" };
  }
};