import type { RenderNodeType, TNodeType } from "@react-email-builder/engine";

export type RenderNodeTypeData<T extends TNodeType> = Extract<
  RenderNodeType,
  { type: T }
>;

declare global {
  interface Window {
    __lab?: { document(): unknown; exportHtml(): Promise<string> };
    __xssFired?: boolean;
  }
}

export {};
