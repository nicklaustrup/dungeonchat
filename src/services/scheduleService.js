import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

/**
 * Schedule Service
 * Handles all campaign scheduling operations including:
 * - Session scheduling with player availability
 * - In-game calendar and time tracking
 * - Campaign timeline and milestones
 * - Recurring events
 * - Player availability tracking
 */

/**
 * Generate a unique schedule event ID
 */
function generateEventId() {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a scheduled event
 */
export async function createScheduledEvent(firestore, campaignId, eventData) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const eventId = generateEventId();
  const eventRef = doc(firestore, "campaigns", campaignId, "schedule", eventId);

  const event = {
    eventId,
    title: eventData.title || "Untitled Event",
    description: eventData.description || "",
    type: eventData.type || "session", // 'session', 'milestone', 'in-game', 'reminder'
    startTime: eventData.startTime || Timestamp.now(),
    endTime: eventData.endTime || null,
    location: eventData.location || "",
    isRecurring: eventData.isRecurring || false,
    recurrencePattern: eventData.recurrencePattern || null, // 'daily', 'weekly', 'biweekly', 'monthly'
    recurrenceEndDate: eventData.recurrenceEndDate || null,
    participants: eventData.participants || [], // Array of user IDs
    availability: eventData.availability || {}, // { userId: 'yes'|'no'|'maybe' }
    inGameDate: eventData.inGameDate || null, // For in-game calendar events
    tags: eventData.tags || [],
    isCompleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: eventData.createdBy || null,
  };

  await setDoc(eventRef, event);
  return event;
}

/**
 * Get a specific scheduled event
 */
export async function getScheduledEvent(firestore, campaignId, eventId) {
  if (!firestore || !campaignId || !eventId) {
    throw new Error("Firestore, campaignId, and eventId are required");
  }

  const eventRef = doc(firestore, "campaigns", campaignId, "schedule", eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    throw new Error("Event not found");
  }

  return { id: eventSnap.id, ...eventSnap.data() };
}

/**
 * Get all scheduled events for a campaign
 */
export async function getScheduledEvents(firestore, campaignId, filters = {}) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const eventsRef = collection(firestore, "campaigns", campaignId, "schedule");
  let q = query(eventsRef, orderBy("startTime", "asc"));

  // Apply filters
  if (filters.type) {
    q = query(
      eventsRef,
      where("type", "==", filters.type),
      orderBy("startTime", "asc")
    );
  }

  if (filters.startDate && filters.endDate) {
    q = query(
      eventsRef,
      where("startTime", ">=", filters.startDate),
      where("startTime", "<=", filters.endDate),
      orderBy("startTime", "asc")
    );
  }

  const eventsSnap = await getDocs(q);
  return eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update a scheduled event
 */
export async function updateScheduledEvent(
  firestore,
  campaignId,
  eventId,
  updates
) {
  if (!firestore || !campaignId || !eventId) {
    throw new Error("Firestore, campaignId, and eventId are required");
  }

  const eventRef = doc(firestore, "campaigns", campaignId, "schedule", eventId);

  await updateDoc(eventRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a scheduled event
 */
export async function deleteScheduledEvent(firestore, campaignId, eventId) {
  if (!firestore || !campaignId || !eventId) {
    throw new Error("Firestore, campaignId, and eventId are required");
  }

  const eventRef = doc(firestore, "campaigns", campaignId, "schedule", eventId);
  await deleteDoc(eventRef);
}

/**
 * Update player availability for an event
 */
export async function updateAvailability(
  firestore,
  campaignId,
  eventId,
  userId,
  status
) {
  if (!firestore || !campaignId || !eventId || !userId) {
    throw new Error("All parameters are required");
  }

  const event = await getScheduledEvent(firestore, campaignId, eventId);
  const availability = event.availability || {};
  availability[userId] = status; // 'yes', 'no', 'maybe'

  await updateScheduledEvent(firestore, campaignId, eventId, {
    availability,
  });
}

/**
 * Mark event as completed
 */
export async function completeEvent(firestore, campaignId, eventId, summary) {
  if (!firestore || !campaignId || !eventId) {
    throw new Error("Firestore, campaignId, and eventId are required");
  }

  await updateScheduledEvent(firestore, campaignId, eventId, {
    isCompleted: true,
    completedAt: Timestamp.now(),
    summary: summary || "",
  });
}

/**
 * Generate recurring event instances
 */
export async function generateRecurringInstances(
  firestore,
  campaignId,
  eventId,
  count = 4
) {
  if (!firestore || !campaignId || !eventId) {
    throw new Error("Firestore, campaignId, and eventId are required");
  }

  const event = await getScheduledEvent(firestore, campaignId, eventId);

  if (!event.isRecurring || !event.recurrencePattern) {
    throw new Error("Event is not recurring");
  }

  const instances = [];
  let currentDate = event.startTime.toDate();
  const endDate = event.endTime ? event.endTime.toDate() : null;

  for (let i = 0; i < count; i++) {
    // Calculate next occurrence based on pattern
    switch (event.recurrencePattern) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "biweekly":
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        throw new Error("Invalid recurrence pattern");
    }

    // Check if we've passed the recurrence end date
    if (
      event.recurrenceEndDate &&
      currentDate > event.recurrenceEndDate.toDate()
    ) {
      break;
    }

    const newStartTime = Timestamp.fromDate(new Date(currentDate));
    let newEndTime = null;
    if (endDate) {
      const duration = endDate.getTime() - event.startTime.toDate().getTime();
      newEndTime = Timestamp.fromDate(
        new Date(currentDate.getTime() + duration)
      );
    }

    // Create new instance
    const instance = {
      ...event,
      startTime: newStartTime,
      endTime: newEndTime,
      parentEventId: eventId,
      isRecurringInstance: true,
    };

    delete instance.id;
    delete instance.eventId;

    const newEvent = await createScheduledEvent(
      firestore,
      campaignId,
      instance
    );
    instances.push(newEvent);
  }

  return instances;
}

/**
 * Subscribe to scheduled events (real-time)
 */
export function subscribeToScheduledEvents(
  firestore,
  campaignId,
  callback,
  filters = {}
) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const eventsRef = collection(firestore, "campaigns", campaignId, "schedule");
  let q = query(eventsRef, orderBy("startTime", "asc"));

  if (filters.type) {
    q = query(
      eventsRef,
      where("type", "==", filters.type),
      orderBy("startTime", "asc")
    );
  }

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
}

/**
 * Create a campaign timeline milestone
 */
export async function createMilestone(firestore, campaignId, milestoneData) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  return await createScheduledEvent(firestore, campaignId, {
    ...milestoneData,
    type: "milestone",
  });
}

/**
 * Get campaign timeline (milestones)
 */
export async function getCampaignTimeline(firestore, campaignId) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  return await getScheduledEvents(firestore, campaignId, { type: "milestone" });
}

/**
 * Create in-game calendar event
 */
export async function createInGameEvent(firestore, campaignId, eventData) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  return await createScheduledEvent(firestore, campaignId, {
    ...eventData,
    type: "in-game",
  });
}

/**
 * Get in-game calendar events
 */
export async function getInGameEvents(firestore, campaignId) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  return await getScheduledEvents(firestore, campaignId, { type: "in-game" });
}

/**
 * Calculate availability summary for an event
 */
export function calculateAvailabilitySummary(event, campaignMembers) {
  const availability = event.availability || {};
  const summary = {
    yes: 0,
    no: 0,
    maybe: 0,
    pending: 0,
    total: campaignMembers.length,
  };

  campaignMembers.forEach((memberId) => {
    const status = availability[memberId];
    if (status === "yes") summary.yes++;
    else if (status === "no") summary.no++;
    else if (status === "maybe") summary.maybe++;
    else summary.pending++;
  });

  summary.percentage =
    summary.total > 0 ? Math.round((summary.yes / summary.total) * 100) : 0;

  return summary;
}

/**
 * Get upcoming events (next N events)
 */
export async function getUpcomingEvents(firestore, campaignId, limit = 5) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const now = Timestamp.now();
  const eventsRef = collection(firestore, "campaigns", campaignId, "schedule");
  const q = query(
    eventsRef,
    where("startTime", ">=", now),
    where("isCompleted", "==", false),
    orderBy("startTime", "asc")
  );

  const eventsSnap = await getDocs(q);
  const events = eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return events.slice(0, limit);
}

/**
 * Get events for a specific date range
 */
export async function getEventsByDateRange(
  firestore,
  campaignId,
  startDate,
  endDate
) {
  if (!firestore || !campaignId || !startDate || !endDate) {
    throw new Error("All parameters are required");
  }

  return await getScheduledEvents(firestore, campaignId, {
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
  });
}

/**
 * Export events to calendar format (iCal/Google Calendar compatible)
 */
export function exportToCalendarFormat(events) {
  // Simplified iCal format
  const icalEvents = events.map((event) => {
    const start = event.startTime.toDate();
    const end = event.endTime
      ? event.endTime.toDate()
      : new Date(start.getTime() + 3600000);

    return {
      title: event.title,
      start: start.toISOString(),
      end: end.toISOString(),
      description: event.description,
      location: event.location,
      type: event.type,
    };
  });

  return icalEvents;
}

// Default export
const scheduleService = {
  createScheduledEvent,
  getScheduledEvent,
  getScheduledEvents,
  updateScheduledEvent,
  deleteScheduledEvent,
  updateAvailability,
  completeEvent,
  generateRecurringInstances,
  subscribeToScheduledEvents,
  createMilestone,
  getCampaignTimeline,
  createInGameEvent,
  getInGameEvents,
  calculateAvailabilitySummary,
  getUpcomingEvents,
  getEventsByDateRange,
  exportToCalendarFormat,
};

export default scheduleService;
