import React from 'react';
import { useParams } from 'react-router-dom';

function CampaignDashboard() {
  const { campaignId } = useParams();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Campaign Dashboard</h1>
      <p>Campaign ID: {campaignId}</p>
      <p>This will show campaign overview, members, and navigation.</p>
      <p>Coming soon...</p>
    </div>
  );
}

export default CampaignDashboard;