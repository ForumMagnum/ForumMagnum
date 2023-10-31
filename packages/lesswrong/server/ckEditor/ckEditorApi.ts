import crypto from 'crypto';
import fs from 'fs';
import difference from 'lodash/difference';
import moment from 'moment';
import _ from 'underscore';
import Posts from '../../lib/collections/posts/collection';
import Revisions from '../../lib/collections/revisions/collection';
import Users from '../../lib/collections/users/collection';
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { buildRevision, getLatestRev, getNextVersion, getPrecedingRev, htmlToChangeMetrics } from '../editor/make_editable_callbacks';
import { createMutator, Globals } from '../vulcan-lib';
import { CkEditorUser, CreateDocumentPayload, DocumentResponse, DocumentResponseSchema, UserSchema } from './ckEditorApiValidators';
import { getCkEditorApiPrefix, getCkEditorApiSecretKey } from './ckEditorServerConfig';
import { getPostEditorConfig } from './postEditorConfig';

// TODO: actually implement these in Zod
interface CkEditorComment {
  id: string,
  document_id: string,
  thread_id: string,
  content: string,
  user: {id: string},
  created_at: string,
  updated_at: string,
  attributes: any,
}

interface CkEditorGetCommentsResponse {
cursor_next: string,
cursor_prev: string,
data: CkEditorComment[],
}

// Time interval such that, when autosaving, we will update an existing
// rev instead of create a new rev if it's within this amount of time ago. In
// milliseconds.
const autosaveMaxInterval = 10*60*1000;

const cloudEditorAutosaveCommitMessage = "Cloud editor autosave";

function combineURIs(prefix: string, path: string): string {
  if (prefix.endsWith("/")) {
    return prefix.substr(0, prefix.length-1) + path;
  } else {
    return prefix + path;
  }
}

function generateSignature(apiKey: string, method: string, uri: string, timestamp: number, body: any) {
  // From: https://ckeditor.com/docs/cs/latest/examples/security/request-signature-nodejs.html
  const url = new URL(uri);
  const path = url.pathname + url.search;

  const hmac = crypto.createHmac('SHA256', apiKey);
  hmac.update(`${method.toUpperCase()}${path}${timestamp}`);

  if (body) {
    hmac.update(Buffer.from(JSON.stringify(body)));
  }

  return hmac.digest('hex');
}

async function fetchCkEditorRestAPI(method: string, uri: string, body?: any): Promise<string> {
  const apiPrefix = getCkEditorApiPrefix()!;
  // See: https://ckeditor.com/docs/cs/latest/guides/security/request-signature.html
  const timestamp = new Date().getTime();
  const fullURI = combineURIs(apiPrefix, uri);
  console.log(`CkEditor REST API: ${method} ${fullURI}`); //eslint-disable-line no-console
  const response = await fetch(fullURI, {
    method,
    body: JSON.stringify(body),
    headers: {
      "X-CS-Signature": generateSignature(getCkEditorApiSecretKey()!, method, fullURI, timestamp, body),
      "X-CS-Timestamp": "" + timestamp,
    },
  });
  if (!response.ok) {

    let explanation;
    try {
      const responseBody = await response.json();
      explanation = responseBody.data?.reasons?.[0]?.explanation;
    } catch (err) { /* empty */ }

    if (explanation)
      throw new Error(`CkEditor REST API call FAILED (${response.status}): ${method} ${fullURI}\n${explanation}`);
    throw new Error(`CkEditor REST API call FAILED (${response.status}): ${method} ${fullURI}`);
  }
  const responseBody = await response.text();
  return responseBody;
}


const documentHelpers = {
  postIdToCkEditorDocumentId(postId: string) {
    return `${postId}-edit`;
  },

  ckEditorDocumentIdToPostId(ckEditorId: string) {
    if (ckEditorId.endsWith("-edit")) {
      return ckEditorId.substr(0, ckEditorId.length-"-edit".length);
    } else {
      return ckEditorId;
    }
  },
  
  async saveDocumentRevision(userId: string, documentId: string, html: string) {
    const fieldName = "contents";
    const user = await Users.findOne(userId);
    const previousRev = await getLatestRev(documentId, fieldName);
    
    const newOriginalContents = {
      data: html,
      type: "ckEditorMarkup",
    }
    
    if (!user) {
      throw Error("no user found for userId in saveDocumentRevision")
    }
    if (!previousRev || !_.isEqual(newOriginalContents, previousRev.originalContents)) {
      const newRevision: Partial<DbRevision> = {
        ...await buildRevision({
          originalContents: newOriginalContents,
          currentUser: user,
        }),
        documentId,
        fieldName,
        collectionName: "Posts",
        version: await getNextVersion(documentId, "patch", fieldName, true),
        draft: true,
        updateType: "patch",
        commitMessage: cloudEditorAutosaveCommitMessage,
        changeMetrics: htmlToChangeMetrics(previousRev?.html || "", html),
      };
      await createMutator({
        collection: Revisions,
        document: newRevision,
        validate: false,
      });
    }
  },

  async saveOrUpdateDocumentRevision(postId: string, html: string) {
    const fieldName = "contents";
    const previousRev = await getLatestRev(postId, fieldName);
    
    // Time relative to which to compute the max autosave interval, in ms since
    // epoch.
    const lastEditedAt = previousRev
      ? moment(previousRev.autosaveTimeoutStart || previousRev.editedAt).toDate().getTime()
      : 0;
    const timeSinceLastEdit = new Date().getTime() - lastEditedAt; //In ms
    
    if (previousRev
      && previousRev.draft
      && timeSinceLastEdit < autosaveMaxInterval
      && previousRev.commitMessage===cloudEditorAutosaveCommitMessage
    ) {
      // Get the revision prior to the one being replaced, for computing change metrics
      const precedingRev = await getPrecedingRev(previousRev);
      
      // eslint-disable-next-line no-console
      console.log("Updating rev "+previousRev._id);
      // Update the existing rev
      await Revisions.rawUpdateOne(
        {_id: previousRev._id},
        {$set: {
          editedAt: new Date(),
          autosaveTimeoutStart: previousRev.autosaveTimeoutStart || previousRev.editedAt,
          originalContents: { data: html, type: "ckEditorMarkup" },
          changeMetrics: htmlToChangeMetrics(precedingRev?.html || "", html),
        }}
      )
    } else {
      const post = await Posts.findOne(postId);
      const userId = post!.userId;
      // Create a new rev
      await documentHelpers.saveDocumentRevision(userId, postId, html);
    }
  }
};

// See https://docs.cke-cs.com/api/v5/docs for documentation on ckEditor's api.
const ckEditorApi = {
  async fetchCkEditorDocumentFromStorage(ckEditorId: string): Promise<DocumentResponse> {
    const rawResult = await fetchCkEditorRestAPI("GET", `/documents/${ckEditorId}`);
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch (err) {
      throw new Error(`Failure to parse response from ckEditor when fetching document from storage. Returned data: ${rawResult}`);
    }
  
    const validatedResult = DocumentResponseSchema.safeParse(parsedResult);
    if (!validatedResult.success) {
      throw new Error(`Failure to validate response from ckEditor when fetching document from storage. Validation error: ${validatedResult.error}.  Parsed data: ${parsedResult}`);
    }
  
    return validatedResult.data;
  },

  async getAllCollaborations() {
    return await fetchCkEditorRestAPI("GET", "/collaborations");
  },

  async getAllDocuments() {
    return await fetchCkEditorRestAPI("GET", "/documents");
  },

  async fetchCkEditorCommentThread(threadId: string): Promise<CkEditorComment[]> {
    // Fetch a comment thread. Used to find out who should be notified of new
    // comments in that thread.
    //
    // The REST API has pagination, which we don't handle. Instead we just set the
    // limit to the maximum (according to the documentation at
    // https://help.cke-cs.com/api/v4/docs#tag/Comments/paths/~1comments/get); if
    // a CkEditor thread somehow has more comments than that, then new commenters
    // won't subscribed after the 1000th comment, which is not a big problem.
    const limit = 1000;
    
    const response = await fetchCkEditorRestAPI("GET", `/comments?thread_id=${threadId}&limit=${limit}`);
    const parsedResponse: CkEditorGetCommentsResponse = JSON.parse(response);
    return parsedResponse.data;
  },

  async fetchCkEditorUser(userId: string): Promise<CkEditorUser | undefined> {
    let parsedUser;
    try {
      const rawUser = await fetchCkEditorRestAPI("GET", `/users/${userId}`);
      parsedUser = JSON.parse(rawUser);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`Failed to fetch or parse ckEditor user with id ${userId}. Error: ${err}`)
      return undefined;
    }

    const validatedUser = UserSchema.safeParse(parsedUser);
    if (!validatedUser.success) {
      // eslint-disable-next-line no-console
      console.log(`Failed to validate ckEditor user response with error ${validatedUser.error.toString()}.  Parsed data: ${parsedUser}`);
      return undefined;
    }

    return validatedUser.data;
  },

  async flushCkEditorCollaboration(ckEditorId: string) {
    return await fetchCkEditorRestAPI("DELETE", `/collaborations/${ckEditorId}?force=true&wait=true`);
  },

  /**
   * This deletes only the document *contents* from storage, not any associated collaborative session, comments, suggestions, users, etc.
   */
  async deleteCkEditorCloudStorageDocument(ckEditorId: string) {
    return await fetchCkEditorRestAPI("DELETE", `/storage/${ckEditorId}`);
  },
  
  /**
   * This deletes the *entire* document, including any associated collaborative session, comments, suggestions, users, etc.
   */
  async deleteCkEditorCloudDocument(ckEditorId: string) {
    return await fetchCkEditorRestAPI("DELETE", `/documents/${ckEditorId}?force=true&wait=true`);
  },

  async createCkEditorUser(user: { id: string; name: string; }): Promise<string> {
    return await fetchCkEditorRestAPI("POST", `/users`, user);
  },

  async createCollaborativeSession(ckEditorId: string, html: string) {
    return await fetchCkEditorRestAPI("POST", "/collaborations", {
      document_id: ckEditorId,
      bundle_version: ckEditorBundleVersion,
      data: html,
      use_initial_data: false,
    });
  },

  async createCkEditorDocument(payload: CreateDocumentPayload) {
    return await fetchCkEditorRestAPI("POST", "/documents", payload);
  },

  async uploadEditorBundle(bundleVersion: string): Promise<void> {
    if (!bundleVersion)
      throw new Error("Missing argument: bundleVersion");
    
    const editorBundle = fs.readFileSync("public/lesswrong-editor/build/ckeditor-cloud.js", 'utf8');
    const editorBundleHash = crypto.createHash('sha256').update(editorBundle, 'utf8').digest('hex');
    
    // eslint-disable-next-line no-console
    console.log(`Uploading editor with SHA256sum ${editorBundleHash}`);
    
    const result = await fetchCkEditorRestAPI("POST", "/editors", {
      bundle: editorBundle,
      config: {
        ...getPostEditorConfig(),
        cloudServices: {
          bundleVersion,
        },
      },
      testData: "<p>Test</p>",
    });
  },

  async checkEditorBundle(bundleVersion: string): Promise<void> {
    if (!bundleVersion)
      throw new Error("Missing argument: bundleVersion");
    
    const result = await fetchCkEditorRestAPI("GET", `/editors/${bundleVersion}/exists`);
    // eslint-disable-next-line no-console
    console.log(result);
  },

  async flushAllCkEditorCollaborations() {
    await fetchCkEditorRestAPI("DELETE", `/collaborations?force=true`);
  }
}

const ckEditorApiHelpers = {
  async fetchCkEditorCloudStorageDocumentHtml(ckEditorId: string): Promise<string> {
    // First try getting the document from /collaborations, then from /documents.
    // The former corresponds to a running CkEditor process on CkEditor's servers,
    // the latter to data at rest in their cloud saving thing. The former will
    // fail if the document has timed out and is no longer being actively edited;
    // the latter will fail if there's a bundle version mismatch.
    try {
      return await fetchCkEditorRestAPI("GET", `/collaborations/${ckEditorId}`);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Downloading document via /collaborations failed. Trying via /documents.");
      const document = await ckEditorApi.fetchCkEditorDocumentFromStorage(ckEditorId);
      return document.content.data;
    }
  },

  async createMissingUsersForDocument(document: CreateDocumentPayload) {
    const commentUsers = document.comments.map(comment => comment.user.id);
    const suggestionUsers = document.suggestions.map(suggestion => suggestion.author_id);
    const documentUserIds = Array.from(new Set([...commentUsers, ...suggestionUsers]));
  
    const ckEditorUsers = filterNonnull(await Promise.all(documentUserIds.map(userId => ckEditorApi.fetchCkEditorUser(userId))));
  
    const missingUserIds = difference(documentUserIds, ckEditorUsers.map(user => user.id));
    const missingUserNames = await Users.find({ _id: { $in: missingUserIds } }, undefined, { _id: 1, displayName: 1, username: 1, fullName: 1 }).fetch();
    const missingUserPayloads = missingUserNames.map(user => ({
      id: user._id,
      name: userGetDisplayName(user),
    }));
  
    await Promise.all(missingUserPayloads.map(user => ckEditorApi.createCkEditorUser(user)));
  },

  async createRemoteStorageDocument(document: CreateDocumentPayload) {
    await ckEditorApiHelpers.createMissingUsersForDocument(document);
    return await ckEditorApi.createCkEditorDocument(document);
  },

  // Given a state for a document, which may or may not currently have a collaboration
  // open and may or may not be stored yet in CkEditor's cloud, push a revision,
  // overwriting whatever's currently there.
  // (This is used when reverting through the revision-history UI.)
  async pushRevisionToCkEditor(postId: string, html: string) {
    // eslint-disable-next-line no-console
    console.log(`Pushing to CkEditor cloud: postId=${postId}, html=${html}`);
    const ckEditorId = documentHelpers.postIdToCkEditorDocumentId(postId);
    
    // Check for unsaved changes and save them first
    const latestHtml = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorId);
    await documentHelpers.saveOrUpdateDocumentRevision(postId, latestHtml);
    
    // End the collaboration session so that we can restart with new contents
    // To do this we have to delete *both* the document and the collaboration.
    // (jimrandomh: This seems like suspiciously bad API design in CkEditor's REST API, but
    // I've checked thoroughly and there's no way to just overwrite a
    // collaboration like you'd hope.)
    //
    // (RobertM: the above was true as of ckEditor's v4 api.
    // With the v5 api, you can delete an entire document, along with any associated collaborative session, comments, suggestions, etc.
    // Unfortunately the part where it does delete comments, suggestions, etc. is undesirable.
    // So we just flush the session and delete the document *contents* from storage, but it takes two operations.)
    await ckEditorApi.flushCkEditorCollaboration(ckEditorId);
    await ckEditorApi.deleteCkEditorCloudStorageDocument(ckEditorId);
    
    // Push the selected revision
    await ckEditorApi.createCollaborativeSession(ckEditorId, html);
  },

  async debugGetCkEditorCloudInfo() {
    const allCollaborations = await ckEditorApi.getAllCollaborations();
    const allDocuments = await ckEditorApi.getAllDocuments();
    
    // eslint-disable-next-line no-console
    console.log(`Collaborations: ${allCollaborations}`);
    // eslint-disable-next-line no-console
    console.log(`Documents: ${allDocuments}`);
  }
};

Globals.cke = {
  ...ckEditorApi,
  ...ckEditorApiHelpers,
  ...documentHelpers
};

// Also generate serverShellCommands that log the output of every function here, rather than just running them.
// In general this is only useful for GET calls, since ckEditor doesn't often return anything for POST/DELETE/etc operations.
// This isn't guaranteed to produce sane results in every single case, but seems fine for the things I've tested.
Globals.cke.log = Object.fromEntries(Object.entries(Globals.cke).map(([key, val]) => {
  if (typeof val !== 'function') {
    return [key, val];
  }

  const withLoggedOutput = async (...args: any[]) => {
    const result = await val(...args);
    console.log({ result });
    return result;
  };

  return [key, withLoggedOutput];
}));

export { ckEditorApi, ckEditorApiHelpers, documentHelpers };
