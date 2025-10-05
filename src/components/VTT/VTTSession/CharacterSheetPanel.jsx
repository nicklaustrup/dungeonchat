/**
 * CharacterSheetPanel Component
 * Character sheet viewer for VTT
 * DMs can see all character sheets, players see only their own
 */
import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { CharacterSheet } from '../../CharacterSheet';
import { createPlayerStagedToken } from '../../../services/characterSheetService';
import './CharacterSheetPanel.css';

function CharacterSheetPanel({ campaignId, isUserDM, initialCharacterId = null }) {
  const { user, firestore, storage } = useContext(FirebaseContext);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(initialCharacterId);
  const [loading, setLoading] = useState(true);
  const [generatingTokenFor, setGeneratingTokenFor] = useState(null);

  // Update selection when initialCharacterId changes
  useEffect(() => {
    if (initialCharacterId) {
      setSelectedCharacterId(initialCharacterId);
    }
  }, [initialCharacterId]);

  // Load characters
  useEffect(() => {
    if (!firestore || !campaignId) return;

    const charactersRef = collection(firestore, 'campaigns', campaignId, 'characters');
    
    // DM sees all characters, players see only their own
    const q = isUserDM 
      ? query(charactersRef)
      : query(charactersRef, where('userId', '==', user?.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chars = [];
      snapshot.forEach((doc) => {
        chars.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setCharacters(chars);
      
      // Auto-select first character if none selected
      if (chars.length > 0 && !selectedCharacterId) {
        setSelectedCharacterId(chars[0].id);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, campaignId, user, isUserDM, selectedCharacterId]);

  // Handle manual token generation for a character
  const handleGenerateToken = async (character) => {
    if (!isUserDM || generatingTokenFor) return;
    
    setGeneratingTokenFor(character.id);
    try {
      await createPlayerStagedToken(firestore, campaignId, character.id, character);
      console.log(`Successfully generated token for ${character.name}`);
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert(`Failed to generate token for ${character.name}: ${error.message}`);
    } finally {
      setGeneratingTokenFor(null);
    }
  };

  if (loading) {
    return (
      <div className="character-sheet-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading characters...</p>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="character-sheet-panel">
        <div className="empty-state">
          <h3>No Characters Found</h3>
          <p>
            {isUserDM 
              ? 'No player characters have been created yet.'
              : 'You don\'t have a character in this campaign yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-sheet-panel">
      {/* Character Tabs */}
      {characters.length > 1 && (
        <div className="character-tabs">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`character-tab ${selectedCharacterId === char.id ? 'active' : ''}`}
              onClick={() => setSelectedCharacterId(char.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedCharacterId(char.id);
                }
              }}
            >
              <span className="character-name">{char.name || 'Unnamed Character'}</span>
              <span className="character-class">
                {char.class || 'Unknown'} {char.level || 1}
              </span>
              {isUserDM && (
                <button
                  className="generate-token-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateToken(char);
                  }}
                  disabled={generatingTokenFor === char.id}
                  title="Generate map token for this character"
                >
                  {generatingTokenFor === char.id ? '⏳' : '🎭'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Character Sheet */}
      <div className="character-sheet-container">
        {selectedCharacterId && (
          <CharacterSheet
            firestore={firestore}
            storage={storage}
            campaignId={campaignId}
            userId={selectedCharacterId}
            isModal={false}
          />
        )}
      </div>
    </div>
  );
}

export default CharacterSheetPanel;
