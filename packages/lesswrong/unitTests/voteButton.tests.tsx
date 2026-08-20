/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { VoteButtonAnimation } from "@/components/votes/VoteButton";

jest.mock("../lib/utils/isMobile", () => ({
  isMobile: () => false,
}));

describe("VoteButtonAnimation", () => {
  it("casts a strong vote on a desktop double-click without toggling through neutral", () => {
    const vote = jest.fn();

    render(
      <VoteButtonAnimation vote={vote} currentStrength="neutral">
        {({eventHandlers}) => <button {...eventHandlers}>Vote</button>}
      </VoteButtonAnimation>
    );

    const button = screen.getByRole("button", {name: "Vote"});
    fireEvent.mouseDown(button, {detail: 1});
    fireEvent.mouseUp(button, {detail: 1});
    fireEvent.mouseDown(button, {detail: 2});
    fireEvent.mouseUp(button, {detail: 2});

    expect(vote).toHaveBeenNthCalledWith(1, "small");
    expect(vote).toHaveBeenNthCalledWith(2, "big");
    expect(vote).toHaveBeenCalledTimes(2);
  });
});
