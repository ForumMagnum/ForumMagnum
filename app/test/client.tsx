"use client"

import '../../pages/api/reactFactoryShim'
// import { gql, useSuspenseQuery } from '@apollo/client';
import { use, Suspense } from 'react'
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

// modified letter apostrophe. bit oʼ a pain to refer to, but what's the alternative?
const BitOʼData = (props: { fetchPromise: Promise<string> }) => {
  const data = use(props.fetchPromise)
  return data && <> we have data</>
}

export default function Home(props: { fetchPromise: Promise<string>, data: string }) {


  return (<>
    <div>
      <p>
        Look, it&apos;s a post<Suspense fallback={<></>}><BitOʼData fetchPromise={props.fetchPromise} /></Suspense>
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
