import React, { useState, useCallback } from 'react';
import moment from 'moment';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { MODERATOR_ACTION_TYPES } from '@/lib/collections/moderatorActions/constants';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import classNames from 'classnames';
import LWTooltip from '@/components/common/LWTooltip';
import MetaInfo from '@/components/common/MetaInfo';
import FormatDate from '@/components/common/FormatDate';
import type { InboxAction } from './inboxReducer';

const UpdateModeratorActionMutation = gql(`
  mutation updateModeratorActionSupermod($selector: SelectorInput!, $data: UpdateModeratorActionDataInput!) {
    updateModeratorAction(selector: $selector, data: $data) {
      data {
        ...ModeratorActionDisplay
      }
    }
  }
`);

const styles = defineStyles('SupermodModeratorActionItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    '&:hover': {
      '& $clearIcon': {
        opacity: 0.5,
      },
    },
  },
  icon: {
    width: 12,
    height: 12,
    cursor: 'pointer',
    opacity: 0.5,
    marginRight: 10,
    '&:hover': {
      opacity: 1,
    },
  },
  date: {
    marginLeft: 10,
    display: 'flex',
    alignItems: 'center',
    '& input': {
      width: 40,
      textAlign: 'center',
    },
  },
  clickToEdit: {
    cursor: 'pointer',
  },
  margin: {
    marginRight: 10,
  },
  clearIcon: {
    opacity: 0.1,
    marginBottom: -2,
  },
}));

interface SupermodModeratorActionItemProps {
  user: SunshineUsersList;
  moderatorAction: ModeratorActionDisplay;
  dispatch: React.Dispatch<InboxAction>;
}

function computeEndsAfterDays(endedAt: Date | string | null | undefined): number | undefined {
  if (!endedAt) return undefined;
  const endedAtDate = moment(endedAt);
  const today = moment(new Date());
  return endedAtDate.diff(today, 'days');
}

function computeNewEndDate(endsAfterDays: number | undefined): Date | null {
  if (endsAfterDays === undefined) return null;
  const today = moment(new Date());
  return today.add(endsAfterDays, 'days').toDate();
}

const SupermodModeratorActionItem = ({
  user,
  moderatorAction,
  dispatch,
}: SupermodModeratorActionItemProps) => {
  const classes = useStyles(styles);
  const [editing, setEditing] = useState(false);
  const [endsAfterDays, setEndsAfterDays] = useState<number | undefined>(
    computeEndsAfterDays(moderatorAction.endedAt)
  );

  const [updateModeratorAction] = useMutation(UpdateModeratorActionMutation);

  const updateUserModeratorActionsLocally = useCallback((updatedAction: ModeratorActionDisplay) => {
    const currentActions = user.moderatorActions ?? [];
    const updatedActions = currentActions.map(action =>
      action._id === updatedAction._id ? updatedAction : action
    );
    dispatch({
      type: 'UPDATE_USER',
      userId: user._id,
      fields: { moderatorActions: updatedActions },
    });
  }, [user._id, user.moderatorActions, dispatch]);

  const handleChangeEndAfterDays = useCallback((ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = ev.target.value;
    if (!newValue.length) {
      setEndsAfterDays(undefined);
    } else {
      const days = parseInt(newValue, 10);
      setEndsAfterDays(days);
    }
  }, []);

  const handleUpdateEndAfterDays = useCallback(async () => {
    const newEndDate = computeNewEndDate(endsAfterDays);
    const result = await updateModeratorAction({
      variables: {
        selector: { _id: moderatorAction._id },
        data: { endedAt: newEndDate },
      },
    });

    const updatedAction = result.data?.updateModeratorAction?.data;
    if (updatedAction) {
      updateUserModeratorActionsLocally(updatedAction);
    }

    setEditing(false);
  }, [moderatorAction._id, endsAfterDays, updateModeratorAction, updateUserModeratorActionsLocally]);

  const handleEndModerationAction = useCallback(async () => {
    const result = await updateModeratorAction({
      variables: {
        selector: { _id: moderatorAction._id },
        data: { endedAt: new Date() },
      },
    });

    const updatedAction = result.data?.updateModeratorAction?.data;
    if (updatedAction) {
      updateUserModeratorActionsLocally(updatedAction);
    }

    setEditing(false);
  }, [moderatorAction._id, updateModeratorAction, updateUserModeratorActionsLocally]);

  const actionTypeLabel = MODERATOR_ACTION_TYPES[moderatorAction.type] ?? moderatorAction.type;

  const endedAtEditForm = (
    <>
      <span className={classes.margin}>
        <Input type="number" value={endsAfterDays ?? ''} onChange={handleChangeEndAfterDays} /> days
      </span>
      <LWTooltip title="Edit end date">
        <DoneIcon className={classes.icon} onClick={handleUpdateEndAfterDays} />
      </LWTooltip>
    </>
  );

  const endedAtDisplay = (
    <LWTooltip title="Edit duration">
      <span className={classes.clickToEdit} onClick={() => setEditing(true)}>
        {moderatorAction.endedAt && <MetaInfo>{endsAfterDays} days</MetaInfo>}
      </span>
    </LWTooltip>
  );

  return (
    <div className={classes.root}>
      <FormatDate date={moderatorAction.createdAt} />{' '}
      {actionTypeLabel}{' '}
      <MetaInfo className={classes.date}>
        {editing ? endedAtEditForm : endedAtDisplay}
      </MetaInfo>
      <LWTooltip title="Remove this mod-action">
        <ClearIcon
          className={classNames(classes.icon, classes.clearIcon)}
          onClick={handleEndModerationAction}
        />
      </LWTooltip>
    </div>
  );
};

export default SupermodModeratorActionItem;
