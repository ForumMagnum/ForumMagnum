"use client";
import React, { useRef, useState } from "react";
import classNames from "classnames";
import isEqual from "lodash/isEqual";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ForumIcon from "@/components/common/ForumIcon";
import { Link } from "@/lib/reactRouterWrapper";
import { AUTHOR_NARRATION_VOICE, type NarrationListenerSettings } from "@/lib/narration/narrationTypes";
import { narrationPlayerHasRoom } from "./narrationPlayerLayout";

const styles = defineStyles("NarrationSettingsPanel", (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr max-content",
    alignItems: "center",
    columnGap: 12,
    rowGap: 6,
    padding: "8px 16px 12px",
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
  header: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: -8,
  },
  title: {
    fontWeight: 600,
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    padding: 0,
    color: theme.palette.icon.dim,
    background: "transparent",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.greyAlpha(0.08),
    },
    "& svg": {
      width: 18,
      height: 18,
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
    cursor: "pointer",
  },
  // At the right, whether it fits beside the checkbox or wraps onto a line of its own
  applyButton: {
    marginLeft: "auto",
  },
  hint: {
    gridColumn: "1 / -1",
    color: theme.palette.text.dim,
    fontSize: 12,
    "& a": {
      color: theme.palette.primary.main,
    },
  },
}));

export interface NarrationVoiceOption {
  voiceId: string
  name: string
  description: string
  previewUrl: string
}

export interface NarrationModelOption {
  modelId: string
  name: string
}

export interface NarrationOptions {
  /** The voices that anyone can choose */
  voices: NarrationVoiceOption[]
  /** More voices, and the choice of model, which the server only gives to admins */
  adminOptions?: {
    voices: NarrationVoiceOption[]
    models: NarrationModelOption[]
  }|null
}

/** A choice of voice: one of the voices that everyone gets, the author's own, or (for admins) any of the rest */
const NarrationVoiceRow = ({ id, label, voiceId, setVoiceId, options, playVoicePreview }: {
  id: string
  label: string
  voiceId: string
  setVoiceId: (voiceId: string) => void
  options: NarrationOptions
  playVoicePreview: (previewUrl: string) => void
}) => {
  const classes = useStyles(styles);
  const adminVoices = options.adminOptions?.voices ?? [];
  const previewUrl = [...options.voices, ...adminVoices].find(voice => voice.voiceId === voiceId)?.previewUrl;

  return <>
    <label className={classes.label} htmlFor={id}>{label}</label>
    <select id={id} className={classes.select} value={voiceId} onChange={event => setVoiceId(event.target.value)}>
      {options.voices.map(voice => <option key={voice.voiceId} value={voice.voiceId}>{voice.name}</option>)}
      <option value={AUTHOR_NARRATION_VOICE}>Author</option>
      {adminVoices.length > 0 && <optgroup label="Admin options">
        {adminVoices.map(voice => <option key={voice.voiceId} value={voice.voiceId}>
          {voice.name} - {voice.description}
        </option>)}
      </optgroup>}
    </select>
    <button
      type="button"
      className={classes.textButton}
      onClick={() => previewUrl && playVoicePreview(previewUrl)}
      disabled={!previewUrl}
      aria-label={`Preview ${label.toLowerCase()}`}
    >
      Preview
    </button>
  </>;
};

const NarrationSettingsPanel = ({ options, settings, onApply, onClose, autoScroll, setAutoScroll }: {
  options: NarrationOptions
  settings: NarrationListenerSettings
  onApply: (settings: NarrationListenerSettings) => void
  /** Closes the settings, leaving the player open */
  onClose: () => void
  autoScroll: boolean
  setAutoScroll: (autoScroll: boolean) => void
}) => {
  const classes = useStyles(styles);
  const [draft, setDraft] = useState(settings);
  const previewAudioRef = useRef<HTMLAudioElement|null>(null);
  const models = options.adminOptions?.models;

  const playVoicePreview = (previewUrl: string) => {
    previewAudioRef.current?.pause();
    const previewAudio = new Audio(previewUrl);
    previewAudioRef.current = previewAudio;
    void previewAudio.play();
  };

  return <div className={classes.root}>
    <div className={classes.header}>
      <span className={classes.title}>Settings</span>
      <button type="button" className={classes.closeButton} onClick={onClose} aria-label="Close settings" title="Close settings">
        <ForumIcon icon="Close" />
      </button>
    </div>

    <NarrationVoiceRow
      id="narration-post-voice"
      label="Posts voice"
      voiceId={draft.postVoiceId}
      setVoiceId={postVoiceId => setDraft({ ...draft, postVoiceId })}
      options={options}
      playVoicePreview={playVoicePreview}
    />
    <NarrationVoiceRow
      id="narration-comment-voice"
      label="Comments voice"
      voiceId={draft.commentVoiceId}
      setVoiceId={commentVoiceId => setDraft({ ...draft, commentVoiceId })}
      options={options}
      playVoicePreview={playVoicePreview}
    />
    <div className={classes.hint}>
      Each user is randomly assigned an ElevenLabs voice preset.{" "}
      <Link to="/account?highlightField=narrationVoiceId" target="_blank">Choose my voice</Link>
    </div>

    {models && <>
      <label className={classes.label} htmlFor="narration-model">Model (Admin)</label>
      <select
        id="narration-model"
        className={classes.select}
        value={draft.modelId}
        onChange={event => setDraft({ ...draft, modelId: event.target.value })}
      >
        {models.map(model => <option key={model.modelId} value={model.modelId}>{model.name}</option>)}
      </select>
      <span />
    </>}

    <div className={classes.footer}>
      <label className={classes.checkboxLabel}>
        <input type="checkbox" checked={autoScroll} onChange={event => setAutoScroll(event.target.checked)} />
        <span>Scroll along with the narration</span>
      </label>
      <button
        type="button"
        className={classNames(classes.textButton, classes.applyButton)}
        onClick={() => onApply(draft)}
        disabled={isEqual(draft, settings)}
      >
        Apply
      </button>
    </div>
    <div className={classes.hint}>
      Applying new settings continues from the paragraph being read. Audio is generated once per voice and kept, so
      switching back is instant. Double-click a paragraph to jump to it.
    </div>
  </div>;
};

export default NarrationSettingsPanel;
