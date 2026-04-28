import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { Posts } from '../../server/collections/posts/collection'
import { getCollaborativeEditorAccess, CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { getCKEditorDocumentId } from '../../lib/ckEditorUtils'
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { getCkEditorEnvironmentId, getCkEditorSecretKey } from './ckEditorServerConfig';
import jwt from 'jsonwebtoken'
import { randomId } from '../../lib/random';
import { NextRequest, NextResponse } from 'next/server';
import { captureException } from '@/lib/sentryWrapper';
import { getUserFromReq } from '../vulcan-lib/apollo-server/getUserFromReq';

function permissionsLevelToCkEditorRole(access: CollaborativeEditingAccessLevel): string {
  switch (access) {
    case "edit": return "writer";
    case "comment": return "commentator";
    case "read": return "reader";
    case "none": return "";
  }
}

function extractHeaders(req: NextRequest) {
  const referer = req.headers.get('referer');
  const collectionName = req.headers.get('collection-name');
  const documentId = req.headers.get('document-id') ?? undefined;
  const linkSharingKey = req.headers.get('link-sharing-key');

  return { referer, collectionName, documentId, linkSharingKey };
}

function handleErrorAndReturn(req: NextRequest, error: Error) {
  const { linkSharingKey, ...safeHeaders } = extractHeaders(req);

  // eslint-disable-next-line no-console
  console.error(error, { headers: safeHeaders });
  captureException(error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}

export async function ckEditorTokenHandler(req: NextRequest) {
  const environmentId = getCkEditorEnvironmentId();
  const secretKey = getCkEditorSecretKey()!; // Assume nonnull; causes lack of encryption in development

  const { collectionName, documentId, linkSharingKey } = extractHeaders(req);

  if (!collectionName || collectionName.includes(",")) {
    const error = new Error("Missing or multiple collectionName headers");
    return handleErrorAndReturn(req, error);
  }

  if (documentId?.includes(",")) {
    const error = new Error("Multiple documentId headers");
    return handleErrorAndReturn(req, error);
  }

  const urlForContext = req.nextUrl.clone();
  if (linkSharingKey) {
    urlForContext.searchParams.set('key', linkSharingKey);
  }

  const user = await getUserFromReq(req);

  const contextWithKey = computeContextFromUser({
    user,
    headers: req.headers,
    searchParams: urlForContext.searchParams,
    cookies: req.cookies.getAll(),
    isSSR: false,
  });
    
  if (collectionName === "Posts") {
    if (!documentId) {
      const error = new Error("Missing documentId header for Posts token request");
      return handleErrorAndReturn(req, error);
    }

    const ckEditorId = getCKEditorDocumentId(documentId);
    const post = await Posts.findOne(documentId);
    const access = await getCollaborativeEditorAccess({ formType: "edit", post, user, context: contextWithKey, useAdminPowers: true });

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
