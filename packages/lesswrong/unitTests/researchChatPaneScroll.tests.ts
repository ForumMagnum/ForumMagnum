import {
  countNewVisibleEvents,
  isScrolledNearBottom,
  newMessagePillLabel,
} from "../components/research/chatPaneScroll";

describe("research chat pane scroll helpers", () => {
  it("treats positions within the bottom threshold as pinned", () => {
    expect(isScrolledNearBottom({ scrollHeight: 1000, scrollTop: 436, clientHeight: 500 })).toBe(true);
    expect(isScrolledNearBottom({ scrollHeight: 1000, scrollTop: 435, clientHeight: 500 })).toBe(false);
  });

  it("counts only newly appended visible events", () => {
    expect(countNewVisibleEvents(3, 5)).toBe(2);
    expect(countNewVisibleEvents(5, 5)).toBe(0);
    expect(countNewVisibleEvents(5, 3)).toBe(0);
  });

  it("labels singular and plural new-message pills", () => {
    expect(newMessagePillLabel(1)).toBe("1 new message");
    expect(newMessagePillLabel(2)).toBe("2 new messages");
  });
});
