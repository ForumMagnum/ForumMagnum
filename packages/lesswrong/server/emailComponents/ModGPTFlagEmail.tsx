import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 570,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
  },
  row: {
    marginBottom: 20
  },
  flag: {
    color: theme.palette.grey[700],
    margin: '0 20px 10px'
  },
  link: {
    color: theme.palette.primary.main,
  },
});

const ModGPTFlagEmail = ({
  commentLink,
  flag,
  classes,
}: {
  commentLink: string,
  flag?: string,
  classes: ClassesType,
}) => {
  
  let intro = <div className={classes.row}>
    Our moderation bot suspects that <a href={commentLink}>your comment</a> violates
    the <a href="https://forum.effectivealtruism.org/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum">
      EA Forum discussion norms
    </a>.
  </div>
  if (flag) {
    intro = <>
      <div className={classes.row}>
        Our moderation bot suspects that <a href={commentLink}>your comment</a> violates
        the following <a href="https://forum.effectivealtruism.org/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum">
          EA Forum discussion norm(s)
        </a>:
      </div>
      <div className={classes.row}>
        <div className={classes.flag}>
          {flag}
        </div>
      </div>
    </>
  }

  return (
    <div className={classes.root}>
      {intro}
      <div className={classes.row}>
        Your comment will be collapsed by default. We encourage you to improve the comment, after which the bot will re-evaluate it.
      </div>
      <div className={classes.row}>
        If you believe the bot made a mistake, please report this to the EA Forum Team by replying to this email
        or contacting us <a href="https://forum.effectivealtruism.org/contact">here</a>.
      </div>
    </div>
  );
};

const ModGPTFlagEmailComponent = registerComponent(
  "ModGPTFlagEmail",
  ModGPTFlagEmail,
  { styles }
);

declare global {
  interface ComponentTypes {
    ModGPTFlagEmail: typeof ModGPTFlagEmailComponent;
  }
}
