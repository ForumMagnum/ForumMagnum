
export const captureException = () => {};
export const getIsolationScope = (): Scope => ({
 getUser: ()=>null,
 setUser: ()=>{},
 getScopeData: ()=>({ sdkProcessingMetadata: {} }),
});
export interface Scope {}
