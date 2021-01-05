export default {
    // eslint-disable-next-line no-console
    config: (conf) => console.log("Called mjAPI.config"),
    // eslint-disable-next-line no-console
    start: () => console.log("Called mjAPI.start"),
    typeset: (conf) => ({html: "", css: ""})
}
