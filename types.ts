export enum PropertyStatus {
  DISCOVER = 'DISCOVER',
  UNDERWRITE = 'UNDERWRITE', // Formerly DILIGENCE
  MANAGE = 'MANAGE',         // Formerly OWNED
  PASSED = 'PASSED',
  DISPOSED = 'DISPOSED'
}

export enum AssetClass {
  MULTIFAMILY = 'Multifamily',
  OFFICE = 'Office',
  RETAIL = 'Retail',
  INDUSTRIAL = 'Industrial',
  MIXED_USE = 'Mixed Use',
  OTHER = 'Other',
}

export interface DetailedFinancials {
  // Income
  grossPotentialRent: number;
  otherIncome: number;
  vacancyRate: number; // %

  // Expenses
  propertyTax: number;
  insurance: number;
  utilities: number;
  repairsMaintenance: number;
  managementFee: number; // % of EGI
  capitalReserves: number;

  // Acquisition
  purchasePrice: number;
  closingCosts: number;
  renovationBudget: number;
}

export interface LoanAssumptions {
  ltv: number; // % Loan to Value
  interestRate: number; // %
  amortizationYears: number;
}

export interface UnderwritingAssumptions {
  marketRentGrowth: number; // %
  expenseGrowth: number; // %
  exitCapRate: number; // %
  holdPeriodYears: number;
}

export interface StatusHistory {
  status: PropertyStatus;
  date: string;
  note?: string;
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
  zoning?: string;
  style?: string;
  useCode?: string;

  lastSaleDate?: string;
  lastSalePrice?: number;
  buildingType?: string;
  streetViewImageUrl?: string;

  status: PropertyStatus;
  history: StatusHistory[]; // Track flow changes

  description: string;

  // Lat/Long for Map
  latitude?: number;
  longitude?: number;

  // AI Discovery Scoring
  aiScore?: number; // 0-100
  aiReasoning?: string;

  // Financials
  financials: DetailedFinancials;
  loan: LoanAssumptions;
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
  cashFlow: number;
}