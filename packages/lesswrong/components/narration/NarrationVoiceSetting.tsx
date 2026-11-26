"use client";
import React, { useEffect, useRef, useState } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useMessages } from "@/components/common/withMessages";
import ForumIcon from "@/components/common/ForumIcon";
import SettingsButton from "../users/account/SettingsButton";
import SettingsSelectRow, { SettingsSelect } from "../users/account/SettingsSelectRow";
import { formatNarrationPlaybackRate, narrationPlaybackRates, useNarrationPlaybackRate } from "./useNarrationPlaybackRate";

const NarrationSelectableVoicesQuery = gql(`
  query NarrationSelectableVoicesQuery {
    narrationSelectableVoices {
      voiceId
      name
      description
      previewUrl
    }
  }
`);

/** The select's value for a user who has no voice yet, and will be given one when it's first needed */
const AUTO_VOICE_VALUE = "";

const playbackRateOptions = narrationPlaybackRates.map(playbackRate => ({
  value: playbackRate,
  label: formatNarrationPlaybackRate(playbackRate),
}));

const styles = defineStyles("NarrationVoiceSetting", () => ({
  sample: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  sampleButtonIcon: {
    width: 14,
    height: 14,
  },
}));

/** Stopping a sample before it has loaded makes its play() fail, which isn't a failure to report */
function isInterruptedPlayback(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Plays our recording of a voice, at the speed chosen, from its start each time */
const NarrationVoiceSample = ({ voiceName, previewUrl, playbackRate, setPlaybackRate }: {
  voiceName: string
  previewUrl: string
  playbackRate: number
  setPlaybackRate: (playbackRate: number) => void
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      // Loading the recording resets playbackRate to defaultPlaybackRate
      audio.defaultPlaybackRate = playbackRate;
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.play().catch((error: unknown) => {
      if (!isInterruptedPlayback(error)) {
        // A recording that fails to load leaves the element playing nothing,
        // rather than paused, and pausing it is what puts the button back
        audio.pause();
        flash({ messageString: "The sample couldn't be played", type: "error" });
      }
    });
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  return <div className={classes.sample}>
    <audio
      ref={audioRef}
      src={previewUrl}
      preload="none"
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
    />
    <SettingsSelect
      value={playbackRate}
      onChange={newPlaybackRate => setPlaybackRate(Number(newPlaybackRate))}
      options={playbackRateOptions}
      ariaLabel="Sample playback speed"
    />
    <SettingsButton
      onClick={isPlaying ? stop : play}
      ariaLabel={isPlaying ? "Stop the sample" : `Play a sample of ${voiceName}`}
    >
      <ForumIcon icon={isPlaying ? "Stop" : "Play"} className={classes.sampleButtonIcon} />
      {isPlaying ? "Stop" : "Play"}
    </SettingsButton>
  </div>;
};

/**
 * Lets a user choose the voice that their posts and comments are narrated in
 * (for listeners who ask to hear authors' voices), and hear a sample of the
 * one that's chosen. The sample starts at the speed that they listen to
 * narration at, and the speed they choose here is only for the sample.
 */
const NarrationVoiceSetting = ({ value, onChange }: {
  value: string|null|undefined
  onChange: (voiceId: string|null) => void
}) => {
  const { data } = useQuery(NarrationSelectableVoicesQuery, { ssr: false });
  const voices = data?.narrationSelectableVoices;
  const selectedVoice = voices?.find(voice => voice.voiceId === value);
  const { playbackRate: listeningPlaybackRate } = useNarrationPlaybackRate();
  const [samplePlaybackRate, setSamplePlaybackRate] = useState(listeningPlaybackRate);

  const options = voices
    ? [{ value: AUTO_VOICE_VALUE, label: "Auto" }, ...voices.map(voice => ({ value: voice.voiceId, label: `${voice.name} - ${voice.description}` }))]
    : [{ value: value ?? AUTO_VOICE_VALUE, label: "Loading voices…" }];

  return <SettingsSelectRow
    value={value ?? AUTO_VOICE_VALUE}
    onChange={newValue => onChange(newValue === AUTO_VOICE_VALUE ? null : newValue)}
    options={options}
    label="Your voice"
    description="The voice that your posts and comments are read aloud in, for listeners who choose to hear authors' voices. With Auto, one is picked the first time it's needed."
    controlsBelowSelect={selectedVoice && <NarrationVoiceSample
      key={selectedVoice.voiceId}
      voiceName={selectedVoice.name}
      previewUrl={selectedVoice.previewUrl}
      playbackRate={samplePlaybackRate}
      setPlaybackRate={setSamplePlaybackRate}
    />}
  />;
};

export default NarrationVoiceSetting;
