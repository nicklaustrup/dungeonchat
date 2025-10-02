import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { mapService } from '../../../services/vtt/mapService';
import { fogOfWarService } from '../../../services/vtt/fogOfWarService';
import { tokenService } from '../../../services/vtt/tokenService';
import MapCanvas from '../Canvas/MapCanvas';
import TokenManager from '../TokenManager/TokenManager';
import DeleteTokenModal from '../Canvas/DeleteTokenModal';
import ChatPage from '../../../pages/ChatPage';
import ChatPanel from './ChatPanel';
import PartyPanel from './PartyPanel';
import CampaignRules from '../../Campaign/CampaignRules';
import PartyManagement from '../../Session/PartyManagement';
import InitiativeTracker from '../../Session/InitiativeTracker';
import MapQueue from './MapQueue';
import EncounterBuilder from './EncounterBuilder';
import ResizablePanel from './ResizablePanel';
import CharacterSheetPanel from './CharacterSheetPanel';
import LightingPanel from '../Lighting/LightingPanel';
import VoiceChatPanel from '../../Voice/VoiceChatPanel';
import VoiceNotificationContainer, { setNotificationContainer } from '../../Voice/VoiceNotificationContainer';
import useTokens from '../../../hooks/vtt/useTokens';
import useLighting from '../../../hooks/vtt/useLighting';
import { 
  FiMessageSquare, 
  FiFileText, 
  FiUsers, 
  FiMap, 
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiTarget,
  FiUser
} from 'react-icons/fi';
import { FaHeadphones } from 'react-icons/fa';
import './VTTSession.css';
import '../../Campaign/CampaignChatHeader.css'; // For voice panel styles

/**
 * VTTSession - Main Virtual Tabletop Session Room
 * Real-time collaborative space for running game sessions
 * DM and Players share the same view with different capabilities
 */
function VTTSession() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user, firestore } = useContext(FirebaseContext);
  
  // Campaign & User state
  const [campaign, setCampaign] = useState(null);
  const [isUserDM, setIsUserDM] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Map state
  const [activeMap, setActiveMap] = useState(null);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  
  // Load tokens with real-time sync
  const { tokens } = useTokens(campaignId, activeMap?.id);
  
  // Get selected token object
  const selectedToken = tokens?.find(t => t.id === selectedTokenId || t.tokenId === selectedTokenId);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  
  // Panel state
  const [activePanel, setActivePanel] = useState(null); // 'chat', 'notes', 'party', 'maps', 'encounter', 'initiative'
  const [showTokenManager, setShowTokenManager] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Floating panel state
  const [floatingPanels, setFloatingPanels] = useState({
    chat: false,
    rules: false,
    party: false,
    initiative: false,
    characters: false
  });
  
  // Fog of War state
  const [fogOfWarEnabled, setFogOfWarEnabled] = useState(false);
  
  // Lighting state
  const [showLightingPanel, setShowLightingPanel] = useState(false);
  
  // Voice chat state
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [isVoiceMinimized, setIsVoiceMinimized] = useState(false);
  const [voicePosition, setVoicePosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isVoiceDragging, setIsVoiceDragging] = useState(false);
  const voiceDragStartRef = useRef({ x: 0, y: 0 });
  const notificationContainerRef = useRef(null);
  
  // Load lighting system for active map
  const lightingHook = useLighting(firestore, campaignId, activeMap?.id, activeMap?.lighting);
  
  // Help tooltip state
  const [helpTooltipDismissed, setHelpTooltipDismissed] = useState(false);

  // Hide app navigation on mount, restore on unmount
  useEffect(() => {
    // Hide the app navigation and breadcrumb
    const appNav = document.querySelector('.app-navigation');
    const breadcrumb = document.querySelector('.breadcrumb');
    
    if (appNav) appNav.style.display = 'none';
    if (breadcrumb) breadcrumb.style.display = 'none';

    // Restore on unmount
    return () => {
      if (appNav) appNav.style.display = '';
      if (breadcrumb) breadcrumb.style.display = '';
    };
  }, []);

  // Load campaign and check DM status
  useEffect(() => {
    const loadCampaign = async () => {
      if (!campaignId || !user || !firestore) return;

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const campaignRef = doc(firestore, 'campaigns', campaignId);
        const campaignSnap = await getDoc(campaignRef);

        if (campaignSnap.exists()) {
          const campaignData = { id: campaignSnap.id, ...campaignSnap.data() };
          setCampaign(campaignData);
          setIsUserDM(campaignData.dmId === user.uid);
          
          // Load active map
          if (campaignData.activeMapId) {
            const map = await mapService.getMap(firestore, campaignId, campaignData.activeMapId);
            setActiveMap(map);
          }
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, user, firestore]);

  // Auto-create player tokens for players with character sheets
  useEffect(() => {
    console.log('Auto-create player token check:', { 
      hasCampaign: !!campaign, 
      hasUser: !!user, 
      hasFirestore: !!firestore, 
      hasActiveMap: !!activeMap, 
      isUserDM,
      willRun: !!(campaign && user && firestore && activeMap && !isUserDM)
    });
    
    if (!campaign || !user || !firestore || !activeMap || isUserDM) return;

    const createPlayerToken = async () => {
      try {
        const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
        
        // First check if player has a character sheet
        const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', user.uid);
        const characterSnap = await getDoc(characterRef);
        
        if (!characterSnap.exists()) {
          console.log('Player has no character sheet, skipping token creation');
          return; // Only create tokens for players with character sheets
        }
        
        const character = characterSnap.data();
        
        // Check if player already has a token for this map
        const tokensRef = collection(firestore, 'campaigns', campaignId, 'vtt', activeMap.id, 'tokens');
        const q = query(tokensRef, where('ownerId', '==', user.uid), where('type', '==', 'pc'));
        const existingTokens = await getDocs(q);
        
        if (!existingTokens.empty) return; // Player already has a token on this map

        // Get user profile for photo
        const profileRef = doc(firestore, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        const profile = profileSnap.exists() ? profileSnap.data() : {};

        // Create staged player token
        const playerToken = {
          name: character.name || profile.displayName || user.displayName || 'Player',
          type: 'pc', // Use 'pc' to match TokenPalette
          imageUrl: profile.photoURL || user.photoURL || '',
          position: { x: 100, y: 100 },
          size: { width: 50, height: 50 },
          color: '#4a9eff',
          characterId: user.uid,
          ownerId: user.uid,
          staged: true, // Start in staging area
          isHidden: false,
          createdBy: user.uid
        };

        const createdToken = await tokenService.createToken(firestore, campaignId, activeMap.id, playerToken);
        console.log('Player token created and staged for:', character.name, 'Token ID:', createdToken, 'Token data:', playerToken);
      } catch (err) {
        console.error('Error creating player token:', err);
      }
    };

    createPlayerToken();
  }, [campaign, user, firestore, activeMap, isUserDM, campaignId]);

  // Subscribe to fog of war and sync state
  useEffect(() => {
    if (!firestore || !campaignId || !activeMap?.id) return;

    const unsubscribe = fogOfWarService.subscribeFogOfWar(firestore, campaignId, activeMap.id, (data) => {
      if (data) {
        setFogOfWarEnabled(data.enabled || false);
      } else {
        setFogOfWarEnabled(false);
      }
    });

    return () => unsubscribe();
  }, [firestore, campaignId, activeMap?.id]);

  // Handle map selection from queue
  const handleMapSelect = async (mapId) => {
    try {
      const map = await mapService.getMap(firestore, campaignId, mapId);
      setActiveMap(map);
      
      // DM can set this as the active map for all players
      if (isUserDM) {
        await mapService.setActiveMap(firestore, campaignId, mapId);
      }
    } catch (err) {
      console.error('Error loading map:', err);
    }
  };

  // Toggle a sidebar panel; ensure sidebar opens when selecting a panel
  const togglePanel = (panelName) => {
    setActivePanel(prev => {
      const next = prev === panelName ? null : panelName;
      if (next && !isSidebarOpen) {
        // Open sidebar if a new panel is being activated while it's hidden
        setIsSidebarOpen(true);
      }
      return next;
    });
  };

  // Toggle floating panel
  const toggleFloatingPanel = (panelName) => {
    setFloatingPanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // Close floating panel
  const closeFloatingPanel = (panelName) => {
    setFloatingPanels(prev => ({
      ...prev,
      [panelName]: false
    }));
  };

  // Toggle fog of war
  const handleToggleFog = async () => {
    if (!isUserDM || !activeMap) return;
    
    try {
      // Check if fog exists first
      const fogData = await fogOfWarService.getFogOfWar(firestore, campaignId, activeMap.id);
      
      if (!fogData) {
        // Initialize fog if it doesn't exist
        if (!activeMap.gridEnabled) {
          alert('Grid must be enabled to use Fog of War');
          return;
        }
        await handleInitializeFog();
      } else {
        // Toggle existing fog
        const newState = await fogOfWarService.toggleFogOfWar(firestore, campaignId, activeMap.id);
        setFogOfWarEnabled(newState);
      }
    } catch (err) {
      console.error('Error toggling fog of war:', err);
      alert('Failed to toggle fog of war: ' + err.message);
    }
  };

  // Initialize fog of war for new map
  const handleInitializeFog = async () => {
    if (!isUserDM || !activeMap || !activeMap.gridEnabled) return;
    
    try {
      const gridWidth = Math.ceil(activeMap.width / activeMap.gridSize);
      const gridHeight = Math.ceil(activeMap.height / activeMap.gridSize);
      
      await fogOfWarService.initializeFogOfWar(firestore, campaignId, activeMap.id, gridWidth, gridHeight);
      setFogOfWarEnabled(true);
    } catch (err) {
      console.error('Error initializing fog of war:', err);
    }
  };
  
  const confirmDeleteToken = async () => {
    if (!tokenToDelete || !activeMap) return;
    
    try {
      const tokenId = tokenToDelete.id || tokenToDelete.tokenId;
      await tokenService.deleteToken(firestore, campaignId, activeMap.id, tokenId);
      setSelectedTokenId(null);
      setShowDeleteModal(false);
      setTokenToDelete(null);
    } catch (err) {
      console.error('Error deleting token:', err);
      alert('Failed to delete token: ' + err.message);
    }
  };
  
  const cancelDeleteToken = () => {
    setShowDeleteModal(false);
    setTokenToDelete(null);
  };
  
  // Voice chat drag handlers
  const handleVoiceDragStart = (e) => {
    setIsVoiceDragging(true);
    voiceDragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!isVoiceDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - voiceDragStartRef.current.x;
      const deltaY = e.clientY - voiceDragStartRef.current.y;
      
      setVoicePosition(prev => ({
        x: Math.max(0, Math.min(window.innerWidth - 380, prev.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, prev.y + deltaY))
      }));
      
      voiceDragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsVoiceDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVoiceDragging]);

  // Setup notification container
  useEffect(() => {
    if (notificationContainerRef.current) {
      setNotificationContainer(notificationContainerRef.current);
    }
  }, []);

  const handleVoiceNotification = (notification) => {
    if (notificationContainerRef.current) {
      notificationContainerRef.current.addNotification(notification);
    }
  };

  if (loading) {
    return (
      <div className="vtt-session-loading">
        <div className="loading-spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="vtt-session-error">
        <h2>Campaign not found</h2>
        <p>The campaign you're looking for doesn't exist or you don't have access.</p>
      </div>
    );
  }

  return (
    <div className="vtt-session">
      {/* Top Toolbar */}
      <div className="vtt-toolbar">
        <div className="toolbar-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-pressed={isSidebarOpen}
          >
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h1 className="session-title">{campaign.name} - Live Session</h1>
          <span className="user-role-badge">
            {isUserDM ? '👑 Dungeon Master' : '🎭 Player'}
          </span>
        </div>

        <div className="toolbar-center">
          {/* Quick Action Buttons */}
          <button
            className={`toolbar-button ${activePanel === 'chat' || floatingPanels.chat ? 'active' : ''}`}
            onClick={() => {
              if (floatingPanels.chat) {
                // Close floating panel
                setFloatingPanels(prev => ({ ...prev, chat: false }));
              } else if (activePanel === 'chat') {
                // Pop out from sidebar
                setFloatingPanels(prev => ({ ...prev, chat: true }));
                setActivePanel(null);
                setIsSidebarOpen(false);
              } else {
                // Open in sidebar
                setActivePanel('chat');
                setIsSidebarOpen(true);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (!floatingPanels.chat) {
                // Pop out directly
                setFloatingPanels(prev => ({ ...prev, chat: true }));
                setActivePanel(null);
                setIsSidebarOpen(false);
              }
            }}
            title="Session Chat (Click to toggle, Right-click to pop out)"
            aria-label="Session Chat"
            aria-pressed={activePanel === 'chat' || floatingPanels.chat}
          >
            <FiMessageSquare />
            <span>Chat {floatingPanels.chat && '⬜'}</span>
          </button>

          <button
            className={`toolbar-button ${activePanel === 'rules' ? 'active' : ''}`}
            onClick={() => togglePanel('rules')}
            title="Campaign Rules"
            aria-label="Campaign Rules"
            aria-pressed={activePanel === 'rules'}
          >
            <FiFileText />
            <span>Rules</span>
          </button>

          <button
            className={`toolbar-button ${activePanel === 'party' || floatingPanels.party ? 'active' : ''}`}
            onClick={() => {
              if (floatingPanels.party) {
                // Close floating panel
                setFloatingPanels(prev => ({ ...prev, party: false }));
              } else if (activePanel === 'party') {
                // Pop out from sidebar
                setFloatingPanels(prev => ({ ...prev, party: true }));
                setActivePanel(null);
                setIsSidebarOpen(false);
              } else {
                // Open in sidebar
                setActivePanel('party');
                setIsSidebarOpen(true);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (!floatingPanels.party) {
                // Pop out directly
                setFloatingPanels(prev => ({ ...prev, party: true }));
                setActivePanel(null);
                setIsSidebarOpen(false);
              }
            }}
            title="Party Management (Click to toggle, Right-click to pop out)"
            aria-label="Party Management"
            aria-pressed={activePanel === 'party' || floatingPanels.party}
          >
            <FiUsers />
            <span>Party {floatingPanels.party && '⬜'}</span>
          </button>

          <button
            className={`toolbar-button ${activePanel === 'initiative' ? 'active' : ''}`}
            onClick={() => togglePanel('initiative')}
            title="Initiative Tracker"
            aria-label="Initiative Tracker"
            aria-pressed={activePanel === 'initiative'}
          >
            <FiTarget />
            <span>Initiative</span>
          </button>

          <button
            className={`toolbar-button ${floatingPanels.characters ? 'active' : ''}`}
            onClick={() => toggleFloatingPanel('characters')}
            title="Character Sheets"
            aria-label="Character Sheets"
            aria-pressed={floatingPanels.characters}
          >
            <FiUser />
            <span>Characters</span>
          </button>

          <button
            className={`toolbar-button ${showVoicePanel ? 'active' : ''}`}
            onClick={() => setShowVoicePanel(!showVoicePanel)}
            title={showVoicePanel ? 'Close Voice Chat' : 'Open Voice Chat'}
            aria-label="Voice Chat"
            aria-pressed={showVoicePanel}
          >
            <FaHeadphones />
            <span>Voice</span>
          </button>

          {isUserDM && (
            <>
              <button
                className={`toolbar-button ${activePanel === 'maps' ? 'active' : ''}`}
                onClick={() => togglePanel('maps')}
                title="Map Queue"
                aria-label="Map Queue"
                aria-pressed={activePanel === 'maps'}
              >
                <FiMap />
                <span>Maps</span>
              </button>

              <button
                className={`toolbar-button ${activePanel === 'encounter' ? 'active' : ''}`}
                onClick={() => togglePanel('encounter')}
                title="Encounter Builder"
                aria-label="Encounter Builder"
                aria-pressed={activePanel === 'encounter'}
              >
                <FiSettings />
                <span>Encounters</span>
              </button>
            </>
          )}
        </div>

        <div className="toolbar-right">
          {isUserDM && (
            <button
              className={`toolbar-button primary ${showTokenManager ? 'active' : ''}`}
              onClick={() => setShowTokenManager(!showTokenManager)}
              title="Token Manager"
              aria-label="Token Manager"
              aria-pressed={showTokenManager}
            >
              🎭 Tokens
            </button>
          )}

          <button
            className="toolbar-button exit-button"
            onClick={() => navigate(`/campaign/${campaignId}`)}
            title="Exit Session"
            aria-label="Exit VTT Session and return to campaign"
          >
            <FiLogOut />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vtt-content">
        {/* Left Sidebar (Collapsible) */}
        {isSidebarOpen && (
          <div className="vtt-sidebar">
            {activePanel === 'chat' && !floatingPanels.chat && (
              <ChatPage campaignContext={true} showHeader={false} />
            )}

            {activePanel === 'rules' && (
              <CampaignRules 
                campaignId={campaignId} 
                isUserDM={isUserDM}
              />
            )}

            {activePanel === 'party' && !floatingPanels.party && (
              <PartyManagement 
                campaignId={campaignId}
              />
            )}

            {activePanel === 'initiative' && (
              <InitiativeTracker campaignId={campaignId} />
            )}

            {activePanel === 'maps' && isUserDM && (
              <MapQueue
                campaignId={campaignId}
                activeMapId={activeMap?.id}
                onMapSelect={handleMapSelect}
              />
            )}

            {activePanel === 'encounter' && isUserDM && (
              <EncounterBuilder
                campaignId={campaignId}
                mapId={activeMap?.id}
              />
            )}

            {!activePanel && (
              <div className="sidebar-placeholder">
                <FiMenu size={48} />
                <p>Select a tool from the toolbar above</p>
              </div>
            )}
          </div>
        )}

        {/* Center Canvas Area */}
        <div className="vtt-canvas-container">
          {activeMap ? (
            <MapCanvas
              map={activeMap}
              campaignId={campaignId}
              width={window.innerWidth - (isSidebarOpen ? 420 : 0) - (showTokenManager ? 320 : 0)}
              height={window.innerHeight - 60}
              isDM={isUserDM}
              selectedTokenId={selectedTokenId}
              onTokenSelect={setSelectedTokenId}
              fogOfWarEnabled={fogOfWarEnabled}
              onToggleFog={handleToggleFog}
              onInitializeFog={handleInitializeFog}
            />
          ) : (
            <div className="no-map-placeholder">
              <FiMap size={64} />
              <h2>No Active Map</h2>
              <p>
                {isUserDM 
                  ? 'Select a map from the Map Queue to get started'
                  : 'Waiting for DM to load a map...'
                }
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Token Manager (DM only) */}
        {isUserDM && showTokenManager && activeMap && (
          <div className="vtt-token-sidebar">
            <TokenManager
              campaignId={campaignId}
              mapId={activeMap.id}
              selectedToken={selectedToken}
              onTokenCreated={(token) => {
                console.log('Token created:', token);
              }}
              onTokenUpdated={(tokenId, updates) => {
                console.log('Token updated:', tokenId);
              }}
              onTokenDeleted={(tokenId) => {
                console.log('Token deleted:', tokenId);
                if (selectedTokenId === tokenId) {
                  setSelectedTokenId(null);
                }
              }}
              onClose={() => setShowTokenManager(false)}
            />
          </div>
        )}
      </div>

      {/* Floating Resizable Panels (legacy) */}
      {/* NOTE: Chat & Party ResizablePanel versions removed to avoid duplicate floating windows.
          ChatPanel and PartyPanel below now provide the floating implementations. */}

      {floatingPanels.rules && (
        <ResizablePanel
          title="Campaign Rules"
          onClose={() => closeFloatingPanel('rules')}
          defaultWidth={500}
          defaultHeight={600}
          defaultPosition={{ x: 100, y: 120 }}
          zIndex={1002}
        >
          <CampaignRules campaignId={campaignId} isUserDM={isUserDM} />
        </ResizablePanel>
      )}

      {/* Party ResizablePanel removed (see note above) */}

      {floatingPanels.initiative && (
        <ResizablePanel
          title="Initiative Tracker"
          onClose={() => closeFloatingPanel('initiative')}
          defaultWidth={400}
          defaultHeight={500}
          defaultPosition={{ x: 200, y: 160 }}
          zIndex={1004}
        >
          <InitiativeTracker campaignId={campaignId} />
        </ResizablePanel>
      )}

      {floatingPanels.characters && (
        <ResizablePanel
          title="Character Sheets"
          onClose={() => closeFloatingPanel('characters')}
          defaultWidth={600}
          defaultHeight={700}
          defaultPosition={{ x: 250, y: 80 }}
          zIndex={1005}
        >
          <CharacterSheetPanel campaignId={campaignId} isUserDM={isUserDM} />
        </ResizablePanel>
      )}
      
      {/* Delete Token Modal */}
      {showDeleteModal && tokenToDelete && (
        <DeleteTokenModal
          token={tokenToDelete}
          onConfirm={confirmDeleteToken}
          onCancel={cancelDeleteToken}
        />
      )}

      {/* Floating Panels */}
      {floatingPanels.chat && (
        <ChatPanel
          key="floating-chat-panel"
          campaignId={campaignId}
          isFloating={true}
          onClose={() => closeFloatingPanel('chat')}
          onDock={() => {
            closeFloatingPanel('chat');
            setActivePanel('chat');
            setIsSidebarOpen(true);
          }}
        />
      )}

      {floatingPanels.party && (
        <PartyPanel
          key="floating-party-panel"
          campaignId={campaignId}
          isFloating={true}
          onClose={() => closeFloatingPanel('party')}
          onDock={() => {
            closeFloatingPanel('party');
            setActivePanel('party');
            setIsSidebarOpen(true);
          }}
        />
      )}

      {/* Lighting Control Panel */}
      {isUserDM && showLightingPanel && activeMap && (
        <LightingPanel
          lights={lightingHook.lights}
          globalLighting={lightingHook.globalLighting}
          onCreateLight={lightingHook.createLight}
          onUpdateLight={lightingHook.updateLight}
          onDeleteLight={lightingHook.deleteLight}
          onUpdateGlobalLighting={lightingHook.updateGlobalLighting}
          onClose={() => setShowLightingPanel(false)}
          isDM={isUserDM}
        />
      )}

      {/* Tool Instructions Tooltip */}
      {!helpTooltipDismissed && (
        <div className="vtt-help-tooltip">
          <span>💡 Alt+Click to ping | Select tool to draw/point</span>
          <button 
            className="dismiss-tooltip-btn" 
            onClick={() => setHelpTooltipDismissed(true)}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Chat Floating Panel */}
      <VoiceNotificationContainer ref={notificationContainerRef} />
      {showVoicePanel && campaign && (
        <div 
          className={`floating-voice-panel ${isVoiceDragging ? 'dragging' : ''}`}
          onMouseDown={handleVoiceDragStart}
          style={{
            position: 'fixed',
            top: `${voicePosition.y}px`,
            left: `${voicePosition.x}px`,
            cursor: isVoiceDragging ? 'grabbing' : 'grab',
            zIndex: 1000
          }}
        >
          <div className="floating-voice-header">
            <h3>🎙️ Voice Chat</h3>
            <div className="floating-voice-actions">
              <button
                className="btn-voice-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVoiceMinimized(!isVoiceMinimized);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title={isVoiceMinimized ? "Maximize" : "Minimize"}
              >
                {isVoiceMinimized ? '🗖' : '🗕'}
              </button>
              <button
                className="btn-voice-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVoicePanel(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
          {!isVoiceMinimized && (
            <VoiceChatPanel
              campaign={campaign}
              campaignId={campaignId}
              roomId="voice-general"
              isFloating={true}
              isMinimized={isVoiceMinimized}
              onMinimizeChange={setIsVoiceMinimized}
              onNotification={handleVoiceNotification}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default VTTSession;
