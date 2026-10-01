import type { AppState, PendingExcalidrawElements } from "../../excalidraw/types";
import { type NonDeleted, type ElementsMap, type ExcalidrawElement, type ExcalidrawFlowchartNodeElement, type NonDeletedExcalidrawElement } from "./types";
import type { Scene } from "./Scene";
export type LinkDirection = "up" | "right" | "down" | "left";
export declare const addNewNodes: (startNode: NonDeleted<ExcalidrawFlowchartNodeElement>, appState: AppState, direction: LinkDirection, scene: Scene, numberOfNodes: number, stickyCrossStart?: number | null) => {
    nodes: NonDeletedExcalidrawElement[];
    crossStart: number;
};
export declare class FlowChartNavigator {
    isExploring: boolean;
    private sameLevelNodes;
    private sameLevelIndex;
    private direction;
    private visitedNodes;
    clear(): void;
    exploreByDirection(element: ExcalidrawElement, elementsMap: ElementsMap, direction: LinkDirection): ExcalidrawElement["id"] | null;
    private static getNodeRelatives;
    private static getSuccessors;
    private static getPredecessors;
}
export declare class FlowChartCreator {
    isCreatingChart: boolean;
    private numberOfNodes;
    private direction;
    private clusterCrossStart;
    pendingNodes: PendingExcalidrawElements | null;
    createNodes(startNode: NonDeleted<ExcalidrawFlowchartNodeElement>, appState: AppState, direction: LinkDirection, scene: Scene): void;
    clear(): void;
}
export declare const isNodeInFlowchart: (element: ExcalidrawFlowchartNodeElement, elementsMap: ElementsMap) => boolean;
