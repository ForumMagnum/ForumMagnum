import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Link } from '../../lib/reactRouterWrapper';
import Users from '../../lib/collections/users/collection';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';
import { Tags } from '../../lib/collections/tags/collection';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "white",
    padding: 10,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: "1.3rem",
    boxShadow: theme.boxShadow,
    ...theme.typography.postStyle
  },
  secondaryInfo: {
    display: 'flex',
    ...theme.typography.commentStyle,
    justifyContent: 'space-between',
    fontSize: '1rem',
    color: 'rgba(0,0,0,0.55)',
    marginTop: 8
  },
  helpText: {
  },
  hideButton: {
  },
  inner: {
    width: "100%",
  },
  tooltip: {
    display: "block"
  },
  title: {
    flexGrow: 1,
    flexBasis: 1,
    marginRight: "auto"
  },
  allTagsBarColor: {
    color: theme.palette.primary.main
  },
  personalLink: {
    color: theme.palette.grey[600]
  },
  text: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: "center"
  },
  barRoot: {
    marginBottom: 5,
  },
  bar2: {
    backgroundColor: theme.palette.grey[600]
  },
  bar2Background: {
    backgroundColor: "rgba(0,0,0,.1)"
  }

});

const TagProgressBar = ({ classes }: {
  classes: ClassesType,
}) => {

  const { LWTooltip, PostsItem2MetaInfo, SeparatorBullet } = Components;
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });
  const { openDialog } = useDialog();
  const { flash } = useMessages();

  const { totalCount: processedTagsTotal = 0 } = useMulti({
    terms: {
      view: "processedLWWikiTags",
      limit: 0
    },
    collection: Tags,
    fragmentName: "TagFragment",
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  })

  const { totalCount: allTagsToProcessTotal = 0 } = useMulti({
    terms: {
      view: "allLWWikiTags",
      limit: 0
    },
    collection: Tags,
    fragmentName: "TagFragment",
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  })

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideTaggingProgressBar: true
        },
      })
      flash({
        messageString: "Hid tagging progress bar from the frontpage",
        type: "success",
        action: () => void updateUser({
          selector: { _id: currentUser._id },
          data: {
            hideTaggingProgressBar: false
          },
        })
      })
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
  }

  if (!allTagsToProcessTotal || !processedTagsTotal) return null

  const allPostsTooltip = processedTagsTotal < allTagsToProcessTotal ?
    `${allTagsToProcessTotal - processedTagsTotal} pages out of ${allTagsToProcessTotal} from the LW 1.0 Wiki still need processing` :
    `All tags and wiki pages from the LW Wiki import have been processed!`

  return <div className={classes.root}>
    <div className={classes.inner}>
      <div className={classes.text}>
        <Link className={classes.title} to={"/posts/ELN6FpRLoeLJPgx8z/importing-the-old-lw-wiki-help-wanted"}>
          LW 1.0 Wiki Import Progress
          </Link>
        <PostsItem2MetaInfo>
          <Link className={classes.allTagsBarColor} to={"/posts/ELN6FpRLoeLJPgx8z/importing-the-old-lw-wiki-help-wanted"}>
            How to Help
            </Link>
          <SeparatorBullet />
          <a className={classes.allTagsBarColor} href="https://docs.google.com/spreadsheets/d/1uz_zORpS_FsTj82SRp_5CxL0o4-CIj4ZK_jLrBjjqJ8/edit#gid=2115128922">
            Process Pages
            </a>
        </PostsItem2MetaInfo>
        <LWTooltip title={<div>
          <div>View all completely untagged posts, sorted by karma</div>
          <div><em>(Click through to read posts, and then tag them)</em></div>
        </div>}>
        </LWTooltip>
      </div>
      {
        <LWTooltip className={classes.tooltip} title={allPostsTooltip}>
          <LinearProgress
            classes={{ root: classes.barRoot }}
            variant="determinate"
            value={(processedTagsTotal / allTagsToProcessTotal) * 100}
          />
        </LWTooltip>
      }
      <div className={classes.secondaryInfo}>
        <div className={classes.helpText}>
          <span className={classes.allTagsBarColor}>{allTagsToProcessTotal - processedTagsTotal} pages from the LW 1.0 Wiki still need processing.{" "} </span>
        </div>
        <LWTooltip title={"Hide this progress bar from the frontpage"}>
          <a
            className={classes.hideButton}
            onClick={hideClickHandler}
          >
            Hide
            </a>
        </LWTooltip>
      </div>
    </div>
  </div>
}

const TagProgressBarComponent = registerComponent("TagProgressBar", TagProgressBar, { styles, hocs: [withErrorBoundary] });

declare global {
  interface ComponentTypes {
    TagProgressBar: typeof TagProgressBarComponent
  }
}

