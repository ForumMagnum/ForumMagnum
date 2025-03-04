"use client"

import '../../pages/api/reactFactoryShim'
// import { gql, useSuspenseQuery } from '@apollo/client';
import Link from 'next/link';

// const randomPostData = gql`
//    query randomPost($id: String!) {
//     posts(input: {terms: {limit: 2}}) {
//       results {
//         _id
//         title
//         slug
//       }
//     }
//   }
// `

export default function Home() {
  // const { data } = useSuspenseQuery<any>(randomPostData)

  return (<>
    <div>
      <p>
        Look, it's a post
      </p>
    </div>
    {/* <div>
      {data.posts.results.map((post: any) => (
        <div key={post._id}>
          {post.title}
        </div>
      ))}
    </div> */}
    <Link href="/"><strong>Go Home</strong></Link>
    {/* <TopPostsPage /> */}
    </>
  );
}
