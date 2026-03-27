"use client";
import React, { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import classNames from "classnames";
import LWDialog from "../common/LWDialog";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";
import { ClaudeSparkIcon } from "../icons/claudeSparkIcon";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import ForumIcon from "../common/ForumIcon";
import { gql } from "@/lib/generated/gql-codegen";
import { useTracking } from "@/lib/analyticsEvents";

const styles = defineStyles("ClaudeOnboardingModal", (theme: ThemeType) => ({
  content: {
    padding: "24px 25px",
    width: 760,
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    ...theme.typography.commentStyle,
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
  },
  claudeIcon: {
    width: 20,
    height: 20,
  },
  instructions: {
    ...theme.typography.commentStyle,
    fontSize: 15,
    lineHeight: "1.6",
    color: theme.palette.text.normal,
    "& ol": {
      paddingLeft: 20,
      margin: "0 0 16px 0",
    },
    "& li": {
      marginBottom: 12,
    },
    "& a": {
      color: theme.palette.primary.main,
    },
    "& code": {
      background: theme.palette.greyAlpha(0.07),
      padding: "2px 5px",
      borderRadius: 3,
      fontSize: 13,
    },
  },
  claudeButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: theme.palette.buttons.shareWithClaude,
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.alwaysWhite,
    transition: "all 0.15s ease",
    "&:hover": {
      background: theme.palette.buttons.shareWithClaudeHover,
    },
  },
  claudeButtonIcon: {
    fontSize: 15,
  },
  claudeButtonDisabled: {
    opacity: 0.5,
    cursor: "default",
  },
  confirmButton: {
    width: "fit-content",
    marginTop: 10,
  },
  doneButton: {
    height: 36,
  },
  screenshot: {
    display: "block",
    margin: "12px auto 4px",
    marginLeft: -20,
    borderRadius: 6,
  },
  loading: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.grey[600],
    padding: "8px 0",
  },
  error: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.error.main,
    padding: "8px 0",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 16,
    borderTop: theme.palette.greyBorder("1px", 0.1),
  },
}));

const getClaudeAccessLinkMutation = gql(`
  mutation getClaudeAccessLink {
    getClaudeAccessLink
  }
`);

function getClaudeConfirmMessage(confirmUrl: string) {
  return `Please confirm that you can access the LessWrong API by running:\n\ncurl -X POST ${confirmUrl}`;
}

const ClaudeOnboardingModal = ({
  onClose,
  postId,
}: {
  onClose: () => void;
  postId: string;
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [getLink] = useMutation(getClaudeAccessLinkMutation);

  useEffect(() => {
    void getLink().then((result) => {
      const link = result.data?.getClaudeAccessLink;
      if (link) {
        setConfirmUrl(link);
      } else {
        setError("Failed to generate confirmation link. Please try again.");
      }
    }).catch((e) => {
      setError(e.message ?? "Failed to generate confirmation link.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claudeConfirmLink = confirmUrl
    ? `https://www.claude.ai/new?q=${encodeURIComponent(getClaudeConfirmMessage(confirmUrl))}`
    : null;

  return (
    <LWDialog maxWidth="md" open={true} onClose={onClose}>
      <div className={classes.content}>
        <div className={classes.title}>
          <ClaudeSparkIcon className={classes.claudeIcon} />
          Connect Claude to LessWrong
        </div>

        <div className={classes.instructions}>
          <ol>
            <li>
              Open your{" "}
              <a
                href="https://claude.ai/settings/capabilities#code-execution"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => captureEvent("claudeOnboardingSettingsClicked", { postId })}
              >
                Claude settings
              </a>
              , ensure "Allow network egress" is toggled on, and add{" "}
              <code>www.lesswrong.com</code> to "Additional allowed
              domains".
              <CloudinaryImage2
                publicId="claude_onboarding_orange_wswu5o"
                width={710}
                className={classes.screenshot}
              />
            </li>
            <li>
              {error ? (
                <span className={classes.error}>{error}</span>
              ) : (
                <>
                  After that, click the following button and send the message to
                  finalize the connection: <button
                    type="button"
                    className={classNames(classes.claudeButton, classes.confirmButton, !claudeConfirmLink && classes.claudeButtonDisabled)}
                    disabled={!claudeConfirmLink}
                    onClick={() => {
                      if (!claudeConfirmLink) return;
                      captureEvent("claudeOnboardingConfirmClicked", { postId });
                      window.open(claudeConfirmLink, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ForumIcon icon="OpenInNew" className={classes.claudeButtonIcon} />
                    Confirm in Claude
                  </button>
                </>
              )}
            </li>
          </ol>
        </div>

        <div className={classes.footer}>
          <button type="button" className={classNames(classes.claudeButton, classes.doneButton)} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </LWDialog>
  );
};

export default ClaudeOnboardingModal;
