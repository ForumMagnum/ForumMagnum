import type { ComponentType } from "react";
import { TickReactionIcon } from "../../components/icons/reactions/TickReactionIcon";
import { CrossReactionIcon } from "../../components/icons/reactions/CrossReactionIcon";
import { HeartReactionIcon } from "../../components/icons/reactions/HeartReactionIcon";
import { HandshakeReactionIcon } from "../../components/icons/reactions/HandshakeReactionIcon";
import { LightbulbReactionIcon } from "../../components/icons/reactions/LightbulbReactionIcon";
import { DeltaReactionIcon } from "../../components/icons/reactions/DeltaReactionIcon";

export type EmojiOption = {
  Component: ComponentType,
  name: string,
  label: string,
}

export const eaAnonymousEmojiPalette: EmojiOption[] = [
  {
    Component: TickReactionIcon,
    name: "agree",
    label: "Agree",
  },
  {
    Component: CrossReactionIcon,
    name: "disagree",
    label: "Disagree",
  },
];

export const eaEmojiPalette: EmojiOption[] = [
  {
    Component: HeartReactionIcon,
    name: "love",
    label: "Heart",
  },
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

export const eaEmojiNames = [
  ...eaAnonymousEmojiPalette,
  ...eaEmojiPalette,
].map(({name}) => name);
