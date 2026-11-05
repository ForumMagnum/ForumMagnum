import { PostsViews } from '@/lib/collections/posts/views';
import { TagsViews } from '@/lib/collections/tags/views';
import { UsersViews } from '@/lib/collections/users/views';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { createAdminContext, createAnonymousContext } from '@/server/vulcan-lib/createContexts';

const userTerms: UsersViewTerms = { view: 'usersByUserIds', userIds: ['attacker', 'victim'] };

const getUserSort = async (orderBy: unknown) => {
  const { options } = await viewTermsToQuery(UsersViews, { ...userTerms, orderBy }, undefined, createAnonymousContext());
  return options.sort;
};

describe('terms.orderBy', () => {
  it('sorts by a column the user can read', async () => {
    expect(await getUserSort({ karma: -1 })).toEqual({ karma: -1, _id: -1 });
  });

  it.each([
    ['readable only per-document', { email: 1 }],
    ['a path into an unreadable JSON column', { 'services.password.bcrypt': 1 }],
    ['not a column', { notAColumn: 1 }],
    ['resolver-only, with no column', { IPs: 1 }],
    ['an inherited object property', { constructor: 1 }],
    ['not an object', 'email'],
  ])('falls back to the default sort when the field is %s', async (_description, orderBy) => {
    const { options: defaultOptions } = await viewTermsToQuery(UsersViews, userTerms, undefined, createAnonymousContext());
    expect(await getUserSort(orderBy)).toEqual(defaultOptions.sort);
  });

  it('drops unreadable columns while keeping the rest of the sort', async () => {
    expect(await getUserSort({ email: 1, karma: -1, notAColumn: 1 })).toEqual({ karma: -1, _id: -1 });
  });

  it('drops a column whose readable value comes from a redacting resolver', async () => {
    const { options } = await viewTermsToQuery(PostsViews, { view: 'new', orderBy: { rsvps: 1 } }, undefined, createAnonymousContext());
    expect(options.sort).not.toHaveProperty('rsvps');
  });

  it('applies group-based read permissions to the current user', async () => {
    const terms: TagsViewTerms = { view: 'allTagsAlphabetical', orderBy: { autoTagPrompt: 1 } };
    const anonymous = await viewTermsToQuery(TagsViews, terms, undefined, createAnonymousContext());
    const admin = await viewTermsToQuery(TagsViews, terms, undefined, createAdminContext());
    expect(anonymous.options.sort).not.toHaveProperty('autoTagPrompt');
    expect(admin.options.sort).toHaveProperty('autoTagPrompt', 1);
  });
});
