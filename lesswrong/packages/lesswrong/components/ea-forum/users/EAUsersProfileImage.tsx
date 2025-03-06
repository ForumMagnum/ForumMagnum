import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { userCanEditUser } from "../../../lib/collections/users/helpers";
import { useCurrentUser } from "../../common/withUser";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useMessages } from "../../common/withMessages";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import ForumIcon from "@/components/common/ForumIcon";
import UsersProfileImage from "@/components/users/UsersProfileImage";

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

const EAUsersProfileImage = ({user, classes}: {
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

const EAUsersProfileImageComponent = registerComponent(
  "EAUsersProfileImage",
  EAUsersProfileImage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUsersProfileImage: typeof EAUsersProfileImageComponent
  }
}

export default EAUsersProfileImageComponent;
