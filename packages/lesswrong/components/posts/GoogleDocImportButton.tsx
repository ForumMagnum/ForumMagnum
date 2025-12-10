import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, gql, useQuery } from "@apollo/client";
import { extractGoogleDocId, googleDocIdToUrl, postGetEditUrl } from "../../lib/collections/posts/helpers";
import { useMessages } from "../common/withMessages";
import { useTracking } from "../../lib/analyticsEvents";
import type { GoogleDocMetadata } from "../../server/collections/revisions/helpers";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import EAButton from "../ea-forum/EAButton";
import ForumIcon from "../common/ForumIcon";
import PopperCard from "../common/PopperCard";
import LWClickAwayListener from "../common/LWClickAwayListener";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  button: {
    color: theme.palette.grey[900],
    backgroundColor: "transparent",
    padding: "2px 12px",
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
    '&:disabled': {
      color: theme.palette.grey[900],
      backgroundColor: "transparent",
      opacity: 0.5
    },
  },
  buttonInternalIcon: {
    width: "20px",
    marginRight: 6
  },
  popper: {
    marginTop: 12,
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
  },
  card: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: 322
  },
  info: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[900],
    lineHeight: "18px"
  },
  footer: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[600],
    lineHeight: "18px",
    fontStyle: 'italic',
  },
  error: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "18px",
    textAlign: "center",
    color: theme.palette.error.main
  },
  formButton: {
    fontWeight: 600,
    display: "flex",
    alignItems: "center"
  },
  loadingDots: {
    marginTop: -8
  },
  input: {
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    padding: "12px 8px",
    '&:hover, &:focus': {
      backgroundColor: theme.palette.grey[200],
    }
  }
});


const GoogleDocImportButton = ({ postId, version, classes }: { postId?: string; version?: string; classes: ClassesType<typeof styles> }) => {
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [open, setOpen] = useState(false)
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { captureEvent } = useTracking()
  const { flash } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: latestGoogleDocMetadataQuery } = useQuery<{ latestGoogleDocMetadata: GoogleDocMetadata }>(
    gql`
      query latestGoogleDocMetadata($postId: String!, $version: String) {
        latestGoogleDocMetadata(postId: $postId, version: $version)
      }
    `,
    {
      variables: {
        postId,
        version,
        batchKey: "docImportInfo"
      },
      skip: !postId,
    }
  );
  const previousDocId = latestGoogleDocMetadataQuery?.latestGoogleDocMetadata?.id

  useEffect(() => {
    if (previousDocId) {
      setGoogleDocUrl(googleDocIdToUrl(previousDocId))
    }
  }, [previousDocId])

  const fileId = extractGoogleDocId(googleDocUrl)
  const canImport = !!fileId

  const [importGoogleDocMutation, {loading: mutationLoading}] = useMutation(
    gql`
      mutation ImportGoogleDoc($fileUrl: String!, $postId: String) {
        ImportGoogleDoc(fileUrl: $fileUrl, postId: $postId) {
          ...PostsBase
        }
      }
      ${fragmentTextForQuery("PostsBase")}
    `,
    {
      onCompleted: (data: { ImportGoogleDoc: PostsBase }) => {
        setErrorMessage(null)
        const postId = data?.ImportGoogleDoc?._id;
        const linkSharingKey = data?.ImportGoogleDoc?.linkSharingKey;
        const editPostUrl = postGetEditUrl(postId, false, linkSharingKey ?? undefined);

        captureEvent("googleDocImportSubmitted", {
          success: true,
          fileUrl: googleDocUrl,
          postId,
          isNew: !postId,
        });

        if (location.url === editPostUrl) {
          window.location.reload();
        } else {
          void navigate(editPostUrl);
        }
      },
      onError: (error) => {
        captureEvent("googleDocImportSubmitted", {
          success: false,
          fileUrl: googleDocUrl,
          postId,
          isNew: !postId,
        });

        setErrorMessage(error.message)
        flash(error.message)
      }
    }
  );

  const handleToggle = useCallback((newState: boolean) => {
    captureEvent("googleDocImportToggled", {
      open: newState
    })
    setOpen(newState)
  }, [captureEvent])

  const handleImportClick = useCallback(async () => {
    void importGoogleDocMutation({
      variables: { fileUrl: googleDocUrl, postId },
    });
  }, [googleDocUrl, importGoogleDocMutation, postId]);

  return (
    <>
      <div ref={anchorEl}>
        <EAButton
          onClick={() => {
            handleToggle(!open);
          }}
          className={classes.button}
        >
          <ForumIcon icon="Import" className={classes.buttonInternalIcon} />
          Import Google doc
        </EAButton>
      </div>
      <PopperCard open={open} anchorEl={anchorEl.current} placement="bottom-start" className={classes.popper}>
        <LWClickAwayListener onClickAway={() => handleToggle(false)}>
          <div className={classes.card}>
            <div className={classes.info}>
              Paste a link to a publicly accessible Google Doc (sharing set to "Anyone with the link can view")
            </div>
            <input
              className={classes.input}
              type="url"
              placeholder="https://docs.google.com/document/d/..."
              value={googleDocUrl}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGoogleDocUrl(event.target.value)}
            />
            {errorMessage && <div className={classes.error}>{errorMessage}</div>}
            <EAButton className={classes.formButton} disabled={!canImport} onClick={handleImportClick}>
              {mutationLoading ? <Loading className={classes.loadingDots} /> : <>Import Google doc</>}
            </EAButton>
            <div className={classes.footer}>
              This will overwrite any unsaved changes
              {postId ? `, but you can still restore saved versions from "Version history"` : ""}
            </div>
          </div>
        </LWClickAwayListener>
      </PopperCard>
    </>
  );
};

export default registerComponent("GoogleDocImportButton", GoogleDocImportButton, { styles });


