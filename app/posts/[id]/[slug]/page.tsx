"use client"

// import '../../../../pages/api/reactFactoryShim'
import { gql, useSuspenseQuery } from '@apollo/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { registerComponent } from '../../../../lesswrong/packages/lesswrong/lib/vulcan-lib/components';
const thisPostQuery = gql`
   query postById($id: String!) {
    post(input: { selector : { _id: $id }}) {
      result {
        _id
        title
        slug
        contents {
          html
        }
      }
    }
  }
`

export default function Home({ params }: { params: Promise<{ id: string, slug: string }> }) {
  const [postId, setPostId] = useState<string | null>(null)
  const [post, setPost] = useState<any>(null)
  
  // Resolve the params promise to get the ID
  useEffect(() => {
    void (async () => {
      const { id } = await params
      setPostId(id)
    })()
  }, [params])
  
  // Use the query at component level - use empty string for id if not available yet
  const { data } = useSuspenseQuery<any>(thisPostQuery, {
    variables: { id: postId || '' },
    skip: !postId // Skip the query until we have an ID
  })
  
  // Set post data when query result is available
  useEffect(() => {
    console.log("data", data?.post?.result)
    if (data?.post?.result) {
      setPost(data.post.result)
    }
  }, [data])

  return (<>
    <div>
      {post && <div key={post._id}>
        {post.title}
        <div dangerouslySetInnerHTML={{ __html: post.contents.html }} />
      </div>
      }
    </div>
    <Link href="/"><strong>Go Home</strong></Link>
    <Link href="/test"><strong>Go Test</strong></Link>
    {/* <TopPostsPage /> */}
  </>
  );
}
