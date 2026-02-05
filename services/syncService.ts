import { StorageService } from "./storageService";

// URL for MassGIS Parcels (Statewide or partial)
// Using an example direct link (users might need to update this)
const MASSGIS_URL = "https://s3.us-east-1.amazonaws.com/download.massgis.digital.mass.gov/shapefiles/l3parcels/L3_SHP_M001_BN.zip"; // Barnstable example for testing, or full state if avail

export const SyncService = {

    downloadStatewideParcels: async (onProgress: (pct: number) => void): Promise<void> => {
        // 1. Ensure we have a directory handle
        if (!await StorageService.isConfigured()) {
            throw new Error("Storage folder not selected. Please configure storage in settings.");
        }

        try {
            // 2. Start Fetch
            const response = await fetch(MASSGIS_URL, { mode: 'cors' });
            if (!response.body) throw new Error("ReadableStream not supported by browser or empty body.");

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            // 3. Open File Handle
            // @ts-ignore
            const dirHandle = (StorageService as any).cachedDirHandle; // Accessing internal handle (hacky but needed for MVP)
            // Ideally StorageService exposes a method 'getFileWriter'

            // Allow user to select where to save if not using cached handle specifically for this
            // But let's assume we save to 'downloads' subfolder in the main DB folder
            // For now, simpler: Save to 'massgis_parcels.zip' in the root of the selected folder

            const fileHandle = await dirHandle.getFileHandle('massgis_parcels.zip', { create: true });
            const writable = await fileHandle.createWritable();

            // 4. Stream to Disk
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                await writable.write(value);

                loaded += value.length;
                if (total) {
                    onProgress(Math.round((loaded / total) * 100));
                }
            }

            await writable.close();
            console.log("Download complete.");

        } catch (e) {
            console.error("Sync failed:", e);
            throw e;
        }
    }
};
