/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpoilerBlock, {
  containsSpoilerClassName,
  removeSpoilerClassNames,
} from "@/components/contents/SpoilerBlock";

jest.mock("@/components/hooks/useStyles", () => ({
  defineStyles: () => ({}),
  useStyles: () => ({
    root: "spoiler-root",
    inlineRoot: "spoiler-inline-root",
    toggle: "spoiler-toggle",
    content: "spoiler-content",
    inlineContent: "spoiler-inline-content",
  }),
}));

describe("SpoilerBlock", () => {
  it("reveals spoiler content only through an explicit button", () => {
    const { container } = render(
      <SpoilerBlock attributes={{ className: "other-class" }}>
        <blockquote><p>hidden quote</p></blockquote>
        <p>hidden follow-up</p>
      </SpoilerBlock>,
    );

    expect(screen.getByText("hidden quote")).not.toBeVisible();
    expect(screen.getByText("hidden follow-up")).not.toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(container.querySelector(".other-class")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show spoiler" }));

    expect(screen.getByText("hidden quote")).toBeVisible();
    expect(screen.getByText("hidden follow-up")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hide spoiler" })).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByText("hidden quote"));
    expect(screen.getByText("hidden quote")).toBeVisible();
  });

  it("uses inline markup for legacy inline spoilers", () => {
    render(
      <p>
        Before
        <SpoilerBlock attributes={{}} inline>
          inline secret
        </SpoilerBlock>
        after
      </p>,
    );

    expect(screen.getByText("inline secret").closest(".spoiler-inline-root")?.tagName).toBe("SPAN");
    expect(screen.getByText("inline secret")).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Show spoiler" }));
    expect(screen.getByText("inline secret")).toBeVisible();
  });

  it("recognizes and removes current and legacy spoiler classes", () => {
    const classes = ["layout", "spoilers", "spoiler", "spoiler-v2"];

    expect(containsSpoilerClassName(classes)).toBe(true);
    expect(removeSpoilerClassNames(classes)).toEqual(["layout"]);
    expect(containsSpoilerClassName(["layout"])).toBe(false);
  });
});
