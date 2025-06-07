import React from 'react';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import { Chip } from '@/components/widgets/Chip';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import ErrorBoundary from "../common/ErrorBoundary";
import TagsSearchAutoComplete from "../search/TagsSearchAutoComplete";

const TagBasicInfoQuery = gql(`
  query TagSelect($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagBasicInfo
      }
    }
  }
`);

const styles = defineStyles('TagSelect', (theme: ThemeType) => ({
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

interface TagSelectProps {
  field: TypedFieldApi<string | null | undefined>;
  label: string;
}

export const TagSelect = ({ field, label }: TagSelectProps) => {
  const classes = useStyles(styles);
  const value = field.state.value;

  const { loading, data } = useQuery(TagBasicInfoQuery, {
    variables: { documentId: value },
    skip: !value,
  });
  
  const selectedTag = data?.tag?.result;

  return (
    <div className={classes.root}>
      <ErrorBoundary>
        <TagsSearchAutoComplete
          clickAction={(id) => field.handleChange(id)}
          placeholder={label}
        />
      </ErrorBoundary>
      {(!loading && selectedTag?.name) ?
        <Chip
          onDelete={() => field.handleChange(null)}
          className={classes.chip}
          label={selectedTag?.name}
        />: <></>}
    </div>
  );
}
