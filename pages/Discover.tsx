import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Building2, TrendingUp, AlertCircle, Loader2, X } from 'lucide-react';
import { Property, PropertyStatus } from '../types';
import { getProperties, updateStatus, saveProperty } from '../services/propertyService';
import { MassGISService } from '../services/massgisService';
import { useNavigate } from 'react-router-dom';

const Discover = () => {
    const [leads, setLeads] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]); // MassGIS features
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        const allProps = await getProperties();
        // Filter for Discover phase
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
            await saveProperty(newProp);
            setSearchResults([]); // Clear search
            setSearchQuery('');
            loadLeads(); // Refresh list
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

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Discovery Pipeline</h1>
                    <p className="text-slate-500">Search and import properties from MassGIS records.</p>
                </div>

                {/* Search / Add Property */}
                <div className="relative w-full md:w-96 z-50">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Address (e.g. 123 Main St)..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={searching}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {searching ? <Loader2 className="animate-spin" /> : 'Search'}
                        </button>
                    </form>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center p-2 bg-slate-50 border-b border-slate-100">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">MassGIS Records</span>
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
                                            {res.attributes.CITY} • {res.attributes.USE_CODE} • Owner: {res.attributes.OWNER1}
                                        </div>
                                    </div>
                                    <Plus size={18} className="text-indigo-400 group-hover:text-indigo-600" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* List of Active Leads */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading pipeline...</div>
            ) : leads.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-slate-600">No Active Leads</h3>
                    <p className="text-slate-400 max-w-md mx-auto mt-2">
                        Use the search bar above to find a property in the MassGIS database and add it to your pipeline.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leads.map(property => (
                        <div key={property.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                            <div className="h-48 bg-slate-200 relative overflow-hidden">
                                {property.imageUrl ? (
                                    <img src={property.imageUrl} alt={property.address} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <Building2 size={48} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                    {property.assetClass}
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="font-bold text-lg text-slate-900 truncate">{property.address}</h3>
                                <p className="text-slate-500 text-sm mb-4">{property.city}, {property.state} {property.zip}</p>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-slate-400 uppercase">Year</div>
                                        <div className="font-semibold text-slate-700">{property.yearBuilt}</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-slate-400 uppercase">Units</div>
                                        <div className="font-semibold text-slate-700">{property.units}</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-slate-400 uppercase">SqFt</div>
                                        <div className="font-semibold text-slate-700">{property.sqft.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => handlePass(property.id)}
                                        className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        Pass
                                    </button>
                                    <button
                                        onClick={() => handleUnderwrite(property.id)}
                                        className="flex-1 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        Underwrite
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Discover;
