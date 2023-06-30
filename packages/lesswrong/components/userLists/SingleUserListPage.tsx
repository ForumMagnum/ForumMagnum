import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { useSingle } from "../../lib/crud/withSingle";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType): JssStyles => ({
});

const SingleUserListPage = ({classes}: {
  classes: ClassesType,

}) => {
  const { params } = useLocation();
  const listId = params?.id;
  const { document: userList, loading } = useSingle({
    collectionName: "UserLists",
    fragmentName: "UserListFragment",
    documentId: listId,
  })
  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const { ContentItemBody, Loading, SingleColumnSection, WrappedSmartForm } = Components;
  if (loading || !userList) {
    return <Loading />
  }
  if (userList.userId === currentUser?._id) {
    return <SingleColumnSection>
      <WrappedSmartForm
        collectionName="UserLists"
        mutationFragmentName="UserListEditFragment"
        queryFragmentName="UserListEditFragment"
        documentId={listId}
        successCallback={() => history.push('/userLists')}
      />
    </SingleColumnSection>
  }
  return <SingleColumnSection>
    <div>
      {userList?.name}
    </div>
    <div>
      {userList.description && <ContentItemBody
        dangerouslySetInnerHTML={{__html: userList.description.html }}
      />}
    </div>
    
    {/*TODO: List of members that's spaced out and nicely editable*/}
  </SingleColumnSection>;
}

const SingleUserListPageComponent = registerComponent("SingleUserListPage", SingleUserListPage, {styles});

declare global {
  interface ComponentTypes {
    SingleUserListPage: typeof SingleUserListPageComponent,
  }
}
