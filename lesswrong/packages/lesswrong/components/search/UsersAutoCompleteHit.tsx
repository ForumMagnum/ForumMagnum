import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Loading } from "@/components/vulcan-core/Loading";
import MetaInfo from "@/components/common/MetaInfo";
import FormatDate from "@/components/common/FormatDate";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer"
  }
});

const UsersAutoCompleteHit = ({document, classes}: {
  document: SearchUser
  classes: ClassesType<typeof styles>
}) => {
  if (document) {
    return <div className={classes.root}>
      <MetaInfo>
        {document.displayName}
      </MetaInfo>
      <MetaInfo>
        {document.karma} karma
      </MetaInfo>
      <MetaInfo>
        <FormatDate date={document.createdAt}/>
      </MetaInfo>
    </div>
  } else {
    return <Loading />
  }
};

const UsersAutoCompleteHitComponent = registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit, {styles});

declare global {
  interface ComponentTypes {
    UsersAutoCompleteHit: typeof UsersAutoCompleteHitComponent
  }
}

export default UsersAutoCompleteHitComponent;

