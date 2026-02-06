import { Property, PropertyStatus, AssetClass, DetailedFinancials } from "../types";
import { getUseCodeDescription } from "../constants/massgisMappings";

// MassGIS Level 3 Parcel Feature Server
// Source: https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/L3_TAXPAR_POLY_ASSESS_gdb/FeatureServer/0
const MASSGIS_LAYER_URL = "https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/L3_TAXPAR_POLY_ASSESS_gdb/FeatureServer/0";

interface MassGISFeature {
    attributes: {
        SITE_ADDR: string;
        CITY: string;
        ZIP: string;
        USE_CODE: string;
        BLD_AREA: number;
        RES_AREA: number;
        UNITS: number;
        YEAR_BUILT: number;
        TOTAL_VAL: number;
        STYLE: string;
        ZONING: string;
        LOT_SIZE: number;
        OWNER1: string;
    };
    geometry: {
        x: number;
        y: number;
    };
}

export const MassGISService = {
    // Search for properties by address string (using SQL LIKE query on SITE_ADDR)
    searchProperties: async (query: string): Promise<MassGISFeature[]> => {
        // Basic sanitization
        const safeQuery = query.replace(/[^\w\s]/gi, '').toUpperCase();
        const where = `SITE_ADDR LIKE '%${safeQuery}%'`;

        const params = new URLSearchParams({
            f: 'json',
            where: where,
            outFields: 'SITE_ADDR,CITY,ZIP,USE_CODE,BLD_AREA,RES_AREA,UNITS,YEAR_BUILT,TOTAL_VAL,BLDG_VAL,LAND_VAL,STYLE,ZONING,LOT_SIZE,OWNER1,NUM_ROOMS,STORIES,LS_DATE,LS_PRICE,LOC_ID',
            outSR: '4326', // Return WGS84 coordinates
            returnGeometry: 'true',
            returnCentroid: 'true', // Crucial for polygon layers to get a marker point
            resultRecordCount: '10'
        });

        return await MassGISService._doQuery(params);
    },

    // Internal helper for queries
    _doQuery: async (params: URLSearchParams): Promise<MassGISFeature[]> => {
        try {
            const response = await fetch(`${MASSGIS_LAYER_URL}/query?${params.toString()}`);
            const data = await response.json();
            if (data.error) {
                console.error("MassGIS Error:", data.error);
                return [];
            }
            return data.features || [];
        } catch (e) {
            console.error("Failed to query MassGIS:", e);
            return [];
        }
    },

    // Advanced Query for Agents
    queryByCriteria: async (city: string, useCodes: string[]): Promise<MassGISFeature[]> => {
        let where = `CITY = '${city.toUpperCase()}'`;

        if (useCodes.length > 0) {
            const codesStr = useCodes.map(c => `'${c}'`).join(',');
            where += ` AND USE_CODE IN (${codesStr})`;
        }

        const params = new URLSearchParams({
            f: 'json',
            where: where,
            outFields: 'SITE_ADDR,CITY,ZIP,USE_CODE,BLD_AREA,RES_AREA,UNITS,YEAR_BUILT,TOTAL_VAL,BLDG_VAL,LAND_VAL,STYLE,ZONING,LOT_SIZE,OWNER1,NUM_ROOMS,STORIES,LS_DATE,LS_PRICE,LOC_ID',
            outSR: '4326', // Return WGS84 coordinates
            returnGeometry: 'true',
            returnCentroid: 'true',
            resultRecordCount: '20'
        });

        return await MassGISService._doQuery(params);
    },

    // Convert MassGIS Feature to our Application Property Model
    convertToProperty: (feature: any): Property => {
        const attr = feature.attributes;
        const geom = feature.geometry;
        const centroid = feature.centroid; // Returned when returnCentroid=true

        // Determine Asset Class
        let assetClass = AssetClass.OTHER;
        const useCodeStr = attr.USE_CODE || '';
        const useCode = parseInt(useCodeStr) || 0;

        // 1xx is Residential
        if (useCode >= 101 && useCode <= 199) {
            assetClass = AssetClass.MULTIFAMILY;
        }
        // 3xx is Commercial (Retail/Office/etc)
        else if (useCode >= 300 && useCode <= 399) {
            assetClass = AssetClass.RETAIL;
        }
        // 4xx is Industrial
        else if (useCode >= 400 && useCode <= 499) {
            assetClass = AssetClass.INDUSTRIAL;
        }

        // Special Mixed Use Detection
        if (useCodeStr.startsWith('0')) {
            assetClass = AssetClass.MIXED_USE;
        }

        const estimatedMarketValue = (attr.TOTAL_VAL || 0);
        let units = attr.UNITS || 0;

        // Inferred units from style if UNITS is missing or 1 but style suggests more
        if (units <= 1 && attr.STYLE) {
            const style = attr.STYLE.toUpperCase();
            if (style.includes('4UNIT')) units = 4;
            else if (style.includes('DX') || style.includes('DUPLEX')) units = 2;
            else if (style.includes('TK') || style.includes('TRIPLE')) units = 3;
            else if (style.includes('31-99')) units = 65; // Improved average for "31-99"
            else if (style.includes('UNIT') || style.includes('APT')) {
                // Try to extract a number if present
                const match = style.match(/(\d+)\s*UNIT/);
                if (match) units = parseInt(match[1]);
            }
        }

        // Final fallback
        if (units === 0) units = 1;

        // Format Sale Date (MassGIS uses YYYYMMDD string)
        let formattedSaleDate = attr.LS_DATE;
        if (formattedSaleDate && formattedSaleDate.length === 8) {
            const y = formattedSaleDate.substring(0, 4);
            const m = formattedSaleDate.substring(4, 6);
            const d = formattedSaleDate.substring(6, 8);
            formattedSaleDate = `${m}/${d}/${y}`;
        }

        const financials: DetailedFinancials = {
            purchasePrice: estimatedMarketValue,
            grossPotentialRent: 0,
            vacancyRate: 5,
            otherIncome: 0,
            propertyTax: Math.round(estimatedMarketValue * 0.012),
            insurance: units * 1000,
            utilities: units * 1500,
            repairsMaintenance: units * 800,
            managementFee: 5,
            capitalReserves: units * 300,
            closingCosts: Math.round(estimatedMarketValue * 0.02),
            renovationBudget: 0
        };

        // Use LOC_ID as the unique identifier to prevent duplicates
        const locId = attr.LOC_ID || `MGEN-${Date.now()}`;

        return {
            id: locId,
            address: attr.SITE_ADDR || 'Unknown Address',
            city: attr.CITY || 'Unknown',
            state: 'MA',
            zip: attr.ZIP || '',
            assetClass: assetClass,
            buildingType: getUseCodeDescription(useCodeStr),
            sqft: attr.BLD_AREA || attr.RES_AREA || attr.LIVING_AREA || 0,
            units: units,
            yearBuilt: attr.YEAR_BUILT || 1900,
            zoning: attr.ZONING,
            style: attr.STYLE,
            useCode: attr.USE_CODE,
            lastSaleDate: formattedSaleDate || undefined,
            lastSalePrice: attr.LS_PRICE || undefined,
            status: PropertyStatus.DISCOVER,
            history: [],
            // Use centroid if available (for markers), fallback to geom if it's already a point
            latitude: centroid?.y || geom?.y || 0,
            longitude: centroid?.x || geom?.x || 0,
            description: `Official MassGIS Record (${locId}). Owner: ${attr.OWNER1 || 'N/A'}.`,
            financials: financials,
            loan: {
                ltv: 75,
                interestRate: 6.5,
                amortizationYears: 30
            },
            assumptions: {
                marketRentGrowth: 3,
                expenseGrowth: 2.5,
                exitCapRate: 6.0,
                holdPeriodYears: 5
            }
        };
    }
};
