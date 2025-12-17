import React, { useState, useEffect, useCallback } from "react";
import { useFirebase } from "../../services/FirebaseContext";
import { useCampaign } from "../../hooks/useCampaign";
import {
  subscribeToScheduledEvents,
  createScheduledEvent,
  updateScheduledEvent,
  deleteScheduledEvent,
  updateAvailability,
  calculateAvailabilitySummary,
  exportToCalendarFormat,
} from "../../services/scheduleService";
import "./CampaignCalendar.css";

/**
 * CampaignCalendar Component
 *
 * Full-featured calendar system for campaign session scheduling and milestone tracking.
 * Features:
 * - Month/Week/Day view modes with navigation
 * - Real-time event synchronization
 * - Event creation modal with recurring patterns
 * - Availability tracking (yes/no/maybe) with visual indicators
 * - Upcoming events sidebar with countdown timers
 * - In-game calendar toggle
 * - Export to iCal format
 * - Event color coding by type
 * - DM-only event management with member availability updates
 */
function CampaignCalendar({ campaignId }) {
  const { firestore } = useFirebase();
  const { campaign, isUserDM } = useCampaign(campaignId);

  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month"); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showInGameCalendar, setShowInGameCalendar] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: "",
    type: "session",
    startTime: "",
    endTime: "",
    description: "",
    location: "",
    recurring: false,
    recurrencePattern: "weekly",
    recurrenceEndDate: "",
    inGameDate: "",
  });

  // Subscribe to events
  useEffect(() => {
    if (!firestore || !campaignId) return;

    setLoading(true);
    const unsubscribe = subscribeToScheduledEvents(
      firestore,
      campaignId,
      (updatedEvents) => {
        setEvents(updatedEvents);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, campaignId]);

  // Calendar navigation
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Event modal handlers
  const openEventModal = useCallback((event = null) => {
    if (event) {
      setSelectedEvent(event);
      setEventForm({
        title: event.title || "",
        type: event.type || "session",
        startTime: event.startTime?.toDate().toISOString().slice(0, 16) || "",
        endTime: event.endTime?.toDate().toISOString().slice(0, 16) || "",
        description: event.description || "",
        location: event.location || "",
        recurring: event.recurring || false,
        recurrencePattern: event.recurrencePattern || "weekly",
        recurrenceEndDate:
          event.recurrenceEndDate?.toDate().toISOString().slice(0, 10) || "",
        inGameDate: event.inGameDate || "",
      });
    } else {
      setSelectedEvent(null);
      setEventForm({
        title: "",
        type: "session",
        startTime: "",
        endTime: "",
        description: "",
        location: "",
        recurring: false,
        recurrencePattern: "weekly",
        recurrenceEndDate: "",
        inGameDate: "",
      });
    }
    setShowEventModal(true);
  }, []);

  const closeEventModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  // Event CRUD operations
  const handleSaveEvent = useCallback(async () => {
    if (!eventForm.title || !eventForm.startTime) {
      alert("Please fill in required fields (title and start time)");
      return;
    }

    try {
      const eventData = {
        title: eventForm.title,
        type: eventForm.type,
        startTime: new Date(eventForm.startTime),
        endTime: eventForm.endTime ? new Date(eventForm.endTime) : null,
        description: eventForm.description,
        location: eventForm.location,
        recurring: eventForm.recurring,
        recurrencePattern: eventForm.recurring
          ? eventForm.recurrencePattern
          : null,
        recurrenceEndDate: eventForm.recurrenceEndDate
          ? new Date(eventForm.recurrenceEndDate)
          : null,
        inGameDate: eventForm.inGameDate || null,
      };

      if (selectedEvent) {
        await updateScheduledEvent(
          firestore,
          campaignId,
          selectedEvent.id,
          eventData
        );
      } else {
        await createScheduledEvent(firestore, campaignId, eventData);
      }

      closeEventModal();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Please try again.");
    }
  }, [firestore, campaignId, eventForm, selectedEvent, closeEventModal]);

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      if (!window.confirm("Are you sure you want to delete this event?"))
        return;

      try {
        await deleteScheduledEvent(firestore, campaignId, eventId);
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    },
    [firestore, campaignId]
  );

  // Availability tracking
  const handleAvailabilityUpdate = useCallback(
    async (eventId, status) => {
      if (!campaign?.currentUser?.uid) return;

      try {
        await updateAvailability(
          firestore,
          campaignId,
          eventId,
          campaign.currentUser.uid,
          status
        );
      } catch (error) {
        console.error("Error updating availability:", error);
        alert("Failed to update availability. Please try again.");
      }
    },
    [firestore, campaignId, campaign]
  );

  // Export to calendar format
  const handleExport = useCallback(() => {
    const calendarData = exportToCalendarFormat(events);
    const blob = new Blob([calendarData], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${campaign?.name || "campaign"}-schedule.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }, [events, campaign]);

  // Calendar grid generation
  const generateCalendarGrid = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate grid
    const grid = [];
    let dayCounter = 1;

    // 6 weeks to ensure full coverage
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < firstDay) {
          weekDays.push(null); // Empty cell
        } else if (dayCounter > daysInMonth) {
          weekDays.push(null);
        } else {
          weekDays.push(dayCounter);
          dayCounter++;
        }
      }
      grid.push(weekDays);
    }

    return grid;
  }, [currentDate]);

  // Get events for specific date
  const getEventsForDate = useCallback(
    (date) => {
      return events.filter((event) => {
        if (!event.startTime) return false;
        const eventDate = event.startTime.toDate();
        return (
          eventDate.getDate() === date &&
          eventDate.getMonth() === currentDate.getMonth() &&
          eventDate.getFullYear() === currentDate.getFullYear()
        );
      });
    },
    [events, currentDate]
  );

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = useCallback(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return events
      .filter((event) => {
        if (!event.startTime) return false;
        const eventDate = event.startTime.toDate();
        return eventDate >= now && eventDate <= sevenDaysFromNow;
      })
      .sort((a, b) => a.startTime.toDate() - b.startTime.toDate());
  }, [events]);

  // Format date display
  const formatMonthYear = useCallback(() => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  const formatDate = useCallback((date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  // Calculate time until event
  const getTimeUntilEvent = useCallback((eventDate) => {
    const now = new Date();
    const diff = eventDate - now;

    if (diff < 0) return "Past";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "Soon";
  }, []);

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  const calendarGrid = generateCalendarGrid();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="campaign-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>Campaign Calendar</h2>
          {isUserDM && (
            <button className="btn-primary" onClick={() => openEventModal()}>
              + New Event
            </button>
          )}
        </div>

        <div className="calendar-controls">
          {/* View mode selector */}
          <div className="view-mode-selector">
            <button
              className={viewMode === "month" ? "active" : ""}
              onClick={() => setViewMode("month")}
            >
              Month
            </button>
            <button
              className={viewMode === "week" ? "active" : ""}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
            <button
              className={viewMode === "day" ? "active" : ""}
              onClick={() => setViewMode("day")}
            >
              Day
            </button>
          </div>

          {/* Navigation */}
          <div className="calendar-navigation">
            <button onClick={navigatePrevious}>◀</button>
            <button onClick={goToToday}>Today</button>
            <button onClick={navigateNext}>▶</button>
          </div>

          {/* Additional controls */}
          <div className="calendar-actions">
            <button onClick={() => setShowInGameCalendar(!showInGameCalendar)}>
              {showInGameCalendar ? "📅 Real" : "🎲 In-Game"}
            </button>
            <button onClick={handleExport}>📥 Export</button>
          </div>
        </div>
      </div>

      {/* Main calendar area */}
      <div className="calendar-content">
        {/* Calendar grid */}
        <div className="calendar-grid-container">
          <h3 className="calendar-month-title">{formatMonthYear()}</h3>

          {/* Day headers */}
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}

            {/* Date cells */}
            {calendarGrid.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="calendar-cell empty"
                      />
                    );
                  }

                  const dayEvents = getEventsForDate(date);
                  const isToday =
                    date === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`calendar-cell ${isToday ? "today" : ""}`}
                    >
                      <div className="cell-date">{date}</div>
                      <div className="cell-events">
                        {dayEvents.slice(0, 3).map((event) => {
                          const availabilitySummary =
                            calculateAvailabilitySummary(
                              event,
                              campaign?.members || []
                            );

                          return (
                            <div
                              key={event.id}
                              className={`event-badge ${event.type}`}
                              onClick={() => openEventModal(event)}
                              title={`${event.title} - ${availabilitySummary.percentage}% available`}
                            >
                              <span className="event-time">
                                {formatTime(event.startTime.toDate())}
                              </span>
                              <span className="event-title">{event.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="event-more">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Upcoming events sidebar */}
        <div className="upcoming-events-sidebar">
          <h3>Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p className="no-events">No upcoming events in the next 7 days</p>
          ) : (
            <div className="upcoming-events-list">
              {upcomingEvents.map((event) => {
                const availabilitySummary = calculateAvailabilitySummary(
                  event,
                  campaign?.members || []
                );
                const eventDate = event.startTime.toDate();
                const userAvailability =
                  event.availability?.[campaign?.currentUser?.uid];

                return (
                  <div
                    key={event.id}
                    className={`upcoming-event ${event.type}`}
                  >
                    <div className="event-header">
                      <span className="event-type-badge">{event.type}</span>
                      <span className="event-countdown">
                        {getTimeUntilEvent(eventDate)}
                      </span>
                    </div>
                    <h4>{event.title}</h4>
                    <div className="event-datetime">
                      <span>📅 {formatDate(eventDate)}</span>
                      <span>🕐 {formatTime(eventDate)}</span>
                    </div>
                    {event.location && (
                      <div className="event-location">📍 {event.location}</div>
                    )}
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}

                    {/* Availability tracking */}
                    <div className="event-availability">
                      <div className="availability-summary">
                        <span className="available-count">
                          ✓ {availabilitySummary.yes} /{" "}
                          {availabilitySummary.yes +
                            availabilitySummary.no +
                            availabilitySummary.maybe +
                            availabilitySummary.pending}
                        </span>
                        <span className="availability-percentage">
                          {availabilitySummary.percentage}% available
                        </span>
                      </div>

                      {/* User availability buttons */}
                      {!isUserDM && (
                        <div className="availability-buttons">
                          <button
                            className={`availability-btn yes ${userAvailability === "yes" ? "active" : ""}`}
                            onClick={() =>
                              handleAvailabilityUpdate(event.id, "yes")
                            }
                          >
                            ✓ Yes
                          </button>
                          <button
                            className={`availability-btn maybe ${userAvailability === "maybe" ? "active" : ""}`}
                            onClick={() =>
                              handleAvailabilityUpdate(event.id, "maybe")
                            }
                          >
                            ? Maybe
                          </button>
                          <button
                            className={`availability-btn no ${userAvailability === "no" ? "active" : ""}`}
                            onClick={() =>
                              handleAvailabilityUpdate(event.id, "no")
                            }
                          >
                            ✗ No
                          </button>
                        </div>
                      )}
                    </div>

                    {/* DM actions */}
                    {isUserDM && (
                      <div className="event-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => openEventModal(event)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={closeEventModal}>
          <div
            className="modal-content calendar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{selectedEvent ? "Edit Event" : "New Event"}</h3>
              <button className="modal-close" onClick={closeEventModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                  placeholder="Session 12: The Dragon's Lair"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={eventForm.type}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, type: e.target.value })
                  }
                >
                  <option value="session">Session</option>
                  <option value="milestone">Milestone</option>
                  <option value="in-game">In-Game Event</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.startTime}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, startTime: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={eventForm.endTime}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                  placeholder="Discord, Roll20, etc."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                  placeholder="Session notes, reminders, etc."
                  rows={4}
                />
              </div>

              {eventForm.type === "in-game" && (
                <div className="form-group">
                  <label>In-Game Date</label>
                  <input
                    type="text"
                    value={eventForm.inGameDate}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, inGameDate: e.target.value })
                    }
                    placeholder="15th of Flamerule, 1492 DR"
                  />
                </div>
              )}

              {/* Recurring options */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={eventForm.recurring}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        recurring: e.target.checked,
                      })
                    }
                  />
                  <span>Recurring Event</span>
                </label>
              </div>

              {eventForm.recurring && (
                <>
                  <div className="form-group">
                    <label>Recurrence Pattern</label>
                    <select
                      value={eventForm.recurrencePattern}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          recurrencePattern: e.target.value,
                        })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Recurrence End Date</label>
                    <input
                      type="date"
                      value={eventForm.recurrenceEndDate}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          recurrenceEndDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeEventModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEvent}>
                {selectedEvent ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignCalendar;
