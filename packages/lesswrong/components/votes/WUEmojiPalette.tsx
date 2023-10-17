import React, { FC } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { EmojiOption } from "../../lib/voting/eaEmojiPalette";
import { PaletteSection } from "./EAEmojiPalette";

import { wuEmojiPalette } from "../../lib/voting/wuEmojiPalette";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 6,
  },
  title: {
    margin: "4px 6px -4px 4px",
    fontSize: 11,
  },
  divider: {
    border: "none",
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    margin: "6px 0",
  },
  emoji: {
    display: "flex",
    padding: "8px 12px 8px 0",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    userSelect: "none",
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[200],
    },
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.primary.main,
    textAlign: "center",
    width: 32,
    marginRight: 4,
    "& svg": {
      width: 18,
      height: 18.
    },
  },
});

const WUEmojiPalette = ({onSelectEmoji, classes}: {
  onSelectEmoji: (emojiOption: EmojiOption) => void,
  classes: ClassesType,
}) => {
  return (
    <div className={classes.root}>
      <PaletteSection
        title=""
        options={wuEmojiPalette}
        onSelectEmoji={onSelectEmoji}
        classes={classes}
      />
    </div>
  );
}

const WUEmojiPaletteComponent = registerComponent(
  "WUEmojiPalette",
  WUEmojiPalette,
  {styles},
);

declare global {
  interface ComponentTypes {
    WUEmojiPalette: typeof WUEmojiPaletteComponent
  }
}
