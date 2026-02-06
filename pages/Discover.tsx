import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Building2, TrendingUp, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';
import { Property, PropertyStatus } from '../types';
import { getProperties, updateStatus, saveProperty } from '../services/propertyService';
import { MassGISService } from '../services/massgisService';
import { StreetViewService } from '../services/streetViewService';
import { getUseCodeDescription, getStyleDescription, getZoningDescription, getUnitCountSummary } from '../constants/massgisMappings';
import { useNavigate } from 'react-router-dom';
import { ResearchAgent } from '../components/ResearchAgent';

const Discover = () => {
    const [leads, setLeads] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Modal State
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [showAgent, setShowAgent] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        const allProps = await getProperties();
        setLeads(allProps.filter(p => p.status === PropertyStatus.DISCOVER));
        setLoading(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        const results = await MassGISService.searchProperties(searchQuery);
        setSearchResults(results);
        setSearching(false);
    };

    const handleAddProperty = async (feature: any) => {
        try {
            const newProp = MassGISService.convertToProperty(feature);

            // Proactively try to fetch a street view image
            const imageUrl = await StreetViewService.getFreeStreetViewImage(newProp.latitude || 0, newProp.longitude || 0);
            if (imageUrl) {
                newProp.streetViewImageUrl = imageUrl;
            }

            await saveProperty(newProp);
            setSearchResults([]);
            setSearchQuery('');
            loadLeads();
        } catch (e) {
            console.error("Failed to add property", e);
            alert("Could not import property data.");
        }
    };

    const handleUnderwrite = async (id: string) => {
        await updateStatus(id, PropertyStatus.UNDERWRITE);
        navigate('/underwrite');
    };

    const handlePass = async (id: string) => {
        if (confirm('Archive this lead?')) {
            await updateStatus(id, PropertyStatus.PASSED, 'Passed in Discovery phase');
            loadLeads();
        }
    };

    const handleAgentResults = async (features: any[]) => {
        setSearchResults(features);
        setShowAgent(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Discovery Pipeline</h1>
                    <p className="text-slate-500">Search and import properties from MassGIS records.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-96 z-40">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Address Search..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searching}
                                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50"
                            >
                                {searching ? <Loader2 className="animate-spin" /> : 'Find'}
                            </button>
                        </form>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto z-50">
                                <div className="flex justify-between items-center p-2 bg-slate-50 border-b border-slate-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Found Records</span>
                                    <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                </div>
                                {searchResults.map((res, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddProperty(res)}
                                        className="w-full text-left p-3 hover:bg-indigo-50 border-b border-slate-100 transition-colors flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-semibold text-slate-800">{res.attributes.SITE_ADDR}</div>
                                            <div className="text-xs text-slate-500">
                                                {res.attributes.CITY} • {getUseCodeDescription(res.attributes.USE_CODE)}
                                            </div>
                                        </div>
                                        <Plus size={18} className="text-indigo-400 group-hover:text-indigo-600" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Agent Toggle */}
                    <button
                        onClick={() => setShowAgent(!showAgent)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-all ${showAgent ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        <Sparkles size={18} /> Research Agent
                    </button>
                </div>
            </header>

            {/* Research Agent Panel */}
            {showAgent && (
                <div className="mb-6 p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg animate-in slide-in-from-top-4">
                    <ResearchAgent onResultsFound={handleAgentResults} onClose={() => setShowAgent(false)} />
                </div>
            )}

            {/* List of Active Leads */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading pipeline...</div>
            ) : leads.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-slate-600">No Active Leads</h3>
                    <p className="text-slate-400 max-w-md mx-auto mt-2">
                        Use the search bar to find properties or ask the Research Agent to find deals matching your criteria.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leads.map(property => (
                        <div
                            key={property.id}
                            onClick={() => setSelectedProperty(property)}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer overflow-hidden group flex flex-col"
                        >
                            <div className="h-40 bg-slate-200 relative overflow-hidden shrink-0">
                                {property.streetViewImageUrl ? (
                                    <img src={property.streetViewImageUrl} alt={property.address} className="w-full h-full object-cover" />
                                ) : property.imageUrl ? (
                                    <img src={property.imageUrl} alt={property.address} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <Building2 size={48} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                    {property.buildingType || property.assetClass}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-slate-900 truncate">{property.address}</h3>
                                <p className="text-slate-500 text-sm mb-4">{property.city}, {property.state}</p>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-slate-400 uppercase">Year</div>
                                        <div className="font-semibold text-slate-700">{property.yearBuilt}</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-slate-400 uppercase">Units</div>
                                        <div className="font-semibold text-slate-700">
                                            {getUnitCountSummary(property.units, property.useCode || '')}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-slate-400 uppercase">SqFt</div>
                                        <div className="font-semibold text-slate-700">{property.sqft.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => handlePass(property.id)}
                                        className="flex-1 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        Pass
                                    </button>
                                    <button
                                        onClick={() => handleUnderwrite(property.id)}
                                        className="flex-1 px-3 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        Underwrite
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Property Detail Modal */}
            {selectedProperty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="h-64 bg-slate-200 relative overflow-hidden">
                            {selectedProperty.streetViewImageUrl ? (
                                <img src={selectedProperty.streetViewImageUrl} alt={selectedProperty.address} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <Building2 size={64} opacity={0.5} />
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedProperty(null)}
                                className="absolute top-4 right-4 p-2 bg-white/70 hover:bg-white rounded-full transition-colors shadow-sm z-10"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-4 left-4 z-10">
                                <h2 className="text-2xl font-bold text-slate-900 bg-white/90 px-3 py-1 rounded-lg backdrop-blur shadow-sm">{selectedProperty.address}</h2>
                                <p className="text-slate-800 font-medium bg-white/90 px-3 py-1 rounded-lg backdrop-blur mt-1 inline-block shadow-sm">{selectedProperty.city}, {selectedProperty.state}</p>
                            </div>

                            {/* External Street View Link */}
                            <a
                                href={StreetViewService.getGoogleStreetViewLink(selectedProperty.latitude || 0, selectedProperty.longitude || 0)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-xs font-bold z-10"
                            >
                                <MapPin size={14} /> Street View
                            </a>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Property Details</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Year Built</dt>
                                            <dd className="font-semibold text-slate-900">{selectedProperty.yearBuilt}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Building Size</dt>
                                            <dd className="font-semibold text-slate-900">{selectedProperty.sqft.toLocaleString()} sqft</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Units</dt>
                                            <dd className="font-semibold text-slate-900">
                                                {getUnitCountSummary(selectedProperty.units, selectedProperty.useCode || '')}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Style</dt>
                                            <dd className="font-semibold text-slate-900">{getStyleDescription(selectedProperty.style || '')}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Zoning</dt>
                                            <dd className="font-semibold text-slate-900">{getZoningDescription(selectedProperty.zoning || '')}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Asset Class</dt>
                                            <dd className="font-semibold text-slate-900">{selectedProperty.assetClass}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Type</dt>
                                            <dd className="font-semibold text-slate-900">{selectedProperty.buildingType}</dd>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-slate-100 mt-2">
                                            <dt className="text-slate-500">Owner</dt>
                                            <dd className="font-semibold text-slate-700 text-right leading-tight max-w-[150px]">{selectedProperty.description.split('Owner: ')[1] || 'N/A'}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assessment & Financials</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Assessed Value</dt>
                                            <dd className="font-semibold text-slate-900">${selectedProperty.financials.purchasePrice.toLocaleString()}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Est. Taxes</dt>
                                            <dd className="font-semibold text-slate-900">${selectedProperty.financials.propertyTax.toLocaleString()}/yr</dd>
                                        </div>
                                        {selectedProperty.lastSalePrice && (
                                            <div className="flex justify-between pt-2 border-t border-slate-100 mt-2">
                                                <dt className="text-slate-500">Last Sale</dt>
                                                <dd className="font-semibold text-slate-900">
                                                    ${selectedProperty.lastSalePrice.toLocaleString()}
                                                    <span className="text-[10px] text-slate-400 ml-1 font-normal">
                                                        ({selectedProperty.lastSaleDate || 'N/A'})
                                                    </span>
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <AlertCircle size={10} /> MassGIS Record ID: {selectedProperty.id}
                                </span>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setSelectedProperty(null); }}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => { handleUnderwrite(selectedProperty.id); setSelectedProperty(null); }}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                >
                                    Start Underwriting
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discover;
