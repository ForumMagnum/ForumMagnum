import React, { useState, useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib";

type EmojiOption = {
  emoji: string,
  name: string,
}

const emojiPalette: EmojiOption[] = [
  {emoji: "🤝", name: "Helpful"},
  {emoji: "💡", name: "This changed my mind"},
  {emoji: "🕵️", name: "Scout mindset"},
  {emoji: "🧠", name: "Well-reasoned"},
  {emoji: "📖", name: "Well-cited"},
  {emoji: "❤️", name: "Send love"},
  {emoji: "🙏", name: "Thank you"},
  {emoji: "🎉", name: "Celebrate"},
  {emoji: "🤔", name: "I'm confused"},
  {emoji: "😂", name: "Funny"},
];

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    gap: "10px",
    fontSize: 13,
  },
  emojiContainer: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: "2px",
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

const EAEmojiPalette = ({classes}: {classes: ClassesType}) => {
  const [hovered, setHovered] = useState<EmojiOption | null>(null);

  const onEnter = useCallback((emojiOption: EmojiOption) => {
    setHovered(emojiOption);
  }, [hovered]);

  const onLeave = useCallback((emojiOption: EmojiOption) => {
    if (emojiOption.name === hovered?.name) {
      setHovered(null);
    }
  }, [hovered]);

  return (
    <div>
      <div className={classes.emojiContainer}>
        {emojiPalette.map((emojiOption) =>
          <div
            key={emojiOption.name}
            onMouseEnter={() => onEnter(emojiOption)}
            onMouseLeave={() => onLeave(emojiOption)}
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
              <div>{hovered.name}</div>
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
