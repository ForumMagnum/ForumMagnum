import { DocumentServiceClient, UserEventServiceClient, v1beta, protos } from "@google-cloud/discoveryengine";
import { googleRecommendationsCredsPath } from "../../lib/instanceSettings";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { loadByIds } from "../../lib/loaders";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { getInstanceSettingsFilePath } from "../commandLine";
import { vertexDocumentServiceParentPathSetting, vertexRecommendationServingConfigPathSetting, vertexUserEventServiceParentPathSetting } from "../databaseSettings";
import { getConfirmedCoauthorIds, postGetPageUrl } from "../../lib/collections/posts/helpers";
import path from "path";
import chunk from "lodash/chunk";
import type { ClientSettingDependencies, ClientSettings, CreateGoogleMediaDocumentMetadataArgs, GoogleMediaDocumentMetadata, PostEvent, FrontpageViewEvent, ReadStatusWithPostId, SupportedPostEventTypes } from "./types";
import { getParentTraceId, openPerfMetric, wrapWithPerfMetric } from "../perfMetrics";

const { RecommendationServiceClient } = v1beta;

export function initGoogleVertex() {
  // This is a weird hack which is necessary because this was the least crazy way to authenticate with Google Cloud from the outside.
  // The tl;dr is that Google's client libraries will read process.env.GOOGLE_APPLICATION_CREDENTIALS and expect to find a filepath to the credentials file.
  // The easiest way I thought of to solve the problem of differing relative paths between local env and production
  // was to put the path of the creds file _relative to the instance settings file_ into an instance setting, and then join it with the path to the instance settings file.
  // See https://cloud.google.com/docs/authentication/provide-credentials-adc#wlif-key for details
  const credsPath = googleRecommendationsCredsPath.get();
  const settingsFileName = getInstanceSettingsFilePath();
  if (credsPath && settingsFileName) {
    const settingsFileDirectory = path.dirname(settingsFileName);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(settingsFileDirectory, credsPath);
  }
}

const getGoogleClientInstanceOrThrow = <T extends new () => InstanceType<T>, Deps extends ClientSettingDependencies>(
  constructor: T,
  /**
   * If the client depends on any settings at runtime, pass them in here to cause the getter to throw if any of the settings are missing.
   * The settings need to be provided via an object with the field names being formatted like `fooSetting` (ending in `Setting`), and returning a `T | null` value for arbitrary `T`.
   */
  runtimeSettingDependencies?: Deps
): () => { client: InstanceType<T>, settingValues: ClientSettings<Deps> } => ((ClientConstructor: T) => {
  let client: InstanceType<T>;
  return () => {
    let settingValues = {} as ClientSettings<Deps>;
    const settingDependencyTuples = Object.entries(runtimeSettingDependencies ?? {});
    if (settingDependencyTuples.length) {
      const settingValueTuples = settingDependencyTuples.map(([settingName, setting]) => [settingName.slice(0, -7), setting.get()]);
      const missingSettingTuples = settingValueTuples.filter(([_, settingValue]) => settingValue === null);
      if (missingSettingTuples.length) {
        const missingSettingNames = missingSettingTuples.map(([settingName]) => settingName).join(', ');
        throw new Error(`Missing setting(s) ${missingSettingNames} for ${constructor.name}!`);
      }

      settingValues = Object.fromEntries(settingValueTuples) as ClientSettings<Deps>;
    }

    if (!client) {
      client = new ClientConstructor();
    }

    return { client, settingValues };
  };
})(constructor);

const clients = {
  documents: getGoogleClientInstanceOrThrow(DocumentServiceClient, { vertexDocumentServiceParentPathSetting }),
  userEvents: getGoogleClientInstanceOrThrow(UserEventServiceClient, { vertexUserEventServiceParentPathSetting }),
  recommendations: getGoogleClientInstanceOrThrow(RecommendationServiceClient, { vertexRecommendationServingConfigPathSetting }),
};

const helpers = {
  /**
   * If we're going to be performing an update (which all of our individual document upserts are), then we need the parent path to construct the fully-qualified "name"
   * 
   * Implied by https://cloud.google.com/generative-ai-app-builder/docs/reference/rest/v1/projects.locations.dataStores.branches.documents/patch
   * 
   * More concretely confirmed by the (hidden!) docstring in DocumentServiceClient.updateDocument
   */
  createMediaDocument({ post, tags, authorIds }: Required<CreateGoogleMediaDocumentMetadataArgs>, parentPath?: string): protos.google.cloud.discoveryengine.v1.IDocument {
    const tagIds = tags.map(tag => tag._id);
    if (tagIds.length === 0) {
      tagIds.push('none')
    }

    const persons = authorIds.map(authorId => ({ name: authorId, role: 'author' } as const));
  
    const metadata: GoogleMediaDocumentMetadata = {
      title: post.title,
      uri: `https://www.lesswrong.com${postGetPageUrl(post)}`,
      available_time: post.postedAt.toISOString(),
      categories: tagIds,
      filter_tags: tagIds,
      persons,
      media_type: 'articles',
    };

    const nameForUpsert = parentPath ? { name: `${parentPath}/documents/${post._id}` } : {};
  
    return {
      ...nameForUpsert,
      id: post._id,
      schemaId: 'default_schema',
      jsonData: JSON.stringify(metadata),
    };
  },

  createBasePostEvent(eventType: SupportedPostEventTypes, eventInfo: PostEvent) {
    const { userId, postId, timestamp, attributionId } = eventInfo;
    return {
      eventType,
      // TODO - this should maybe be clientId for logged out users if doing real stuff with it, but no logged out users for now
      userPseudoId: userId, 
      eventTime: {
        seconds: timestamp.getTime() / 1000,
        nanos: 0
      },
      userInfo: { userId },
      documents: [{ id: postId }],
      attributionToken: attributionId
    };
  },

  createViewItemEventFromReadStatus(eventType: 'view-item' | 'media-play', readStatus: ReadStatusWithPostId): protos.google.cloud.discoveryengine.v1.IUserEvent {
    const { userId, postId, lastUpdated: timestamp } = readStatus;
    return helpers.createViewItemEvent(eventType, { userId, postId, timestamp });
  },

  createViewItemEvent(eventType: 'view-item' | 'media-play', eventInfo: PostEvent): protos.google.cloud.discoveryengine.v1.IUserEvent {
    return helpers.createBasePostEvent(eventType, eventInfo);
  },

  createMediaCompleteEvent(eventInfo: PostEvent): protos.google.cloud.discoveryengine.v1.IUserEvent {
    const baseEvent = helpers.createBasePostEvent('media-complete', eventInfo);
    return {
      ...baseEvent,
      mediaInfo: {
        mediaProgressPercentage: 1
      },
    };
  },

  createViewHomePageEvent(frontpageViewEvent: FrontpageViewEvent) {
    const { userId, timestamp } = frontpageViewEvent;

    return {
      eventType: 'view-home-page',
      // TODO - this should maybe be clientId for logged out users if doing real stuff with it, but no logged out users for now
      userPseudoId: userId,
      eventTime: {
        seconds: timestamp.getTime() / 1000,
        nanos: 0
      },
      userInfo: { userId }
    };
  },

  openVertexRecommendationPerfMetric(servingConfigPath: string) {
    const servingConfigName = servingConfigPath.split('/').slice(-1)[0] ?? 'unknown';
    return openPerfMetric({
      op_type: 'vertex',
      op_name: servingConfigName,
      ...getParentTraceId()
    });
  },
};

const googleVertexApi = {
  async getRecommendations(limit: number, context: ResolverContext) {
    const { client, settingValues: { vertexRecommendationServingConfigPath } } = clients.recommendations();
    const [recommendationsResponse] = await wrapWithPerfMetric(
      () => client.recommend({
        validateOnly: false,
        servingConfig: vertexRecommendationServingConfigPath,
        pageSize: limit,
        userEvent: { eventType: 'view-home-page', userPseudoId: context.currentUser?._id },
      }),
      () => helpers.openVertexRecommendationPerfMetric(vertexRecommendationServingConfigPath)
    );
    if (!recommendationsResponse.results) {
      // TODO: error?
      // eslint-disable-next-line no-console
      console.log(`Didn't get back a response with any results from google!`);
      return [];
    }

    const postIds = filterNonnull(recommendationsResponse.results.map(result => result.document?.id ?? result.id));
    const posts = filterNonnull(await loadByIds(context, 'Posts', postIds));
    const filteredPosts = await accessFilterMultiple(context.currentUser, 'Posts', posts, context);

    const attributionId = recommendationsResponse.attributionToken;
    const postsWithAttribution = filteredPosts.map(post => ({ post, attributionId }));

    return postsWithAttribution;
  },

  async importPosts(postsWithMetadata: Required<CreateGoogleMediaDocumentMetadataArgs>[]) {
    const { client, settingValues: { vertexDocumentServiceParentPath } } = clients.documents();

    const googleMediaDocuments = postsWithMetadata.map((postWithMetadata) => helpers.createMediaDocument(postWithMetadata));

    // Max batch size of 100 for media documents
    const chunkedDocuments = chunk(googleMediaDocuments, 100);
    for (const chunk of chunkedDocuments) {
      const [importDocumentsOperation] = await client.importDocuments({
        inlineSource: { documents: chunk },
        parent: vertexDocumentServiceParentPath
      });

      const [importDocumentsResponse] = await importDocumentsOperation.promise();
      if (importDocumentsResponse.errorSamples?.length) {
        // eslint-disable-next-line no-console
        console.log('Error importing documents', { error: importDocumentsResponse.errorSamples[0] });
      }
    }
  },

  async importUserEvents(userEvents: protos.google.cloud.discoveryengine.v1.IUserEvent[]) {
    const { client, settingValues: { vertexUserEventServiceParentPath } } = clients.userEvents();

    // Max batch size of 100k for user events
    const chunkedUserEvents = chunk(userEvents, 90000);
    for (const chunk of chunkedUserEvents) {
      const [importUserEventsOperation] = await client.importUserEvents({ inlineSource: { userEvents: chunk }, parent: vertexUserEventServiceParentPath });
      const [importUserEventsResponse] = await importUserEventsOperation.promise();
      if (importUserEventsResponse.errorSamples?.length) {
        // eslint-disable-next-line no-console
        console.log('Error importing user events', { error: importUserEventsResponse.errorSamples[0] });
      }
    }
  },

  async upsertPost(postWithMetadata: CreateGoogleMediaDocumentMetadataArgs, context: ResolverContext) {
    const { client, settingValues: { vertexDocumentServiceParentPath } } = clients.documents();
    let { post, tags, authorIds } = postWithMetadata;

    if (!tags) {
      const tagIds = Object.entries(post.tagRelevance ?? {}).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]) => tagId);
      tags = filterNonnull(await loadByIds(context, 'Tags', tagIds));  
    }

    authorIds ??= [post.userId, ...getConfirmedCoauthorIds(post)];

    const postWithHydratedMetadata = { post, tags, authorIds };
    const googleMediaDocument = helpers.createMediaDocument(postWithHydratedMetadata, vertexDocumentServiceParentPath);

    await client.updateDocument({ document: googleMediaDocument, allowMissing: true },);
  },

  async writeUserEvent(userEvent: protos.google.cloud.discoveryengine.v1.IUserEvent) {
    const { client, settingValues: { vertexUserEventServiceParentPath } } = clients.userEvents();

    await client.writeUserEvent({ userEvent, parent: vertexUserEventServiceParentPath });
  }
};

export { clients, helpers, googleVertexApi };
