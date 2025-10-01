import React, { useEffect, useState } from 'react';
import { initiativeService } from '../../services/initiativeService';
import { subscribeToEncounters } from '../../services/encounterService';
import { useFirebase } from '../../services/FirebaseContext';
import './SessionQuickNav.css';

const tabs = [
  { key: 'session-notes', label: 'Notes', icon: '📝' },
  { key: 'encounters', label: 'Encounters', icon: '⚔️' },
  { key: 'initiative', label: 'Initiative', icon: '🎯' },
  { key: 'calendar', label: 'Calendar', icon: '📅' },
  { key: 'party', label: 'Party', icon: '👥' }
];

export default function SessionQuickNav({ activeTab, onNavigate, campaignId, firestore }) {
  const { firestore: ctxFs } = useFirebase();
  const fs = firestore || ctxFs;
  const [initiative, setInitiative] = useState(null);
  const [activeEncounter, setActiveEncounter] = useState(null);

  // Subscribe to initiative changes
  useEffect(() => {
    if (!fs || !campaignId) return;
    const unsub = initiativeService.subscribeToInitiative(fs, campaignId, (data) => {
      setInitiative(data);
    });
    return () => unsub && unsub();
  }, [fs, campaignId]);

  // Subscribe to active encounters
  useEffect(() => {
    if (!fs || !campaignId) return;
    const unsub = subscribeToEncounters(fs, campaignId, (encounters) => {
      const active = encounters.find(e => e.isActive && !e.isTemplate && !e.completedAt);
      setActiveEncounter(active || null);
    });
    return () => unsub && unsub();
  }, [fs, campaignId]);

  return (
    <div className="session-quick-nav">
      {tabs.map(t => {
        const isActive = t.key === activeTab;
        const showEncounterBadge = t.key === 'initiative' && activeEncounter;
        const showTurn = t.key === 'initiative' && initiative?.isActive;
        return (
          <button
            key={t.key}
            className={`quick-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate(t.key)}
          >
            <span className="icon">{t.icon}</span>
            <span className="label">{t.label}</span>
            {showEncounterBadge && (
              <span className="badge encounter">{activeEncounter?.name?.slice(0,10) || 'Enc'}</span>
            )}
            {showTurn && (
              <span className="badge turn">R{initiative.round} T{(initiative.currentTurn||0)+1}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}