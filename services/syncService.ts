import { StorageService } from "./storageService";

// URL for MassGIS Parcels (Statewide or partial)
// Using an example direct link (users might need to update this)
const MASSGIS_URL = "https://download.massgis.digital.mass.gov/shapefiles/l3parcels/L3_SHP_STATEWIDE.zip"; // Statewide Level 3 Parcels

export const SyncService = {

    downloadStatewideParcels: async (onProgress: (pct: number) => void): Promise<void> => {
        // 1. Ensure we have a directory handle
        const dirHandle = StorageService.getHandle();
        if (!dirHandle) {
            throw new Error("Storage folder not selected or access expired. Please re-select the folder in Settings.");
        }

        try {
            // 2. Start Fetch
            const response = await fetch(MASSGIS_URL, { mode: 'cors' });
            if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            if (!response.body) throw new Error("ReadableStream not supported by browser or empty body.");

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            // 3. Open File Handle
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
