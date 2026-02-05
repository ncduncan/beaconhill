import { Property } from '../types';

// File System Access API Types (polyfill/stub for TS)
interface FileSystemDirectoryHandle {
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}
interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
    getFile(): Promise<File>;
}
interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    close(): Promise<void>;
}

const DB_FILENAME = 'beaconhill_db.json';
const STORAGE_KEY_DIR_HANDLE = 'beaconhill_dir_handle';
const STORAGE_KEY_FALLBACK = 'beaconhill_data_fallback';

let cachedDirHandle: FileSystemDirectoryHandle | null = null;

export const StorageService = {
    // Check if we have improved storage configured
    isConfigured: async (): Promise<boolean> => {
        // We can't actually store the handle in localStorage (it's not serializable).
        // It must be retrieved from IndexedDB (complex) or re-requested.
        // For this MVP, we will require re-selecting or hold it in memory.
        return !!cachedDirHandle;
    },

    // Request access to a folder
    setDirectory: async (): Promise<void> => {
        try {
            // @ts-ignore - API might not be in standard definitions yet
            const handle = await window.showDirectoryPicker();
            cachedDirHandle = handle;

            // Try to read existing db or create one
            await StorageService.load();
        } catch (e) {
            console.error("Failed to set directory:", e);
            throw e;
        }
    },

    // Save data to JSON
    save: async (properties: Property[]): Promise<void> => {
        const data = JSON.stringify(properties, null, 2);

        if (cachedDirHandle) {
            try {
                const fileHandle = await cachedDirHandle.getFileHandle(DB_FILENAME, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(data);
                await writable.close();
                console.log("Saved to file system.");
            } catch (e) {
                console.error("Error saving to file system, falling back to local storage", e);
                localStorage.setItem(STORAGE_KEY_FALLBACK, data);
            }
        } else {
            // Fallback
            localStorage.setItem(STORAGE_KEY_FALLBACK, data);
        }
    },

    // Load data from JSON
    load: async (): Promise<Property[]> => {
        if (cachedDirHandle) {
            try {
                const fileHandle = await cachedDirHandle.getFileHandle(DB_FILENAME, { create: true });
                const file = await fileHandle.getFile();
                const text = await file.text();
                if (!text) return [];
                return JSON.parse(text) as Property[];
            } catch (e) {
                console.error("Error loading, trying fallback", e);
            }
        }

        // Fallback
        const fallback = localStorage.getItem(STORAGE_KEY_FALLBACK);
        return fallback ? JSON.parse(fallback) : [];
    },

    // Internal accessor for SyncService (Advanced)
    getHandle: () => cachedDirHandle,

    // Export current data (for backup)
    exportBackup: () => {
        const data = localStorage.getItem(STORAGE_KEY_FALLBACK);
        if (!data) return;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beaconhill_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
};
