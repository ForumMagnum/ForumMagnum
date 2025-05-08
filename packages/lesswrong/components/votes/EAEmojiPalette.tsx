import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import {
  eaAnonymousEmojiPalette,
  eaEmojiPalette,
  EmojiOption,
} from "../../lib/voting/eaEmojiPalette";

const styles = (theme: ThemeType) => ({
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
      height: 18,
    },
  },
});

const PaletteSection: FC<{
  title: string,
  options: EmojiOption[],
  onSelectEmoji: (emojiOption: EmojiOption) => void,
  classes: ClassesType<typeof styles>,
}> = ({title, options, onSelectEmoji, classes}) => {
  const {SectionTitle} = Components;
  return (
    <>
      <SectionTitle
        title={title}
        titleClassName={classes.title}
        noTopMargin
      />
      <div>
        {options.map((emojiOption) =>
          <div
            key={emojiOption.name}
            onClick={() => onSelectEmoji(emojiOption)}
            className={classes.emoji}
          >
            <div className={classes.icon}>
              <emojiOption.Component />
            </div>
            {emojiOption.label}
          </div>
        )}
      </div>
    </>
  );
}

const EAEmojiPaletteInner = ({onSelectEmoji, classes}: {
  onSelectEmoji: (emojiOption: EmojiOption) => void,
  classes: ClassesType<typeof styles>,
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

export const EAEmojiPalette = registerComponent(
  "EAEmojiPalette",
  EAEmojiPaletteInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojiPalette: typeof EAEmojiPalette
  }
}
