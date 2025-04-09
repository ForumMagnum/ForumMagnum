import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import LinearProgress from '@/lib/vendor/@material-ui/core/src/LinearProgress';
import { Link } from '../../lib/reactRouterWrapper';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';
import { taggingNamePluralSetting } from '@/lib/instanceSettings';

export const progressBarRoot = (theme: ThemeType) => ({
  background: theme.palette.panelBackground.default,
  padding: 10,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: "1.3rem",
  boxShadow: theme.palette.boxShadow.default,
  ...theme.typography.postStyle
})

export const secondaryInfo = (theme: ThemeType) => ({
  display: 'flex',
  ...theme.typography.commentStyle,
  justifyContent: 'space-between',
  fontSize: '1rem',
  color: theme.palette.text.dim55,
  marginTop: 8
})

const styles = (theme: ThemeType) => ({
  root: {
    ...progressBarRoot(theme)
  },
  secondaryInfo: {
    ...secondaryInfo(theme)
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
    color: theme.palette.text.dim3,
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
    backgroundColor: theme.palette.text.dim3,
  },
  bar2Background: {
    backgroundColor: theme.palette.panelBackground.tenPercent,
  }

});

const TagProgressBar = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {

  const { LWTooltip, PostsItem2MetaInfo, SeparatorBullet } = Components;
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { openDialog } = useDialog();
  const { flash } = useMessages();

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateCurrentUser({
        hideTaggingProgressBar: true
      })
      flash({
        messageString: "Hid tagging progress bar from the frontpage",
        type: "success",
        action: () => void updateCurrentUser({
          hideTaggingProgressBar: false
        })
      })
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <Components.LoginPopup onClose={onClose} />
      });
    }
  }

  const allPostsTooltip = `All tags and wiki pages from the LW Wiki import have been processed!`

  return <div className={classes.root}>
    <div className={classes.inner}>
      <div className={classes.text}>
        <Link className={classes.title} to={"/posts/ELN6FpRLoeLJPgx8z/importing-the-old-lw-wiki-help-wanted"}>
          LW 1.0 Wiki Import Progress
          </Link>
        <PostsItem2MetaInfo>
          <Link className={classes.allTagsBarColor} to={"/posts/ELN6FpRLoeLJPgx8z/importing-the-old-lw-wiki-help-wanted"}>
            What's the Import?
            </Link>
          <SeparatorBullet />
          <Link className={classes.allTagsBarColor} to={`/${taggingNamePluralSetting.get()}/dashboard`}>
            Help Process Pages
          </Link>
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
            value={100}
          />
        </LWTooltip>
      }
      <div className={classes.secondaryInfo}>
        <div className={classes.helpText}>
          <span className={classes.allTagsBarColor}> All pages from the LW 1.0 Wiki have been processed!{" "} </span>
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

