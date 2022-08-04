import React from 'react';
import { useDialog } from '../common/withDialog';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import HistoryIcon from '@material-ui/icons/History';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import LockIcon from '@material-ui/icons/Lock';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import classNames from 'classnames';
import { useTagBySlug } from './useTag';
import { forumTypeSetting, taggingNameIsSet, taggingNamePluralSetting } from '../../lib/instanceSettings';
import Tags, { tagMinimumKarmaPermissions } from '../../lib/collections/tags/collection';

const isEAForum = forumTypeSetting.get() === "EAForum"

const styles = (theme: ThemeType): JssStyles => ({
  buttonsRow: {
    ...theme.typography.body2,
    marginTop: 2,
    marginBottom: 16,
    color: theme.palette.grey[700],
    display: "flex",
    flexWrap: "wrap",
    [theme.breakpoints.down('xs')]: {
      marginTop: 8,
    },
    '& svg': {
      height: 20,
      width: 20,
      marginRight: 4,
      marginBottom: 1, // JP it's fine, stop adjusting single pixels
      cursor: "pointer",
      color: theme.palette.grey[700]
    }
  },
  buttonTooltip: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
    marginRight: 16,
  },
  buttonLabel: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  disabledButton: {
    display: "flex",
    alignItems: "center",
    marginRight: 16,
    '&:hover': {
      opacity: 1
    },
  },
  subscribeToWrapper: {
    display: "flex !important",
  },
  subscribeTo: {
    marginRight: 16
  },
  helpImprove: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    marginLeft: 'auto',
    color: theme.palette.grey[700],
    fontStyle: "italic",
  },
});

const TagPageButtonRow = ({ tag, editing, setEditing, className, classes }: {
  tag: TagPageWithRevisionFragment | TagPageFragment,
  editing: boolean,
  setEditing: (editing: boolean) => void,
  className?: string,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { LWTooltip, NotifyMeButton, TagDiscussionButton, ContentItemBody } = Components;
  const { tag: beginnersGuideContentTag } = useTagBySlug("tag-cta-popup", "TagFragment")

  const numFlags = tag.tagFlagsIds?.length

  function handleEditClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (currentUser) {
      setEditing(true)
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
      e.preventDefault();
    }
  }

  const showEdit = !editing
  const noEditKarmaTooLow = currentUser && currentUser.karma < tagMinimumKarmaPermissions.edit
  const noEditNotAuthor = currentUser && !currentUser.isAdmin && tag.authorOnly && tag.userId !== currentUser._id
  const canEdit = showEdit && !noEditKarmaTooLow && !noEditNotAuthor

  const editTooltip = <>
    {noEditNotAuthor && <>
      <div>
      This article can only be edited by the author or an admin, please comment in the discussion to suggest changes
    </div>
    <br />
    </>}
    {noEditKarmaTooLow && <>
      <div>
      You must have at least {tagMinimumKarmaPermissions.edit} karma to edit this topic
    </div>
    <br />
    </>}
    {!!numFlags && <>
      <div>
        This article has the following flag{tag.tagFlagsIds?.length > 1 ? "s" : ""}:{' '}
        {tag.tagFlags.map((flag, i) => <span key={flag._id}>{flag.name}{(i + 1) < tag.tagFlags?.length && ", "}</span>)}
      </div>
      <br />
    </>}
    <ContentItemBody
      className={classes.beginnersGuide}
      dangerouslySetInnerHTML={{ __html: beginnersGuideContentTag?.description?.html || "" }}
      description={`tag ${tag?.name}`}
    />
  </>

  return <div className={classNames(classes.buttonsRow, className)}>
    {showEdit && <LWTooltip
      className={classes.buttonTooltip}
      title={editTooltip}
    >
      {canEdit ? (<a className={classes.button} onClick={handleEditClick}>
        <EditOutlinedIcon /><span className={classes.buttonLabel}>
          Edit
        </span>
      </a>) : (
        <a className={classes.disabledButton} onClick={() => {}}><LockIcon /><span className={classes.buttonLabel}>
          Edit
        </span></a>)}
    </LWTooltip>}
    {<Link
      className={classes.button}
      to={`/${taggingNameIsSet.get() ? taggingNamePluralSetting.get() : 'tag'}/${tag.slug}/history`}
    >
      <HistoryIcon /><span className={classes.buttonLabel}>History</span>
    </Link>}
    {!userHasNewTagSubscriptions(currentUser) && !tag.wikiOnly && !editing && <LWTooltip title="Get notifications when posts are added to this tag." className={classes.subscribeToWrapper}>
      <NotifyMeButton
        document={tag}
        className={classes.subscribeTo}
        showIcon
        hideLabelOnMobile
        subscribeMessage="Subscribe"
        unsubscribeMessage="Unsubscribe"
        subscriptionType={subscriptionTypes.newTagPosts}
      />
    </LWTooltip>}
    <div className={classes.button}>
      <TagDiscussionButton tag={tag} hideLabelOnMobile />
    </div>
    {!userHasNewTagSubscriptions(currentUser) && <LWTooltip
      className={classes.helpImprove}
      title={editTooltip}
    >
      <a onClick={handleEditClick}>
        Help improve this page {!!numFlags && <>({numFlags} flag{numFlags > 1 ? "s" : ""})</>}
      </a>
    </LWTooltip>}
  </div>
}

const TagPageButtonRowComponent = registerComponent("TagPageButtonRow", TagPageButtonRow, { styles });

declare global {
  interface ComponentTypes {
    TagPageButtonRow: typeof TagPageButtonRowComponent
  }
}
