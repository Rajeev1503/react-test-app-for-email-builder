import type { RenderNodeType, TNodeType } from "@react-email-builder/engine";

export type RenderNodeTypeData<T extends TNodeType> = Extract<
  RenderNodeType,
  { type: T }
>;

declare global {
  interface Window {
    __xssFired?: boolean;
  }
}

export {};
