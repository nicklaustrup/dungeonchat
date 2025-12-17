import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCachedUserProfile } from "../../services/cache";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useCachedUserProfile();

  // Use username from profile, fallback to display name, then to 'Adventurer'
  const displayName = profile?.username || user?.displayName || "Adventurer";

  const navigationOptions = [
    {
      title: "General Lobby",
      description: "Join the main chat room and talk with the community",
      path: "/lobby",
      icon: "💬",
    },
    {
      title: "Browse Campaigns",
      description: "Discover and join D&D campaigns created by other players",
      path: "/campaigns",
      icon: "🗡️",
    },
    {
      title: "Create Campaign",
      description: "Start your own D&D campaign and invite players to join",
      path: "/create-campaign",
      icon: "⚔️",
    },
  ];

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <h1>Welcome to DungeonChat!</h1>
          <p className="welcome-message">
            Hello {displayName}! Choose your path below:
          </p>
        </div>

        <div className="navigation-grid">
          {navigationOptions.map((option, index) => (
            <div
              key={index}
              className="nav-card"
              onClick={() => navigate(option.path)}
            >
              <div className="nav-icon">{option.icon}</div>
              <div className="nav-content">
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
              <div className="nav-arrow">→</div>
            </div>
          ))}
        </div>

        <div className="landing-footer">
          <p>
            New to D&D? Start with the <strong>General Lobby</strong> to meet
            other players, or <strong>Browse Campaigns</strong> to find
            beginner-friendly games!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
