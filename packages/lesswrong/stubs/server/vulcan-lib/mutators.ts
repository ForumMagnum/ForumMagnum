
export const createMutator: CreateMutator = async <N extends CollectionNameString>(
  createMutatorParams: CreateMutatorParams<N>,
) => {
  throw new Error("This function can only run on the server");
}

export const updateMutator: UpdateMutator = async <N extends CollectionNameString>(params: UpdateMutatorParams<N>) => {
  throw new Error("This function can only run on the server");
}

export const deleteMutator: DeleteMutator = async <N extends CollectionNameString>(params: DeleteMutatorParams<N>) => {
  throw new Error("This function can only run on the server");
}
