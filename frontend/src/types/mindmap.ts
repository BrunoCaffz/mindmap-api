export type MindMapNodeType = "ROOT" | "HEADING" | "LIST_ITEM" | "CALLOUT";

export interface MindMapNode {
  id: string;
  title: string;
  description: string;
  type: MindMapNodeType;
  children: MindMapNode[];
}
