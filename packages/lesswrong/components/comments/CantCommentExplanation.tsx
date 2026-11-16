import { useForumType } from '@/components/hooks/useForumType';
import React from 'react';
import classNames from 'classnames';
import { moderationEmail } from '@/lib/instanceSettings';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("CantCommentExplanation", (theme: ThemeType) => ({
  root: {
    padding: "1em 0",
  },
  emailLink: {
    textDecoration: "underline !important",
  
    "&:hover": {
      color: theme.palette.link.dim,
    }
  },
}));

const CantCommentExplanation = ({reason}: {
  reason: string,
}) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const email = moderationEmail.get(forumType)
  return (
    <div className={classNames("i18n-message", "author_has_banned_you", classes.root)}>
      {reason}{" "}
      { email && <span>
        (Questions? Send an email to <a className={classes.emailLink} href={`mailto:${email}`}>{email}</a>)
      </span> }
    </div>
  );
}

export default CantCommentExplanation;
