import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { truncate } from '../../lib/editor/ellipsize';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { getHashLinkOnClick } from '../common/HashLink';
import { isLW, isLWorAF } from '../../lib/instanceSettings';
import { useNavigate } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { TagExcerpt } from "../common/excerpts/TagExcerpt";
import { ContentItemBody } from "../common/ContentItemBody";
import { ContentStyles } from "../common/ContentStyles";

const styles = (theme: ThemeType) => ({
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

export const getTagDescriptionHtmlHighlight = (tag: TagPreviewFragment | TagSectionPreviewFragment) => {
  if (!tag.description) {
    return undefined;
  } else if ('htmlHighlight' in tag.description) {
    return tag.description.htmlHighlight;
  } else {
    return tag.description.htmlHighlightStartingAtHash;
  }
}

const getTagParagraphTruncationCount = (tag: TagPreviewFragment | TagSectionPreviewFragment) => {
  if (!tag.description || 'htmlHighlight' in tag.description) return 1;

  // Show two paragraphs for links to tag section headers
  return isLWorAF ? 8 : 2;
}

const TagPreviewDescriptionInner = ({tag, hash, classes, activeTab}: {
  tag: (TagPreviewFragment | TagSectionPreviewFragment) & { summaries?: MultiDocumentContentDisplay[] },
  hash?: string,
  activeTab?: number,
  classes: ClassesType<typeof styles>
}) => {
  const navigate = useNavigate();

  if (!tag) {
    return null
  }

  if (isFriendlyUI) {
    return (
      <TagExcerpt
        tag={tag}
        lines={4}
        hideMultimedia
        hideMoreLink
      />
    );
  }

  const showCustomDescriptionHighlight = isLW && tag.core && !hash;

  let highlight: string | undefined;
  // If we're on LW and previewing a core tag (but not a section within it), show the custom description
  if (showCustomDescriptionHighlight) {
    highlight = CoreTagCustomDescriptions[tag.name];
  }

  // Otherwise (or if the custom description is missing), use the tag's description
  if (!highlight) {
    highlight = truncate(
      getTagDescriptionHtmlHighlight(tag),
      getTagParagraphTruncationCount(tag),
      "paragraphs",
      '.. <a class="read-more-button" href="#">(read more)</a>'
    );
  }

  const tagUrl = tagGetUrl(tag, undefined, undefined, hash);
  const hashLinkOnClick = getHashLinkOnClick({ to: tagUrl, id: 'read-more-button' });
  let html: string | undefined;

  if (activeTab !== undefined && tag.summaries) {
    html = tag.summaries[activeTab].contents?.html ?? ''
  } else {
    html = highlight;
  }

  if (html) {
    return <div
      onClick={(ev: React.MouseEvent) => {
        if ((ev.target as any)?.className==="read-more-button") {
          ev.preventDefault();
          navigate(tagUrl);
          hashLinkOnClick(ev as React.MouseEvent<HTMLAnchorElement>);
        }
      }}
    >
      <ContentStyles contentType="comment">
        <ContentItemBody
          className={classes.root}
          dangerouslySetInnerHTML={{__html: html}}
          description={`tag ${tag.name}`}
        />
      </ContentStyles>
    </div>
  }

  // TODO: This hacky code path that we never hit is Times New Roman
  return <div className={classes.root}><b>{tag.name}</b></div>
}

export const TagPreviewDescription = registerComponent("TagPreviewDescription", TagPreviewDescriptionInner, {styles});


