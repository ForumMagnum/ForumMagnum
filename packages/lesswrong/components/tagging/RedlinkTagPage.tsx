import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { tagUrlBaseSetting } from '@/lib/instanceSettings';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { type ErrorLike } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import { Link } from "../../lib/reactRouterWrapper";
import { useNavigate } from "../../lib/routeUtil";
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import ContentStyles from "../common/ContentStyles";
import Error404 from "../common/Error404";
import { gql } from "@/lib/generated/gql-codegen";
import { StatusCodeSetter } from '../next/StatusCodeSetter';

const MultiDocumentMinimumInfoMultiQuery = gql(`
  query multiMultiDocumentRedlinkTagPageQuery($selector: MultiDocumentSelector, $limit: Int, $enableTotal: Boolean) {
    multiDocuments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...MultiDocumentMinimumInfo
      }
      totalCount
    }
  }
`);

const TagBasicInfoMultiQuery = gql(`
  query multiTagRedlinkTagPageQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagBasicInfo
      }
      totalCount
    }
  }
`);

const styles = defineStyles("RedlinkTagPage", theme => ({
  title: {
    marginBottom: 16,
  },
  pingbacksList: {
    marginBottom: "32px",
  },
  createButton: {
    padding: 8,
  },
}));

interface RedLinkPingback {
  _id: string
  slug: string
  name: string
}

function getDisplayedLensName(lens: MultiDocumentMinimumInfo) {
  if (lens.title) {
    return lens.title;
  }

  const subtitleString = lens.tabSubtitle ? `: ${lens.tabSubtitle}` : '';
  return `${lens.tabTitle}${subtitleString}`;
}

export const useRedLinkPingbacks = (documentId: string|undefined, excludedDocumentIds?: string[]): {
  results: RedLinkPingback[]
  totalCount: number
  loading: boolean
  error: ErrorLike|undefined
} => {
  const tagPingbacks = useQuery(TagBasicInfoMultiQuery, {
    variables: {
      selector: { pingbackWikiPages: { tagId: documentId, excludedTagIds: excludedDocumentIds } },
      limit: 10,
      enableTotal: true,
    },
    skip: !documentId,
    notifyOnNetworkStatusChange: true,
  });

  const lensPingbacks = useQuery(MultiDocumentMinimumInfoMultiQuery, {
    variables: {
      selector: { pingbackLensPages: { documentId: documentId, excludedDocumentIds: excludedDocumentIds } },
      limit: 10,
      enableTotal: true,
    },
    skip: !documentId,
    notifyOnNetworkStatusChange: true,
  });

  const results: RedLinkPingback[] = [
    ...(tagPingbacks.data?.tags?.results ?? []).map(t => ({
      _id: t._id,
      slug: t.slug,
      name: t.name,
    })),
    ...(lensPingbacks.data?.multiDocuments?.results ?? []).map(l => ({
      _id: l._id,
      slug: l.slug,
      name: getDisplayedLensName(l)
    })),
  ]

  return { 
    results,
    totalCount: (tagPingbacks.data?.tags?.totalCount ?? 0) + (lensPingbacks.data?.multiDocuments?.totalCount ?? 0),
    loading: tagPingbacks.loading || lensPingbacks.loading,
    error: tagPingbacks.error ?? lensPingbacks.error
  }
}

function capitalizeFirstLetter(s: string): string {
  return s.substring(0,1).toUpperCase() + s.substring(1);
}

export const inferRedLinkTitle = (tag: TagBasicInfo|null, slug: string|null): string|null => {
  const derivedTitle = slug && slug.split(/[_-]/).map(capitalizeFirstLetter).join(' ');
  
  return tag?.name ?? derivedTitle ?? null;
}

const RedlinkTagPage = ({tag, slug}: {
  tag: TagPageFragment|TagPageWithRevisionFragment|null
  slug?: string
}) => {
  const classes = useStyles(styles);
  const { results: pingbacks, loading: pingbacksLoading, error: pingbacksError } = useRedLinkPingbacks(tag?._id);
  const navigate = useNavigate();
  const title = capitalizeFirstLetter(inferRedLinkTitle(tag, slug??null) ?? "Unnamed");

  const createPageUrl = `/${tagUrlBaseSetting.get()}/create?name=${encodeURIComponent(title)}&type=wiki`
  function createPage() {
    navigate(createPageUrl);
  }


  const tagSlug = tag?.slug ?? slug;
  // If the tag doesn't have a slug, and the slug is not provided, show a 404
  if (!tagSlug) {
    return <Error404 />
  }

  return <SingleColumnSection>
    <StatusCodeSetter status={404}/>
    <Typography variant="display3">
      <Link className={classes.title} to={tagGetUrl({slug: tagSlug})}>{title}</Link>
    </Typography>

    <ContentStyles contentType="tag">
      <p>This wiki page has not been created yet.</p>
      
      {pingbacks && <>
        <p>These wiki pages link to this page:</p>
        
        <ul className={classes.pingbacksList}>
          {pingbacks?.map(t => <li key={t._id}>
            <Link to={tagGetUrl({slug: t.slug})}>{t.name}</Link>
          </li>)}
        </ul>
      </>}
      {!pingbacks?.length && !pingbacksLoading && !pingbacksError && <p>
        There are no wiki pages linking to this page.
      </p>}
    </ContentStyles>
    
    <Link to={createPageUrl}>
      <Button className={classes.createButton} variant="contained" color="primary">
        Create Page
      </Button>
    </Link>
  </SingleColumnSection>
}

export default registerComponent('RedlinkTagPage', RedlinkTagPage);



