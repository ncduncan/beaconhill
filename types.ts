export enum PropertyStatus {
  DISCOVERY = 'DISCOVERY',
  DILIGENCE = 'DILIGENCE',
  OWNED = 'OWNED',
}

export enum AssetClass {
  MULTIFAMILY = 'Multifamily',
  OFFICE = 'Office',
  RETAIL = 'Retail',
  INDUSTRIAL = 'Industrial',
  MIXED_USE = 'Mixed Use',
}

export interface Financials {
  purchasePrice: number;
  grossPotentialRent: number;
  vacancyRate: number; // percentage 0-100
  operatingExpenses: number; // annual
  propertyTax: number; // annual
  capitalReserves: number; // annual
}

export interface UnderwritingAssumptions {
  marketRentGrowth: number; // %
  expenseGrowth: number; // %
  exitCapRate: number; // %
  holdPeriodYears: number;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  assetClass: AssetClass;
  sqft: number;
  units: number;
  yearBuilt: number;
  imageUrl?: string;
  status: PropertyStatus;
  description: string;
  
  // AI Discovery Scoring
  aiScore?: number; // 0-100
  aiReasoning?: string;

  // Financials
  financials: Financials;
  assumptions: UnderwritingAssumptions;

  // AI Insights
  aiValuePlan?: string;
  aiRisks?: string;
  lastAiUpdate?: string;
}

// Helper types for charts
export interface CashFlowPoint {
  year: number;
  noi: number;
  yield: number;
}