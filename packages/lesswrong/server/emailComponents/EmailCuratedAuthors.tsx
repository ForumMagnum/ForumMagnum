import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("EmailCuratedAuthors", (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    lineHeight: "22px",
  },
  link: {
    color: theme.palette.primary.main,
  },
  hr: {
    marginTop: 30,
  }
}));

const EmailCuratedAuthors = ({ user, post }: {
  user: DbUser;
  post: DbPost;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        Thank you for contributing to the EA Forum!
        We were impressed with your post, <a href={postGetPageUrl(post, true)} className={classes.link}>{post.title}</a>,
        and are excited to let you know that <strong>we’ve decided to curate it</strong>. ⭐️
        Curated posts are pinned to the top of the Forum frontpage so that they can be viewed more widely,
        and are included in our <a href="https://forum.effectivealtruism.org/recommendations" className={classes.link}>list of curated posts</a>.
      </p>
      <p>
        Authors like you are essential to sustaining a healthy and valuable online space.
        We genuinely appreciate you taking the time to contribute, and we look forward to seeing more from you in the future.
      </p>
      <p>
        As a valued author, we’d love to hear your feedback! In particular, we’d be interested to hear
        how you found the writing experience, and how we could improve it. Feel free to reply to this email,
        or find other ways to contact us <a href="https://forum.effectivealtruism.org/contact" className={classes.link}>here</a>.
      </p>
      <p>
        – The EA Forum Team
      </p>
      <hr className={classes.hr}/>
    </div>
  );
};

const EmailCuratedAuthorsComponent = registerComponent("EmailCuratedAuthors", EmailCuratedAuthors);

declare global {
  interface ComponentTypes {
    EmailCuratedAuthors: typeof EmailCuratedAuthorsComponent;
  }
}
