export function mjpage(html: string, conf1: any, conf2: any, callback: any) {
    callback(html)
    return {
        on: (callbackName: string, callback: any) => callback(html)
    }
}

export default mjpage
