import { runQuery } from '@/server/vulcan-lib/query';
import { ImageResponse } from 'next/og';
import { gql } from '@/lib/generated/gql-codegen';
import { NextResponse } from 'next/server';
 
const PostMetadataQuery = gql(`
  query PostMetadataForPreviewImage($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        _id
        title
        socialPreviewImageAutoUrl
        contents {
          html
        }
      }
    }
  }
`);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ _id: string }> },
) {
  const postId = (await params)._id;
  const result = await runQuery(PostMetadataQuery, {
    postId,
  });
  const post = result?.data?.post?.result;
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  //const backgroundImage = post.socialPreviewImage ?? extractBackgroundImageFromPost(post);

  return new ImageResponse((
    <div
      style={{
        fontSize: 40,
        color: 'black',
        background: 'white',
        width: '100%',
        height: '100%',
        padding: '50px 200px',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {post.title}
    </div>
  ),
  {
    width: 1200,
    height: 630,
  });
}
