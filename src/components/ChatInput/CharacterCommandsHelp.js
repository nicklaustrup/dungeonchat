/**
 * Character Commands Help Component
 * Shows available character-aware dice commands for D&D campaigns
 */

import React, { useState } from "react";
import { getAvailableAbilities } from "../../services/characterContextService";
import { SKILL_CHECK_PRESETS } from "../../services/diceService";
import "./CharacterCommandsHelp.css";

export function CharacterCommandsHelp({
  isOpen,
  onClose,
  hasCharacter = false,
}) {
  const [activeTab, setActiveTab] = useState("commands");

  if (!isOpen) return null;

  return (
    <div className="commands-help-overlay" onClick={onClose}>
      <div className="commands-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="commands-help-header">
          <h2>Character Commands {!hasCharacter && "(Requires Character)"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="commands-help-tabs">
          <button
            className={`tab-button ${activeTab === "commands" ? "active" : ""}`}
            onClick={() => setActiveTab("commands")}
          >
            Commands
          </button>
          <button
            className={`tab-button ${activeTab === "context" ? "active" : ""}`}
            onClick={() => setActiveTab("context")}
          >
            Message Types
          </button>
        </div>

        <div className="commands-help-content">
          {activeTab === "commands" && (
            <div className="commands-section">
              <div className="command-group">
                <h3>🎲 Dice Rolling Commands</h3>
                <div className="command-list">
                  <div className="command-item">
                    <code>/roll [dice]</code>
                    <span>Roll dice manually (e.g., /roll 1d20+5)</span>
                  </div>
                  <div className="command-item">
                    <code>/r [dice]</code>
                    <span>Short form of /roll</span>
                  </div>
                </div>
              </div>

              {hasCharacter && (
                <>
                  <div className="command-group">
                    <h3>
                      🎯 Skill Checks{" "}
                      {hasCharacter ? "" : "(Character Required)"}
                    </h3>
                    <div className="command-list">
                      <div className="command-item">
                        <code>/check [skill]</code>
                        <span>Roll skill check with character bonuses</span>
                      </div>
                      <div className="command-item">
                        <code>/skill [skill]</code>
                        <span>Alternative to /check</span>
                      </div>
                    </div>
                    <div className="command-examples">
                      <h4>Popular Skills:</h4>
                      <div className="skill-examples">
                        {SKILL_CHECK_PRESETS.slice(0, 8).map((skill) => (
                          <span
                            key={skill.label}
                            className="skill-example"
                            title={skill.description}
                          >
                            {skill.label.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <p className="example-text">
                        Example: <code>/check perception</code> or{" "}
                        <code>/skill stealth</code>
                      </p>
                    </div>
                  </div>

                  <div className="command-group">
                    <h3>
                      🛡️ Saving Throws{" "}
                      {hasCharacter ? "" : "(Character Required)"}
                    </h3>
                    <div className="command-list">
                      <div className="command-item">
                        <code>/save [ability]</code>
                        <span>Roll saving throw with character bonuses</span>
                      </div>
                      <div className="command-item">
                        <code>/saving [ability]</code>
                        <span>Alternative to /save</span>
                      </div>
                    </div>
                    <div className="command-examples">
                      <h4>Abilities:</h4>
                      <div className="ability-examples">
                        {getAvailableAbilities().map((ability) => (
                          <span key={ability} className="ability-example">
                            {ability.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <p className="example-text">
                        Example: <code>/save wisdom</code> or{" "}
                        <code>/saving constitution</code>
                      </p>
                    </div>
                  </div>

                  <div className="command-group">
                    <h3>
                      ⚔️ Attack Rolls{" "}
                      {hasCharacter ? "" : "(Character Required)"}
                    </h3>
                    <div className="command-list">
                      <div className="command-item">
                        <code>/attack</code>
                        <span>
                          Roll attack with character proficiency and ability
                          bonuses
                        </span>
                      </div>
                      <div className="command-item">
                        <code>/att</code>
                        <span>Short form of /attack</span>
                      </div>
                    </div>
                    <p className="example-text">
                      Example: <code>/attack</code> (uses best of STR/DEX +
                      proficiency)
                    </p>
                  </div>
                </>
              )}

              {!hasCharacter && (
                <div className="no-character-notice">
                  <p>
                    🎭 <strong>Create a character</strong> in this campaign to
                    unlock character-aware commands!
                  </p>
                  <p>
                    Character commands automatically include your ability
                    modifiers, proficiency bonuses, and skill ranks.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "context" && (
            <div className="context-section">
              <div className="context-group">
                <h3>🎭 In-Character (IC) Messages</h3>
                <p>
                  Messages that your character speaks or does in the game world.
                </p>
                <div className="context-examples">
                  <div className="context-example">
                    <code>"Hello there, traveler!"</code>
                    <span>Quoted speech</span>
                  </div>
                  <div className="context-example">
                    <code>*draws sword cautiously*</code>
                    <span>Actions in asterisks</span>
                  </div>
                  <div className="context-example">
                    <code>/me looks around nervously</code>
                    <span>Action command</span>
                  </div>
                  <div className="context-example">
                    <code>/ic I check for traps</code>
                    <span>Explicit IC command</span>
                  </div>
                </div>
              </div>

              <div className="context-group">
                <h3>💬 Out-of-Character (OOC) Messages</h3>
                <p>
                  Messages where you as a player are talking, not your
                  character.
                </p>
                <div className="context-examples">
                  <div className="context-example">
                    <code>/ooc I need to step away for 5 minutes</code>
                    <span>OOC command</span>
                  </div>
                  <div className="context-example">
                    <code>((What spell should I cast?))</code>
                    <span>Double parentheses</span>
                  </div>
                  <div className="context-example">
                    <code>[[Can we pause here?]]</code>
                    <span>Double brackets</span>
                  </div>
                  <div className="context-example">
                    <code>OOC: Great session tonight!</code>
                    <span>OOC prefix</span>
                  </div>
                </div>
              </div>

              <div className="context-group">
                <h3>📝 Regular Messages</h3>
                <p>Normal chat messages without special character context.</p>
                <div className="context-examples">
                  <div className="context-example">
                    <code>What time is our next session?</code>
                    <span>Regular planning discussion</span>
                  </div>
                  <div className="context-example">
                    <code>That was a great roll!</code>
                    <span>General commentary</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CharacterCommandsHelp;
