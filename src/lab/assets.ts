import type { Asset, AssetAdapter } from "@react-email-builder/react";

/** Uses the dev server's upload endpoint in vite.config.ts, as a host's API would be. */
export const labAssets: AssetAdapter = {
  async upload(file) {
    const response = await fetch(`/__lab/upload?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "content-type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error(`The upload failed (HTTP ${response.status}).`);
    return (await response.json()) as Asset;
  },
  async list() {
    const response = await fetch("/__lab/uploads");
    return (await response.json()) as Asset[];
  },
  async search(query) {
    const assets = await this.list!();
    return assets.filter((asset) => asset.name?.includes(query));
  },
  /**
   * A stand-in image generator, so Envoy's image generation can be tried without
   * a paid model: it draws a labelled gradient and uploads it like any image.
   */
  async generate(prompt) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 600;
    const context = canvas.getContext("2d")!;
    const gradient = context.createLinearGradient(0, 0, 1200, 600);
    gradient.addColorStop(0, "#0c6f78");
    gradient.addColorStop(1, "#5857f5");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 600);
    context.fillStyle = "#ffffff";
    context.font = "bold 40px sans-serif";
    context.fillText("Generated image (lab)", 60, 280);
    context.font = "28px sans-serif";
    context.fillText(prompt.slice(0, 70), 60, 340);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
    return this.upload!(new File([blob], `generated-${Date.now()}.png`, { type: "image/png" }));
  },
};
