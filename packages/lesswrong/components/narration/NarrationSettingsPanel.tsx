"use client";
import React, { useRef, useState } from "react";
import classNames from "classnames";
import isEqual from "lodash/isEqual";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ForumIcon from "@/components/common/ForumIcon";
import { useCurrentUser } from "@/components/common/withUser";
import { Link } from "@/lib/reactRouterWrapper";
import { AUTHOR_NARRATION_VOICE, type NarrationListenerSettings } from "@/lib/narration/narrationTypes";
import { narrationPlayerHasRoom } from "./narrationPlayerLayout";

// The colors are custom properties that the player sets (see narrationPlayerStyles.ts)
const styles = defineStyles("NarrationSettingsPanel", (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr max-content",
    alignItems: "center",
    columnGap: 8,
    rowGap: 6,
    padding: "10px 14px 14px",
    borderBottom: "1px solid var(--narration-divider)",
    // On a phone, the panel can be taller than what's left of the screen
    maxHeight: "calc(100vh - 200px)",
    overflowY: "auto",
    // Each setting's label goes above its control, or beside it if there's room
    [narrationPlayerHasRoom(theme)]: {
      gridTemplateColumns: "max-content 1fr max-content",
      columnGap: 12,
      rowGap: 8,
    },
  },
  header: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: -6,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    padding: 0,
    color: "var(--narration-icon)",
    background: "transparent",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    "&:hover": {
      color: "var(--narration-text)",
      background: "var(--narration-hover)",
    },
    "& svg": {
      width: 18,
      height: 18,
    },
  },
  label: {
    gridColumn: "1 / -1",
    marginTop: 4,
    fontSize: 12,
    color: "var(--narration-dim)",
    [narrationPlayerHasRoom(theme)]: {
      gridColumn: "auto",
      marginTop: 0,
    },
  },
  // A <select> without the browser's drawing of one. The arrow at its right
  // is two gradients, so that it can take the text's color.
  select: {
    minWidth: 0,
    width: "100%",
    padding: "7px 28px 7px 10px",
    appearance: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: "var(--narration-text)",
    backgroundColor: "var(--narration-control-bg)",
    backgroundImage: "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
    backgroundPosition: "calc(100% - 15px) 54%, calc(100% - 10px) 54%",
    backgroundSize: "5px 5px",
    backgroundRepeat: "no-repeat",
    border: "none",
    borderRadius: 8,
    textOverflow: "ellipsis",
    cursor: "pointer",
    transition: "background-color 120ms ease-out",
    "&:hover": {
      backgroundColor: "var(--narration-control-hover-bg)",
    },
  },
  textButton: {
    padding: "7px 12px",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--narration-text)",
    background: "var(--narration-control-bg)",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    transition: "background 120ms ease-out",
    "&:hover:not(:disabled)": {
      background: "var(--narration-control-hover-bg)",
    },
    "&:disabled": {
      opacity: 0.45,
      cursor: "default",
    },
  },
  footer: {
    gridColumn: "1 / -1",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    "& input": {
      margin: 0,
      accentColor: "var(--narration-accent)",
    },
  },
  // At the right, whether it fits beside the checkbox or wraps onto a line of its own
  applyButton: {
    marginLeft: "auto",
    padding: "7px 16px",
    color: "var(--narration-on-accent)",
    background: "var(--narration-accent)",
    "&:hover:not(:disabled)": {
      background: "var(--narration-accent)",
      filter: "brightness(0.92)",
    },
  },
  hint: {
    gridColumn: "1 / -1",
    color: "var(--narration-dim)",
    fontSize: 12,
    lineHeight: "16px",
    "& a": {
      color: "var(--narration-text)",
      textDecoration: "underline",
      textUnderlineOffset: 2,
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
  const currentUser = useCurrentUser();
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
      Each user is randomly assigned an ElevenLabs voice preset.
      {currentUser && <>{" "}<Link to="/account?highlightField=narrationVoiceId" target="_blank">Choose my voice</Link></>}
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
  </div>;
};

export default NarrationSettingsPanel;
