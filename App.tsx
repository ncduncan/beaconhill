import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Underwrite from './pages/Underwrite';
import Manage from './pages/Manage';
import SettingsPage from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
    return (
        <HashRouter>
            <ErrorBoundary>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/discover" element={<Discover />} />
                        <Route path="/underwrite" element={<Underwrite />} />
                        <Route path="/manage" element={<Manage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </ErrorBoundary>
        </HashRouter>
    );
};

export default App;