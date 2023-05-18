import React, { useState, useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { eaEmojiPalette, EmojiOption } from "../../lib/voting/eaEmojiPalette";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    gap: "10px",
    fontSize: 13,
  },
  emojiContainer: {
    display: "flex",
    flexWrap: "wrap",
    margin: "1em",
  },
  emoji: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexBasis: "20%",
    fontSize: "1.6em",
    aspectRatio: 1,
    borderRadius: theme.borderRadius.small,
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.grey[110],
    },
  },
  nameContainer: {
    display: "flex",
    alignItems: "center",
    padding: "1.2em",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    color: theme.palette.grey[600],
    background: theme.palette.grey[60],
    gap: "8px",
    height: 44,
  },
  emojiPreview: {
    fontSize: "1.6em",
  },
});

const EAEmojiPalette = ({onSelectEmoji, classes}: {
  onSelectEmoji: (emojiOption: EmojiOption) => void,
  classes: ClassesType,
}) => {
  const [hovered, setHovered] = useState<EmojiOption | null>(null);

  const onEnter = useCallback((emojiOption: EmojiOption) => {
    setHovered(emojiOption);
  }, []);

  const onLeave = useCallback((emojiOption: EmojiOption) => {
    if (emojiOption.name === hovered?.name) {
      setHovered(null);
    }
  }, [hovered]);

  return (
    <div>
      <div className={classes.emojiContainer}>
        {eaEmojiPalette.map((emojiOption) =>
          <div
            key={emojiOption.name}
            onMouseEnter={() => onEnter(emojiOption)}
            onMouseLeave={() => onLeave(emojiOption)}
            onClick={() => onSelectEmoji(emojiOption)}
            className={classes.emoji}
          >
            {emojiOption.emoji}
          </div>
        )}
      </div>
      <div className={classes.nameContainer}>
        {hovered
          ? (
            <>
              <div className={classes.emojiPreview}>{hovered.emoji}</div>
              <div>{hovered.label}</div>
            </>
          )
          : "What did you think of this?"
        }
      </div>
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
