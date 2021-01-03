export default {
    config: (conf) => console.log("Called mjAPI.config"),
    start: () => console.log("Called mjAPI.start"),
    typeset: (conf) => ({html: "", css: ""})
}
