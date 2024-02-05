import React, { useCallback, useState } from "react";
import { fragmentTextForQuery, registerComponent, Components, getSiteUrl, makeAbsolute } from "../../lib/vulcan-lib";
import TextField from "@material-ui/core/TextField";
import { useMutation, gql } from "@apollo/client";
import { DatabasePublicSetting } from "../../lib/publicSettings";

// Next steps:
// - [ ] Get backend working with existing UI
//   - [ ] Import button works (NOT including ckeditor paste issues)
//   - [ ] Sign in button works (already true, but just make sure)
//   - [ ] Unlink button works
// - Update UI to match designs

const gdocImportEmailSetting = new DatabasePublicSetting<string | null>('gdocImportEmail.email', null)

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

const useGoogleDocImport = () => {
  const [importGoogleDocMutation] = useMutation(gql`
    mutation ImportGoogleDoc($fileUrl: String!, $postId: String) {
      ImportGoogleDoc(fileUrl: $fileUrl, postId: $postId) {
        ...RevisionDisplay
      }
    }
    ${fragmentTextForQuery('RevisionDisplay')}
  `, {
    onCompleted: (data) => {
      console.log({data})
    }
  });

  return importGoogleDocMutation;
};

export const GoogleDocImport = ({ postId, classes }: { postId?: string, classes: ClassesType<typeof styles> }) => {
  console.log("Rendering (check infinite loop)")
  const [googleDocLink, setGoogleDocLink] = useState(
    "https://docs.google.com/document/d/1ApMSWz4RPALKc27Mf33MgOlCQP8oMsodKh5DPnWEC78/edit"
  );

  const { EAButton } = Components;

  const importGoogleDoc = useGoogleDocImport();

  const handleImportClick = useCallback(async () => {
    void importGoogleDoc({
      variables: { fileUrl: googleDocLink, postId },
    });
  }, [googleDocLink, importGoogleDoc, postId]);

  const handleSignInClick = useCallback(async () => {
    window.open(makeAbsolute("/auth/linkgdrive"), "_blank");
  }, []);

  const handleUnlinkClick = useCallback(async () => {}, []);

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
