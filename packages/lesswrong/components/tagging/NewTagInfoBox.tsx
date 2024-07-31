import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { styles as postInfoStyles } from "../posts/NewPostHowToGuides";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { taggingNameSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";

const styleGuideLink = "/topics/style-guide";
const wikiFaqLink = "/topics/ea-wiki-faq";

const styles = (theme: ThemeType) => ({
  ...postInfoStyles(theme),
  content: {
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "140%",
    "& li": {
      marginLeft: -16,
      "&:not(:last-child)": {
        marginBottom: 8,
      },
    },
    "& a": {
      fontWeight: 600,
      color: theme.palette.primary.main,
    },
  },
});

const NewTagInfoBox = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageElementContext="newTagInfoBox">
      <div className={classes.root}>
        <div className={classes.title}>
          Adding a new {taggingNameSetting.get()}
        </div>
        <div className={classes.content}>
          <p>
            When you add a new topic, ensure that:
          </p>
          <ol>
            <li>
              The topic, or a very similar topic, does not already exist. If a
              very similar topic already exists, consider adding detail to that
              topic wiki page rather than creating a new topic.
            </li>
            <li>
              Your topic tag is relevant to at least three existing Forum posts
              by different authors (not including yourself). Please tag these posts
              after you create your topic. The topic must describe a central theme
              in each post. If you cannot yet tag three relevant posts, the Forum
              probably doesn’t need this topic yet.
            </li>
            <li>
              You’ve added at least a couple of sentences to define the term and
              explain how the topic tag should be used. If you like, you can write
              a full wiki page in line with this{" "}
              <Link to={styleGuideLink}>style guide</Link>. However, we won’t
              reject otherwise useful new topics because they don’t have a full
              entry.
            </li>
          </ol>
          <p>
            Topics that don’t meet this criteria will likely be rejected. More
            information can be found in <Link to={wikiFaqLink}>the Wiki FAQ</Link>.
          </p>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const NewTagInfoBoxComponent = registerComponent(
  "NewTagInfoBox",
  NewTagInfoBox,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewTagInfoBox: typeof NewTagInfoBoxComponent
  }
}
