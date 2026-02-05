import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import FinancialChart from './components/FinancialChart';
import { Property, PropertyStatus, AssetClass, Financials, UnderwritingAssumptions } from './types';
import * as PropertyService from './services/propertyService';
import * as GeminiService from './services/geminiService';
import { Plus, Loader2, Home, AlertCircle, TrendingUp, CheckCircle, Search as SearchIcon, MapPin, DollarSign, BrainCircuit, Settings, ExternalLink, ArrowRight, Building, Sparkles } from 'lucide-react';

// --- Page: Dashboard ---
const Dashboard = () => {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    PropertyService.getProperties().then(setProperties);
  }, []);

  const discoveryProps = properties.filter(p => p.status === PropertyStatus.DISCOVERY);
  const diligenceProps = properties.filter(p => p.status === PropertyStatus.DILIGENCE);
  const ownedProps = properties.filter(p => p.status === PropertyStatus.OWNED);

  const calculateYield = (p: Property) => {
    const f = p.financials;
    const noi = f.grossPotentialRent * (1 - f.vacancyRate/100) - f.operatingExpenses - f.propertyTax;
    return (noi / f.purchasePrice) * 100;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Investment Pipeline</h2>
           <p className="text-sm text-slate-500">Massachusetts Market Activity</p>
        </div>
        <Link to="/discover" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus size={18} /> New Search
        </Link>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-[500px]">
        
        {/* Stage 1: Discovery / AI Watchlist */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Sparkles size={18} className="text-amber-500" />
                    Discovery Watchlist
                </div>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">{discoveryProps.length}</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {discoveryProps.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">{p.assetClass}</span>
                            {p.aiScore && (
                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <BrainCircuit size={12} /> {p.aiScore}% Match
                                </span>
                            )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{p.address}</h4>
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.aiReasoning || p.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                            <div>Est. ${ (p.financials.purchasePrice/1000000).toFixed(1) }M</div>
                            <div className="text-right">Est. { (p.financials.grossPotentialRent/1000).toFixed(0) }k Rent</div>
                        </div>

                        <Link to={`/underwrite?id=${p.id}`} className="w-full text-center block text-xs bg-indigo-50 text-indigo-600 py-2 rounded font-medium hover:bg-indigo-100">
                            Move to Diligence
                        </Link>
                    </div>
                ))}
                {discoveryProps.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">No properties in watchlist.</div>
                )}
            </div>
        </div>

        {/* Stage 2: Diligence / Underwriting */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <TrendingUp size={18} className="text-blue-500" />
                    Active Underwriting
                </div>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">{diligenceProps.length}</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {diligenceProps.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">{p.assetClass}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{p.address}</h4>
                        <div className="flex justify-between items-center my-3 p-2 bg-slate-50 rounded">
                            <div className="text-xs text-slate-500">Proj. Yield</div>
                            <div className="text-sm font-mono font-bold text-emerald-600">{calculateYield(p).toFixed(2)}%</div>
                        </div>
                        <Link to={`/underwrite?id=${p.id}`} className="w-full text-center block text-xs bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                            Continue Analysis
                        </Link>
                    </div>
                ))}
                {diligenceProps.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">No active deals.</div>
                )}
            </div>
        </div>

         {/* Stage 3: Management */}
         <div className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Building size={18} className="text-emerald-500" />
                    Managed Portfolio
                </div>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">{ownedProps.length}</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {ownedProps.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{p.address}</h4>
                        <div className="text-xs text-slate-500 mb-2">{p.city}, MA • {p.units} Units</div>
                        <Link to="/manage" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1">
                            View Operations <ArrowRight size={12}/>
                        </Link>
                    </div>
                ))}
                {ownedProps.length === 0 && (
                     <div className="text-center py-8 text-slate-400 text-sm">No properties owned.</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// --- Page: Discover ---
const Discover = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [newProperty, setNewProperty] = useState<Partial<Property> | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAddress) return;
    setLoading(true);
    try {
        const enrichedData = await GeminiService.enrichPropertyData(searchAddress);
        
        const draftProp: Property = {
            id: Date.now().toString(),
            address: searchAddress,
            city: enrichedData.city || 'Unknown',
            state: 'MA',
            zip: enrichedData.zip || '',
            assetClass: AssetClass.MULTIFAMILY,
            sqft: enrichedData.sqft || 0,
            units: enrichedData.units || 1,
            yearBuilt: enrichedData.yearBuilt || 2000,
            description: enrichedData.description || 'No description available',
            status: PropertyStatus.DISCOVERY,
            aiScore: Math.floor(Math.random() * (95 - 75) + 75), // Mock AI score for demo
            aiReasoning: "Strong location fundamentals with value-add potential detected in market data.",
            imageUrl: `https://picsum.photos/800/600?random=${Date.now()}`,
            financials: {
                purchasePrice: enrichedData.financials?.purchasePrice || 0,
                grossPotentialRent: enrichedData.financials?.grossPotentialRent || 0,
                vacancyRate: 5,
                operatingExpenses: enrichedData.financials?.operatingExpenses || 0,
                propertyTax: enrichedData.financials?.propertyTax || 0,
                capitalReserves: enrichedData.financials?.capitalReserves || 0,
            },
            assumptions: {
                marketRentGrowth: 3,
                expenseGrowth: 2,
                exitCapRate: 6,
                holdPeriodYears: 10
            }
        };
        setNewProperty(draftProp);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const saveToPipeline = async (status: PropertyStatus) => {
      if(newProperty) {
          const propToSave = { ...newProperty, status } as Property;
          await PropertyService.saveProperty(propToSave);
          if (status === PropertyStatus.DILIGENCE) {
             navigate(`/underwrite?id=${propToSave.id}`);
          } else {
             // Saved to watchlist
             navigate('/');
          }
      }
  };

  return (
    <div className="space-y-8">
       {/* Search Hero */}
       <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Discover New Assets</h2>
            <p className="text-indigo-100 mb-8 max-w-xl">Enter an address in Massachusetts. Our AI agent will estimate preliminary underwriting metrics and link to official records.</p>
            
            <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
                <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        placeholder="e.g. 500 Boylston St, Boston, MA"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 border-0 focus:ring-4 focus:ring-indigo-400/50 shadow-lg"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-70 shadow-lg"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <SearchIcon />}
                    Analyze
                </button>
            </form>
          </div>
          {/* Decorative background element */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
       </div>

       {/* Utilities */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <a 
             href="https://maps.massgis.digital.mass.gov/MassMapper/MassMapper.html" 
             target="_blank" 
             rel="noopener noreferrer"
             className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors group"
           >
             <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        Official MA Property Records <ExternalLink size={14} className="text-slate-400"/>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Access the MassGIS Interactive Map to verify parcel lines, ownership, and tax data.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                    <MapPin className="text-indigo-600" size={24}/>
                </div>
             </div>
           </a>
       </div>

       {newProperty && (
           <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-fade-in ring-1 ring-indigo-100">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                   <div>
                       <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-bold text-slate-900">{newProperty.address}</h3>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <BrainCircuit size={14} /> {newProperty.aiScore}% Match
                            </span>
                       </div>
                       <p className="text-slate-500">{newProperty.city}, {newProperty.state} {newProperty.zip}</p>
                   </div>
                   <div className="flex gap-3">
                        <button 
                           onClick={() => saveToPipeline(PropertyStatus.DISCOVERY)} 
                           className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                           Save to Watchlist
                        </button>
                        <button 
                           onClick={() => saveToPipeline(PropertyStatus.DILIGENCE)} 
                           className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
                        >
                           Start Underwriting <ArrowRight size={18} />
                        </button>
                   </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                   <DataPoint label="Est. Price" value={`$${newProperty.financials?.purchasePrice.toLocaleString()}`} />
                   <DataPoint label="Est. Rent/Yr" value={`$${newProperty.financials?.grossPotentialRent.toLocaleString()}`} />
                   <DataPoint label="Sqft" value={newProperty.sqft?.toLocaleString()} />
                   <DataPoint label="Year Built" value={newProperty.yearBuilt?.toString()} />
               </div>
               
               <div className="bg-slate-50 p-6 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                   <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Property Description</h4>
                   {newProperty.description}
               </div>
           </div>
       )}
    </div>
  );
};

// --- Page: Underwrite ---
const Underwrite = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'financial' | 'ai'>('financial');
    const [loadingAI, setLoadingAI] = useState(false);
    
    // Parse query params for direct navigation
    const query = new URLSearchParams(window.location.search);
    const queryId = query.get('id');

    useEffect(() => {
        const load = async () => {
            const props = await PropertyService.getProperties();
            // Filter: show both Diligence and Discovery items in sidebar if selected, but primarily Diligence
            const validProps = props.filter(p => 
                p.status === PropertyStatus.DILIGENCE || 
                p.status === PropertyStatus.OWNED || 
                p.status === PropertyStatus.DISCOVERY // Allow editing Watchlist items too
            );
            setProperties(validProps);
            
            if (queryId && validProps.some(p => p.id === queryId)) {
                setSelectedId(queryId);
            } else if (validProps.length > 0 && !selectedId) {
                // Default to first Diligence item if possible
                const firstDiligence = validProps.find(p => p.status === PropertyStatus.DILIGENCE);
                setSelectedId(firstDiligence ? firstDiligence.id : validProps[0].id);
            }
        };
        load();
    }, [queryId]);

    const activeProperty = properties.find(p => p.id === selectedId);

    const handleGenerateInsight = async () => {
        if (!activeProperty) return;
        setLoadingAI(true);
        const plan = await GeminiService.generateValueAddPlan(activeProperty);
        
        const updated = { ...activeProperty, aiValuePlan: plan, lastAiUpdate: new Date().toISOString() };
        await PropertyService.saveProperty(updated);
        
        // Update local state
        setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
        setLoadingAI(false);
    };

    const handleFinancialChange = async (field: keyof Financials, value: string) => {
        if (!activeProperty) return;
        const numValue = parseFloat(value) || 0;
        const updated = {
            ...activeProperty,
            financials: { ...activeProperty.financials, [field]: numValue }
        };
        // Update local immediately for UI responsiveness
        setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
        await PropertyService.saveProperty(updated);
    };

    const handlePromoteToDiligence = async () => {
        if (!activeProperty) return;
        const updated = { ...activeProperty, status: PropertyStatus.DILIGENCE };
        await PropertyService.saveProperty(updated);
        setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
    }

    const handlePurchase = async () => {
        if(!activeProperty) return;
        if(confirm("Ready to acquire this asset? It will move to Management.")) {
            const updated = { ...activeProperty, status: PropertyStatus.OWNED };
            await PropertyService.saveProperty(updated);
            // Navigate to manage
            window.location.href = '#/manage';
        }
    };

    if (!activeProperty) return <div className="p-8 text-center text-slate-500">No properties available. Go to Discover to add one.</div>;

    return (
        <div className="flex h-[calc(100vh-8rem)]">
            {/* Property List Sidebar */}
            <div className="w-64 border-r border-slate-200 pr-4 overflow-y-auto shrink-0">
                <h3 className="font-bold text-slate-900 mb-4 px-2">Properties</h3>
                <div className="space-y-2">
                    {properties.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
                                selectedId === p.id 
                                ? 'bg-indigo-50 text-indigo-700 font-medium border-indigo-200' 
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-transparent'
                            }`}
                        >
                            <div className="truncate font-medium">{p.address}</div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-slate-400">{p.city}</span>
                                <StatusBadge status={p.status} small />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Analysis Area */}
            <div className="flex-1 pl-8 overflow-y-auto pr-2">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            {activeProperty.address}
                            <span className="text-sm font-normal px-2 py-1 bg-slate-100 rounded text-slate-500 border border-slate-200">{activeProperty.assetClass}</span>
                        </h2>
                        <div className="text-sm text-slate-500 mt-1">
                             Status: <span className="font-medium text-slate-700">{activeProperty.status}</span>
                             {activeProperty.status === PropertyStatus.DISCOVERY && (
                                 <span className="ml-2 text-indigo-600 cursor-pointer hover:underline" onClick={handlePromoteToDiligence}>
                                     (Click to start full Diligence)
                                 </span>
                             )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('financial')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'financial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Financials
                            </button>
                            <button 
                                onClick={() => setActiveTab('ai')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                AI Value Agent
                            </button>
                        </div>
                        {activeProperty.status !== PropertyStatus.OWNED && (
                            <button onClick={handlePurchase} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
                                <CheckCircle size={16} /> Acquire Asset
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'financial' ? (
                    <div className="space-y-8 animate-fade-in">
                        {/* Input Grid */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Settings size={18} /> Underwriting Assumptions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputGroup label="Purchase Price ($)" value={activeProperty.financials.purchasePrice} onChange={(v) => handleFinancialChange('purchasePrice', v)} />
                                <InputGroup label="Gross Potential Rent ($/yr)" value={activeProperty.financials.grossPotentialRent} onChange={(v) => handleFinancialChange('grossPotentialRent', v)} />
                                <InputGroup label="Vacancy Rate (%)" value={activeProperty.financials.vacancyRate} onChange={(v) => handleFinancialChange('vacancyRate', v)} />
                                <InputGroup label="Operating Expenses ($/yr)" value={activeProperty.financials.operatingExpenses} onChange={(v) => handleFinancialChange('operatingExpenses', v)} />
                                <InputGroup label="Property Tax ($/yr)" value={activeProperty.financials.propertyTax} onChange={(v) => handleFinancialChange('propertyTax', v)} />
                                <InputGroup label="Cap Reserves ($/yr)" value={activeProperty.financials.capitalReserves} onChange={(v) => handleFinancialChange('capitalReserves', v)} />
                            </div>
                        </div>

                        {/* Charts */}
                        <FinancialChart property={activeProperty} />
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full animate-fade-in flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BrainCircuit className="text-indigo-500" />
                                Value Unlock Potential
                            </h3>
                            <button 
                                onClick={handleGenerateInsight}
                                disabled={loadingAI}
                                className="text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                            >
                                {loadingAI ? 'Thinking...' : 'Refresh Analysis'}
                            </button>
                        </div>
                        
                        <div className="prose prose-slate max-w-none flex-1 overflow-y-auto">
                            {activeProperty.aiValuePlan ? (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                   {/* Simple replacement for markdown if needed */}
                                   {activeProperty.aiValuePlan}
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                    <BrainCircuit size={48} className="mb-4 opacity-50" />
                                    <p>Ask the AI Agent to identify hidden value.</p>
                                    <button onClick={handleGenerateInsight} className="mt-4 text-indigo-600 font-medium hover:underline">Start Analysis</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Page: Manage ---
const Manage = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [insights, setInsights] = useState<Record<string, string>>({});

    useEffect(() => {
        PropertyService.getProperties().then(props => 
            setProperties(props.filter(p => p.status === PropertyStatus.OWNED))
        );
    }, []);

    const handleGetTrends = async (p: Property) => {
        setInsights(prev => ({...prev, [p.id]: "Analyzing market trends..."}));
        const trend = await GeminiService.analyzeManagementTrends(p);
        setInsights(prev => ({...prev, [p.id]: trend}));
    }

    if(properties.length === 0) {
        return <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">No properties owned yet. Complete an acquisition in Underwrite.</div>
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Property Management</h2>
            <div className="grid grid-cols-1 gap-6">
                {properties.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between">
                             <div>
                                <h3 className="text-lg font-bold text-slate-900">{p.address}</h3>
                                <div className="text-sm text-slate-500 mt-1 flex gap-4">
                                    <span>{p.city}, MA</span>
                                    <span>{p.units} Units</span>
                                    <span>Built {p.yearBuilt}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-2xl font-bold text-emerald-600">
                                    {(( (p.financials.grossPotentialRent * (1 - p.financials.vacancyRate/100) - p.financials.operatingExpenses) / p.financials.purchasePrice ) * 100).toFixed(2)}%
                                </div>
                                <div className="text-xs text-slate-400 uppercase tracking-wide">Current Yield</div>
                             </div>
                        </div>
                        <div className="p-6 bg-slate-50">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                    <TrendingUp size={16} /> Market & Strategic Trends
                                </h4>
                                <button 
                                    onClick={() => handleGetTrends(p)}
                                    className="text-xs bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-100 text-indigo-600"
                                >
                                    Update Intelligence
                                </button>
                            </div>
                            <div className="text-sm text-slate-600 bg-white p-4 rounded border border-slate-200 min-h-[100px]">
                                {insights[p.id] ? (
                                    <div className="whitespace-pre-wrap">{insights[p.id]}</div>
                                ) : (
                                    <p className="italic text-slate-400">No recent market intelligence updates.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Shared Components ---

const MetricCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-full">{icon}</div>
    </div>
);

const StatusBadge = ({ status, small }: { status: PropertyStatus, small?: boolean }) => {
    const styles = {
        [PropertyStatus.DISCOVERY]: 'bg-blue-100 text-blue-700',
        [PropertyStatus.DILIGENCE]: 'bg-amber-100 text-amber-700',
        [PropertyStatus.OWNED]: 'bg-emerald-100 text-emerald-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full font-bold ${styles[status]} ${small ? 'text-[10px]' : 'text-xs'}`}>
            {status}
        </span>
    );
};

const DataPoint = ({ label, value }: { label: string, value?: string }) => (
    <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-slate-900 text-lg">{value || '-'}</p>
    </div>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</label>
        <input 
            type="number" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);

// --- App Root ---

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/underwrite" element={<Underwrite />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;