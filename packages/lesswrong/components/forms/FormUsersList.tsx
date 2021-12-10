import React from 'react';
import { registerComponent, Components, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { makeSortableListComponent } from './sortableList';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  
  listEditor: {
    display: "flex"
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
});

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => <li className={classes.item}>
    <Components.SingleUsersItemWrapper documentId={contents} removeItem={removeItem} />
  </li>
});

export function FormUsersList<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string[]>,
  label: string,
}) {
  const classes = useStyles(styles, "FormUsersList");
  const {value,setValue} = useFormComponentContext<string[],T>(form, fieldName);
  const {ErrorBoundary, UsersSearchAutoComplete} = Components;
  
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>{label}</span>
    <span className={classes.rightColumn}>
      <span className={classes.listEditor}>
        <ErrorBoundary>
          <UsersSearchAutoComplete
            clickAction={(added: string) => {
              setValue([...value, added]);
            }}
            label={label}
          />
        </ErrorBoundary>
        <SortableList
          value={value}
          setValue={setValue}
          axis="xy"
          className={classes.list}
          classes={classes}
        />
      </span>
    </span>
  </div>
}

registerComponent('FormUsersList', FormUsersList, {styles});
declare global {
  interface ComponentTypes {
    FormUsersList: typeof FormUsersList
  }
}
