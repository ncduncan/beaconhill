import { Property } from "../types";

export const StreetViewService = {
    /**
     * Attempts to find a free street view image URL for the given coordinates.
     * Currently uses KartaView (OpenStreetCam) as a free provider.
     */
    getFreeStreetViewImage: async (lat: number, lng: number): Promise<string | null> => {
        try {
            // KartaView API v2.0 - Find images near coordinates
            const response = await fetch(`https://api.kartaview.org/2.0/photo/?lat=${lat}&lng=${lng}&radius=100&limit=1`);
            const data = await response.json();

            if (data.status.apiCode === '200' && data.data && data.data.length > 0) {
                const photo = data.data[0];
                // The API returns the path/filename. We need the full URL.
                // Standard KartaView image host: https://images.kartaview.org
                const imageName = photo.name || photo.thumb_name;
                if (imageName) {
                    return `https://images.kartaview.org/${imageName}`;
                }
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
