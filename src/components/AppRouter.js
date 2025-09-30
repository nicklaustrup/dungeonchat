import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from '../pages/ChatPage';
import LandingPage from '../components/Landing/LandingPage';
import CampaignBrowser from '../components/Campaign/CampaignBrowser';
import CampaignDashboard from '../components/Campaign/CampaignDashboard';
import CampaignCreator from '../components/Campaign/CampaignCreator';
import AppNavigation from '../components/Navigation/AppNavigation';
import Breadcrumb from '../components/Navigation/Breadcrumb';
import { useFirebase } from '../services/FirebaseContext';

function AppRouter() {
  const { user } = useFirebase();

  // Require authentication for all routes except landing
  if (!user) {
    return <ChatPage />; // ChatPage handles sign-in when no user
  }

  return (
    <BrowserRouter>
      <div className="app-router-layout">
        <AppNavigation />
        <Breadcrumb />
        <Routes>
          {/* Landing page - default route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Lobby - existing general chat */}
          <Route path="/lobby" element={<ChatPage showHeader={false} />} />
          
          {/* Campaign routes */}
          <Route path="/campaigns" element={<CampaignBrowser />} />
          <Route path="/create-campaign" element={<CampaignCreator />} />
          <Route 
            path="/campaign/:campaignId" 
            element={<CampaignDashboard />} 
          />
          <Route 
            path="/campaign/:campaignId/chat" 
            element={<ChatPage campaignContext={true} showHeader={false} />} 
          />
          <Route 
            path="/campaign/:campaignId/chat/:channelId" 
            element={<ChatPage campaignContext={true} showHeader={false} />} 
          />
          
          {/* Fallback to lobby */}
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;