import { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { APP_CONSTANTS } from '../constants/app';

interface ImportOptions<T> {
  onImport: (file: File) => Promise<T>;
  onSuccess?: (result?: T) => void;
  onError?: (error: any) => void;
  validateContent?: (content: any) => string | null; // Returns error message if invalid
}

export function useFileImport<T>({ onImport, onSuccess, onError, validateContent }: ImportOptions<T>) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input immediately
    if (fileInputRef.current) fileInputRef.current.value = '';

    setImporting(true);

    try {
      // 1. Read file
      const content = await readFileContent(file);
      
      // 2. Parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        throw new SyntaxError(APP_CONSTANTS.TOAST_MESSAGES.JOB.INVALID_FILE);
      }

      // 3. Custom Validation (e.g. duplicate check)
      if (validateContent) {
        const validationError = validateContent(parsedData);
        if (validationError) {
          addToast('error', validationError);
          setImporting(false);
          return;
        }
      }

      // 4. Perform Import
      const result = await onImport(file);
      
      if (onSuccess) onSuccess(result as any);
      addToast('success', APP_CONSTANTS.TOAST_MESSAGES.JOB.IMPORT_SUCCESS);
      
    } catch (error: any) {
      console.error('Import failed:', error);
      const message = error.message || APP_CONSTANTS.TOAST_MESSAGES.JOB.IMPORT_ERROR;
      addToast('error', message);
      if (onError) onError(error);
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    fileInputRef,
    handleImportClick,
    handleFileChange
  };
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error(APP_CONSTANTS.TOAST_MESSAGES.JOB.READ_ERROR));
    reader.readAsText(file);
  });
}
