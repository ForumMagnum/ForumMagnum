import React, { useCallback } from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { makeSortableListComponent } from './sortableList';
import find from 'lodash/find';
import InputLabel from '@/lib/vendor/@material-ui/core/src/InputLabel';
import {isEAForum} from '../../lib/instanceSettings';
import type { EditablePost } from '../../lib/collections/posts/helpers';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';

const coauthorsListEditorStyles = defineStyles('CoauthorsListEditor', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    marginLeft: 8,
    marginTop: -12,
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
  checkbox: {
    padding: '6px',
  },
  checkboxContainer: {
    margin: '10px 0 -8px 0'
  },
  checkboxLabel: {
    fontSize: '1.1rem',
    fontWeight: theme.typography.body1.fontWeight ?? 400,
    color: theme.palette.text.normal,
    cursor: 'pointer'
  },
}));

type CoauthorListItem = {
  userId: string
  confirmed: boolean
  requested: boolean
}

const SortableList = makeSortableListComponent({
  RenderItem: ({contents, removeItem}) => {
    const classes = useStyles(coauthorsListEditorStyles);
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

interface CoauthorsListEditorProps {
  field: TypedFieldApi<CoauthorListItem[] | null>;
  post: EditablePost;
  label: string;
}

export const CoauthorsListEditor = ({ field, post, label }: CoauthorsListEditorProps) => {
  const classes = useStyles(coauthorsListEditorStyles);
  const value = field.state.value ?? [];
  const hasPermission = !!post.hasCoauthorPermission;

  const toggleHasPermission = () => {
    const newValue = value.map((author) => ({ ...author, confirmed: !hasPermission }));
    field.handleChange(newValue);
    field.form.setFieldValue('hasCoauthorPermission', !hasPermission);
  }

  const addUserId = (userId: string) => {
    const newValue = [...value, { userId, confirmed: hasPermission, requested: false }];
    field.handleChange(newValue);
  }

  const setValue = useCallback((newValue: CoauthorListItem[]) => {
    field.handleChange(newValue);
  }, [field]);

  return (
    <>
      <div className={classes.root}>
        <Components.ErrorBoundary>
          <Components.UsersSearchAutoComplete
            clickAction={addUserId}
            label={post.collabEditorDialogue ? "Add participant" : label}
            />
        </Components.ErrorBoundary>
        <SortableList
          axis="xy"
          value={value.map(v=>v.userId)}
          setValue={(newValue: string[]) => {
            setValue(newValue.map(userId => {
              const userWithStatus = find(value, u=>u.userId===userId);
              return {
                userId,
                confirmed: userWithStatus?.confirmed||false,
                requested: userWithStatus?.confirmed||false,
              };
            }));
          }}
          className={classes.list}
        />
      </div>
      {isEAForum && <div className={classes.checkboxContainer}>
        <Components.LWTooltip
          title='If this box is left unchecked then these users will be asked if they want to be co-authors. If you click Publish with pending co-authors, publishing will be delayed for up to 24 hours to allow for co-authors to give permission.'
          placement='left'
        >
          <InputLabel className={classes.checkboxLabel}>
            <Checkbox className={classes.checkbox} checked={hasPermission} onChange={toggleHasPermission} />
            These users have agreed to co-author this post
          </InputLabel>
        </Components.LWTooltip>
      </div>}
    </>
  );
}
