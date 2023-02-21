import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import ArchiveIcon from '@material-ui/icons/Archive';
import UnarchiveIcon from '@material-ui/icons/Unarchive';


const styles = (theme: ThemeType): JssStyles => ({
  
});

const PostsItemArchiveButton = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { PostsItem2MetaInfo, FormatDate, LWTooltip } = Components;


  return <div className={classes.archiveButton}>
    {isArchived ? <LWTooltip title={unarchiveBookmarkTooltip} placement="right">
        <UnarchiveIcon onClick={() => setBookmarkArchived(post._id, false)}/>
    </LWTooltip> : <LWTooltip title={archiveDraftTooltip} placement="right">
      <ArchiveIcon onClick={onArchive} />
    </LWTooltip>}
  </div>
}

const PostsItemArchiveButtonComponent = registerComponent("PostsItemArchiveButton", PostsItemArchiveButton, {styles});

declare global {
  interface ComponentTypes {
    PostsItemArchiveButton: typeof PostsItemArchiveButtonComponent
  }
}

