import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, AlertTriangle, CheckCircle } from 'lucide-react';

const Settings = () => {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-2.0-flash-exp');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('beaconhill_api_key');
        if (stored) setApiKey(stored);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('beaconhill_api_key', apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                    <div className="bg-slate-100 p-2 rounded-lg">
                        <SettingsIcon className="text-slate-700" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                        <p className="text-slate-500">Configure your AI agent connection.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Key size={16} /> Google Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber-500" />
                            Stored locally in your browser. Never sent to our servers.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        {saved ? <CheckCircle size={18} className="text-emerald-400" /> : <Save size={18} />}
                        {saved ? 'Settings Saved' : 'Save Configuration'}
                    </button>
                </form>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-indigo-900">
                <h3 className="font-bold mb-2">How to get a key?</h3>
                <p className="text-sm mb-4">You need a Google Gemini API key to power the AI underwriting features.</p>
                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                >
                    Get a free API Key <SettingsIcon size={14} />
                </a>
            </div>
        </div>
    );
};

export default Settings;
