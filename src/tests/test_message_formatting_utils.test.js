import {
  formatTimestamp,
  formatTimeOnly,
  formatFullTimestamp,
  buildMessageId,
  relativeLastActive,
} from "../utils/messageFormatting";

function fakeTs(date) {
  return { toDate: () => new Date(date) };
}

describe("messageFormatting utilities", () => {
  test("formatTimestamp produces expected 12h format", () => {
    const d = new Date("2024-05-06T14:07:00Z");
    const local = new Date(d.getTime());
    const mm = String(local.getMonth() + 1).padStart(2, "0");
    const dd = String(local.getDate()).padStart(2, "0");
    const yyyy = local.getFullYear();
    let hrs = local.getHours();
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const mins = String(local.getMinutes()).padStart(2, "0");
    const expected = `${mm}/${dd}/${yyyy} ${hrs}:${mins} ${ampm}`;
    expect(formatTimestamp(fakeTs(d))).toBe(expected);
  });

  test("formatTimeOnly returns empty string for invalid input", () => {
    expect(formatTimeOnly(null)).toBe("");
  });

  test("formatFullTimestamp falls back gracefully", () => {
    const d = new Date();
    expect(formatFullTimestamp(d)).toBe(d.toLocaleString());
  });

  test("buildMessageId uses existing id fields", () => {
    expect(buildMessageId({ id: "abc" })).toBe("abc");
    expect(buildMessageId({ documentId: "doc1" })).toBe("doc1");
    expect(buildMessageId({ _id: "mongo42" })).toBe("mongo42");
  });

  test("buildMessageId creates temp id when missing", () => {
    const msg = { uid: "u1", createdAt: { seconds: 123 } };
    expect(buildMessageId(msg)).toBe("temp_u1_123");
  });

  test("relativeLastActive handles ranges", () => {
    const now = Date.now();
    expect(relativeLastActive(now, { now })).toBe("just now");
    expect(relativeLastActive(now - 5 * 60000, { now })).toBe("5m ago");
    expect(relativeLastActive(now - 2 * 60 * 60000, { now })).toBe("2h ago");
    expect(relativeLastActive(now - 3 * 24 * 60 * 60000, { now })).toBe(
      "3d ago"
    );
  });
});
