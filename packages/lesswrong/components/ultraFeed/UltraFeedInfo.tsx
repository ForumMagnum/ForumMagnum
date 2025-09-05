import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Link } from '../../lib/reactRouterWrapper';
import ContentStyles from '../common/ContentStyles';

const styles = defineStyles("UltraFeedInfo", (theme: ThemeType) => ({
  infoContainer: {
    marginBottom: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  settingGroup: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
    padding: 16,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 24,
    paddingBottom: 24,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
  },
  groupTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginBottom: 12,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    fontSize: '1.2rem',
    color: theme.palette.primary.main,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    marginBottom: 8,
    color: theme.palette.text.primary,
  },
  paragraph: {
    marginBottom: 12,
    color: theme.palette.text.primary,
    fontSize: '1.1rem',
    lineHeight: 1.6,
  },
  list: {
    paddingInlineStart: "30px",
    marginBottom: 12,
    '& li': {
      marginBottom: 6,
      fontSize: '1.1rem',
      lineHeight: 1.6,
    },
  },
  codeInline: {
    fontSize: '0.9rem',
    fontWeight: 600,
    backgroundColor: theme.palette.grey[200],
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  tipBox: {
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    padding: 12,
    borderRadius: 4,
    marginTop: 16,
    fontSize: '1.05rem',
    lineHeight: 1.6,
  },
  tipTitle: {
    fontWeight: 600,
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tipIcon: {
    fontSize: '1rem',
    color: theme.palette.primary.main,
  },
}));

const UltraFeedInfo = () => {
  const classes = useStyles(styles);

  return (
    <ContentStyles contentType="ultraFeed">
      <div className={classes.settingGroup}>
          <p className={classes.paragraph}>
            The <strong>For You</strong> feed is an attempt to present you with the content you would most like to see from across all of LessWrong. The content is personalized based on your viewing/voting/etc history and by default includes:
            <ul>
              <li>Recent posts and comments</li>
              <li>Recent content from users you've followed/subscribed to</li>
              <li>Recommended from LessWrong's full archive of posts</li>
              <li>Feature content such as Annual Review winners</li>
              <li>Your bookmarks</li>
              <li>Quick takes</li>
            </ul>
            You can adjust the proportion of the content from each source in the settings.
            Note that within the feed, each comment is always a direct reply to the one above it.
            Read more in the <Link to="/posts/AJuZj4Zv9iyHHRFwX/lesswrong-feed-new-now-in-beta">announcement post!</Link>
          </p>
        </div>
    </ContentStyles>
  );
};

export default UltraFeedInfo;
