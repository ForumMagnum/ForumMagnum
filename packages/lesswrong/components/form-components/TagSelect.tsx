import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import withUser from '../common/withUser';
import { useSingle } from '../../lib/crud/withSingle';
import Chip from '@/lib/vendor/@material-ui/core/src/Chip/Chip';

const styles = (theme: ThemeType) => ({
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

const TagSelect = ({value, path, classes, label, updateCurrentValues}: {
  value: string,
  path: string,
  document: any,
  classes: ClassesType<typeof styles>,
  label?: string,
  updateCurrentValues<T extends {}>(values: T): void,
}) => {
  const {document: selectedTag, loading} = useSingle({
    skip: !value,
    documentId: value,
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
  });

  const setSelectedTagId = useCallback((value?: string) => {
    updateCurrentValues({
      [path]: value,
    });
  }, [updateCurrentValues, path]);

  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.TagsSearchAutoComplete
          clickAction={setSelectedTagId}
          placeholder={label}
        />
      </Components.ErrorBoundary>
      {(!loading && selectedTag?.name) ?
        <Chip
          onDelete={() => setSelectedTagId(undefined)}
          className={classes.chip}
          label={selectedTag?.name}
        />: <></>}
    </div>
  );
}

const TagSelectComponent = registerComponent('TagSelect', TagSelect, {
  styles: styles,
  hocs: [withUser],
});

declare global {
  interface ComponentTypes {
    TagSelect: typeof TagSelectComponent
  }
}
