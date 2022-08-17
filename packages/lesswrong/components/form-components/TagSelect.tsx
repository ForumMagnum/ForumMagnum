import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import { useSingle } from '../../lib/crud/withSingle';
import Chip from '@material-ui/core/Chip/Chip';

const TagSelectStyles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
  },
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: theme.palette.background.usersListItem,
  },
});

const TagSelect = ({ value, path, document, classes, label, currentUser, updateCurrentValues, type }: {
  value: string,
  path: string,
  document: any,
  classes: ClassesType,
  label?: string,
  currentUser: DbUser | null,
  updateCurrentValues<T extends {}>(values: T): void,
  type: any
}) => {
  const [ valueEverSet, setValueEverSet ] = useState(false);
  const { document: parentTag, loading } = useSingle({
    documentId: valueEverSet ? value : document.parentTag?._id,
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
  });

  const setValue = (newValue: string|null) => {
    updateCurrentValues({[path]: newValue});
    setValueEverSet(true);
  }

  return (
    <>
      <div className={classes.root}>
        <Components.ErrorBoundary>
          <Components.TagsSearchAutoComplete
            clickAction={setValue}
            placeholder={label}
          />
        </Components.ErrorBoundary>
        {(!loading && parentTag?.name) ?
          <Chip
            onDelete={(_: string) => setValue(null)}
            className={classes.chip}
            label={parentTag?.name}
          />: <></>}
      </div>
    </>
  );
}

const TagSelectComponent = registerComponent('TagSelect', TagSelect, {
  styles: TagSelectStyles,
  hocs: [withUser],
});

declare global {
  interface ComponentTypes {
    TagSelect: typeof TagSelectComponent
  }
}
