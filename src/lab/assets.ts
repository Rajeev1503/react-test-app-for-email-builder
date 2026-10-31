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
};
