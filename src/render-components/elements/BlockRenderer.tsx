export const BlockRenderer = ({ node }: { node: any }) => {
  // block doesn't have children usually, it is the leaf.
  // node.blockType determines content.

  if (node.blockType === "text") {
    return (
      <div
        className="w-full"
        style={{ ...node.styles }}
        dangerouslySetInnerHTML={{ __html: node.content }}
      />
    );
  }

  if (node.blockType === "button") {
    return (
      <div className="w-full" style={{ textAlign: node.align || "center" }}>
        <a
          href={node.href || "#"}
          className="inline-block no-underline px-5 py-2.5 rounded text-center"
          style={{ ...node.styles }}
        >
          {node.label || "Button"}
        </a>
      </div>
    );
  }

  if (node.blockType === "image") {
    return (
      <div className="w-full" style={{ textAlign: node.align || "center" }}>
        <img
          {...node.props}
          className="max-w-full h-auto inline-block"
          style={{ ...node.styles }}
        />
      </div>
    );
  }
  // If no matching blockType is found, return null or a default message
  return null;
};
