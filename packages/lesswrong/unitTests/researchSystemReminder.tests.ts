import {
  buildSystemReminderWrap,
  parseLeadingSystemReminder,
} from "../server/research/systemReminder";

describe("research system reminders", () => {
  it("includes and parses the current conversation id", () => {
    const wrapped = buildSystemReminderWrap(
      {
        activeDocument: { id: "doc_123", title: "Active doc" },
        originDocument: { id: "doc_origin", title: "Origin doc" },
        conversationId: "conv_abc",
      },
      "Please read the doc.",
    );

    expect(wrapped).toContain('conversation-id="conv_abc"');
    expect(wrapped).toContain(
      "references to that same conversation id are this conversation, not a separate prior conversation",
    );
    expect(parseLeadingSystemReminder(wrapped)).toEqual({
      activeDocumentId: "doc_123",
      originDocumentId: "doc_origin",
      conversationId: "conv_abc",
    });
  });

  it("keeps conversation id optional for old persisted reminders", () => {
    const parsed = parseLeadingSystemReminder(
      '<system-reminder active-document-id="doc_123">\nThe user is viewing a document.\n</system-reminder>\n\nHello',
    );

    expect(parsed).toEqual({
      activeDocumentId: "doc_123",
      originDocumentId: null,
      conversationId: null,
    });
  });
});
