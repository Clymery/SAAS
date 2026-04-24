import { Canvas, FabricObject, FabricText, FabricImage } from "fabric"

export function exportCanvas(
  canvas: Canvas,
  format: "png" | "jpeg" = "png"
): string {
  return canvas.toDataURL({
    format,
    quality: 1,
    multiplier: 1,
  })
}

export function loadCanvasFromJSON(
  canvas: Canvas,
  json: string | object
): void {
  const data = typeof json === "string" ? json : JSON.stringify(json)
  canvas.loadFromJSON(data).then(() => {
    canvas.renderAll()
  })
}

export async function createImageLayer(
  canvas: Canvas,
  url: string
): Promise<FabricImage> {
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" })
  img.set({
    left: (canvas.width ?? 800) / 2,
    top: (canvas.height ?? 800) / 2,
    originX: "center",
    originY: "center",
  })
  if (img.width && img.height && canvas.width && canvas.height) {
    const scale = Math.min(
      (canvas.width * 0.6) / img.width,
      (canvas.height * 0.6) / img.height,
      1
    )
    img.scale(scale)
  }
  canvas.add(img)
  canvas.setActiveObject(img)
  canvas.renderAll()
  return img
}

export function createTextLayer(
  canvas: Canvas,
  text: string = "Hello World"
): FabricText {
  const textObj = new FabricText(text, {
    left: (canvas.width ?? 800) / 2,
    top: (canvas.height ?? 800) / 2,
    fontSize: 40,
    fill: "#000000",
    fontFamily: "Inter",
    originX: "center",
    originY: "center",
  })
  canvas.add(textObj)
  canvas.setActiveObject(textObj)
  canvas.renderAll()
  return textObj
}

export function removeBackground(
  _canvas: Canvas,
  _object: FabricObject
): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("mock-removal-result-url")
    }, 1000)
  })
}
