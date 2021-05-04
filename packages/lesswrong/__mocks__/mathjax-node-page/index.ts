export function mjpage(html, conf1, conf2, callback) {
    callback(html)
    return {
        on: (callbackName, callback) => callback(html)
    }
}

export default mjpage
