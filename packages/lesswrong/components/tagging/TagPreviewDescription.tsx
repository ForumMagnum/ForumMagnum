import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import { useNavigation } from '../../lib/routeUtil';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { isLW } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    "& a.read-more-button": {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    },
  }
});

const CoreTagCustomDescriptions: Record<string, string> = {
  'Rationality': "The <strong>Rationality</strong> tag is for posts about how to think in ways that more reliably result in you having true beliefs and making decisions that result in attainment of your goals.",
  'AI': "The <strong>AI</strong> tag is for anything related to AI and ML, including technical alignment, strategy/governance, and timelines forecasting.",
  'World Modeling': "<p>The <strong>World Modeling</strong> tag is for posts that simply describe how the world is, e.g. physics, math, history, etc.</p><p>Often this tag is superceded by a more specific one like <em>Rationality</em>, <em>AI</em>, or <em>World Optimization</em>.</p>",
  'World Optimization': 'The <strong>World Optimization</strong> tag is for posts about how to make the world better at scale, e.g. altruistic cause areas, society-wide interventions, moral philosophy, etc.',
  'Practical': 'The <strong>Practical</strong> tag is for posts about things you can use to make your life locally better, e.g. health, productivity, relationships, DIY, etc.',
  'Site Meta': '<strong>Site Meta</strong> is for posts about the site itself, including bugs, feature requests, and site policy.',
  'Community': 'The <strong>Community</strong> tag is for LessWrong/Rationality community events, analysis of community health, norms and directions of the community, and posts about understanding communities in general.' 
};


const TagPreviewDescription = ({tag, classes}: {
  tag: TagPreviewFragment,
  classes: ClassesType
}) => {
  const { ContentItemBody, ContentStyles } = Components;
  const { history } = useNavigation();

  if (!tag) return null
  
  const showCustomDescriptionHighlight = isLW && tag.core;

  let highlight: string | undefined;
  // If we're on LW and previewing a core tag, show the custom description
  if (showCustomDescriptionHighlight) {
    highlight = CoreTagCustomDescriptions[tag.name];
  }

  // Otherwise (or if the custom description is missing), use the tag's description
  if (!highlight) {
    highlight = truncate(tag.description?.htmlHighlight, 1, "paragraphs",
    '.. <a class="read-more-button" href="#">(read more)</a>');
  }

  if (highlight) {
    return <div
      onClick={(ev: React.SyntheticEvent) => {
        if ((ev.target as any)?.className==="read-more-button") {
          history.push(tagGetUrl(tag));
        }
      }}
    >
      <ContentStyles contentType="comment">
        <ContentItemBody
          className={classes.root}
          dangerouslySetInnerHTML={{__html: highlight}}
          description={`tag ${tag.name}`}
        />
      </ContentStyles>
    </div>
  }
  // TODO: This hacky code path that we never hit is Times New Roman
  return <div className={classes.root}><b>{tag.name}</b></div>
}

const TagPreviewDescriptionComponent = registerComponent("TagPreviewDescription", TagPreviewDescription, {styles});

declare global {
  interface ComponentTypes {
    TagPreviewDescription: typeof TagPreviewDescriptionComponent
  }
}
