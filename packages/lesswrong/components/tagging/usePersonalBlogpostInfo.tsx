import React from "react";
import { ForumOptions, forumSelect } from "../../lib/forumTypeUtils";

const lwafPersonalBlogpostInfo = {
  name: "Personal Blog",
  tooltip: <div>
    <p><b>Personal Blogposts</b> are posts that don't fit LessWrong's Frontpage Guidelines. They get less visibility by default. The frontpage guidelines are:</p>
    <ul>
      <li><em>Timelessness</em>. Will people still care about this in 5 years?</li>
      <li><em>Avoid political topics</em>. They're important to discuss sometimes, but we try to avoid it on LessWrong.</li>
      <li><em>General Appeal</em>. Is this a niche post that only a small fraction of users will care about?</li>
    </ul>
  </div>
}

const personalBlogpostInfo: ForumOptions<{name: string, tooltip: React.JSX.Element}> = {
  LessWrong: lwafPersonalBlogpostInfo,
  AlignmentForum: lwafPersonalBlogpostInfo,
  EAForum: {
    name: "Personal",
    tooltip: <div>
      <div>
        By default, the home page only displays Frontpage Posts, which are selected by moderators as especially interesting or useful to people with interest in doing good effectively. Personal posts get to have looser standards of relevance, and may include topics that could lead to more emotive or heated discussion (e.g. politics), which are generally excluded from Frontpage.
      </div>
    </div>
  },
  default: {
    name: "Personal",
    tooltip: <div>
      <div>
        By default, the home page only displays Frontpage Posts, which are selected by moderators as especially interesting or useful to people with interest in doing good effectively. Personal posts get to have looser standards of relevance, and may include topics that could lead to more emotive or heated discussion (e.g. politics), which are generally excluded from Frontpage.
      </div>
    </div>
  },
}

export const usePersonalBlogpostInfo = () => forumSelect(personalBlogpostInfo);
