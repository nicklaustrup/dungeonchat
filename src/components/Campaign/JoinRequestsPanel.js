import React, { useState, useEffect } from 'react';
import campaignRequestService from '../../services/campaign/campaignRequestService';
import { joinCampaign } from '../../services/campaign/campaignService';
import './JoinRequestsPanel.css';

export default function JoinRequestsPanel({ firestore, campaignId, dmId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const pendingRequests = await campaignRequestService.getPendingRequests(firestore, campaignId);
      setRequests(pendingRequests);
    } catch (err) {
      console.error('Error loading join requests:', err);
      setError('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (!window.confirm(`Approve ${request.username}'s request to join as ${request.characterName}?`)) {
      return;
    }

    try {
      setProcessingId(request.id);
      setError('');

      // Approve the request
      await campaignRequestService.approveJoinRequest(
        firestore,
        request.id,
        dmId
      );

      // Add user to campaign
      await joinCampaign(firestore, campaignId, request.userId, {
        characterName: request.characterName,
        characterClass: request.characterClass
      });

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== request.id));

      alert(`${request.username} has been added to the campaign!`);
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (request) => {
    if (!window.confirm(`Deny ${request.username}'s request to join?`)) {
      return;
    }

    try {
      setProcessingId(request.id);
      setError('');

      await campaignRequestService.denyJoinRequest(firestore, request.id, dmId);

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== request.id));

      alert(`Request from ${request.username} has been denied.`);
    } catch (err) {
      console.error('Error denying request:', err);
      setError(err.message || 'Failed to deny request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="join-requests-panel">
        <h3>Join Requests</h3>
        <div className="loading">Loading requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="join-requests-panel">
        <h3>Join Requests</h3>
        <p className="no-requests">No pending join requests</p>
      </div>
    );
  }

  return (
    <div className="join-requests-panel">
      <h3>Join Requests ({requests.length})</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="requests-list">
        {requests.map(request => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <div className="request-user">
                <strong>{request.username}</strong>
                <span className="request-character">
                  as {request.characterName}
                  {request.characterClass && ` (${request.characterClass})`}
                </span>
              </div>
              <div className="request-date">
                {request.createdAt?.toDate().toLocaleDateString()}
              </div>
            </div>

            {request.message && (
              <div className="request-message">
                <p><strong>Message:</strong></p>
                <p>{request.message}</p>
              </div>
            )}

            <div className="request-actions">
              <button
                className="btn btn-success"
                onClick={() => handleApprove(request)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeny(request)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? 'Processing...' : 'Deny'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
