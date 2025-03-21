import type { FC } from "react";
import { TickReactionIcon } from "../../components/icons/reactions/TickReactionIcon";
import { CrossReactionIcon } from "../../components/icons/reactions/CrossReactionIcon";
import { HeartReactionIcon } from "../../components/icons/reactions/HeartReactionIcon";
import { HandshakeReactionIcon } from "../../components/icons/reactions/HandshakeReactionIcon";
import { LightbulbReactionIcon } from "../../components/icons/reactions/LightbulbReactionIcon";
import { DeltaReactionIcon } from "../../components/icons/reactions/DeltaReactionIcon";
import { LaughReactionIcon } from "@/components/icons/reactions/LaughReactionIcon";

export type EmojiOption = {
  Component: FC,
  name: string,
  label: string,
  isNegative?: boolean,
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
    isNegative: true,
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
  {
    Component: LaughReactionIcon,
    name: "laugh",
    label: "Joy",
  },
];

export const getEAAnonymousEmojiByName = (targetName: string) =>
  eaAnonymousEmojiPalette.find(({name}) => name === targetName)

export const getEAPublicEmojiByName = (targetName: string) =>
  eaEmojiPalette.find(({name}) => name === targetName)

export const getEAEmojisForKarmaChanges = (showNegative: boolean) => ({
  publicEmojis: eaEmojiPalette
    .filter(({isNegative}) => showNegative || !isNegative)
    .map(({name}) => name),
  privateEmojis: eaAnonymousEmojiPalette
    .filter(({isNegative}) => showNegative || !isNegative)
    .map(({name}) => name),
});

export const eaEmojiNames = [
  ...eaAnonymousEmojiPalette,
  ...eaEmojiPalette,
].map(({name}) => name);

export const eaPublicEmojiNames = eaEmojiPalette.map(({name}) => name);

export const getEmojiMutuallyExclusivePartner = (emojiName: string) => {
  switch (emojiName) {
  case "agree":
    return "disagree";
  case "disagree":
    return "agree";
  default:
    return undefined;
  }
}
