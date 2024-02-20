import React, { useCallback, useEffect, useRef, useState } from "react";
import { fragmentTextForQuery, registerComponent, Components } from "../../lib/vulcan-lib";
import { useMutation, gql, useQuery } from "@apollo/client";
import { extractGoogleDocId, postGetEditUrl } from "../../lib/collections/posts/helpers";
import { useMessages } from "../common/withMessages";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { useLocation } from "../../lib/routeUtil";
import { useMulti } from "../../lib/crud/withMulti";
import { useTracking } from "../../lib/analyticsEvents";

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
    marginTop: 12
  },
  card: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: 286
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
  underline: {
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
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


const GoogleDocImportButton = ({ postId, classes }: { postId?: string; classes: ClassesType<typeof styles> }) => {
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [open, setOpen] = useState(false)
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [canImport, setCanImport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { EAButton, ForumIcon, PopperCard, LWClickAwayListener, Loading } = Components;

  const { captureEvent } = useTracking()
  const { flash } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const fileId = extractGoogleDocId(googleDocUrl)
  const { data: canAccessQuery } = useQuery(
    gql`
      query CanAccessGoogleDoc($fileUrl: String!) {
        CanAccessGoogleDoc(fileUrl: $fileUrl)
      }
    `,
    {
      variables: {
        fileUrl: googleDocUrl,
      },
      fetchPolicy: "network-only",
      ssr: false,
      skip: !fileId,
    }
  );

  useEffect(() => {
    const _canAccess = canAccessQuery?.CanAccessGoogleDoc

    if (_canAccess === true) {
      setCanImport(true)
      setErrorMessage(null)
      return
    }
    if (_canAccess === false) {
      setCanImport(false)
      if (fileId) {
        setErrorMessage("We don't have access to that doc")
      }
      return
    }

    if (!fileId) {
      setErrorMessage(null)
    }
  }, [canAccessQuery?.CanAccessGoogleDoc, fileId])

  const { results: serviceAccounts, loading: serviceAccountsLoading } = useMulti({
    terms: {},
    collectionName: "GoogleServiceAccountSessions",
    fragmentName: 'GoogleServiceAccountSessionInfo',
    enableTotal: false,
    extraVariablesValues: {
      batchKey: "serviceAccounts"
    }
  })
  const email = serviceAccounts?.[0]?.email

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

        // This should only rarely happen, as the access check covers most cases
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
            {email || serviceAccountsLoading ? (
              <>
                <div className={classes.info}>
                  Paste a link that is public or shared with <span className={classes.underline}>{email}</span>
                </div>
                <input
                  className={classes.input}
                  type="url"
                  placeholder="https://docs.google.com/example"
                  value={googleDocUrl}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGoogleDocUrl(event.target.value)}
                />
                {errorMessage && <div className={classes.error}>{errorMessage}</div>}
                <EAButton className={classes.formButton} disabled={!canImport} onClick={handleImportClick}>
                  {mutationLoading ? <Loading className={classes.loadingDots} /> : <>Import Google doc</>}
                </EAButton>
                <div className={classes.footer}>
                    This will overwrite any unsaved changes
                    {postId ? ", but you can still restore saved versions from “Version history”" : ""}
                </div>
              </>
            ) : (
              <div className={classes.info}>Error in configuration, contact support if this persists</div>
            )}
          </div>
        </LWClickAwayListener>
      </PopperCard>
    </>
  );
};

const GoogleDocImportButtonComponent = registerComponent("GoogleDocImportButton", GoogleDocImportButton, { styles });

declare global {
  interface ComponentTypes {
    GoogleDocImportButton: typeof GoogleDocImportButtonComponent;
  }
}
