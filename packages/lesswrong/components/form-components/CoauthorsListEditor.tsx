import React, { useCallback } from 'react';
import { arrayMove } from 'react-sortable-hoc';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import withUser from '../common/withUser';
import { makeSortableListComponent } from '../forms/sortableList';

const coauthorsListEditorStyles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
  },
  checkbox: {
    padding: '6px',
  },
  checkboxContainer: {
    margin: '10px 0',
    fontSize: '1.1rem',
    fontWeight: 400,
  },
});

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SequencesListEditorItem documentId={contents} removeItem={removeItem} />
    </li>
  }
});

const CoauthorsListEditor = ({ value, path, document, classes, label, currentUser }, context: {
  value: { userId: string, confirmed: boolean, requested: boolean }[],
  path: string,
  document: Partial<DbPost>,
  classes: ClassesType,
  label?: string,
  currentUser: DbUser|null
}) => {
  const hasPermission = !!document.hasCoauthorPermission;

  const { updateCurrentValues } = context;
  
  const setValue = useCallback((newValue: string[]) => {
    updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);
  
  const toggleHasPermission = () => {
    const newValue = value.map((author) => ({ ...author, confirmed: !hasPermission }));
    updateCurrentValues({
      [path]: newValue,
      hasCoauthorPermission: !hasPermission,
    });
  }

  const addUserId = (userId: string) => {
    const newValue = [...value, { userId, confirmed: hasPermission, requested: false }];
    updateCurrentValues({ [path]: newValue });
  }

  return (
    <>
      <div className={classes.root}>
        <Components.ErrorBoundary>
          <Components.UsersSearchAutoComplete clickAction={addUserId} label={label} />
        </Components.ErrorBoundary>
        <SortableList
          axis="xy"
          value={value}
          setValue={setValue}
          className={classes.list}
          classes={classes}
        />
      </div>
      <div className={classes.checkboxContainer}>
        <Components.LWTooltip
          title='If this box is left unchecked then these users will be asked if they want to be co-authors when the post is published'
          placement='left'
        >
          <Checkbox className={classes.checkbox} checked={hasPermission} onChange={toggleHasPermission} />
          These users have agreed to co-author this post
        </Components.LWTooltip>
      </div>
    </>
  );
}

const CoauthorsListEditorComponent = registerComponent('CoauthorsListEditor', CoauthorsListEditor, {
  styles: coauthorsListEditorStyles,
  hocs: [withUser],
});

declare global {
  interface ComponentTypes {
    CoauthorsListEditor: typeof CoauthorsListEditorComponent
  }
}
