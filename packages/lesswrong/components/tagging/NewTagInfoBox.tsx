import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { styles as postInfoStyles } from "../posts/NewPostHowToGuides";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { taggingNameSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";
import classNames from "classnames";

const wikiFaqLink = "/topics/ea-wiki-faq";

const styles = (theme: ThemeType) => ({
  ...postInfoStyles(theme),
  width: {
    marginRight: 0,
    "@media (max-width: 1400px)": {
      width: 220,
    },
  },
  content: {
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "140%",
    marginTop: -6,
    "& li": {
      marginLeft: -16,
      "&:not(:last-child)": {
        marginBottom: 8,
      },
    },
    "& a": {
      fontWeight: 600,
      color: theme.palette.primary.main,
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
      },
    },
  },
});

const NewTagInfoBoxInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const tag = taggingNameSetting.get();
  return (
    <AnalyticsContext pageElementContext="newTagInfoBox">
      <div className={classNames(classes.root, classes.width)}>
        <div className={classes.title}>
          Your {tag} may be rejected if:
        </div>
        <div className={classes.content}>
          <ol>
            <li>
              A similar {tag} already exists.
            </li>
            <li>
              The {tag} isn’t applied to three relevant posts by different
              authors (not counting your own) after you create it.
            </li>
            <li>
              You haven’t included at least a sentence defining the {tag}.
            </li>
          </ol>
          <p>
            Check out the <Link to={wikiFaqLink}>Wiki FAQ</Link> for more tips
            and explanations.
          </p>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export const NewTagInfoBox = registerComponent(
  "NewTagInfoBox",
  NewTagInfoBoxInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewTagInfoBox: typeof NewTagInfoBox
  }
}
