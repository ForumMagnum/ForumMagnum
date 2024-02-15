import React, { useCallback, useState } from "react";
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
// - [ ] Squash migrations
// - [ ] UI
// - [ ] Deploy to beta site, get people to test
// - [ ] (maybe) Move refresh tokens to a separate table (to avoid logging + allow refreshing the magic token)

const gdocImportEmailSetting = new DatabasePublicSetting<string | null>("gdocImportEmail.email", null);

const styles = (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.default,
    padding: 16,
    gap: "12px",
    display: "flex",
    flexDirection: "column",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 450,
  },
  row: {
    width: "100%",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
  },
});

export const GoogleDocImport = ({ postId, classes }: { postId?: string; classes: ClassesType<typeof styles> }) => {
  console.log("Rendering GoogleDocImport")
  const [googleDocLink, setGoogleDocLink] = useState(
    "https://docs.google.com/document/d/1ApMSWz4RPALKc27Mf33MgOlCQP8oMsodKh5DPnWEC78/edit"
  );

  const { EAButton } = Components;

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

  const [unlinkAccountMutation] = useMutation(
    gql`
      mutation UserUnlinkGoogleAccount {
        UserUnlinkGoogleAccount
      }
    `,
    {
      onError: () => {
        flash("Error while unlinking account")
      },
    }
  );

  const handleImportClick = useCallback(async () => {
    void importGoogleDocMutation({
      variables: { fileUrl: googleDocLink, postId },
    });
  }, [googleDocLink, importGoogleDocMutation, postId]);

  const handleSignInClick = useCallback(async () => {
    window.open(makeAbsolute("/auth/linkgdrive"), "_blank", "noopener,noreferrer");
  }, []);

  const handleUnlinkClick = useCallback(async () => {
    void unlinkAccountMutation()
  }, [unlinkAccountMutation]);

  return (
    <div className={classes.root}>
      Share with {gdocImportEmailSetting.get()}
      <div className={classes.row}>
        <TextField
          className={classes.rowContent}
          label="Google doc link"
          variant="outlined"
          value={googleDocLink}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGoogleDocLink(event.target.value)}
        />
        <EAButton onClick={handleImportClick}>Import</EAButton>
      </div>
      <div className={classes.row}>
        <div className={classes.rowContent}>User info</div>
        <EAButton onClick={handleSignInClick}>Sign in/Switch account</EAButton>
        <EAButton onClick={handleUnlinkClick}>Unlink account</EAButton>
      </div>
    </div>
  );
};

const GoogleDocImportComponent = registerComponent("GoogleDocImport", GoogleDocImport, { styles });

declare global {
  interface ComponentTypes {
    GoogleDocImport: typeof GoogleDocImportComponent;
  }
}
