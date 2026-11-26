import { defineStyles } from "@/components/hooks/useStyles";
import { LLM_CHAT_SIDEBAR_WIDTH } from "@/components/languageModels/llmChatSidebarWidth";
import { POSTS_BOTTOM_BAR_SHOWN_PROPERTY } from "@/components/posts/PostsBottomBar";
import { RIGHT_COLUMN_WIDTH_WITH_SIDENOTES } from "@/components/posts/PostsPage/constants";
import {
  NARRATION_PLAYER_FLOATING_BREAKPOINT,
  narrationDockHeight,
  NARRATION_PLAYER_DOCKED_CLASS,
  narrationPlayerHasRoom,
} from "./narrationPlayerLayout";

export const NARRATION_PLAYER_FLOATING_MARGIN = 12;
/** Post pages have a right-hand margin at least this wide at the widths where the player floats, which it fits inside */
const FLOATING_WIDTH = RIGHT_COLUMN_WIDTH_WITH_SIDENOTES - (2 * NARRATION_PLAYER_FLOATING_MARGIN);

/** The height of the part of the scrubber that takes clicks, which is taller than the rail drawn inside it */
const SCRUBBER_HEIGHT = 20;

function shadowColor(lightModeAlpha: number, darkModeAlpha: number): string {
  return `light-dark(rgba(0,0,0,${lightModeAlpha}),rgba(0,0,0,${darkModeAlpha}))`;
}

/** The same translucent white whether or not the site is in dark mode, for things drawn on a surface that's always dark */
function alwaysWhiteAlpha(alpha: number): string {
  return `light-dark(rgba(255,255,255,${alpha}),rgba(255,255,255,${alpha}))`;
}

/**
 * The scrubber is a range input with the browser's own drawing of it turned
 * off, on top of a rail that's drawn separately. Only its thumb is visible.
 * Chrome and Firefox name the parts differently, and a rule that names both
 * is ignored by each, so each part is styled twice.
 */
const scrubberThumb = {
  appearance: "none",
  boxSizing: "border-box",
  width: "var(--narration-thumb-width)",
  height: "var(--narration-thumb-height)",
  border: "none",
  borderRadius: "var(--narration-thumb-radius)",
  background: "var(--narration-thumb-color)",
  opacity: "var(--narration-thumb-rest-opacity)",
  transition: "opacity 120ms ease-out",
};

const scrubberTrack = {
  height: SCRUBBER_HEIGHT,
  background: "transparent",
  border: "none",
};

export const narrationPlayerStyles = defineStyles("NarrationPlayer", (theme: ThemeType) => {
  const floating = theme.breakpoints.up(NARRATION_PLAYER_FLOATING_BREAKPOINT);
  const ink = theme.palette.grey[900];
  const primaryTint = (percent: number) => `color-mix(in srgb, ${theme.palette.primary.main} ${percent}%, transparent)`;

  // The times go under the two ends of the scrubber, rather than beside it
  const timesBelowScrubber = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateAreas: `"scrubber scrubber" "elapsed duration"`,
    gap: 0,
    "& $scrubber": {
      gridArea: "scrubber",
    },
    "& $time": {
      minWidth: 0,
      fontSize: 11,
      lineHeight: "14px",
    },
    "& $elapsed": {
      gridArea: "elapsed",
      justifySelf: "start",
    },
    "& $duration": {
      gridArea: "duration",
      justifySelf: "end",
    },
  };

  return {
    "@global": {
      // So that the end of the page can be scrolled clear of the docked player
      [`body.${NARRATION_PLAYER_DOCKED_CLASS}`]: {
        paddingBottom: narrationDockHeight,
      },
    },
    // The colors and sizes that differ between themes are custom properties,
    // which the settings panel uses too. These are the ones that the docked
    // player has: the themes are of the floating player only.
    root: {
      "--narration-text": theme.palette.text.normal,
      "--narration-dim": theme.palette.text.dim,
      "--narration-icon": theme.palette.icon.dim,
      "--narration-accent": theme.palette.primary.main,
      "--narration-on-accent": theme.palette.text.alwaysWhite,
      "--narration-rail": theme.palette.greyAlpha(0.14),
      "--narration-hover": theme.palette.greyAlpha(0.07),
      "--narration-play-bg": theme.palette.primary.main,
      "--narration-play-hover-bg": theme.palette.primary.dark,
      "--narration-play-fg": theme.palette.text.alwaysWhite,
      "--narration-control-bg": theme.palette.greyAlpha(0.06),
      "--narration-control-hover-bg": theme.palette.greyAlpha(0.11),
      "--narration-divider": theme.palette.greyAlpha(0.1),
      "--narration-rail-height": "4px",
      "--narration-thumb-width": "12px",
      "--narration-thumb-height": "12px",
      "--narration-thumb-radius": "50%",
      "--narration-thumb-color": theme.palette.primary.main,
      "--narration-thumb-rest-opacity": 1,

      position: "fixed",
      zIndex: theme.zIndexes.narrationPlayer,
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 13,
      color: "var(--narration-text)",

      [floating]: {
        right: NARRATION_PLAYER_FLOATING_MARGIN,
        bottom: NARRATION_PLAYER_FLOATING_MARGIN,
        width: FLOATING_WIDTH,
        // The LLM chat sidebar takes the right-hand side of the screen for
        // itself, so the corner that's free is the one next to it
        "body:has(.SidebarLanguageModelChat-root) &": {
          right: LLM_CHAT_SIDEBAR_WIDTH + NARRATION_PLAYER_FLOATING_MARGIN,
        },
      },

      // Docked across the bottom of the screen, looking like the bottom bar
      // that post pages have on phones (PostsBottomBar). On phones it sits on
      // top of that bar, as part of the same panel: when the bar slides away,
      // the player moves down into its place.
      [theme.breakpoints.down("md")]: {
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.background.pageActiveAreaBackground,
        boxShadow: `0 -2px 8px ${theme.palette.greyAlpha(0.1)}`,
        transform: `translateY(calc(-1 * var(${POSTS_BOTTOM_BAR_SHOWN_PROPERTY}, 0) * var(--header-height)))`,
        transition: "transform 200ms ease-in-out",
      },
    },
    // The timeline has a row to itself, above the buttons, unless there's room
    // for it between them.
    controls: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: 6,
      rowGap: 2,
      padding: "8px 12px",
    },
    transport: {
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    tools: {
      display: "flex",
      alignItems: "center",
      gap: 2,
    },
    timeline: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      order: -1,
      flex: "1 1 100%",
      minWidth: 0,
      [narrationPlayerHasRoom(theme)]: {
        order: 0,
        flex: "1 1 0",
      },
    },
    iconButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: 32,
      height: 32,
      padding: 0,
      fontFamily: "inherit",
      color: "var(--narration-icon)",
      background: "transparent",
      border: "none",
      borderRadius: "50%",
      cursor: "pointer",
      transition: "background 120ms ease-out, color 120ms ease-out",
      "&:hover:not(:disabled)": {
        color: "var(--narration-text)",
        background: "var(--narration-hover)",
      },
      "&:disabled": {
        opacity: 0.4,
        cursor: "default",
      },
      "& svg": {
        width: 20,
        height: 20,
      },
    },
    skipButton: {
      "&$iconButton svg": {
        width: 24,
        height: 24,
      },
    },
    skipBack: {},
    skipForward: {},
    playButton: {
      color: "var(--narration-play-fg)",
      background: "var(--narration-play-bg)",
      "&:hover:not(:disabled)": {
        color: "var(--narration-play-fg)",
        background: "var(--narration-play-hover-bg)",
      },
      "& $playButtonSpinner div": {
        backgroundColor: "var(--narration-play-fg)",
      },
    },
    // The circle that the three tips of the play icon's triangle lie on is
    // centred 1.6 units left of the middle of the icon's 24-unit viewBox. This
    // moves it onto the middle of the button, so that the tips are all the same
    // distance from the button's edge.
    playIcon: {
      transform: "translateX(6.67%)",
    },
    time: {
      flexShrink: 0,
      minWidth: 40,
      fontSize: 12,
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      color: "var(--narration-dim)",
    },
    elapsed: {},
    duration: {},
    scrubber: {
      position: "relative",
      flexGrow: 1,
      minWidth: 60,
      height: SCRUBBER_HEIGHT,
    },
    scrubberRail: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      height: "var(--narration-rail-height)",
      transform: "translateY(-50%)",
      borderRadius: 999,
      background: "var(--narration-rail)",
      overflow: "hidden",
      pointerEvents: "none",
    },
    scrubberFill: {
      height: "100%",
      borderRadius: "inherit",
      background: "var(--narration-accent)",
    },
    scrubberInput: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      margin: 0,
      padding: 0,
      appearance: "none",
      background: "transparent",
      cursor: "pointer",
      "&:disabled": {
        cursor: "default",
      },
      "&:focus-visible": {
        outline: "2px solid var(--narration-accent)",
        outlineOffset: 2,
        borderRadius: 4,
      },
      "&::-webkit-slider-runnable-track": scrubberTrack,
      "&::-moz-range-track": scrubberTrack,
      "&::-webkit-slider-thumb": {
        ...scrubberThumb,
        marginTop: `calc((${SCRUBBER_HEIGHT}px - var(--narration-thumb-height)) / 2)`,
      },
      "&::-moz-range-thumb": scrubberThumb,
      "&:hover::-webkit-slider-thumb, &:focus-visible::-webkit-slider-thumb": {
        opacity: 1,
      },
      "&:hover::-moz-range-thumb, &:focus-visible::-moz-range-thumb": {
        opacity: 1,
      },
      "&:disabled::-webkit-slider-thumb": {
        opacity: 0,
      },
      "&:disabled::-moz-range-thumb": {
        opacity: 0,
      },
    },
    // A <select> without the browser's drawing of one: just the speed, which
    // opens the usual menu when it's clicked
    rateSelect: {
      flexShrink: 0,
      marginLeft: "auto",
      minWidth: 34,
      padding: "5px 8px",
      appearance: "none",
      // Makes it as wide as the speed that's chosen, rather than the widest of
      // them, in the browsers that have this
      fieldSizing: "content",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
      textAlign: "center",
      textAlignLast: "center",
      color: "var(--narration-text)",
      background: "var(--narration-control-bg)",
      border: "none",
      borderRadius: 999,
      cursor: "pointer",
      transition: "background 120ms ease-out",
      "&:hover": {
        background: "var(--narration-control-hover-bg)",
      },
      [narrationPlayerHasRoom(theme)]: {
        marginLeft: 0,
      },
    },
    nowReading: {
      padding: "8px 16px 0",
      fontSize: 12,
      color: "var(--narration-dim)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    // Takes the place of the play button's icon while there's something to
    // wait for. The site's loading indicator is wider than the button, so it's
    // scaled down to fit.
    playButtonSpinner: {
      flexShrink: 0,
      transform: "scale(0.6)",
    },
    // Says what the spinner is for, to screen readers
    status: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
    },
    error: {
      padding: "0 16px 8px",
      color: theme.palette.text.error2,
      overflowWrap: "anywhere",
    },

    // The themes: see narrationPlayerThemes.ts. Each is a class on the root.

    // A plain card. The play button is in the middle, under the scrubber.
    paper: {
      [floating]: {
        background: theme.palette.panelBackground.default,
        border: `1px solid ${theme.palette.greyAlpha(0.09)}`,
        borderRadius: 14,
        boxShadow: `0 1px 2px ${shadowColor(0.06, 0.4)}, 0 12px 32px ${shadowColor(0.12, 0.5)}`,
        "& $controls": {
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateAreas: `"timeline timeline timeline" "speed transport tools"`,
          rowGap: 4,
          padding: "12px 12px 10px",
        },
        "& $timeline": {
          gridArea: "timeline",
          ...timesBelowScrubber,
        },
        "& $transport": {
          gridArea: "transport",
          gap: 8,
        },
        "& $rateSelect": {
          gridArea: "speed",
          justifySelf: "start",
          marginLeft: 0,
        },
        "& $tools": {
          gridArea: "tools",
          justifySelf: "end",
        },
        "& $tools $iconButton": {
          width: 30,
          height: 30,
        },
        "& $nowReading": {
          padding: "10px 12px 0",
        },
        "& $iconButton$playButton": {
          width: 38,
          height: 38,
          "& svg": {
            width: 22,
            height: 22,
          },
        },
      },
    },

    // Frosted glass, with a big play button at the left and no color
    glass: {
      [floating]: {
        "--narration-accent": ink,
        "--narration-on-accent": theme.palette.grey[0],
        "--narration-thumb-color": ink,
        "--narration-play-bg": ink,
        "--narration-play-hover-bg": theme.palette.grey[1000],
        "--narration-play-fg": theme.palette.grey[0],
        "--narration-rail": theme.palette.greyAlpha(0.13),
        "--narration-rail-height": "6px",
        "--narration-thumb-width": "14px",
        "--narration-thumb-height": "14px",
        "--narration-thumb-rest-opacity": 0,
        "--narration-control-bg": theme.palette.greyAlpha(0.07),
        "--narration-control-hover-bg": theme.palette.greyAlpha(0.13),
        background: "light-dark(rgba(255,255,255,.64),rgba(44,44,44,.6))",
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        border: "1px solid light-dark(rgba(255,255,255,.75),rgba(255,255,255,.14))",
        borderRadius: 22,
        boxShadow: `0 0 0 0.5px ${shadowColor(0.16, 0.7)}, 0 18px 44px ${shadowColor(0.18, 0.55)}`,
        "& $controls": {
          display: "grid",
          gridTemplateColumns: "auto auto auto 1fr auto auto",
          gridTemplateAreas: `"play timeline timeline timeline timeline timeline" "play back forward . speed tools"`,
          columnGap: 2,
          rowGap: 2,
          padding: "12px 12px 8px",
        },
        "& $transport": {
          display: "contents",
        },
        "& $iconButton": {
          width: 28,
          height: 28,
          "& svg": {
            width: 18,
            height: 18,
          },
        },
        "& $iconButton$skipButton svg": {
          width: 22,
          height: 22,
        },
        "& $skipBack": {
          gridArea: "back",
        },
        "& $skipForward": {
          gridArea: "forward",
        },
        "& $iconButton$playButton": {
          gridArea: "play",
          width: 50,
          height: 50,
          marginRight: 10,
          "& svg": {
            width: 26,
            height: 26,
          },
        },
        "& $timeline": {
          gridArea: "timeline",
          ...timesBelowScrubber,
        },
        "& $rateSelect": {
          gridArea: "speed",
          marginLeft: 0,
        },
        "& $tools": {
          gridArea: "tools",
        },
      },
    },

    // Dark whatever the page is, in a single row. The scrubber is the bottom
    // edge of the card, and gets thicker under the pointer instead of having
    // a thumb.
    ink: {
      [floating]: {
        "--narration-text": alwaysWhiteAlpha(0.94),
        "--narration-dim": alwaysWhiteAlpha(0.58),
        "--narration-icon": alwaysWhiteAlpha(0.76),
        "--narration-accent": theme.palette.primary.light,
        "--narration-on-accent": "light-dark(#161716,#161716)",
        "--narration-rail": alwaysWhiteAlpha(0.16),
        "--narration-hover": alwaysWhiteAlpha(0.12),
        "--narration-play-bg": alwaysWhiteAlpha(1),
        "--narration-play-hover-bg": alwaysWhiteAlpha(0.84),
        "--narration-play-fg": "light-dark(#161716,#161716)",
        "--narration-control-bg": alwaysWhiteAlpha(0.1),
        "--narration-control-hover-bg": alwaysWhiteAlpha(0.2),
        "--narration-divider": alwaysWhiteAlpha(0.12),
        "--narration-rail-height": "3px",
        "--narration-thumb-width": "2px",
        background: "light-dark(#1b1d1c,#373a38)",
        border: "1px solid light-dark(rgba(255,255,255,0),rgba(255,255,255,.1))",
        borderRadius: 16,
        boxShadow: `0 10px 30px ${shadowColor(0.28, 0.6)}`,
        overflow: "hidden",
        "& $controls": {
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto auto",
          gridTemplateAreas: `"transport elapsed . speed tools" "transport duration . speed tools" "scrubber scrubber scrubber scrubber scrubber"`,
          columnGap: 6,
          rowGap: 0,
          padding: "10px 10px 0",
        },
        "& $transport": {
          gridArea: "transport",
          gap: 2,
        },
        "& $iconButton": {
          width: 26,
          height: 26,
          "& svg": {
            width: 18,
            height: 18,
          },
        },
        "& $iconButton$skipButton svg": {
          width: 22,
          height: 22,
        },
        "& $iconButton$playButton": {
          width: 32,
          height: 32,
        },
        "& $timeline": {
          display: "contents",
        },
        "& $time": {
          minWidth: 0,
          fontSize: 11,
          lineHeight: "13px",
          textAlign: "left",
        },
        "& $elapsed": {
          gridArea: "elapsed",
          alignSelf: "end",
          color: "var(--narration-text)",
        },
        "& $duration": {
          gridArea: "duration",
          alignSelf: "start",
        },
        "& $scrubber": {
          gridArea: "scrubber",
          height: 12,
          margin: "0 -10px",
        },
        "& $scrubberRail": {
          top: "auto",
          bottom: 0,
          transform: "none",
          borderRadius: 0,
          transition: "height 120ms ease-out",
        },
        "& $scrubber:hover $scrubberRail, & $scrubber:focus-within $scrubberRail": {
          height: 7,
        },
        "& $scrubberFill": {
          borderRadius: 0,
        },
        "& $scrubberInput": {
          opacity: 0,
        },
        "& $rateSelect": {
          gridArea: "speed",
          marginLeft: 0,
          padding: "5px 6px",
        },
        "& $tools": {
          gridArea: "tools",
          gap: 0,
        },
      },
    },

    // Flat, and set like the page it's beside: serif numerals, a hairline
    // for the scrubber, and bare glyphs for buttons
    margin: {
      [floating]: {
        "--narration-accent": ink,
        "--narration-on-accent": theme.palette.grey[0],
        "--narration-thumb-color": ink,
        "--narration-rail": theme.palette.greyAlpha(0.16),
        "--narration-rail-height": "2px",
        "--narration-thumb-width": "9px",
        "--narration-thumb-height": "9px",
        "--narration-hover": "transparent",
        "--narration-play-bg": "transparent",
        "--narration-play-hover-bg": "transparent",
        "--narration-play-fg": ink,
        "--narration-control-bg": theme.palette.greyAlpha(0.05),
        "--narration-control-hover-bg": theme.palette.greyAlpha(0.1),
        background: theme.palette.background.pageActiveAreaBackground,
        border: `1px solid ${theme.palette.greyAlpha(0.16)}`,
        borderRadius: 2,
        "& $controls": {
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          gridTemplateAreas: `"timeline timeline timeline timeline" "transport . speed tools"`,
          columnGap: 2,
          rowGap: 0,
          padding: "10px 14px 4px",
        },
        "& $timeline": {
          gridArea: "timeline",
          gap: 10,
        },
        "& $time": {
          minWidth: 0,
          fontFamily: theme.palette.fonts.serifStack,
          fontSize: 14,
          color: "var(--narration-text)",
        },
        "& $transport": {
          gridArea: "transport",
          gap: 0,
          marginLeft: -7,
        },
        "& $iconButton$playButton svg": {
          width: 22,
          height: 22,
        },
        "& $rateSelect": {
          gridArea: "speed",
          marginLeft: 0,
          padding: "5px 6px",
          fontFamily: theme.palette.fonts.serifStack,
          fontSize: 14,
          fontWeight: 400,
          background: "transparent",
          borderRadius: 2,
          "&:hover": {
            background: "var(--narration-control-hover-bg)",
          },
        },
        "& $tools": {
          gridArea: "tools",
          gap: 0,
          marginRight: -7,
        },
        "& $nowReading": {
          padding: "10px 14px 0",
          fontFamily: theme.palette.fonts.serifStack,
          fontSize: 14,
          fontStyle: "italic",
        },
      },
    },

    // Tinted with the site's green, with chunky rounded buttons and a thick
    // scrubber that has a bar for a thumb
    tonal: {
      [floating]: {
        "--narration-icon": `light-dark(${theme.palette.primary.dark},${theme.palette.primary.light})`,
        "--narration-rail": primaryTint(22),
        "--narration-rail-height": "8px",
        "--narration-thumb-width": "4px",
        "--narration-thumb-height": "20px",
        "--narration-thumb-radius": "2px",
        "--narration-thumb-color": `light-dark(${theme.palette.primary.dark},${theme.palette.primary.light})`,
        "--narration-hover": primaryTint(16),
        "--narration-control-bg": primaryTint(14),
        "--narration-control-hover-bg": primaryTint(24),
        "--narration-divider": primaryTint(22),
        background: `color-mix(in srgb, ${theme.palette.primary.main} 11%, ${theme.palette.panelBackground.default})`,
        borderRadius: 24,
        boxShadow: `0 8px 24px ${shadowColor(0.13, 0.5)}`,
        "& $controls": {
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateAreas: `"transport transport tools" "scrubber scrubber scrubber" "elapsed speed duration"`,
          columnGap: 6,
          rowGap: 4,
          padding: "14px 14px 10px",
        },
        "& $transport": {
          gridArea: "transport",
          gap: 6,
        },
        "& $iconButton$skipButton": {
          width: 38,
          height: 38,
          borderRadius: 14,
          background: "var(--narration-control-bg)",
          "&:hover:not(:disabled)": {
            background: "var(--narration-control-hover-bg)",
          },
        },
        "& $iconButton$playButton": {
          width: 58,
          height: 38,
          borderRadius: 19,
          "& svg": {
            width: 22,
            height: 22,
          },
        },
        "& $tools": {
          gridArea: "tools",
          justifySelf: "end",
        },
        "& $timeline": {
          display: "contents",
        },
        "& $scrubber": {
          gridArea: "scrubber",
          marginTop: 4,
        },
        "& $time": {
          minWidth: 0,
          fontSize: 11,
        },
        "& $elapsed": {
          gridArea: "elapsed",
          justifySelf: "start",
        },
        "& $duration": {
          gridArea: "duration",
          justifySelf: "end",
        },
        "& $rateSelect": {
          gridArea: "speed",
          marginLeft: 0,
        },
        "& $nowReading": {
          padding: "12px 14px 0",
        },
      },
    },
  };
});
