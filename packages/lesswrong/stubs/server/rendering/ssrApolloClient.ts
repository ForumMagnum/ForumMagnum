
export async function getApolloClientForSSR(props: any) {
  throw new Error("This function can only run on the server");
}

export async function getApolloClientForSSRWithContext(_props: any) {
  throw new Error("This function can only run on the server");
}

export async function getResolverContextForSSR(_props: any) {
  throw new Error("This function can only run on the server");
}
