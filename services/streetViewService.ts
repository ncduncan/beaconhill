import { Property } from "../types";

export const StreetViewService = {
    /**
     * Attempts to find a free street view image URL for the given coordinates.
     * Currently uses KartaView (OpenStreetCam) as a free provider.
     */
    getFreeStreetViewImage: async (lat: number, lng: number): Promise<string | null> => {
        try {
            // KartaView API v2.0 - Find images near coordinates
            // Note: We use a larger radius (100m) to ensure we find something if imagery is sparse.
            const response = await fetch(`https://api.kartaview.org/2.0/photo/?lat=${lat}&lng=${lng}&radius=100&limit=1`);
            const data = await response.json();

            if (data.status.apiCode === '200' && data.data && data.data.length > 0) {
                const photo = data.data[0];
                // KartaView provides multiple sizes. 'proc' or highest quality is best.
                // If specific size urls aren't in the root, they might be in th_ (thumbnails)
                // Using the thumb_url as a reliable fallback or high-res if available.
                return photo.thumb_name || photo.name || null;
            }
        } catch (e) {
            console.warn("Failed to fetch KartaView image:", e);
        }
        return null;
    },

    /**
     * Returns a direct link to Google Maps Street View for interactive viewing.
     * This is always free as it's a redirect to Google's standard web interface.
     */
    getGoogleStreetViewLink: (lat: number, lng: number): string => {
        return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
    }
};
