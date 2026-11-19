"use client";
import React, { useRef, useState } from "react";
import isEqual from "lodash/isEqual";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import {
  defaultNarrationVoiceTuning,
  narrationTuningKeys,
  narrationTuningRanges,
  type NarrationVoiceSettings,
} from "@/lib/narration/narrationTypes";
import { narrationPlayerHasRoom } from "./narrationPlayerLayout";

const styles = defineStyles("NarrationSettingsPanel", (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr max-content",
    alignItems: "center",
    columnGap: 12,
    rowGap: 6,
    padding: "12px 16px",
    borderBottom: theme.palette.border.faint,
    // On a phone, the panel can be taller than what's left of the screen
    maxHeight: "calc(100vh - 200px)",
    overflowY: "auto",
    // Each setting's label goes above its control, or beside it if there's room
    [narrationPlayerHasRoom(theme)]: {
      gridTemplateColumns: "max-content 1fr max-content",
      rowGap: 8,
    },
  },
  label: {
    gridColumn: "1 / -1",
    color: theme.palette.text.dim,
    [narrationPlayerHasRoom(theme)]: {
      gridColumn: "auto",
    },
  },
  select: {
    minWidth: 0,
    width: "100%",
    padding: "4px 6px",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: theme.palette.text.normal,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.small,
  },
  slider: {
    width: "100%",
  },
  value: {
    fontVariantNumeric: "tabular-nums",
    textAlign: "right",
    color: theme.palette.text.dim,
  },
  textButton: {
    padding: "4px 10px",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: theme.palette.text.normal,
    background: "transparent",
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.small,
    cursor: "pointer",
    "&:hover:not(:disabled)": {
      background: theme.palette.greyAlpha(0.06),
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "default",
    },
  },
  footer: {
    gridColumn: "1 / -1",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginRight: "auto",
    cursor: "pointer",
  },
  hint: {
    gridColumn: "1 / -1",
    color: theme.palette.text.dim,
    fontSize: 12,
  },
}));

export interface NarrationVoiceOption {
  voiceId: string
  name: string
  category: string|null
  previewUrl: string|null
}

export interface NarrationModelOption {
  modelId: string
  name: string
}

const NarrationSettingsPanel = ({ voices, models, settings, onApply, autoScroll, setAutoScroll }: {
  voices: NarrationVoiceOption[]
  models: NarrationModelOption[]
  settings: NarrationVoiceSettings
  onApply: (settings: NarrationVoiceSettings) => void
  autoScroll: boolean
  setAutoScroll: (autoScroll: boolean) => void
}) => {
  const classes = useStyles(styles);
  const [draft, setDraft] = useState(settings);
  const previewAudioRef = useRef<HTMLAudioElement|null>(null);

  const selectedVoice = voices.find(voice => voice.voiceId === draft.voiceId);
  const previewUrl = selectedVoice?.previewUrl;

  const playVoicePreview = () => {
    if (!previewUrl) {
      return;
    }
    previewAudioRef.current?.pause();
    const previewAudio = new Audio(previewUrl);
    previewAudioRef.current = previewAudio;
    void previewAudio.play();
  };

  return <div className={classes.root}>
    <label className={classes.label} htmlFor="narration-voice">Voice</label>
    <select
      id="narration-voice"
      className={classes.select}
      value={draft.voiceId}
      onChange={event => setDraft({ ...draft, voiceId: event.target.value })}
    >
      {voices.map(voice => <option key={voice.voiceId} value={voice.voiceId}>
        {voice.category ? `${voice.name} (${voice.category})` : voice.name}
      </option>)}
    </select>
    <button type="button" className={classes.textButton} onClick={playVoicePreview} disabled={!previewUrl}>
      Preview
    </button>

    <label className={classes.label} htmlFor="narration-model">Model</label>
    <select
      id="narration-model"
      className={classes.select}
      value={draft.modelId}
      onChange={event => setDraft({ ...draft, modelId: event.target.value })}
    >
      {models.map(model => <option key={model.modelId} value={model.modelId}>{model.name}</option>)}
    </select>
    <span />

    {narrationTuningKeys.map(tuningKey => {
      const { min, max, label } = narrationTuningRanges[tuningKey];
      const inputId = `narration-${tuningKey}`;
      return <React.Fragment key={tuningKey}>
        <label className={classes.label} htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          className={classes.slider}
          type="range"
          min={min}
          max={max}
          step={0.05}
          value={draft[tuningKey]}
          onChange={event => setDraft({ ...draft, [tuningKey]: Number(event.target.value) })}
        />
        <span className={classes.value}>{draft[tuningKey].toFixed(2)}</span>
      </React.Fragment>;
    })}

    <div className={classes.footer}>
      <label className={classes.checkboxLabel}>
        <input type="checkbox" checked={autoScroll} onChange={event => setAutoScroll(event.target.checked)} />
        <span>Scroll along with the narration</span>
      </label>
      <button type="button" className={classes.textButton} onClick={() => setDraft({ ...draft, ...defaultNarrationVoiceTuning })}>
        Reset sliders
      </button>
      <button type="button" className={classes.textButton} onClick={() => onApply(draft)} disabled={isEqual(draft, settings)}>
        Apply
      </button>
    </div>
    <div className={classes.hint}>
      Applying new settings continues from the paragraph being read. Audio is generated once per combination of
      settings and kept, so switching back is instant. Double-click a paragraph to jump to it.
    </div>
  </div>;
};

export default NarrationSettingsPanel;
