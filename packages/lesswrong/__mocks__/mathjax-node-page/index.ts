export function mjpage(html, conf1, conf2, callback) {
    console.log("Calling mathjax-node-page")
    callback(html)
    return {
        on: (callbackName, callback) => callback(html)
    }
}

export default mjpage