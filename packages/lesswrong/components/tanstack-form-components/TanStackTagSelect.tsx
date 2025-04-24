import { Chip } from '@/components/widgets/Chip';
import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Components } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TypedFieldApi } from './BaseAppForm';

const styles = defineStyles('TanStackTagSelect', (theme: ThemeType) => ({
  root: {
    display: 'flex',
  },
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: theme.palette.background.usersListItem,
  },
}));

interface TanStackTagSelectProps {
  field: TypedFieldApi<string | null>;
  label: string;
}

export const TanStackTagSelect = ({ field, label }: TanStackTagSelectProps) => {
  const classes = useStyles(styles);
  const value = field.state.value;

  const {document: selectedTag, loading} = useSingle({
    skip: !value,
    documentId: value!,
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
  });

  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.TagsSearchAutoComplete
          clickAction={(id) => field.handleChange(id)}
          placeholder={label}
        />
      </Components.ErrorBoundary>
      {(!loading && selectedTag?.name) ?
        <Chip
          onDelete={() => field.handleChange(null)}
          className={classes.chip}
          label={selectedTag?.name}
        />: <></>}
    </div>
  );
}
