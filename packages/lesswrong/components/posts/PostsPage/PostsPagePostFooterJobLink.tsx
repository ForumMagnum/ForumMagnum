import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useMulti } from '../../../lib/crud/withMulti';
import { useTracking } from "../../../lib/analyticsEvents";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    textAlign: 'right',
    marginTop: 10,
  },
  jobLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: 8,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    fontSize: 14
  },
  jobLinkTagName: {
    textTransform: 'lowercase'
  },
  jobLinkIcon: {
    fontSize: 15,
  },
});

// export function sortTags<T>(list: Array<T>, toTag: (item: T)=>TagBasicInfo|null|undefined): Array<T> {
//   return _.sortBy(list, item=>toTag(item)?.core);
// }

const PostPagePostFooterJobLink = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()

  // const { results } = useMulti({
  //   terms: {
  //     view: "tagsOnPost",
  //     postId: post._id,
  //   },
  //   collectionName: "TagRels",
  //   fragmentName: "TagRelMinimumFragment",
  //   limit: 100,
  // })

  const firstCoreTag = post.tags?.find(tag => tag.core)
  
  if (!firstCoreTag) return null
 
  return <div className={classes.root}>
    <a href={`https://jobs.80000hours.org/?refinementList%5Btags_area%5D%5B0%5D=Biosecurity%20%26%20pandemic%20preparedness`} target="_blank" rel="noopener noreferrer" className={classes.jobLink}>
      <div>See jobs related to <span className={classes.jobLinkTagName}>{firstCoreTag.name}</span></div>
      <OpenInNewIcon className={classes.jobLinkIcon} />
    </a>
  </div>
}

const PostPagePostFooterJobLinkComponent = registerComponent("PostPagePostFooterJobLink", PostPagePostFooterJobLink, {styles});

declare global {
  interface ComponentTypes {
    PostPagePostFooterJobLink: typeof PostPagePostFooterJobLinkComponent
  }
}
