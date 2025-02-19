export interface CreateClaimDialogProps {
  initialTitle: string,
  // `claim` is an ElicitQuestionFragment but for some reason this type isn't
  // in context inside CkEditor bundle builds
  onSubmit: (claim: AnyBecauseHard) => void,
  onCancel: () => void,
}

export type ClaimsPluginConfiguration = {
  openNewClaimDialog: (props: CreateClaimDialogProps) => void,
  renderClaimPreviewInto: (element: HTMLElement, claimId: string) => void,
};

