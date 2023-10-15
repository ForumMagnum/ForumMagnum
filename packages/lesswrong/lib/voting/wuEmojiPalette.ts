import type { ComponentType } from "react";
import { HandshakeReactionIcon } from "../../components/icons/reactions/HandshakeReactionIcon";
import { LightbulbReactionIcon } from "../../components/icons/reactions/LightbulbReactionIcon";
import { DeltaReactionIcon } from "../../components/icons/reactions/DeltaReactionIcon";

export type EmojiOption = {
  Component: ComponentType,
  name: string,
  label: string,
}

export const wuEmojiPalette: EmojiOption[] = [
  {
    Component: HandshakeReactionIcon,
    name: "helpful",
    label: "Helpful",
  },
  {
    Component: LightbulbReactionIcon,
    name: "insightful",
    label: "Insightful",
  },
  {
    Component: DeltaReactionIcon,
    name: "changed-mind",
    label: "Changed my mind",
  },
];

export const wuEmojiNames = wuEmojiPalette.map(({name}) => name);
