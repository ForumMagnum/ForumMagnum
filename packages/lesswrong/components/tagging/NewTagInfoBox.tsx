import React from "react";
import { styles as postInfoStyles } from "../posts/NewPostHowToGuides";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { taggingNameSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";
import classNames from "classnames";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const wikiFaqLink = "/topics/ea-wiki-faq";

const styles = defineStyles("NewTagInfoBox", (theme: ThemeType) => ({
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
}));

const NewTagInfoBox = () => {
  const classes = useStyles(styles);
  const postInfoClasses = useStyles(postInfoStyles);

  const tag = taggingNameSetting.get();
  return (
    <AnalyticsContext pageElementContext="newTagInfoBox">
      <div className={classNames(postInfoClasses.root, classes.width)}>
        <div className={postInfoClasses.title}>
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

export default NewTagInfoBox;


