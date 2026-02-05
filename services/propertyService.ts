import { Property, PropertyStatus, AssetClass } from "../types";

// STORAGE_KEY for localStorage
const STORAGE_KEY = 'beaconhill_cre_properties';

// Initial Mock Data
const INITIAL_DATA: Property[] = [
  {
    id: '1',
    address: '123 Newbury St',
    city: 'Boston',
    state: 'MA',
    zip: '02116',
    assetClass: AssetClass.RETAIL,
    sqft: 4500,
    units: 3,
    yearBuilt: 1910,
    status: PropertyStatus.DILIGENCE,
    description: 'Prime retail frontage with residential units above. High foot traffic area.',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    financials: {
      purchasePrice: 4500000,
      grossPotentialRent: 380000,
      vacancyRate: 5,
      operatingExpenses: 95000,
      propertyTax: 48000,
      capitalReserves: 5000,
    },
    assumptions: {
      marketRentGrowth: 3.0,
      expenseGrowth: 2.5,
      exitCapRate: 5.5,
      holdPeriodYears: 10,
    }
  },
  {
    id: '2',
    address: '450 Harrison Ave',
    city: 'Boston',
    state: 'MA',
    zip: '02118',
    assetClass: AssetClass.OFFICE,
    sqft: 12000,
    units: 8,
    yearBuilt: 1925,
    status: PropertyStatus.DISCOVERY,
    description: 'Converted warehouse space in SoWa district. Potential for creative office or life science conversion.',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    aiScore: 88,
    aiReasoning: 'High appreciation potential due to life science expansion in adjacent neighborhoods.',
    financials: {
      purchasePrice: 8500000,
      grossPotentialRent: 750000,
      vacancyRate: 10,
      operatingExpenses: 180000,
      propertyTax: 92000,
      capitalReserves: 12000,
    },
    assumptions: {
      marketRentGrowth: 4.0,
      expenseGrowth: 2.0,
      exitCapRate: 5.0,
      holdPeriodYears: 7,
    }
  }
];

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getProperties = async (): Promise<Property[]> => {
  await delay(300); // Simulate network
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(stored);
};

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  const props = await getProperties();
  return props.find(p => p.id === id);
};

export const saveProperty = async (property: Property): Promise<void> => {
  await delay(300);
  const props = await getProperties();
  const index = props.findIndex(p => p.id === property.id);
  
  if (index >= 0) {
    props[index] = property;
  } else {
    props.push(property);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
};

export const deleteProperty = async (id: string): Promise<void> => {
  await delay(200);
  const props = await getProperties();
  const filtered = props.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}