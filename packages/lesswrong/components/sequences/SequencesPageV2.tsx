"use client";
import React, { useMemo } from 'react';
import { useCurrentUser } from '../common/withUser';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";
import DeferRender from '../common/DeferRender';
import CloudinaryImage from "../common/CloudinaryImage";
import { defaultSequenceBannerIdSetting, nofollowKarmaThreshold } from '@/lib/instanceSettings';
import { makeCloudinaryImageUrl } from '../common/cloudinaryHelpers';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { Typography } from "../common/Typography";
import SequenceV2CenterToC from "./SequenceV2CenterToC";
import SequenceV2ChapterSection from "./SequenceV2ChapterSection";
import SequenceV2PostSection from "./SequenceV2PostSection";
import SequenceV2FixedToC from "./SequenceV2FixedToC";
import { StatusCodeSetter } from '../next/StatusCodeSetter';
import Divider from '../common/Divider';
import FormatDate from "../common/FormatDate";

type SequenceV2Sequence = {
  _id: string,
  title: string,
  draft: boolean,
  userId: string,
  createdAt?: Date|string|null,
  user?: { _id: string, displayName: string, karma?: number|null }|null,
  bannerImageId?: string|null,
  gridImageId?: string|null,
  contents?: { html?: string|null }|null,
}

type SequenceV2Post = {
  _id: string,
  title: string,
  userId: string,
  user?: { _id: string, displayName: string }|null,
  contents?: { html?: string|null }|null,
}

type SequenceV2Chapter = {
  _id: string,
  title?: string|null,
  subtitle?: string|null,
  number?: number|null,
  sequenceId?: string|null,
  contents?: { html?: string|null }|null,
  posts: SequenceV2Post[],
}

const SequenceV2Query = gql(`
  query SequenceV2Page($sequenceId: String, $selector: ChapterSelector, $limit: Int, $enableTotal: Boolean) {
    sequence(selector: { _id: $sequenceId }) {
      result {
        _id
        title
        draft
        userId
        createdAt
        user {
          _id
          displayName
          karma
        }
        bannerImageId
        gridImageId
        contents {
          ...RevisionDisplay
        }
      }
    }
    chapters(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        _id
        title
        subtitle
        number
        sequenceId
        contents {
          ...RevisionDisplay
        }
        posts {
          _id
          title
          userId
          user {
            _id
            displayName
          }
          contents {
            ...RevisionDisplay
          }
        }
      }
    }
  }
`);

const styles = defineStyles("SequencesPageV2", (theme: ThemeType) => ({
  root: {
    position: "relative",
    paddingTop: `calc(var(--header-height) + 380px)`,
    backgroundColor: "#fff",
    marginTop: -theme.spacing.mainLayoutPaddingTop,
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.isFriendlyUI ? 0 : -10,
    },
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: 380,
    overflow: "hidden",
  },
  bannerImage: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100vw",
    "& img": {
      width: "100vw",
    },
  },
  bannerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "90%",
    background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,.85) 80%, #fff 100%)",
    pointerEvents: "none",
  },
  header: {
    maxWidth: 820,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 16,
  },
  title: {
    ...theme.typography.display4,
    ...theme.typography.headerStyle,
    fontVariant: "small-caps",
    marginTop: -150,
    marginBottom: 12,
    zIndex: 1,
    position: "relative",
  },
  author: {
    fontSize: 24,
    ...theme.typography.postStyle,
    marginTop: 24,
    marginBottom: 8,
    zIndex: 1,
    position: "relative",
  },
  publishDate: {
    fontSize: 16,
    ...theme.typography.postStyle,
    marginBottom: 64,
    zIndex: 1,
    position: "relative",
  },
  description: {
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: 18,
    textAlign: "left",
  },
  readingRoot: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 80,
  },
  readingWidth: {
    maxWidth: 820,
    marginLeft: "auto",
    marginRight: "auto",
  },
  postContent: {
    marginTop: 24,
  },
}));

const SequencesPageV2 = ({ documentId }: {
  documentId: string,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { loading, data } = useQuery<any, any>(SequenceV2Query, {
    variables: {
      sequenceId: documentId,
      selector: { SequenceChapters: { sequenceId: documentId } },
      limit: 100,
      enableTotal: false,
    },
  });

  const sequence: SequenceV2Sequence|null = data?.sequence?.result ?? null;
  const chapters: SequenceV2Chapter[]|null = data?.chapters?.results ?? null;

  const canEdit = sequence ? (userCanDo(currentUser, 'sequences.edit.all') || (userCanDo(currentUser, 'sequences.edit.own') && userOwns(currentUser, sequence))) : false;

  if (loading) return <Loading />
  if (!sequence || !chapters) return <Error404/>

  if (!canEdit && sequence.draft)
    throw new Error('This sequence is a draft and is not publicly visible')

  const bannerId = sequence.bannerImageId || defaultSequenceBannerIdSetting.get();
  const socialImageId = sequence.gridImageId || sequence.bannerImageId;
  const socialImageUrl = socialImageId ? makeCloudinaryImageUrl(socialImageId, {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces",
  }) : undefined;

  const tocSections = useMemo(() => {
    const sections: Array<{ anchor: string, level: number, title: string }> = [];
    chapters.forEach((chapter, chapterIndex) => {
      const chapterAnchor = `chapter-${chapter._id}`;
      const hasChapterTitle = !!chapter.title;
      if (hasChapterTitle) {
        sections.push({ anchor: chapterAnchor, level: 1, title: chapter.title! });
      }
      chapter.posts.forEach((post) => {
        const postAnchor = `post-${post._id}`;
        sections.push({ anchor: postAnchor, level: hasChapterTitle ? 2 : 1, title: post.title });
      });
    });
    return sections;
  }, [chapters]);

  const fixedTocSections = useMemo(() => tocSections.map((s) => ({ title: s.title, anchor: s.anchor, level: s.level })), [tocSections]);
  const firstPostAnchor = chapters.length && chapters[0].posts.length ? `post-${chapters[0].posts[0]._id}` : "postContent";

  const descriptionHtml = sequence.contents?.html ?? "";
  const sequenceAuthorKarma = sequence.user?.karma ?? 0;

  const main = <div className={classes.root}>
    <StatusCodeSetter status={200}/>
    {bannerId && <div className={classes.banner}>
      <DeferRender ssr={false}>
        <div className={classes.bannerImage}>
          <CloudinaryImage
            publicId={bannerId}
            width="auto"
            height="380"
          />
        </div>
      </DeferRender>
      <div className={classes.bannerFade}/>
    </div>}
    <div className={classes.header}>
      <Typography variant='display2' className={classes.title}>
        {sequence.draft && <span>[Draft] </span>}{sequence.title}
      </Typography>
      <div className={classes.author}>
        {sequence.user?.displayName ? `By ${sequence.user.displayName}` : ""}
      </div>
      <div className={classes.publishDate}>
        {sequence.createdAt && <>Published on <FormatDate date={sequence.createdAt} format="MMM DD, YYYY" tooltip={false}/></>}
      </div>
      {descriptionHtml && <ContentStyles contentType="post" className={classes.description}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: descriptionHtml}}
          description={`sequence ${sequence._id}`}
          nofollow={sequenceAuthorKarma < nofollowKarmaThreshold.get()}
        />
      </ContentStyles>}
    </div>

    <div className={classes.readingRoot}>
      <div className={classes.readingWidth}>
        <SequenceV2CenterToC sections={tocSections} sequenceTitle={sequence.title} />
        <Divider  margin={96} wings={false}/>
        <div id="postContent" className={classes.postContent}>
          <div id="postBody">
            {chapters.map((chapter) => {
              const chapterAnchor = `chapter-${chapter._id}`;
              const chapterDescriptionHtml = chapter.contents?.html ?? null;
              const shouldShowChapterSection = !!(chapter.title || chapter.subtitle || chapterDescriptionHtml);
              return <div key={chapter._id}>
                {chapter.title !== sequence.title && <SequenceV2ChapterSection
                  anchor={chapterAnchor}
                  title={chapter.title}
                  subtitle={chapter.subtitle}
                  descriptionHtml={chapterDescriptionHtml}
                />}
                {chapter.posts.map((post) => {
                  const postAnchor = `post-${post._id}`;
                  const html = post.contents?.html ?? "";
                  const showAuthor = post.userId !== sequence.userId;
                  return <SequenceV2PostSection
                    key={post._id}
                    anchor={postAnchor}
                    title={post.title}
                    html={html}
                    showAuthor={showAuthor}
                    authorName={post.user?.displayName}
                  />
                })}
                {!shouldShowChapterSection && <div/>}
              </div>
            })}
          </div>
        </div>
      </div>
    </div>
  </div>

  return <AnalyticsContext pageContext="sequencesPageV2" sequenceId={sequence._id}>
    <div>
      <SequenceV2FixedToC tocSections={fixedTocSections} title={sequence.title} showAfterAnchor={firstPostAnchor} />
      {main}
    </div>
  </AnalyticsContext>
}

export default SequencesPageV2;
