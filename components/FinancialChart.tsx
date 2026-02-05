import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Property } from '../types';

interface FinancialChartProps {
  property: Property;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ property }) => {
  // Generate projection data
  const data = React.useMemo(() => {
    const points = [];
    const f = property.financials;
    const a = property.assumptions;

    let currentGrossRent = f.grossPotentialRent;
    let currentOpex = f.operatingExpenses + f.propertyTax + f.capitalReserves;
    
    for (let year = 1; year <= a.holdPeriodYears; year++) {
      const vacancyLoss = currentGrossRent * (f.vacancyRate / 100);
      const noi = currentGrossRent - vacancyLoss - currentOpex;
      const unleveredYield = (noi / f.purchasePrice) * 100;

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
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis unit="%" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
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
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#64748b'}}
                tickFormatter={(value) => `$${value/1000}k`} 
              />
              <Tooltip 
                 formatter={(value) => [`$${value.toLocaleString()}`, "NOI"]}
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
