import React, { useEffect, useState } from "react";
import { audioService } from "../../../services/vtt/audioService";
import "./AudioController.css";

export default function AudioController({
  firestore,
  campaignId,
  open,
  onClose,
  isDM,
  pushUndo,
}) {
  const [tracks, setTracks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (!open) return;
    const unsub = audioService.subscribe(firestore, campaignId, setTracks);
    return () => unsub();
  }, [open, firestore, campaignId]);

  if (!open) return null;

  return (
    <div className="audio-controller">
      <div className="ac-header">
        <span>Ambient Audio</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="ac-body">
        {isDM && (
          <div className="ac-add">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              placeholder="Audio URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <label className="vol-row">
              Vol
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
              />
            </label>
            <button
              disabled={!url.trim()}
              onClick={async () => {
                await audioService.addTrack(firestore, campaignId, {
                  title,
                  url,
                  volume,
                });
                setTitle("");
                setUrl("");
              }}
            >
              Add
            </button>
          </div>
        )}
        <div className="ac-track-list">
          {tracks.map((t) => (
            <div
              key={t.id}
              className={`ac-track ${t.isPlaying ? "playing" : ""}`}
            >
              <div className="ac-track-main">
                <span className="ac-track-title">{t.title}</span>
                <span className="ac-track-vol">
                  {Math.round((t.volume ?? 1) * 100)}%
                </span>
              </div>
              <div className="ac-track-actions">
                {isDM && (
                  <>
                    <button
                      onClick={async () => {
                        const before = t.volume ?? 1;
                        const after = Math.min(1, before + 0.1);
                        await audioService.updateTrack(
                          firestore,
                          campaignId,
                          t.id,
                          { volume: after }
                        );
                        pushUndo &&
                          pushUndo({
                            undo: () =>
                              audioService.updateTrack(
                                firestore,
                                campaignId,
                                t.id,
                                { volume: before }
                              ),
                            redo: () =>
                              audioService.updateTrack(
                                firestore,
                                campaignId,
                                t.id,
                                { volume: after }
                              ),
                          });
                      }}
                    >
                      +Vol
                    </button>
                    <button
                      onClick={async () => {
                        const before = t.volume ?? 1;
                        const after = Math.max(0, before - 0.1);
                        await audioService.updateTrack(
                          firestore,
                          campaignId,
                          t.id,
                          { volume: after }
                        );
                        pushUndo &&
                          pushUndo({
                            undo: () =>
                              audioService.updateTrack(
                                firestore,
                                campaignId,
                                t.id,
                                { volume: before }
                              ),
                            redo: () =>
                              audioService.updateTrack(
                                firestore,
                                campaignId,
                                t.id,
                                { volume: after }
                              ),
                          });
                      }}
                    >
                      -Vol
                    </button>
                    <button
                      onClick={async () => {
                        if (!t.isPlaying) {
                          // play exclusive
                          const previouslyPlaying = tracks
                            .filter((x) => x.isPlaying && x.id !== t.id)
                            .map((x) => ({ id: x.id }));
                          await audioService.playExclusive(
                            firestore,
                            campaignId,
                            t.id
                          );
                          pushUndo &&
                            pushUndo({
                              undo: async () => {
                                await audioService.stopTrack(
                                  firestore,
                                  campaignId,
                                  t.id
                                );
                                for (const p of previouslyPlaying) {
                                  await audioService.updateTrack(
                                    firestore,
                                    campaignId,
                                    p.id,
                                    { isPlaying: true }
                                  );
                                }
                              },
                              redo: () =>
                                audioService.playExclusive(
                                  firestore,
                                  campaignId,
                                  t.id
                                ),
                            });
                        } else {
                          await audioService.stopTrack(
                            firestore,
                            campaignId,
                            t.id
                          );
                          pushUndo &&
                            pushUndo({
                              undo: () =>
                                audioService.updateTrack(
                                  firestore,
                                  campaignId,
                                  t.id,
                                  { isPlaying: true }
                                ),
                              redo: () =>
                                audioService.stopTrack(
                                  firestore,
                                  campaignId,
                                  t.id
                                ),
                            });
                        }
                      }}
                    >
                      {t.isPlaying ? "Stop" : "Play"}
                    </button>
                    <button
                      onClick={async () => {
                        const snapshot = { ...t };
                        await audioService.deleteTrack(
                          firestore,
                          campaignId,
                          t.id
                        );
                        pushUndo &&
                          pushUndo({
                            undo: () =>
                              audioService.addTrack(
                                firestore,
                                campaignId,
                                snapshot
                              ),
                            redo: () =>
                              audioService.deleteTrack(
                                firestore,
                                campaignId,
                                t.id
                              ),
                          });
                      }}
                    >
                      Del
                    </button>
                  </>
                )}
                {!isDM && t.isPlaying && (
                  <span className="ac-playing-indicator">♪</span>
                )}
              </div>
              {/* Local audio element for players (auto-play when isPlaying) */}
              {t.isPlaying && (
                <audio
                  src={t.url}
                  autoPlay
                  loop={t.loop}
                  volume={t.volume ?? 1}
                />
              )}
            </div>
          ))}
          {tracks.length === 0 && <div className="ac-empty">No tracks.</div>}
        </div>
      </div>
    </div>
  );
}
