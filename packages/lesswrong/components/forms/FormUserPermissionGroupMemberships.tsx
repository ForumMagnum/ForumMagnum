import React from 'react';
import { registerComponent, useStyles } from '../../lib/vulcan-lib/components';
import { userGroups } from '../../lib/vulcan-users/permissions';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import Checkbox from '@material-ui/core/Checkbox';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  
  checkbox: {
    paddingRight: 8,
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});

export function FormUserPermissionGroupMemberships<T, FN extends keyof T>({form, fieldName}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string[]>,
}) {
  const classes = useStyles(styles, "FormUserPermissionGroupMemberships");
  const {value,setValue} = useFormComponentContext<string[],T>(form, fieldName);
  const groups: string[] = _.without(
    _.keys(userGroups),
    'guests', 'members', 'admins'
  );
  
  return <div className={classes.formField}>
    {groups.map(group => <div key={group}>
      <Checkbox
        className={classes.checkbox}
        checked={value.indexOf(group) >= 0}
        onChange={(event) => {
          if (event.target.checked) {
            if (value.indexOf(group) < 0)
              setValue([...value, group]);
          } else {
            if (value.indexOf(group) >= 0)
              setValue(_.filter(value, v=>v!==group));
          }
        }}
      />
      {group}
    </div>)}
  </div>
}

registerComponent('FormUserPermissionGroupMemberships', FormUserPermissionGroupMemberships, {styles});
declare global {
  interface ComponentTypes {
    FormUserPermissionGroupMemberships: typeof FormUserPermissionGroupMemberships
  }
}

