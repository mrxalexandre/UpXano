import Papa from 'papaparse';
import { ParseResult, InventoryItem } from '../types';

export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically converts numbers and booleans
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          // Sometimes PapaParse returns errors for minor things, we check if we got data
          if (results.data.length === 0) {
            resolve({
              data: [],
              headers: [],
              error: `Erro ao ler CSV: ${results.errors[0].message}`,
            });
            return;
          }
        }

        const data = results.data as InventoryItem[];
        const headers = results.meta.fields || [];

        resolve({
          data,
          headers,
        });
      },
      error: (error) => {
        resolve({
          data: [],
          headers: [],
          error: error.message,
        });
      },
    });
  });
};
