import { Property, PropertyStatus, AssetClass, DetailedFinancials } from "../types";

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
            outFields: 'SITE_ADDR,CITY,ZIP,USE_CODE,BLD_AREA,RES_AREA,UNITS,YEAR_BUILT,TOTAL_VAL,STYLE,ZONING,LOT_SIZE,OWNER1',
            returnGeometry: 'false',
            resultRecordCount: '10'
        });

        // ... truncated fetch logic ...
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
            outFields: 'SITE_ADDR,CITY,ZIP,USE_CODE,BLD_AREA,RES_AREA,UNITS,YEAR_BUILT,TOTAL_VAL,STYLE,ZONING,LOT_SIZE,OWNER1',
            returnGeometry: 'false',
            resultRecordCount: '20'
        });

        return await MassGISService._doQuery(params);
    },

    // Convert MassGIS Feature to our Application Property Model
    convertToProperty: (updatedFeature: MassGISFeature): Property => {
        const attr = updatedFeature.attributes;

        // Determine Asset Class
        let assetClass = AssetClass.OTHER;
        const useCode = parseInt(attr.USE_CODE) || 0;

        if (useCode >= 101 && useCode <= 109) assetClass = AssetClass.MULTIFAMILY;
        if (useCode >= 300 && useCode <= 399) assetClass = AssetClass.RETAIL;
        if (useCode >= 400 && useCode <= 499) assetClass = AssetClass.INDUSTRIAL;

        const estimatedMarketValue = (attr.TOTAL_VAL || 0);
        const units = attr.UNITS || 1;

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

        return {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prop-${Date.now()}-${Math.random()}`,
            address: attr.SITE_ADDR || 'Unknown Address',
            city: attr.CITY || 'Unknown',
            state: 'MA',
            zip: attr.ZIP || '',
            assetClass: assetClass,
            sqft: attr.BLD_AREA || attr.RES_AREA || 0,
            units: units,
            yearBuilt: attr.YEAR_BUILT || 1900,
            zoning: attr.ZONING,
            style: attr.STYLE,
            useCode: attr.USE_CODE,
            status: PropertyStatus.DISCOVER,
            history: [],
            description: `Official MassGIS Record. Owner: ${attr.OWNER1 || 'N/A'}. Use: ${attr.USE_CODE}.`,
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
