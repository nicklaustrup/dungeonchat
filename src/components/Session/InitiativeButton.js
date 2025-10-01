import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { initiativeService } from '../../services/initiativeService';
import './InitiativeButton.css';

const InitiativeButton = ({ campaignId, size = 'medium' }) => {
  const { firestore } = useFirebase();
  const [combatSummary, setCombatSummary] = useState(null);
  const [loading, setLoading] = useState(true);



  // Load combat summary
  useEffect(() => {
    if (!campaignId || !firestore) return;

    try {
      const unsubscribe = initiativeService.subscribeToInitiative(firestore, campaignId, (data, error) => {
        if (error) {
          console.error('Error subscribing to initiative:', error);
          setLoading(false);
          return;
        }
        
        if (data) {
          setCombatSummary({
            isActive: data.isActive,
            round: data.round,
            combatantsCount: data.combatants?.length || 0,
            currentTurn: data.currentTurn,
            currentCombatant: data.combatants?.[data.currentTurn] || null
          });
        } else {
          setCombatSummary({
            isActive: false,
            round: 1,
            combatantsCount: 0,
            currentTurn: 0,
            currentCombatant: null
          });
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up initiative subscription:', error);
      setLoading(false);
    }
  }, [campaignId, firestore]);

  if (loading) {
    return (
      <button className={`initiative-button ${size} loading`} disabled>
        <span className="button-icon">⚔️</span>
        <span className="button-text">Loading...</span>
      </button>
    );
  }

  if (!combatSummary) {
    return (
      <button className={`initiative-button ${size} inactive`} disabled>
        <span className="button-icon">⚔️</span>
        <span className="button-text">Initiative</span>
      </button>
    );
  }

  const getButtonStatus = () => {
    if (combatSummary.isActive) {
      return {
        status: 'active',
        text: `Round ${combatSummary.round}`,
        subtitle: combatSummary.currentCombatant ? 
          `${combatSummary.currentCombatant.name}'s Turn` : 
          `${combatSummary.combatantsCount} Combatants`,
        icon: '⚔️'
      };
    } else if (combatSummary.combatantsCount > 0) {
      return {
        status: 'ready',
        text: 'Ready to Start',
        subtitle: `${combatSummary.combatantsCount} Combatants`,
        icon: '🎲'
      };
    } else {
      return {
        status: 'inactive',
        text: 'Initiative',
        subtitle: 'No Combatants',
        icon: '⚔️'
      };
    }
  };

  const buttonStatus = getButtonStatus();

  return (
    <button 
      className={`initiative-button ${size} ${buttonStatus.status}`}
      title={`Initiative Tracker - ${buttonStatus.text}`}
    >
      <span className="button-icon">{buttonStatus.icon}</span>
      <div className="button-content">
        <span className="button-text">{buttonStatus.text}</span>
        {size !== 'small' && (
          <span className="button-subtitle">{buttonStatus.subtitle}</span>
        )}
      </div>
      {combatSummary.isActive && (
        <div className="active-indicator" />
      )}
    </button>
  );
};

export default InitiativeButton;