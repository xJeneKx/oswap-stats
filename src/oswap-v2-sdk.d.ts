//import type { IState } from "@/interfaces/aa.interface";

interface IState {
	[key: string]: any;
}
  
declare module 'oswap-v2-sdk' {
  export function getPoolState(params: IState, stateVars: IState): IState
}
