import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagContributorsList = ({tag, classes}: {
  tag: TagPageFragment|TagPageWithRevisionFragment,
  classes: ClassesType,
}) => {
  const { UsersNameDisplay } = Components;
  
  return <div>
    <div>Contributors</div>
    <ul>
      {tag.contributors && tag.contributors.map(contributor => <li key={contributor.user._id}>
        <UsersNameDisplay user={contributor.user}/>
        {" ("}{contributor.contributionScore})
      </li>)}
    </ul>
  </div>
}

const TagContributorsListComponent = registerComponent("TagContributorsList", TagContributorsList, {styles});

declare global {
  interface ComponentTypes {
    TagContributorsList: typeof TagContributorsListComponent
  }
}


