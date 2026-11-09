/** Reads a web page through the lab server, which fetches it as a host's server would. */
export async function labReadPage(url: string): Promise<string> {
  const response = await fetch(`/__lab/page?url=${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(await response.text());
  return response.text();
}
