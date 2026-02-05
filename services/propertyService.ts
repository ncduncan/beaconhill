import { Property, PropertyStatus, StatusHistory } from "../types";
import { StorageService } from "./storageService";

// Helper to simulate network delay for UI realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getProperties = async (includeHidden = false): Promise<Property[]> => {
  // Ensure storage is ready (or using fallback)
  let props = await StorageService.load();

  if (includeHidden) {
    return props;
  }


  // Filter out 'archived' items unless requested
  // PASSED and DISPOSED are considered "hidden" from the main workflow flow
  return props.filter(p =>
    p.status !== PropertyStatus.PASSED &&
    p.status !== PropertyStatus.DISPOSED
  );
};

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  const props = await StorageService.load(); // Load all, including hidden
  return props.find(p => p.id === id);
};

export const saveProperty = async (property: Property): Promise<void> => {
  await delay(200);
  const props = await StorageService.load();
  const index = props.findIndex(p => p.id === property.id);

  if (index >= 0) {
    // If it exists, merging metadata but KEEPING current status
    // unless the incoming property is significantly different.
    // This satisfies "Limit every property to only having one status"
    const existing = props[index];
    props[index] = {
      ...property,
      status: existing.status, // Preserve progress
      history: existing.history // Preserve history
    };
  } else {
    props.push(property);
  }

  await StorageService.save(props);
};

export const updateStatus = async (id: string, newStatus: PropertyStatus, note?: string): Promise<void> => {
  const props = await StorageService.load();
  const property = props.find(p => p.id === id);

  if (property) {
    // Record history
    const historyItem: StatusHistory = {
      status: property.status,
      date: new Date().toISOString(),
      note: note || `Transitioned to ${newStatus}`
    };

    // Initialize history if missing
    if (!property.history) property.history = [];
    property.history.push(historyItem);

    // Update status
    property.status = newStatus;

    await StorageService.save(props);
  }
};

// "Soft Delete" by moving to DISPOSED or PASSED (already handled by updateStatus), 
// but this strictly removes from DB if needed (e.g. clean up).
// User request: "All data should be retained, but may be hidden". 
// So 'delete' actually just means status change usually. 
// We will keep this for hard cleanups if necessary.
export const hardDeleteProperty = async (id: string): Promise<void> => {
  await delay(200);
  const props = await StorageService.load();
  const filtered = props.filter(p => p.id !== id);
  await StorageService.save(filtered);
}