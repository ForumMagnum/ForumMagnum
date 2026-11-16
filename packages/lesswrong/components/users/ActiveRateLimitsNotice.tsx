import React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { ContentItemBody } from '../contents/ContentItemBody';

const styles = defineStyles('ActiveRateLimitsNotice', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.text.dim2,
  },
  line: {
    '&:not(:last-child)': {
      marginBottom: 4,
    },
  },
  rateLimit: {
    textDecoration: "underline dotted",
    textUnderlineOffset: "3px",
  },
  tooltipMessage: {
    '& a': {
      color: "inherit",
      textDecoration: "underline",
    },
  },
}));

const RateLimitItem = ({ rateLimit }: { rateLimit: ActiveRateLimitInfo }) => {
  const classes = useStyles(styles);
  const tooltip = <ContentItemBody
    className={classes.tooltipMessage}
    dangerouslySetInnerHTML={{ __html: rateLimit.rateLimitMessage }}
  />;
  const until = rateLimit.endsAt ? ` until ${moment(rateLimit.endsAt).format("MMM D, YYYY")}` : "";

  return <LWTooltip title={tooltip} clickable>
    <span className={classes.rateLimit}>{rateLimit.description}{until}</span>
  </LWTooltip>;
}

const RateLimitLine = ({ label, rateLimits }: { label: string, rateLimits: ActiveRateLimitInfo[] }) => {
  const classes = useStyles(styles);
  if (rateLimits.length === 0) return null;
  return <div className={classes.line}>
    {label}{" "}
    {rateLimits.map((rateLimit, index) => <React.Fragment key={index}>
      {index > 0 && "; "}
      <RateLimitItem rateLimit={rateLimit} />
    </React.Fragment>)}
  </div>;
}

const ActiveRateLimitsNotice = ({ commentRateLimits, postRateLimits, className }: {
  commentRateLimits?: ActiveRateLimitInfo[] | null,
  postRateLimits?: ActiveRateLimitInfo[] | null,
  className?: string,
}) => {
  const classes = useStyles(styles);
  if (!commentRateLimits?.length && !postRateLimits?.length) return null;

  return <div className={classNames(classes.root, className)}>
    <RateLimitLine label="Your comments are rate limited:" rateLimits={commentRateLimits ?? []} />
    <RateLimitLine label="Your posts are rate limited:" rateLimits={postRateLimits ?? []} />
  </div>;
}

export default ActiveRateLimitsNotice;
