import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";
import { divIcon } from 'leaflet';
import { Property, PropertyStatus } from '../types';
import * as PropertyService from '../services/propertyService';
import { Link } from 'react-router-dom';
import { BrainCircuit, TrendingUp, Building, ArrowRight } from 'lucide-react';

// Custom Map Icons
const createIcon = (color: string) => divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

const Icons = {
    [PropertyStatus.DISCOVER]: createIcon('#3b82f6'), // Blue
    [PropertyStatus.UNDERWRITE]: createIcon('#f59e0b'), // Orange
    [PropertyStatus.MANAGE]: createIcon('#10b981'), // Green
    [PropertyStatus.PASSED]: createIcon('#94a3b8'), // Gray (Hidden)
    [PropertyStatus.DISPOSED]: createIcon('#94a3b8'), // Gray (Hidden)
};

const Dashboard = () => {
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        PropertyService.getProperties().then(setProperties);
    }, []);

    const discoverCount = properties.filter(p => p.status === PropertyStatus.DISCOVER).length;
    const underwriteCount = properties.filter(p => p.status === PropertyStatus.UNDERWRITE).length;
    const manageCount = properties.filter(p => p.status === PropertyStatus.MANAGE).length;

    // Default center (Boston)
    const [center, setCenter] = useState<[number, number]>([42.3601, -71.0589]);

    useEffect(() => {
        if (properties.length > 0) {
            const firstWithCoords = properties.find(p => p.latitude && p.longitude);
            if (firstWithCoords) {
                setCenter([firstWithCoords.latitude!, firstWithCoords.longitude!]);
            }
        }
    }, [properties]);

    return (
        <div className="flex h-full gap-4">
            {/* Sidebar Stats */}
            <div className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Portfolio Map</h2>
                    <p className="text-sm text-slate-500">Geospatial Overview</p>
                </div>

                {/* Pipeline Summary Cards */}
                <div className="space-y-3">
                    <Link to="/discover" className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors shadow-sm group">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <BrainCircuit className="text-blue-500" size={18} /> Discover
                            </h3>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{discoverCount}</span>
                        </div>
                        <p className="text-xs text-slate-500">New leads & AI opportunities</p>
                        <div className="mt-3 text-xs text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View List <ArrowRight size={12} />
                        </div>
                    </Link>

                    <Link to="/underwrite" className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400 transition-colors shadow-sm group">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp className="text-amber-500" size={18} /> Underwrite
                            </h3>
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{underwriteCount}</span>
                        </div>
                        <p className="text-xs text-slate-500">Active deal analysis</p>
                        <div className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View Pipeline <ArrowRight size={12} />
                        </div>
                    </Link>

                    <Link to="/manage" className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 transition-colors shadow-sm group">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Building className="text-emerald-500" size={18} /> Manage
                            </h3>
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{manageCount}</span>
                        </div>
                        <p className="text-xs text-slate-500">Owned assets & ops</p>
                        <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View Portfolio <ArrowRight size={12} />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
                <MapContainer key={center.join(',')} center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {properties.map(p => {
                        // More robust check for coordinates (0 is valid for some locations, though not MA)
                        if (p.latitude === undefined || p.longitude === undefined) return null;

                        return (
                            <Marker
                                key={p.id}
                                position={[p.latitude, p.longitude]}
                                icon={Icons[p.status] || Icons[PropertyStatus.PASSED]}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[150px]">
                                        <h3 className="font-bold text-sm mb-0.5">{p.address}</h3>
                                        <div className="text-[10px] text-slate-500 mb-2">{p.city}, MA • {p.assetClass}</div>
                                        <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                                            <div className="bg-slate-50 p-1 rounded">
                                                <div className="text-slate-400">UNITS</div>
                                                <div className="font-bold">{p.units}</div>
                                            </div>
                                            <div className="bg-slate-50 p-1 rounded">
                                                <div className="text-slate-400">VALUE</div>
                                                <div className="font-bold">${(p.financials.purchasePrice / 1000).toFixed(0)}k</div>
                                            </div>
                                        </div>
                                        <Link to={`/underwrite?id=${p.id}`} className="block text-center text-xs bg-indigo-600 text-white py-1.5 px-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                                            View Details
                                        </Link>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>

                {/* Legend overlay */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200 text-xs z-[1000]">
                    <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Discover</div>
                    <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Underwrite</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Manage</div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
