import React, { useState, useEffect } from 'react';
import { Property, PropertyStatus, DetailedFinancials } from '../types';
import * as PropertyService from '../services/propertyService';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Undo2, Save, Calculator } from 'lucide-react';
import FinancialChart from '../components/FinancialChart';

const Underwrite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get('id');

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadProperty(id);
        } else {
            // Find first active underwrite or redirect
            PropertyService.getProperties().then(props => {
                const first = props.find(p => p.status === PropertyStatus.UNDERWRITE);
                if (first) {
                    navigate(`?id=${first.id}`, { replace: true });
                } else {
                    setLoading(false);
                }
            });
        }
    }, [id]);

    const loadProperty = async (propId: string) => {
        setLoading(true);
        const p = await PropertyService.getPropertyById(propId);
        setProperty(p || null);
        setLoading(false);
    };

    const handleSave = async (updatedProp: Property) => {
        setProperty(updatedProp);
        await PropertyService.saveProperty(updatedProp);
    };

    const handleFinancialChange = (field: keyof DetailedFinancials, value: string) => {
        if (!property) return;
        const num = parseFloat(value) || 0;
        const updated = {
            ...property,
            financials: {
                ...property.financials,
                [field]: num
            }
        };
        handleSave(updated);
    };

    const handleStatusChange = async (newStatus: PropertyStatus, note: string) => {
        if (!property) return;
        if (confirm(`Confirm status change to ${newStatus}?`)) {
            await PropertyService.updateStatus(property.id, newStatus, note);
            navigate('/'); // Go back to dashboard after major move
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!property) return <div className="p-8 text-center">No property selected. Select one from Dashboard or Discover.</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{property.address}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">UNDERWRITING</span>
                            <span>{property.city} • {property.units} Units</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleStatusChange(PropertyStatus.DISCOVER, "Reverted to Discovery")}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Undo2 size={16} /> Revert
                    </button>
                    <button
                        onClick={() => handleStatusChange(PropertyStatus.PASSED, "Passed during Underwriting")}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <XCircle size={16} /> Pass
                    </button>
                    <button
                        onClick={() => handleStatusChange(PropertyStatus.MANAGE, "Acquired Asset")}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                        <CheckCircle size={16} /> Acquire
                    </button>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Financial Modeling Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Calculator size={20} className="text-indigo-500" /> Financial Model
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Income */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Income</h4>
                            <InputGroup label="Gross Potential Rent" value={property.financials.grossPotentialRent} onChange={(v) => handleFinancialChange('grossPotentialRent', v)} />
                            <InputGroup label="Other Income" value={property.financials.otherIncome} onChange={(v) => handleFinancialChange('otherIncome', v)} />
                            <InputGroup label="Vacancy Rate (%)" value={property.financials.vacancyRate} onChange={(v) => handleFinancialChange('vacancyRate', v)} />
                        </div>

                        {/* Column 2: Expenses */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Annual Expenses</h4>
                            <InputGroup label="Property Tax" value={property.financials.propertyTax} onChange={(v) => handleFinancialChange('propertyTax', v)} />
                            <InputGroup label="Insurance" value={property.financials.insurance} onChange={(v) => handleFinancialChange('insurance', v)} />
                            <InputGroup label="Utilities" value={property.financials.utilities} onChange={(v) => handleFinancialChange('utilities', v)} />
                            <InputGroup label="Repairs & Maint." value={property.financials.repairsMaintenance} onChange={(v) => handleFinancialChange('repairsMaintenance', v)} />
                            <InputGroup label="Mgmt Fee (%)" value={property.financials.managementFee} onChange={(v) => handleFinancialChange('managementFee', v)} />
                        </div>

                        {/* Column 3: Acquisition */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Acquisition</h4>
                            <InputGroup label="Purchase Price" value={property.financials.purchasePrice} onChange={(v) => handleFinancialChange('purchasePrice', v)} />
                            <InputGroup label="Closing Costs" value={property.financials.closingCosts} onChange={(v) => handleFinancialChange('closingCosts', v)} />
                            <InputGroup label="Renovation Budget" value={property.financials.renovationBudget} onChange={(v) => handleFinancialChange('renovationBudget', v)} />
                        </div>
                    </div>
                </div>

                {/* Pro Forma Chart */}
                <FinancialChart property={property} />
            </div>
        </div>
    );
};

// Helper
const InputGroup = ({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <div className="relative">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono text-right"
            />
        </div>
    </div>
);

export default Underwrite;
