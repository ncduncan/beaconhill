import React, { useState, useEffect } from 'react';
import { Property, PropertyStatus } from '../types';
import * as PropertyService from '../services/propertyService';
import { Building, TrendingUp, AlertCircle, Trash2, Undo2 } from 'lucide-react';

const Manage = () => {
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        PropertyService.getProperties().then(props =>
            setProperties(props.filter(p => p.status === PropertyStatus.MANAGE))
        );
    }, []);

    const handleDispose = async (id: string) => {
        if (confirm("Are you sure you want to dispose of this asset? It will be archived.")) {
            await PropertyService.updateStatus(id, PropertyStatus.DISPOSED);
            setProperties(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleRevert = async (id: string) => {
        if (confirm("Move back to Underwriting?")) {
            await PropertyService.updateStatus(id, PropertyStatus.UNDERWRITE);
            setProperties(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Asset Management</h2>
                <p className="text-sm text-slate-500">Operational Portfolio</p>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Building className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500">No properties in management yet.</p>
                    <p className="text-sm text-slate-400">Acquire an asset in Underwriting to see it here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {properties.map(p => (
                        <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 flex justify-between items-start border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{p.address}</h3>
                                    <div className="text-sm text-slate-500 mt-1">{p.city}, MA • {p.units} Units</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRevert(p.id)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                                        title="Send back to Underwriting"
                                    >
                                        <Undo2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDispose(p.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded"
                                        title="Dispose Asset"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricBox label="Current Yield" value="8.4%" trend="+0.2%" good />
                                <MetricBox label="Occupancy" value="96%" trend="-2%" good={false} />
                                <MetricBox label="YTD NOI" value={`$${((p.financials.grossPotentialRent || 0) * 0.55).toLocaleString()}`} trend="On Target" good />
                            </div>

                            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center gap-3 text-sm text-slate-600">
                                <TrendingUp size={16} className="text-indigo-500" />
                                <span>Recent Insight: <span className="italic">Rents in {p.city} up 2% QoQ. Consider renewal bumps.</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MetricBox = ({ label, value, trend, good }: { label: string, value: string, trend: string, good: boolean }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className={`text-xs font-bold mt-1 ${good ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend}
        </div>
    </div>
);

export default Manage;
