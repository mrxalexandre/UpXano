export interface InventoryItem {
  [key: string]: string | number | boolean | null | undefined;
}

export interface InventoryRecord extends InventoryItem {
  id?: number | string; // Updated to accept string IDs as well
  inventario_id?: number | string; // Updated to accept string IDs as well
}

export interface UploadStatus {
  total: number;
  success: number;
  failed: number;
  isProcessing: boolean;
  errors: Array<{ row: number; message: string }>;
  type: 'upload' | 'delete';
}

export type ParseResult = {
  data: InventoryItem[];
  headers: string[];
  error?: string;
};