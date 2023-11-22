import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { heroImageId } from "../../../lib/eaGivingSeason";
import { CloudinaryPropsType, makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";

const socialImageProps: CloudinaryPropsType = {
  dpr: "auto",
  ar: "16:9",
  w: "1200",
  c: "fill",
  g: "center",
  q: "auto",
  f: "auto",
};

const EAVotingPortalHeadTags = ({ classes }: { classes: ClassesType }) => {
  const { HeadTags } = Components;

  return (
    <HeadTags
      title="Donation Election: voting portal"
      description="Vote in the EA Forum Donation Election"
      image={makeCloudinaryImageUrl(heroImageId, socialImageProps)}
    />
  );
};

const EAVotingPortalHeadTagsComponent = registerComponent("EAVotingPortalHeadTags", EAVotingPortalHeadTags);

declare global {
  interface ComponentTypes {
    EAVotingPortalHeadTags: typeof EAVotingPortalHeadTagsComponent;
  }
}
