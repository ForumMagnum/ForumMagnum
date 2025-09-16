import { getContextFromReqAndRes } from '../vulcan-lib/apollo-server/context';
import { Posts } from '../../server/collections/posts/collection'
import { getCollaborativeEditorAccess, CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { getCKEditorDocumentId } from '../../lib/ckEditorUtils'
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { getCkEditorEnvironmentId, getCkEditorSecretKey } from './ckEditorServerConfig';
import jwt from 'jsonwebtoken'
import { randomId } from '../../lib/random';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { captureException } from '@/lib/sentryWrapper';

function permissionsLevelToCkEditorRole(access: CollaborativeEditingAccessLevel): string {
  switch (access) {
    case "edit": return "writer";
    case "comment": return "commentator";
    case "read": return "reader";
    case "none": return "";
  }
}

const formTypeValidator = z.enum(["edit", "new"]).nullable();

export async function ckEditorTokenHandler(req: NextRequest) {
  const environmentId = getCkEditorEnvironmentId();
  const secretKey = getCkEditorSecretKey()!; // Assume nonnull; causes lack of encryption in development

  const collectionName = req.headers.get('collection-name');
  const documentId = req.headers.get('document-id') ?? undefined;
  const userId = req.headers.get('user-id') ?? undefined;
  const rawFormType = req.headers.get('form-type');
  const linkSharingKey = req.headers.get('link-sharing-key');
  
  if (!collectionName || collectionName.includes(",")) {
    const error = new Error("Missing or multiple collectionName headers");
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    throw error;
  }

  if (documentId?.includes(",")) {
    const error = new Error("Multiple documentId headers");
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    throw error;
  }
  
  if (userId?.includes(",")) {
    const error = new Error("Multiple userId headers");
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    throw error;
  }

  const urlForContext = req.nextUrl.clone();
  if (linkSharingKey) {
    urlForContext.searchParams.set('key', linkSharingKey);
  }
  const requestWithKey = new NextRequest({ ...req, url: urlForContext.toString() });
  const contextWithKey = await getContextFromReqAndRes({ req: requestWithKey, isSSR: false });

  const user = contextWithKey.currentUser;
  
  if (collectionName === "Posts") {
    const parsedFormType = formTypeValidator.safeParse(rawFormType);
    if (!parsedFormType.success) {
      const error = new Error("Invalid formType header");
      // eslint-disable-next-line no-console
      console.error(error);
      captureException(error);
      throw error;
    }
  
    const formType = parsedFormType.data;
  
    const ckEditorId = getCKEditorDocumentId(documentId, userId, formType ?? undefined)
    const post = documentId ? await Posts.findOne(documentId) : null;
    const access = documentId ? await getCollaborativeEditorAccess({ formType, post, user, context: contextWithKey, useAdminPowers: true }) : "edit";
  
    if (access === "none") {
      return new Response("Access denied", { status: 403 });
    }
    
    const payload = {
      aud: environmentId,
      iat: Math.floor(new Date().getTime()/1000.0), //seconds since epoch
      user: {
        id: user ? user._id : randomId(),
        name: user ? userGetDisplayName(user) : "Anonymous"
      },
      auth: {
        collaboration: {
          [ckEditorId]: {role: permissionsLevelToCkEditorRole(access)}
        },
      },
    };
    
    const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
    
    return new Response(result, {
      headers: {
        "Content-Type": "application/octet-stream"
      }
    });
  } else {
    const payload = {
      aud: environmentId,
      iat: Math.floor(new Date().getTime()/1000.0), //seconds since epoch
      user: user ? {
        id: user._id,
        name: userGetDisplayName(user)
      } : null,
    };
    
    const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
    
    return new Response(result, {
      headers: {
        "Content-Type": "application/octet-stream"
      }
    });
  }
}
