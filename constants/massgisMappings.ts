// Massachusetts Property Type Classification Codes
// Source: MA Department of Revenue (DLS)

export const USE_CODE_MAPPING: Record<string, string> = {
    // Residential
    '101': 'Single Family Residence',
    '102': 'Residential Condominium',
    '103': 'Mobile Home',
    '104': 'Two-Family Residence',
    '105': 'Three-Family Residence',
    '106': 'Accessory Land with Improvement',
    '109': 'Multiple Houses on One Parcel',
    '111': '4-8 Unit Apartment Building',
    '112': '8+ Unit Apartment Building',
    '113': 'Apartment/Residential Complex',
    '121': 'Rooming/Boarding House',
    '122': 'Fraternity/Sorority House',
    '123': 'Residence Halls/Dormitories',
    '125': 'Other Congregate Housing',
    '130': 'Developable Residential Land',
    '131': 'Potentially Developable Res Land',
    '132': 'Undev. Residential Land',

    // Commercial
    '300': 'Hotel',
    '301': 'Motel',
    '310': 'Tanks (Industrial/Utility)',
    '316': 'Commercial Storage',
    '322': 'Discount Department Store',
    '323': 'Shopping Center/Mall',
    '324': 'Supermarket (>10k sqft)',
    '325': 'Small Retail (<10k sqft)',
    '326': 'Restaurant/Eating Establishment',
    '327': 'Medical Office Building',
    '332': 'Auto Repair Garage',
    '334': 'Gas Station',
    '337': 'Parking Lot',
    '340': 'General Office Building',
    '341': 'Bank Building',
    '342': 'Medical Office',
    '351': 'Private School/Education',
    '352': 'Day Care Facility',

    // Industrial
    '400': 'Manufacturing Facility',
    '401': 'Warehouse/Distribution',
    '402': 'Industrial Office',
    '440': 'Developable Industrial Land',

    // Mixed Use (Common)
    '013': 'Mixed Use (Primarily Residential)',
    '031': 'Mixed Use (Primarily Commercial)',
};

export const STYLE_MAPPING: Record<string, string> = {
    'COL': 'Colonial',
    'CP': 'Cape Cod',
    'RN': 'Ranch',
    'RE': 'Raised Ranch',
    'SL': 'Split Level',
    'VI': 'Victorian',
    'GA': 'Garrison',
    'BU': 'Bungalow',
    'CO': 'Contemporary',
    'MD': 'Modern',
    'CV': 'Conventional',
    'TU': 'Tudor',
    'FE': 'Federal',
    'CL': 'Colonial',
    'RA': 'Ranch',
    'DX': 'Duplex',
    'TK': 'Triple Decker',
    '4UNIT': '4-Unit Building',
    'CONDO': 'Condominium Unit',
};

export const getUseCodeDescription = (code: string): string => {
    return USE_CODE_MAPPING[code] || `Property Type (${code})`;
};

export const getStyleDescription = (style: string): string => {
    if (!style) return 'N/A';
    const upper = style.toUpperCase();
    return STYLE_MAPPING[upper] || style;
};

export const getZoningDescription = (code: string): string => {
    if (!code || code === 'nan' || code === 'N/A') return 'Mixed/Unspecified';
    // Most towns use RA, RB, RC for Res A, B, C or LI for Light Industrial
    return code;
};

// Returns a human readable "X Units" string or inferred from use code
export const getUnitCountSummary = (units: number | null, useCode: string): string => {
    if (units && units > 0) return `${units} ${units === 1 ? 'Unit' : 'Units'}`;

    // Fallback to Use Code Inference
    if (useCode === '101' || useCode === '102') return '1 Unit';
    if (useCode === '104') return '2 Units';
    if (useCode === '105') return '3 Units';
    if (useCode === '111') return '4-8 Units';
    if (useCode === '112') return '8+ Units';

    return 'N/A';
};

// Helper for the AI agent to map simple terms to codes
export const CATEGORY_TO_CODES: Record<string, string[]> = {
    'single family': ['101'],
    'multifamily': ['104', '105', '109', '111', '112'],
    'duplex': ['104'],
    'triplex': ['105'],
    'condo': ['102'],
    'apartment': ['111', '112'],
    'commercial': ['300', '301', '322', '323', '324', '325', '326', '340', '341'],
    'retail': ['322', '323', '324', '325'],
    'office': ['340', '341', '342'],
    'industrial': ['400', '401', '402'],
    'land': ['130', '131', '132', '440', '441', '442'],
};
