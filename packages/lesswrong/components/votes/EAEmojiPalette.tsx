import React, { FC } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import {
  eaAnonymousEmojiPalette,
  eaEmojiPalette,
  EmojiOption,
} from "../../lib/voting/eaEmojiPalette";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 6,
  },
  title: {
    margin: "6px 6px -4px 6px",
    fontSize: 11,
  },
  divider: {
    border: "none",
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    margin: "6px 0",
  },
  emoji: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px 8px 0",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    userSelect: "none",
    borderRadius: theme.borderRadius.default,
    "& svg": {
      color: theme.palette.primary.main,
      width: 35,
      height: 18,
    },
    "&:hover": {
      background: theme.palette.grey[200],
    },
  },
});

const PaletteSection: FC<{
  title: string,
  options: EmojiOption[],
  onSelectEmoji: (emojiOption: EmojiOption) => void,
  classes: ClassesType,
}> = ({title, options, onSelectEmoji, classes}) => {
  const {SectionTitle} = Components;
  return (
    <>
      <SectionTitle
        title={title}
        className={classes.title}
        noTopMargin
      />
      <div>
        {options.map((emojiOption) =>
          <div
            key={emojiOption.name}
            onClick={() => onSelectEmoji(emojiOption)}
            className={classes.emoji}
          >
            <emojiOption.Component />
            {emojiOption.label}
          </div>
        )}
      </div>
    </>
  );
}

const EAEmojiPalette = ({onSelectEmoji, classes}: {
  onSelectEmoji: (emojiOption: EmojiOption) => void,
  classes: ClassesType,
}) => {
  return (
    <div className={classes.root}>
      <PaletteSection
        title="Anonymous"
        options={eaAnonymousEmojiPalette}
        onSelectEmoji={onSelectEmoji}
        classes={classes}
      />
      <hr className={classes.divider} />
      <PaletteSection
        title="Non-anonymous"
        options={eaEmojiPalette}
        onSelectEmoji={onSelectEmoji}
        classes={classes}
      />
    </div>
  );
}

const EAEmojiPaletteComponent = registerComponent(
  "EAEmojiPalette",
  EAEmojiPalette,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojiPalette: typeof EAEmojiPaletteComponent
  }
}
