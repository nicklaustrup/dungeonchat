// Utility functions for formatting message timestamps in a consistent, testable way.
// All functions accept either a Firestore Timestamp-like object (with toDate) or a Date/number.

function normalizeDate(input) {
  if (!input) return null;
  if (typeof input === "object" && typeof input.toDate === "function") {
    try {
      return input.toDate();
    } catch {
      return null;
    }
  }
  if (input instanceof Date) return input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function formatTimestamp(timestamp) {
  const date = normalizeDate(timestamp);
  if (!date) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  let hrs = date.getHours();
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy} ${hrs}:${mins} ${ampm}`;
}

export function formatTimeOnly(timestamp) {
  const date = normalizeDate(timestamp);
  if (!date) return "";
  let hrs = date.getHours();
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${hrs}:${mins} ${ampm}`;
}

export function formatFullTimestamp(timestamp) {
  const date = normalizeDate(timestamp);
  if (!date) return "";
  return date.toLocaleString();
}

// Build a stable message id fallback similar to previous inline logic.
export function buildMessageId(message) {
  if (!message) return "";
  const { id, documentId, _id, uid, createdAt } = message;
  if (id) return id;
  if (documentId) return documentId;
  if (_id) return _id;
  const seconds = createdAt?.seconds || Math.floor(Date.now() / 1000);
  return `temp_${uid || "unknown"}_${seconds}`;
}

export function relativeLastActive(ts, { now = Date.now() } = {}) {
  if (!ts) return "";
  const diff = now - ts;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const messageFormatting = {
  formatTimestamp,
  formatTimeOnly,
  formatFullTimestamp,
  buildMessageId,
  relativeLastActive,
};

export default messageFormatting;
