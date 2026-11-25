"use client";
import React, { useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useMessages } from "@/components/common/withMessages";
import Loading from "@/components/vulcan-core/Loading";
import ExplicitSaveTextSetting from "../users/account/ExplicitSaveTextSetting";
import type { UserSettingsSaveResult } from "../users/account/useAutoSavedUserSettings";

const PreviewNarrationNamePronunciationMutation = gql(`
  mutation PreviewNarrationNamePronunciationMutation($userId: String!, $pronunciation: String!) {
    previewNarrationNamePronunciation(userId: $userId, pronunciation: $pronunciation)
  }
`);

const IPA_URL = "https://en.wikipedia.org/wiki/International_Phonetic_Alphabet";

const styles = defineStyles("NarrationNamePronunciationSetting", (theme: ThemeType) => ({
  previewButton: {
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    background: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "border-color 0.15s ease, color 0.15s ease",
    "&:hover:not(:disabled)": {
      borderColor: theme.palette.greyAlpha(0.4),
      color: theme.palette.grey[900],
      background: theme.palette.greyAlpha(0.03),
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
}));

/** Plays how narration would say the user's name with `pronunciation`, which needn't be what's saved */
const NamePronunciationPreviewButton = ({ userId, pronunciation }: {
  userId: string
  pronunciation: string
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const previewAudioRef = useRef<HTMLAudioElement|null>(null);

  const [previewPronunciation, { loading }] = useMutation(PreviewNarrationNamePronunciationMutation, {
    onCompleted: ({ previewNarrationNamePronunciation: previewAudioUrl }) => {
      previewAudioRef.current?.pause();
      const previewAudio = new Audio(previewAudioUrl);
      previewAudioRef.current = previewAudio;
      previewAudio.play().catch(() => flash({ messageString: "The preview couldn't be played", type: "error" }));
    },
    onError: (error) => flash({ messageString: error.message, type: "error" }),
  });

  return <button
    type="button"
    className={classes.previewButton}
    onClick={() => void previewPronunciation({ variables: { userId, pronunciation } })}
    disabled={loading}
    aria-label="Preview pronunciation"
  >
    {loading ? <Loading /> : "Preview"}
  </button>;
};

/**
 * Lets a user say how narration should pronounce their name where it says
 * who wrote something. It's only saved when they ask for it to be, so that
 * they can try pronunciations out with Preview without narration that's
 * generated in the meantime using their attempts.
 */
const NarrationNamePronunciationSetting = ({ userId, value, onSave }: {
  userId: string
  value: string|null|undefined
  onSave: (pronunciation: string) => Promise<UserSettingsSaveResult>
}) => {
  return <ExplicitSaveTextSetting
    label="Override pronunciation"
    description={<>
      How your name is said when your posts and comments are read aloud, written in
      the <a href={IPA_URL} target="_blank" rel="noopener noreferrer">International Phonetic Alphabet</a>.
      Leave it empty to have the narrator go by your display name.
    </>}
    placeholder="Auto"
    value={value}
    onSave={onSave}
    renderDraftActions={(draft) => <NamePronunciationPreviewButton userId={userId} pronunciation={draft} />}
  />;
};

export default NarrationNamePronunciationSetting;
