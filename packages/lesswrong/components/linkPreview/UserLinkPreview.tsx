import React from 'react';
import classNames from 'classnames';
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { Link } from '@/lib/reactRouterWrapper';
import type { LinkPreviewComponent, RoutePreviewParams } from '@/lib/routeChecks/hoverPreviewRoutes';
import { linkStyles } from './linkStyles';
import { useStyles } from '../hooks/useStyles';
import UserTooltip from '../users/UserTooltip';

const UserLinkPreviewQuery = gql(`
  query UserLinkPreview($slug: String) {
    users(selector: { usersProfile: { slug: $slug } }, limit: 1) {
      results {
        ...UsersMinimumInfo
      }
    }
  }
`);

export const UserLinkPreview: LinkPreviewComponent<'/users/[slug]' | '/user/[slug]' | '/u/[slug]'> = ({href, params, id, className, children}: {
  href: string,
  params: RoutePreviewParams<'/users/[slug]' | '/user/[slug]' | '/u/[slug]'>,
  id: string,
  className?: string,
  children: React.ReactNode,
}) => {
  const classes = useStyles(linkStyles);
  const { data } = useQuery(UserLinkPreviewQuery, {
    variables: { slug: params.slug },
    fetchPolicy: 'cache-first',
    ssr: false,
  });
  const user = data?.users?.results?.[0];
  const link = <Link className={classNames(classes.link, className)} to={href} id={id}>{children}</Link>;

  if (!user) {
    return link;
  }

  return (
    <UserTooltip user={user} placement="bottom-start" inlineBlock={false}>
      {link}
    </UserTooltip>
  );
};
