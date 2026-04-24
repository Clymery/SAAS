import "fabric"

declare module "fabric" {
  export namespace fabric {
    export type Canvas = import("fabric").Canvas
    export type Object = import("fabric").FabricObject
    export type Text = import("fabric").FabricText
    export type Image = import("fabric").FabricImage
  }

  export const fabric: typeof import("fabric")
}
