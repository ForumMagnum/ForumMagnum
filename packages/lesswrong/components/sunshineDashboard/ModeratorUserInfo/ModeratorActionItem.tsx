import moment from 'moment';
import React, { useState } from 'react';
import { isLowAverageKarmaContent } from '../../../lib/collections/moderatorActions/helpers';
import { LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT, MODERATOR_ACTION_TYPES } from "@/lib/collections/moderatorActions/constants";
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { sortBy } from 'underscore';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done'
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear'
import classNames from 'classnames';
import MetaInfo from "../../common/MetaInfo";
import LWTooltip from "../../common/LWTooltip";
import { withDateFields } from '@/lib/utils/dateUtils';
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const ModeratorActionDisplayUpdateMutation = gql(`
  mutation updateModeratorActionModeratorActionItem($selector: SelectorInput!, $data: UpdateModeratorActionDataInput!) {
    updateModeratorAction(selector: $selector, data: $data) {
      data {
        ...ModeratorActionDisplay
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    '&:hover': {
      '& $clearIcon': {
        opacity: .5
      }
    }
  },
  icon: {
    width: 12,
    height: 12,
    cursor: "pointer",
    opacity: .5,
    marginRight: 10,
    '&:hover': {
      opacity: 1
    }
  },
  date: {
    marginLeft: 10,
    display: "flex",
    alignItems: "center",
    '& input': {
      width: 40,
      textAlign: "center"
    }
  },
  clickToEdit: {
    cursor: "pointer"
  },
  margin: {
    marginRight: 10
  },
  clearIcon: {
    opacity: .1
  }
});

export const ModeratorActionItem = ({classes, user, moderatorAction, comments, posts }: {
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList,
  moderatorAction: ModeratorActionDisplay,
  comments: Array<CommentsListWithParentMetadata>|undefined,
  posts: Array<SunshinePostsList>|undefined
}) => {
  const endedAtDate = moment(moderatorAction.endedAt)
  const today = moment(new Date())
  const existingEndedAtDays = endedAtDate.diff(today, "days")

  const [editing, setEditing] = useState<boolean>(false)
  const [endsAfterDays, setEndsAfterDays] = useState<number | undefined>(existingEndedAtDays)

  const getNewEndsInDays = () => {
    if (endsAfterDays) {
      const today = moment(new Date())
      return today.add(endsAfterDays, 'days').toDate()
    } else {
      return null
    }
  }

  const changeEndAfterDays = (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = ev.target.value;
    if (!newValue.length) {
      setEndsAfterDays(undefined);
    } else {
      const days = parseInt(ev.target.value);
      setEndsAfterDays(days);  
    }
  };

  const [updateModeratorAction] = useMutation(ModeratorActionDisplayUpdateMutation);

  const handleUpdateEndAfterDays = async () => {
    await updateModeratorAction({
      variables: {
        selector: { _id: moderatorAction._id },
        data: { endedAt: getNewEndsInDays() }
      }
    })
    setEditing(false)
  }

  const handleEndModerationAction = async () => {
    await updateModeratorAction({
      variables: {
        selector: { _id: moderatorAction._id },
        data: { endedAt: new Date() }
      }
    })
    setEditing(false)
  }

  const sortableComments = (comments ?? []).map(c => withDateFields(c, ['postedAt']));
  const sortablePosts = (posts ?? []).map(p => withDateFields(p, ['postedAt']));
  
  let averageContentKarma: number | undefined;
  if (moderatorAction.type === LOW_AVERAGE_KARMA_COMMENT_ALERT) {
    const mostRecentComments = sortBy(sortableComments, 'postedAt').reverse();
    ({ averageContentKarma } = isLowAverageKarmaContent(mostRecentComments ?? [], 'comment'));
  } else if (moderatorAction.type === LOW_AVERAGE_KARMA_POST_ALERT) {
    const mostRecentPosts = sortBy(sortablePosts, 'postedAt').reverse();
    ({ averageContentKarma } = isLowAverageKarmaContent(mostRecentPosts ?? [], 'post'));
  }

  const suffix = typeof averageContentKarma === 'number' ? ` (${averageContentKarma})` : '';

  const endedAtEditForm = <>
    <span className={classes.margin}>
      <Input type="number" value={endsAfterDays} onChange={changeEndAfterDays}/> days 
    </span>
    <LWTooltip title="Edit end date">
      <DoneIcon className={classes.icon} onClick={handleUpdateEndAfterDays}/>
    </LWTooltip>
  </>

  const endedAt = <LWTooltip title="Edit duration">
    <span className={classes.clickToEdit} onClick={() => setEditing(true)}>
      {moderatorAction.endedAt && <MetaInfo>{endsAfterDays} days</MetaInfo>}
    </span>
  </LWTooltip>


  return <div key={`${user._id}_${moderatorAction.type}`} className={classes.root}>
    {`${MODERATOR_ACTION_TYPES[moderatorAction.type]}${suffix}`}{" "}
    <MetaInfo className={classes.date}>
      {editing 
        ? endedAtEditForm
        : endedAt
      }
    </MetaInfo>
    <LWTooltip title="Remove this mod-action">
      <ClearIcon className={classNames(classes.icon, classes.clearIcon)} onClick={handleEndModerationAction}/>
    </LWTooltip>
  </div>;
}

export default registerComponent('ModeratorActionItem', ModeratorActionItem, {styles});



