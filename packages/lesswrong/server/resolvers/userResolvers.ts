import { markdownToHtml, dataToMarkdown } from '../editor/conversionUtils';
import Users from '../../lib/collections/users/collection';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema, createMutator, slugify, updateMutator, Utils } from '../vulcan-lib';
import pick from 'lodash/pick';
import SimpleSchema from 'simpl-schema';
import {getUserEmail} from "../../lib/collections/users/helpers";
import {userFindOneByEmail} from "../../lib/collections/users/commonQueries";
import {forumTypeSetting} from '../../lib/instanceSettings';
import { Subscriptions } from '../../lib/collections/subscriptions';
import { randomId } from '../../lib/random';
import ReadStatuses from '../../lib/collections/readStatus/collection';
import moment from 'moment';
import Posts from '../../lib/collections/posts/collection';
import countBy from 'lodash/countBy';
import entries from 'lodash/fp/entries';
import sortBy from 'lodash/sortBy';
import last from 'lodash/fp/last';
import Tags from '../../lib/collections/tags/collection';

augmentFieldsDict(Users, {
  htmlMapMarkerText: {
    ...denormalizedField({
      needsUpdate: (data: Partial<DbUser>) => ('mapMarkerText' in data),
      getValue: async (user: DbUser) => {
        if (!user.mapMarkerText) return "";
        return await markdownToHtml(user.mapMarkerText);
      }
    })
  },
  bio: {
    resolveAs: {
      type: "String",
      resolver: (user: DbUser, args: void, { Users }: ResolverContext) => {
        const bio = user.biography?.originalContents;
        if (!bio) return "";
        return dataToMarkdown(bio.data, bio.type);
      }
    }
  },
  htmlBio: {
    resolveAs: {
      type: "String",
      resolver: (user: DbUser, args: void, { Users }: ResolverContext) => {
        const bio = user.biography;
        return bio?.html || "";
      }
    }
  },
});

addGraphQLSchema(`
  type NewUserCompletedProfile {
    username: String,
    slug: String,
    displayName: String,
    subscribedToDigest: Boolean,
    usernameUnset: Boolean
  }
`)

type NewUserUpdates = {
  username: string
  email?: string
  subscribeToDigest: boolean
  acceptedTos: boolean
}

addGraphQLSchema(`
  type MostReadAuthor {
    slug: String,
    displayName: String,
    count: Int
  }
  type MostReadTopic {
    slug: String,
    name: String,
    count: Int
  }
  type MostReadByYear {
    mostReadAuthors: [MostReadAuthor],
    mostReadTopics: [MostReadTopic]
  }
`)

addGraphQLResolvers({
  Mutation: {
    async NewUserCompleteProfile(root: void, { username, email, subscribeToDigest, acceptedTos }: NewUserUpdates, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Cannot change username without being logged in')
      }
      // Check they accepted the terms of use
      if (forumTypeSetting.get() === "EAForum" && !acceptedTos) {
        throw new Error("You must accept the terms of use to continue");
      }
      // Only for new users. Existing users should need to contact support to
      // change their usernames
      if (!currentUser.usernameUnset) {
        throw new Error('Only new users can set their username this way')
      }
      // Check for uniqueness
      const existingUser = await Users.findOne({username})
      if (existingUser && existingUser._id !== currentUser._id) {
        throw new Error('Username already exists')
      }
      // Check for someone setting an email when they already have one
      if (email && getUserEmail(currentUser)) {
        throw new Error('You already have an email address')
      }
      // Check for email uniqueness
      if (email && await userFindOneByEmail(email)) {
        throw new Error('Email already taken')
      }
      // Check for valid email
      if (email && !SimpleSchema.RegEx.Email.test(email)) {
        throw new Error('Invalid email')
      }
      const updatedUser = (await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          usernameUnset: false,
          username,
          displayName: username,
          slug: await Utils.getUnusedSlugByCollectionName("Users", slugify(username)),
          ...(email ? {email} : {}),
          subscribedToDigest: subscribeToDigest,
          acceptedTos,
        },
        // We've already done necessary gating
        validate: false
      })).data
      // Don't want to return the whole object without more permission checking
      return pick(updatedUser, 'username', 'slug', 'displayName', 'subscribedToCurated', 'usernameUnset')
    },
    async UserAcceptTos(_root: void, _args: {}, {currentUser}: ResolverContext) {
      if (!currentUser) {
        throw new Error('Cannot accept terms of use while not logged in');
      }
      const updatedUser = (await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          acceptedTos: true,
        },
        validate: false,
      })).data;
      return updatedUser.acceptedTos;
    },
    async UserUpdateSubforumMembership(root: void, { tagId, member }: {tagId: string, member: boolean}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Cannot join subforum without being logged in')
      }

      if ((member && currentUser.profileTagIds?.includes(tagId)) || (!member && !currentUser.profileTagIds?.includes(tagId))) {
        throw new Error(member ? 'User is aleady a member of this subforum' : 'User is not a member of this subforum so cannot leave')
      }

      const newProfileTagIds = member ? [...(currentUser.profileTagIds || []), tagId] : currentUser.profileTagIds?.filter(id => id !== tagId) || []
      const updatedUser = await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          profileTagIds: newProfileTagIds
        },
        validate: false
      })
      
      return updatedUser
    },
  },
  Query: {
    async UserMostReadByYear(root: void, {year}: {year: number}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Must be logged in to view read history')
      }

      // Get all the user's posts read for the given year
      const start = moment().year(year).dayOfYear(1)
      const end = moment().year(year+1).dayOfYear(1)
      console.log('start', start)
      console.log('end', end)
      const readStatuses = await ReadStatuses.find({
        userId: currentUser._id,
        isRead: true,
        lastUpdated: {$gte: start, $lt: end},
        postId: {$exists: true, $ne: null}
      }).fetch()
      console.log('readStatuses', readStatuses)
      
      // Filter out the posts that the user themselves authored
      // TODO: account for coauthorship
      const posts = (await Posts.find({
        _id: {$in: readStatuses.map(rs => rs.postId)}
      }, {projection: {userId: 1, tagRelevance: 1}}).fetch()).filter(p => p.userId !== currentUser._id)
      console.log(posts)
      
      // Get the top 3 authors that the user has read
      const userIds = posts.map(p => p.userId)
      const authorCounts = countBy(userIds)
      const topAuthors = sortBy(entries(authorCounts), last).slice(-3).map(a => a[0])
      console.log('authorCounts', authorCounts)
      
      const authors = await Users.find({
        _id: {$in: topAuthors}
      }, {projection: {displayName: 1, slug: 1}}).fetch()
      console.log(authors)
      
      // Get the top 3 topics that the user has read
      const tagIds = posts.map(p => Object.keys(p.tagRelevance) ?? []).flat()
      const tagCounts = countBy(tagIds)
      const topTags = sortBy(entries(tagCounts), last).slice(-3).map(t => t[0])
      
      const topics = await Tags.find({
        _id: {$in: topTags}
      }, {projection: {name: 1, slug: 1}}).fetch()
      console.log(topics)
      
      return {
        mostReadAuthors: topAuthors.reverse().map(id => {
          const author = authors.find(a => a._id === id)
          return author ? {
            displayName: author.displayName,
            slug: author.slug,
            count: authorCounts[author._id]
          } : null
        }),
        mostReadTopics: topTags.reverse().map(id => {
          const topic = topics.find(t => t._id === id)
          return topic ? {
            name: topic.name,
            slug: topic.slug,
            count: tagCounts[topic._id]
          } : null
        })
      }
    },
  },
})

addGraphQLMutation(
  'NewUserCompleteProfile(username: String!, subscribeToDigest: Boolean!, email: String, acceptedTos: Boolean): NewUserCompletedProfile'
)
addGraphQLMutation(
  'UserAcceptTos: Boolean'
)
addGraphQLMutation(
  'UserUpdateSubforumMembership(tagId: String!, member: Boolean!): User'
)
addGraphQLQuery('UserMostReadByYear(year: Int!): MostReadByYear')
