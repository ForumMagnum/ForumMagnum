import React, { FC, PropsWithChildren } from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person'
import HomeIcon from '@/lib/vendor/@material-ui/icons/src/Home';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import SubjectIcon from '@/lib/vendor/@material-ui/icons/src/Subject';
import TagIcon from '@/lib/vendor/@material-ui/icons/src/LocalOffer';
import EventIcon from '@/lib/vendor/@material-ui/icons/src/Event';
import QuestionAnswerIcon from '@/lib/vendor/@material-ui/icons/src/QuestionAnswer';
import { forumTitleSetting, siteNameWithArticleSetting, taggingNameCapitalSetting, taggingNameIsSet } from '../../../lib/instanceSettings';
import { curatedUrl } from '@/components/recommendations/constants';
import { ForumOptions, forumSelect } from '../../../lib/forumTypeUtils';
import classNames from 'classnames';
import { getAllTagsPath } from '@/lib/pathConstants';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { Typography } from "../../common/Typography";
import { LWTooltip } from "../../common/LWTooltip";
import { SectionTitle } from "../../common/SectionTitle";

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: 'left',
    display: 'inline-block',
    color: theme.palette.text.dim2,
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body2.fontSize,
    ...(isFriendlyUI && {
      color: theme.palette.grey[800],
      fontWeight: 600
    }),
  },
  icon: {
    fontSize: "1.3rem",
    color: theme.palette.icon.dim600,
    position: "relative",
    top: 3,
    marginRight: 4,
    ...(isFriendlyUI && {
      color: theme.palette.grey[800]
    }),
  },
  tooltipTitle: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
  },
})

const taggingAltName = taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Tag/Wiki'
const taggingAltName2 = taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Tag and wiki'

export type ContentTypeString = "frontpage"|"personal"|"curated"|"shortform"|"tags"|"subforumDiscussion";
interface ContentTypeSettings {
  tooltipTitle?: string,
  tooltipBody?: React.ReactNode,
  linkTarget: string|null,
  Icon: any,
}
type ContentTypeRecord = {
  frontpage: ContentTypeSettings,
  personal: ContentTypeSettings,
  curated: ContentTypeSettings,
  shortform: ContentTypeSettings,
  tags: ContentTypeSettings,
  subforumDiscussion?: ContentTypeSettings,
  event?: ContentTypeSettings,
}

export const contentTypes: ForumOptions<ContentTypeRecord> = {
  LessWrong: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <React.Fragment>
        <p><b>Frontpage Posts</b> are promoted by moderators based on:</p>
        <ul>
          <li>Usefulness, novelty, relevance</li>
          <li>Timeless content (minimizing reference to current events)</li>
          <li>Aiming to explain, rather than persuade</li>
        </ul>
      </React.Fragment>,
      linkTarget: "/posts/5conQhfa4rgb4SaWx/site-guide-personal-blogposts-vs-frontpage-posts",
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blogpost',
      tooltipBody: <React.Fragment>
        <div><b>Personal Blogpost</b></div><br/>
        <div>
          Members can write whatever they want on their personal blog. Personal
          blogposts are a good fit for:
        </div>
        <ul>
          <li>Niche topics</li>
          <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
          <li>Topics that are difficult to discuss rationally</li>
          <li>Personal ramblings</li>
        </ul>
      </React.Fragment>,
      linkTarget: "/posts/5conQhfa4rgb4SaWx/site-guide-personal-blogposts-vs-frontpage-posts",
      Icon: PersonIcon
    },
    curated: {
      tooltipTitle: 'Curated Post',
      tooltipBody: <div>
        The best 2-3 posts each week, selected by the moderation team. Curated
        posts are featured at the top of the front page and emailed to subscribers.
      </div>,
      linkTarget: curatedUrl,
      Icon: StarIcon,
    },
    event: {
      tooltipTitle: 'Event',
      tooltipBody: <div>
        An event post.
      </div>,
      linkTarget: "/community",
      Icon: EventIcon
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is short in length, or written in a short amount of time.
        Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
      </div>,
      linkTarget: "/shortform",
      Icon: SubjectIcon
    },
    tags: {
      tooltipTitle: `${taggingAltName} Edits and Discussion`,
      tooltipBody: <div>
        {taggingAltName2} pages, which organize LessWrong posts and concepts in a more
        durable format.
      </div>,
      Icon: TagIcon,
      linkTarget: getAllTagsPath(),
    },
  },
  AlignmentForum: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <React.Fragment>
        <div>Moderators promote posts to frontpage based on:</div>
        <ul>
          <li>Usefulness, novelty, relevance</li>
          <li>Timeless content (minimizing reference to current events)</li>
          <li>Aiming to explain, rather than persuade</li>
        </ul>
      </React.Fragment>,
      linkTarget: null,
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blog Post',
      tooltipBody: <React.Fragment>
        <div>
          Members can write whatever they want on their personal blog. Personal
          blogposts are a good fit for:
        </div>
        <ul>
          <li>Niche topics</li>
          <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
          <li>Topics that are difficult to discuss rationally</li>
          <li>Personal ramblings</li>
        </ul>
      </React.Fragment>,
      linkTarget: null,
      Icon: PersonIcon
    },
    curated: {
      tooltipTitle: 'Curated Post',
      tooltipBody: <div>
        The best posts, selected by the moderation team.
      </div>,
      linkTarget: curatedUrl,
      Icon: StarIcon,
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is short in length, or written in a short amount of time.
        Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
      </div>,
      linkTarget: "/shortform",
      Icon: SubjectIcon
    },
    tags: {
      tooltipTitle: `${taggingAltName} Edits and Discussion`,
      tooltipBody: <div>
        {taggingAltName2} pages, which organize {siteNameWithArticleSetting.get()} posts and concepts in
        a more durable format.
      </div>,
      Icon: TagIcon,
      linkTarget: getAllTagsPath(),
    },
  },
  EAForum: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <div>
        Posts that are relevant to doing good effectively.
      </div>,
      linkTarget: "/about#Finding_content",
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blog Post',
      tooltipBody: <React.Fragment>
        <div>
          Users can write whatever they want on their personal blog. This category
          is a good fit for:
        </div>
        <ul>
          <li>topics that aren't closely related to EA</li>
          <li>topics that are difficult to discuss rationally</li>
          <li>topics of interest to a small fraction of the Forum’s readers (e.g. local events)</li>
        </ul>
      </React.Fragment>,
      linkTarget: "/posts/5TAwep4tohN7SGp3P/the-frontpage-community-distinction",
      Icon: PersonIcon
    },
    curated: {
      tooltipTitle: 'Curated Post',
      tooltipBody: <div>
        The best 2-3 posts each week, selected by the moderation team. Curated
        posts are featured at the top of the front page and emailed to subscribers.
      </div>,
      linkTarget: curatedUrl,
      Icon: StarIcon,
    },
    shortform: {
      tooltipTitle: 'Quick take',
      tooltipBody: <div>
        Writing that is brief, or written very quickly. Perfect for off-the-cuff
        thoughts, brainstorming, early stage drafts, etc.
      </div>,
      linkTarget: "/quicktakes",
      Icon: SubjectIcon
    },
    tags: {
      tooltipTitle: `${taggingAltName} Edits and Discussion`,
      tooltipBody: <div>
        {taggingAltName2} pages, which organize posts and concepts in a more
        durable format.
      </div>,
      Icon: TagIcon,
      linkTarget: getAllTagsPath(),
    },
    subforumDiscussion: {
      Icon: QuestionAnswerIcon,
      linkTarget: null,
    }
  },
  default: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <React.Fragment>
        <p><b>Frontpage Posts</b> are promoted by moderators based on:</p>
        <ul>
          <li>Usefulness, novelty, relevance</li>
          <li>Timeless content (minimizing reference to current events)</li>
          <li>Aiming to explain, rather than persuade</li>
        </ul>
      </React.Fragment>,
      linkTarget: "/posts/5conQhfa4rgb4SaWx/site-guide-personal-blogposts-vs-frontpage-posts", // TODO
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blogpost',
      tooltipBody: <React.Fragment>
        <div><b>Personal Blogpost</b></div><br/>
        <div>
          Members can write whatever they want on their personal blog. Personal
          blogposts are a good fit for:
        </div>
        <ul>
          <li>Niche topics</li>
          <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
          <li>Topics that are difficult to discuss rationally</li>
          <li>Personal ramblings</li>
        </ul>
      </React.Fragment>,
      linkTarget: "/posts/5conQhfa4rgb4SaWx/site-guide-personal-blogposts-vs-frontpage-posts",
      Icon: PersonIcon
    },
    curated: {
      tooltipTitle: 'Curated Post',
      tooltipBody: <div>
        The best 2-3 posts each week, selected by the moderation team. Curated
        posts are featured at the top of the front page and emailed to subscribers.
      </div>,
      linkTarget: curatedUrl,
      Icon: StarIcon,
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is short in length, or written in a short amount of time.
        Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
      </div>,
      linkTarget: "/shortform",
      Icon: SubjectIcon
    },
    tags: {
      tooltipTitle: `${taggingAltName} Edits and Discussion`,
      tooltipBody: <div>
        {taggingAltName2} pages, which organize {forumTitleSetting.get()} posts and concepts in a more
        durable format.
      </div>,
      Icon: TagIcon,
      linkTarget: getAllTagsPath(),
    },
  }
}

const ContentTypeWrapper: FC<PropsWithChildren<{classes: ClassesType<typeof styles>, className?: string}>> = ({
  classes,
  className,
  children,
}) =>
  isFriendlyUI
    ? <>{children}</>
    : <Typography
      variant="body1"
      component="span"
      className={classNames(classes.root, className)}
    >
        {children}
    </Typography>;

const ContentTypeInner = ({classes, className, type, label}: {
  classes: ClassesType<typeof styles>,
  className?: string,
  type: ContentTypeString,
  label?: string
}) => {
  if (!type) {
    throw new Error('ContentType requires type property')
  }
  const contentData = forumSelect(contentTypes)[type]
  if (!contentData) {
    throw new Error(`Content type ${type} invalid for this forum type`)
  }

  const innerComponent = isFriendlyUI
    ? <SectionTitle title={label} titleClassName={classNames(classes.sectionTitle, className)} noTopMargin noBottomPadding />
    : <span>
      <contentData.Icon className={classes.icon} />{label ? " "+label : ""}
    </span>;

  return (
    <ContentTypeWrapper className={className} classes={classes}>
      {contentData.tooltipTitle ? (
        <LWTooltip
          title={
            <React.Fragment>
              <div className={classes.tooltipTitle}>{contentData.tooltipTitle}</div>
              {contentData.tooltipBody}
            </React.Fragment>
          }
        >
          {innerComponent}
        </LWTooltip>
      ) : innerComponent}
    </ContentTypeWrapper>
  );
}

export const ContentType = registerComponent('ContentType', ContentTypeInner, {styles});


