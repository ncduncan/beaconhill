import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, AlertTriangle, CheckCircle, FolderOpen, Download, HardDrive, Database } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';

const Settings = () => {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);

    const [storageConfigured, setStorageConfigured] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [downloadStatus, setDownloadStatus] = useState<string>('');

    useEffect(() => {
        const stored = localStorage.getItem('beaconhill_api_key');
        if (stored) setApiKey(stored);

        StorageService.isConfigured().then(setStorageConfigured);
    }, []);

    const handleSaveKey = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('beaconhill_api_key', apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleSetFolder = async () => {
        try {
            await StorageService.setDirectory();
            setStorageConfigured(true);
        } catch (e) {
            console.error(e);
            alert("Could not access folder. Please try again.");
        }
    };

    const handleSync = async () => {
        if (!storageConfigured) {
            alert("Please select a storage folder first.");
            return;
        }

        if (confirm("Download ~2GB of MassGIS data? This may take several minutes.")) {
            setDownloadStatus('Downloading...');
            setDownloadProgress(0);
            try {
                await SyncService.downloadStatewideParcels((pct) => {
                    setDownloadProgress(pct);
                });
                setDownloadStatus('Complete');
                setDownloadProgress(100);
            } catch (e) {
                console.error(e);
                setDownloadStatus('Failed. Check console.');
                setDownloadProgress(null);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <SettingsIcon className="text-slate-700" size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
                    <p className="text-slate-500">Configure connections and data storage.</p>
                </div>
            </div>

            {/* API Key Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Key className="text-indigo-500" size={20} /> AI Agent Connection
                </h3>

                <form onSubmit={handleSaveKey} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Google Gemini API Key</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono text-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {saved && <CheckCircle className="text-emerald-500 animate-pulse" size={20} />}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber-500" />
                            Stored locally in browser.
                        </p>
                    </div>
                    <button
                        type="submit"
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-all text-sm"
                    >
                        Save Configuration
                    </button>
                </form>
            </div>

            {/* Storage Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <HardDrive className="text-blue-500" size={20} /> Data Storage
                </h3>

                <div className="flex items-start gap-4 mb-6">
                    <div className={`p-4 rounded-xl border-2 border-dashed ${storageConfigured ? 'border-emerald-200 bg-emerald-50' : 'border-slate-300 bg-slate-50'} flex-1`}>
                        <div className="flex items-center gap-3 mb-2">
                            <FolderOpen className={storageConfigured ? "text-emerald-600" : "text-slate-400"} />
                            <span className="font-bold text-slate-700">
                                {storageConfigured ? "Local Storage Active" : "No Folder Selected"}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Select a local directory to store persistent property data and large map files.
                            This enables the "Private First" architecture.
                        </p>
                        <button
                            onClick={handleSetFolder}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 shadow-sm"
                        >
                            {storageConfigured ? "Change Directory" : "Select Data Folder"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Sync Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Database className="text-emerald-500" size={20} /> MassGIS Data Sync
                </h3>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <h4 className="font-bold text-slate-900">Parcel Shapefiles (Level 3)</h4>
                        <p className="text-sm text-slate-500">Official MassGIS Property Boundaries (~2GB)</p>
                        {downloadStatus && (
                            <div className="mt-2 text-sm font-medium text-indigo-600 flex items-center gap-2">
                                {downloadStatus}
                                {downloadProgress !== null && <span className="text-slate-400">({downloadProgress}%)</span>}
                            </div>
                        )}
                        {downloadProgress !== null && (
                            <div className="w-48 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={!storageConfigured || downloadProgress !== null}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Download size={18} /> Download
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                    *Requires a configured local storage folder. Downloads directly to disk to save memory.
                </p>
            </div>
        </div>
    );
};

export default Settings;
