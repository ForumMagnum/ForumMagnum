"use client";
import React from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import SettingsSelectRow from "../users/account/SettingsSelectRow";

const NarrationSelectableVoicesQuery = gql(`
  query NarrationSelectableVoicesQuery {
    narrationSelectableVoices {
      voiceId
      name
      previewUrl
    }
  }
`);

/** The select's value for a user who has no voice yet, and will be given one when it's first needed */
const AUTO_VOICE_VALUE = "";

const styles = defineStyles("NarrationVoiceSetting", () => ({
  preview: {
    display: "block",
    width: "100%",
    height: 32,
    margin: "12px 0",
  },
}));

/**
 * Lets a user choose the voice that their comments are narrated in, and hear
 * a sample of the one that's chosen.
 */
const NarrationVoiceSetting = ({ value, onChange }: {
  value: string|null|undefined
  onChange: (voiceId: string|null) => void
}) => {
  const classes = useStyles(styles);
  const { data } = useQuery(NarrationSelectableVoicesQuery, { ssr: false });
  const voices = data?.narrationSelectableVoices;
  const selectedVoice = voices?.find(voice => voice.voiceId === value);

  const options = voices
    ? [{ value: AUTO_VOICE_VALUE, label: "Auto" }, ...voices.map(voice => ({ value: voice.voiceId, label: voice.name }))]
    : [{ value: value ?? AUTO_VOICE_VALUE, label: "Loading voices…" }];

  return <>
    <SettingsSelectRow
      value={value ?? AUTO_VOICE_VALUE}
      onChange={newValue => onChange(newValue === AUTO_VOICE_VALUE ? null : newValue)}
      options={options}
      label="Voice for your comments"
      description="The voice your comments are read aloud in. With Auto, one is picked the first time someone listens to a comment of yours."
    />
    {selectedVoice?.previewUrl && <audio
      key={selectedVoice.voiceId}
      className={classes.preview}
      src={selectedVoice.previewUrl}
      controls
      preload="none"
      aria-label={`Sample of ${selectedVoice.name}`}
    />}
  </>;
};

export default NarrationVoiceSetting;
