import React, { useState } from "react";
import { Components, getFragment, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";
import classNames from "classnames";
import Button from '@material-ui/core/Button';
import { useNavigation } from "../../lib/routeUtil";

const styles = (theme: ThemeType): JssStyles => ({
});

const CreateUserListPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { history } = useNavigation();

  const { WrappedSmartForm, FormSubmit, SingleColumnSection, SectionTitle } = Components;

  const SubmitComponent = ({submitLabel = "Submit"}) => {
    return <div className="form-submit">
      <Button
        type="submit"
      >
        {submitLabel}
      </Button>
    </div>
  }
  return <SingleColumnSection>
    <SectionTitle title="Create List"/>
    <WrappedSmartForm
      collectionName="UserLists"
      mutationFragment={getFragment("UserListEditFragment")}
      formComponents={{
        FormSubmit: SubmitComponent,
        FormGroupLayout: Components.DefaultStyleFormGroup
      }}
      successCallback={() => history.push('/userLists')}
    />
  </SingleColumnSection>;
}

const CreateUserListPageComponent = registerComponent("CreateUserListPage", CreateUserListPage, {styles});

declare global {
  interface ComponentTypes {
    CreateUserListPage: typeof CreateUserListPageComponent,
  }
}
