
export interface CTAButtonSettings {
  buttonText: string
  linkTo: string
}

export type EditCTAButtonProps = {
  initialState: CTAButtonSettings
  setDocumentState: (newSettings: CTAButtonSettings) => void
};
export type CTAButtonPluginConfiguration = {
  renderCTAButtonSettingsInto: (
    element: HTMLElement,
    initalState: CTAButtonSettings,
    setDocumentState: (newSettings: CTAButtonSettings) => void
  ) => void,
}
