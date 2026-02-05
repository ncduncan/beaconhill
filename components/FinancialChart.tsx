import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Property, DetailedFinancials } from '../types';

interface FinancialChartProps {
  property: Property;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ property }) => {
  // Generate projection data
  const data = React.useMemo(() => {
    const points = [];
    const f = property.financials;
    const a = property.assumptions;

    let currentGrossRent = f.grossPotentialRent + (f.otherIncome || 0);

    // Calculate initial annual opex sum
    let currentOpex =
      f.propertyTax +
      f.insurance +
      f.utilities +
      f.repairsMaintenance +
      f.capitalReserves;

    // Add management fee which is usually a % of Effective Gross Income, 
    // but for simplicity here we might base it on GPR initially or recalculate yearly.
    // Let's model it as a flat growable expense for now to avoid circular calc complexity in this chart view,
    // or better: recalculate it each year based on EGI.

    for (let year = 1; year <= a.holdPeriodYears; year++) {
      const vacancyLoss = currentGrossRent * (f.vacancyRate / 100);
      const effectiveGrossIncome = currentGrossRent - vacancyLoss;

      const mgmtFeeAmount = effectiveGrossIncome * (f.managementFee / 100);
      const totalOpex = currentOpex + mgmtFeeAmount;

      const noi = effectiveGrossIncome - totalOpex;
      const unleveredYield = (noi / (f.purchasePrice + f.renovationBudget + f.closingCosts)) * 100;

      points.push({
        year: `Year ${year}`,
        noi: Math.round(noi),
        yield: parseFloat(unleveredYield.toFixed(2)),
        grossRent: Math.round(currentGrossRent)
      });

      // Grow metrics for next year
      currentGrossRent *= (1 + a.marketRentGrowth / 100);
      currentOpex *= (1 + a.expenseGrowth / 100);
    }
    return points;
  }, [property]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Cash Yield on Unlevered Cost</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="yield"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 6 }}
                name="Yield %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Net Operating Income (NOI) Growth</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "NOI"]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="noi" fill="#10b981" radius={[4, 4, 0, 0]} name="NOI" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FinancialChart;
