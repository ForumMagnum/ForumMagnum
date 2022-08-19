import React, { useEffect, useState } from 'react';
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

const TagSelect = ({ value, path, document, classes, label, updateCurrentValues }: {
  value: string,
  path: string,
  document: any,
  classes: ClassesType,
  label?: string,
  updateCurrentValues<T extends {}>(values: T): void,
}) => {
  const [currentId, setCurrentId] = useState(document.parentTag?._id);
  const { document: parentTag, loading } = useSingle({
    skip: !currentId,
    documentId: currentId,
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
  });

  useEffect(() => {
    // updateCurrentValues needs to be called after loading the TagBasicInfo query because
    // when the query returns `value` gets set back to undefined for some reason. I think this
    // is probably because it updates local storage somehow, but I'm not sure. This fixes it anyway
    if (!loading && value !== currentId) {
      updateCurrentValues({ [path]: currentId });
    }
  }, [currentId, value, updateCurrentValues, path, loading]);

  return (
    <>
      <div className={classes.root}>
        <Components.ErrorBoundary>
          <Components.TagsSearchAutoComplete
            clickAction={(id: string) => setCurrentId(id)}
            placeholder={label}
          />
        </Components.ErrorBoundary>
        {(!loading && parentTag?.name) ?
          <Chip
            onDelete={(_: string) => setCurrentId(null)}
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
