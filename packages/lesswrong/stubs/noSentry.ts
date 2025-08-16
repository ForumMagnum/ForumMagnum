
export const captureException = () => {};
export const getIsolationScope = (): Scope => ({
 getUser: ()=>null,
 setUser: ()=>{},
});
export interface Scope {}
