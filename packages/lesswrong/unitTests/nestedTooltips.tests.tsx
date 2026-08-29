/**
 * @jest-environment jsdom
 */
import "../lib/index";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import LWTooltip from "@/components/common/LWTooltip";
import { ThemeContext } from "@/components/themes/useTheme";
import { getForumTheme } from "@/themes/forumTheme";
import { ThemeOptions } from "@/themes/themeNames";

const themeOptions = {
  name: "default",
  siteThemeOverride: {},
} satisfies ThemeOptions;
const theme = getForumTheme(themeOptions);

function TestThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{
      theme,
      abstractThemeOptions: themeOptions,
      concreteThemeOptions: themeOptions,
      setThemeOptions: () => {},
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

describe("nested tooltips", () => {
  it("only activates the innermost tooltip under the pointer", () => {
    const onShowOuter = jest.fn();
    const onHideOuter = jest.fn();
    const onShowInner = jest.fn();

    render(
      <TestThemeProvider>
        <LWTooltip title="Outer tooltip" onShow={onShowOuter} onHide={onHideOuter}>
          <span data-testid="outer-anchor">
            Outer anchor
            <LWTooltip title="Inner tooltip" onShow={onShowInner}>
              <span>Inner anchor</span>
            </LWTooltip>
          </span>
        </LWTooltip>
      </TestThemeProvider>,
    );

    fireEvent.mouseOver(screen.getByTestId("outer-anchor"));
    expect(onShowOuter).toHaveBeenCalledTimes(1);

    fireEvent.mouseOver(screen.getByText("Inner anchor"));
    expect(onShowInner).toHaveBeenCalledTimes(1);
    expect(onHideOuter).toHaveBeenCalledTimes(1);
    expect(onShowOuter).toHaveBeenCalledTimes(1);
  });

  it("allows a parent tooltip to activate through a disabled nested tooltip", () => {
    const onShowOuter = jest.fn();

    render(
      <TestThemeProvider>
        <LWTooltip title="Outer tooltip" onShow={onShowOuter}>
          <LWTooltip title="Disabled tooltip" disabled>
            <span>Nested anchor</span>
          </LWTooltip>
        </LWTooltip>
      </TestThemeProvider>,
    );

    fireEvent.mouseOver(screen.getByText("Nested anchor"));
    expect(onShowOuter).toHaveBeenCalledTimes(1);
  });
});
