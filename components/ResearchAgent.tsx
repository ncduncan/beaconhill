import React, { useState } from 'react';
import { Send, Sparkles, Loader2, Bot, Info } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { MassGISService } from '../services/massgisService';
import { CATEGORY_TO_CODES } from '../constants/massgisMappings';

interface ResearchAgentProps {
    onResultsFound: (features: any[]) => void;
    onClose: () => void;
}

export const ResearchAgent: React.FC<ResearchAgentProps> = ({ onResultsFound, onClose }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'agent', text: string }[]>([
        { role: 'agent', text: "I can help you find properties in the MassGIS database. Try asking for '3-family homes in Lowell' or 'Commercial buildings in Worcester'." }
    ]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Step 1: Parse Intent with Gemini
            // We want to extract: City, Use Codes
            const prompt = `
                You are a real estate research assistant.
                The user is searching for properties in Massachusetts.
                Convert their query into a strictly formatted JSON object with these fields:
                - city: string (uppercase name of the city/town, e.g. "BOSTON")
                - propertyType: string (one of: "single family", "multifamily", "condo", "commercial", "land", "other")
                - useCodes: array of strings (MassGIS codes based on propertyType overlay if specific ones aren't clear, e.g. ["101"] for single family. If uncertain, leave empty)
                
                User Query: "${userMsg}"
                
                Respond ONLY with the JSON.
            `;

            const aiResponse = await GeminiService.generateText(prompt);
            let criteria;
            try {
                // Strip markdown code blocks if present
                const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                criteria = JSON.parse(cleanJson);
            } catch (err) {
                console.error("AI JSON Parse Error", err);
                throw new Error("I couldn't understand that search criteria. Please try again.");
            }

            // Step 2: Refine Use Codes locally if AI was generic
            let codes = criteria.useCodes || [];
            if (codes.length === 0 && criteria.propertyType && CATEGORY_TO_CODES[criteria.propertyType]) {
                codes = CATEGORY_TO_CODES[criteria.propertyType];
            }

            setMessages(prev => [...prev, {
                role: 'agent',
                text: `Searching for ${criteria.propertyType || 'properties'} in ${criteria.city}...`
            }]);

            // Step 3: Execute MassGIS Query
            // We need a custom query method in MassGISService for this advanced filter
            // Ideally passing "CITY = 'BOSTON' AND USE_CODE IN ('104','105')"
            // Since we only have searchProperties currently, we might need to extend it or do a direct call here.
            // Let's assume we extend MassGISService right now or use a direct fetch pattern here for the MVP agent.

            const results = await MassGISService.queryByCriteria(criteria.city, codes);

            if (results.length > 0) {
                setMessages(prev => [...prev, { role: 'agent', text: `I found ${results.length} properties matching your criteria.` }]);
                onResultsFound(results);
            } else {
                setMessages(prev => [...prev, { role: 'agent', text: "I didn't find any properties matching those strict criteria in the records I accessed." }]);
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'agent', text: "Sorry, I encountered an error while researching. Please try a simpler specific query." }]);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden flex flex-col h-96">
            <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-800 font-bold">
                    <Sparkles size={18} />
                    <span>Research Agent</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-700 shadow-sms rounded-tl-none border border-slate-200'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span className="text-xs text-slate-400"> Analyzing database...</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="E.g. Find 3-family homes in Somerville..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
