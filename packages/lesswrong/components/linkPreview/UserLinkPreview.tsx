import React from 'react';
import classNames from 'classnames';
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { Link } from '@/lib/reactRouterWrapper';
import { slugify } from '@/lib/utils/slugify';
import type { LinkPreviewComponent, RoutePreviewParams } from '@/lib/routeChecks/hoverPreviewRoutes';
import { linkStyles } from './linkStyles';
import { useStyles } from '../hooks/useStyles';
import UserTooltip from '../users/UserTooltip';

const UserLinkPreviewQuery = gql(`
  query UserLinkPreview($slug: String!) {
    users(selector: { usersProfile: { slug: $slug } }, limit: 1, enableTotal: false) {
      results {
        ...UsersMinimumInfo
      }
    }
  }
`);

type UserProfileRoute = '/users/[slug]' | '/user/[slug]' | '/u/[slug]';

export const UserLinkPreview: LinkPreviewComponent<UserProfileRoute> = ({href, params, id, className, children}: {
  href: string,
  params: RoutePreviewParams<UserProfileRoute>,
  id: string,
  className?: string,
  children: React.ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  // Normalize the slug the same way the profile page does (see UsersSingle),
  // so that links which work when clicked (eg with different capitalization)
  // also get a preview. The usersProfile view also matches against oldSlugs,
  // so links to users who have since changed their username still resolve.
  const { data } = useQuery(UserLinkPreviewQuery, {
    variables: { slug: slugify(params.slug) },
    fetchPolicy: 'cache-first',
    ssr: false,
  });
  const user = data?.users?.results?.[0];
  const link = <Link className={classNames(classes.link, className)} to={href} id={id}>{children}</Link>;

  // Match UsersNameDisplay, which doesn't show a tooltip for deleted users
  if (!user || user.deleted) {
    return link;
  }

  return (
    <UserTooltip user={user} placement="bottom-start" inlineBlock={false}>
      {link}
    </UserTooltip>
  );
};
