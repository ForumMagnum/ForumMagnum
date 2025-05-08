import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { userCanEditUser } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useMessages } from "../../common/withMessages";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { ForumIcon } from "../../common/ForumIcon";
import { UsersProfileImage } from "../../users/UsersProfileImage";

const SIZE = 96;

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 14,
    position: "relative",
    width: SIZE,
    height: SIZE,
  },
  hoverOver: {
    position: "absolute",
    width: "100%",
    height: "100%",
    color: theme.palette.text.alwaysWhite, // These colors are dark-mode independent
    background: theme.palette.panelBackground.userProfileImageHover,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    opacity: 0,
    "&:hover": {
      opacity: 1,
    },
  },
});

const EAUsersProfileImageInner = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {flash} = useMessages();
  const {uploadImage, ImageUploadScript} = useImageUpload({
    imageType: "profileImageId",
    onUploadSuccess: (publicImageId: string) => {
      void updateCurrentUser({
        profileImageId: publicImageId,
      });
      flash("Profile image uploaded");
    },
    onUploadError: (error: Error) => {
      flash(error.message);
    },
  });
  if (!userCanEditUser(currentUser, user)) {
    return (
      <UsersProfileImage user={user} size={SIZE} className={classes.root} />
    );
  }

  return (
    <div className={classes.root} onClick={uploadImage}>
      <ImageUploadScript />
      <div className={classes.hoverOver}>
        <ForumIcon icon="Pencil" />
      </div>
      <UsersProfileImage user={user} size={SIZE} />
    </div>
  );
}

export const EAUsersProfileImage = registerComponent(
  "EAUsersProfileImage",
  EAUsersProfileImageInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUsersProfileImage: typeof EAUsersProfileImage
  }
}
