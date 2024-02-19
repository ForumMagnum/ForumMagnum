import React, { useCallback, useRef, useState } from "react";
import { fragmentTextForQuery, registerComponent, Components, getSiteUrl, makeAbsolute } from "../../lib/vulcan-lib";
import TextField from "@material-ui/core/TextField";
import { useMutation, gql } from "@apollo/client";
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { postGetEditUrl } from "../../lib/collections/posts/helpers";
import { useMessages } from "../common/withMessages";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { useLocation } from "../../lib/routeUtil";

// Next steps:
// - [X] Get backend working with existing UI
//   - [X] Import button works (NOT including ckeditor paste issues)
//   - [X] Sign in button works (already true, but just make sure)
//   - [X] Unlink button works
// - [X] Change version restoration logic to allow restoring as draft
// - [X] Fix import vs paste issues
// - [ ] UI
// - [ ] UI
// - [ ] Squash migrations
// - [ ] Deploy to beta site, get people to test
// - [ ] (maybe) Move refresh tokens to a separate table (to avoid logging + allow refreshing the magic token)

// const gdocImportEmailSetting = new DatabasePublicSetting<string | null>("gdocImportEmail.email", null);

const styles = (theme: ThemeType) => ({
  button: {
    color: theme.palette.primary.main,
    backgroundColor: "transparent",
    padding: "2px 8px",
    '&:hover': {
      backgroundColor: theme.palette.background.primaryDim,
    },
    '&:disabled': {
      color: theme.palette.primary.main,
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
    color: theme.palette.grey[600],
    lineHeight: "18px"
  },
  underline: {
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  formButton: {
    fontWeight: 600,
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
  const [googleDocLink, setGoogleDocLink] = useState(
    "https://docs.google.com/document/d/1ApMSWz4RPALKc27Mf33MgOlCQP8oMsodKh5DPnWEC78/edit"
  );
  const [open, setOpen] = useState(false)
  const anchorEl = useRef<HTMLDivElement | null>(null)

  const { EAButton, ForumIcon, PopperCard, LWClickAwayListener } = Components;

  const { flash } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const [importGoogleDocMutation] = useMutation(
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

        if (location.url === editPostUrl) {
          window.location.reload();
        } else {
          void navigate(editPostUrl);
        }
      },
      onError: () => {
        // TODO handle case where we don't have access to the file
      },
    }
  );

  const handleImportClick = useCallback(async () => {
    void importGoogleDocMutation({
      variables: { fileUrl: googleDocLink, postId },
    });
  }, [googleDocLink, importGoogleDocMutation, postId]);

  return (
    <>
      <div ref={anchorEl}>
        <EAButton
          onClick={() => {
            setOpen(!open);
          }}
          className={classes.button}
        >
          <ForumIcon icon="Import" className={classes.buttonInternalIcon} />
          Import Google doc
        </EAButton>
      </div>
      <PopperCard open={open} anchorEl={anchorEl.current} placement="bottom-start" className={classes.popper}>
        <LWClickAwayListener onClickAway={() => setOpen(false)}>
          <div className={classes.card}>
            <div className={classes.info}>
              Paste a link that is public or shared with{" "}
              <span className={classes.underline}>eaforum.posts@gmail.com</span>
            </div>
            <input
              className={classes.input}
              type="url"
              placeholder="https://docs.google.com/example"
              value={googleDocLink}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGoogleDocLink(event.target.value)}
            />
            <EAButton className={classes.formButton} onClick={handleImportClick}>
              Import Google doc
            </EAButton>
            <div className={classes.info}>
              <i>This will overwrite the existing post, but you can still find it in “Version History”</i>
            </div>
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
