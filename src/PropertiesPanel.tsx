import { useEngineStore, useDispatch } from "@react-email-builder/react";
import { Trash2, Copy, Settings, Layout, Info, Type, Layers, Paintbrush, Sliders } from "lucide-react";
import { useState, useEffect } from "react";

export const PropertiesPanel = () => {
  const dispatch = useDispatch();
  const selectedNodeId = useEngineStore((state) => state.selectedNodeId);
  const node = useEngineStore((state) => {
    if (!selectedNodeId) return null;
    return state.document.nodes.get(selectedNodeId);
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [openSections, setOpenSections] = useState({
    content: true,
    layout: true,
    typography: false,
    border: false,
    background: false,
    effects: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  if (!selectedNodeId || !node) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-mutedtext bg-panelbg">
        <Info className="w-10 h-10 text-appborder mb-2" />
        <p className="text-sm font-medium text-center">No Element Selected</p>
        <p className="text-xs text-mutedtext text-center mt-1">
          Click any element on the canvas to inspect and edit its properties.
        </p>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedNodeId);
    setCopySuccess(true);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this element and all its children?")) {
      dispatch({
        type: "DELETE_NODE",
        payload: {
          nodeId: selectedNodeId,
        },
      });
    }
  };

  // Safe update for properties and styles
  const handleUpdateField = (key: "props" | "styles", fieldName: string, value: any) => {
    const dataObj = node.data as any;
    const currentGroup = dataObj[key] || {};
    
    // Parse numeric fields properly
    let parsedValue = value;
    if (
      key === "styles" &&
      [
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "marginTop",
        "marginRight",
        "marginBottom",
        "marginLeft",
        "borderRadius",
        "borderWidth",
        "width",
        "height",
        "minWidth",
        "maxWidth",
        "minHeight",
        "maxHeight",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "gap",
        "opacity",
      ].includes(fieldName)
    ) {
      if (value === "") {
        parsedValue = undefined;
      } else {
        const num = Number(value);
        parsedValue = isNaN(num) ? value : num;
      }
    }

    const updatedProps = {
      ...dataObj,
      [key]: {
        ...currentGroup,
        [fieldName]: parsedValue,
      },
    };

    // Clean undefined fields
    if (parsedValue === undefined) {
      delete (updatedProps[key] as any)[fieldName];
    }

    dispatch({
      type: "UPDATE_NODE_PROPS",
      payload: {
        nodeId: selectedNodeId,
        props: updatedProps,
      },
    });
  };

  const blockType = node.type === "block" ? (node.data as any).blockType : null;
  const nodeProps = (node.data as any)?.props || {};
  const nodeStyles = (node.data as any)?.styles || {};

  return (
    <div className="h-full flex flex-col bg-panelbg border-l border-appborder text-apptext">
      {/* Header */}
      <div className="p-4 border-b border-appborder bg-headerbg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-sm text-apptext">Properties</h2>
        </div>
        {node.type !== "html" && node.type !== "body" && node.type !== "container" && (
          <button
            onClick={handleDelete}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="p-4 border-b border-appborder bg-panelbg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-mutedtext">Element Info</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/60">
            {node.type === "block" && blockType ? `${node.type}:${blockType}` : node.type}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-appbg border border-appborder rounded px-2 py-1.5">
          <code className="text-xs text-apptext font-mono select-all flex-1 truncate">{selectedNodeId}</code>
          <button
            onClick={handleCopyId}
            className="p-1 text-mutedtext hover:text-apptext rounded"
            title="Copy Node ID"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        {copySuccess && (
          <p className="text-[10px] text-green-600 text-right mt-1 font-medium">Copied to clipboard!</p>
        )}
      </div>

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Render Node Props for Blocks */}
        {node.type === "block" && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection("content")}
              className="w-full flex items-center justify-between py-2 px-3 bg-headerbg hover:bg-appbg rounded-lg text-xs font-bold uppercase tracking-wider text-apptext border border-appborder/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                <span>Content Settings</span>
              </div>
              <span className="text-mutedtext font-mono">{openSections.content ? "−" : "+"}</span>
            </button>
            
            {openSections.content && (
              <div className="p-3 border border-appborder rounded-lg bg-panelbg space-y-3 mt-1">
                {blockType === "text" && (
                  <div>
                    <label className="block text-xs font-medium text-apptext/85 mb-1">Text Content</label>
                    <textarea
                      className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext font-sans"
                      rows={4}
                      value={nodeProps.content || ""}
                      onChange={(e) => handleUpdateField("props", "content", e.target.value)}
                      placeholder="Enter text/HTML content..."
                    />
                  </div>
                )}

                {blockType === "heading" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-apptext/85 mb-1">Heading Content</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                        value={nodeProps.content || ""}
                        onChange={(e) => handleUpdateField("props", "content", e.target.value)}
                        placeholder="Enter heading..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-apptext/85 mb-1">Heading Level</label>
                      <select
                        className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                        value={nodeProps.level || 2}
                        onChange={(e) => handleUpdateField("props", "level", parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6].map((l) => (
                          <option key={l} value={l}>H{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {blockType === "button" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-apptext/85 mb-1">Button Label</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                        value={nodeProps.label || ""}
                        onChange={(e) => handleUpdateField("props", "label", e.target.value)}
                        placeholder="Click Me"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-apptext/85 mb-1">Button Link (URL)</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                        value={nodeProps.href || ""}
                        onChange={(e) => handleUpdateField("props", "href", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}

                {blockType === "image" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-apptext/85 mb-1">Image URL</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                        value={nodeProps.src || ""}
                        onChange={(e) => handleUpdateField("props", "src", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-apptext/85 mb-1">Alt Text</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                        value={nodeProps.alt || ""}
                        onChange={(e) => handleUpdateField("props", "alt", e.target.value)}
                        placeholder="Image description"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Layout & Sizing Accordion */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("layout")}
            className="w-full flex items-center justify-between py-2 px-3 bg-headerbg hover:bg-appbg rounded-lg text-xs font-bold uppercase tracking-wider text-apptext border border-appborder/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layout className="w-3.5 h-3.5 text-indigo-500" />
              <span>Layout & Sizing</span>
            </div>
            <span className="text-mutedtext font-mono">{openSections.layout ? "−" : "+"}</span>
          </button>
          
          {openSections.layout && (
            <div className="p-3 border border-appborder rounded-lg bg-panelbg space-y-3 mt-1">
              {/* Display selection */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Display</label>
                <select
                  className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none focus:border-indigo-500"
                  value={nodeStyles.display || ""}
                  onChange={(e) => handleUpdateField("styles", "display", e.target.value || undefined)}
                >
                  <option value="">Default</option>
                  <option value="block">block</option>
                  <option value="inline-block">inline-block</option>
                  <option value="flex">flex</option>
                  <option value="grid">grid</option>
                  <option value="none">none</option>
                </select>
              </div>

              {/* Flexbox Specific Controls */}
              {nodeStyles.display === "flex" && (
                <div className="space-y-2 p-2 bg-appbg rounded border border-appborder">
                  <span className="block text-[9px] font-bold text-mutedtext uppercase">Flex Layout Options</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-mutedtext mb-0.5">Direction</label>
                      <select
                        className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                        value={nodeStyles.flexDirection || ""}
                        onChange={(e) => handleUpdateField("styles", "flexDirection", e.target.value || undefined)}
                      >
                        <option value="">row</option>
                        <option value="column">column</option>
                        <option value="row-reverse">row-reverse</option>
                        <option value="column-reverse">column-reverse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-mutedtext mb-0.5">Wrap</label>
                      <select
                        className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                        value={nodeStyles.flexWrap || ""}
                        onChange={(e) => handleUpdateField("styles", "flexWrap", e.target.value || undefined)}
                      >
                        <option value="">nowrap</option>
                        <option value="wrap">wrap</option>
                        <option value="wrap-reverse">wrap-reverse</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-mutedtext mb-0.5">Justify</label>
                      <select
                        className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                        value={nodeStyles.justifyContent || ""}
                        onChange={(e) => handleUpdateField("styles", "justifyContent", e.target.value || undefined)}
                      >
                        <option value="">flex-start</option>
                        <option value="center">center</option>
                        <option value="flex-end">flex-end</option>
                        <option value="space-between">space-between</option>
                        <option value="space-around">space-around</option>
                        <option value="space-evenly">space-evenly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-mutedtext mb-0.5">Align</label>
                      <select
                        className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                        value={nodeStyles.alignItems || ""}
                        onChange={(e) => handleUpdateField("styles", "alignItems", e.target.value || undefined)}
                      >
                        <option value="">stretch</option>
                        <option value="flex-start">flex-start</option>
                        <option value="center">center</option>
                        <option value="flex-end">flex-end</option>
                        <option value="baseline">baseline</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Specific Controls */}
              {nodeStyles.display === "grid" && (
                <div className="p-2 bg-appbg rounded border border-appborder space-y-2">
                  <span className="block text-[9px] font-bold text-mutedtext uppercase">Grid Layout Options</span>
                  <div>
                    <label className="block text-[10px] text-mutedtext mb-0.5">Grid Columns</label>
                    <input
                      type="text"
                      className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.gridTemplateColumns || ""}
                      onChange={(e) => handleUpdateField("styles", "gridTemplateColumns", e.target.value)}
                      placeholder="e.g. repeat(3, 1fr)"
                    />
                  </div>
                </div>
              )}

              {/* Gap input - visible when display is flex or grid */}
              {(nodeStyles.display === "flex" || nodeStyles.display === "grid") && (
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Gap</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none focus:border-indigo-500"
                    value={nodeStyles.gap !== undefined ? nodeStyles.gap : ""}
                    onChange={(e) => handleUpdateField("styles", "gap", e.target.value)}
                    placeholder="e.g. 16 or 1rem"
                  />
                </div>
              )}

              {/* Width & Height */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Width</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:border-indigo-500 focus:outline-none"
                    value={nodeStyles.width !== undefined ? nodeStyles.width : ""}
                    onChange={(e) => handleUpdateField("styles", "width", e.target.value)}
                    placeholder="e.g. 600 or 100%"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Height</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:border-indigo-500 focus:outline-none"
                    value={nodeStyles.height !== undefined ? nodeStyles.height : ""}
                    onChange={(e) => handleUpdateField("styles", "height", e.target.value)}
                    placeholder="auto"
                  />
                </div>
              </div>

              {/* Min/Max Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Min Width</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:border-indigo-500 focus:outline-none"
                    value={nodeStyles.minWidth !== undefined ? nodeStyles.minWidth : ""}
                    onChange={(e) => handleUpdateField("styles", "minWidth", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Max Width</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:border-indigo-500 focus:outline-none"
                    value={nodeStyles.maxWidth !== undefined ? nodeStyles.maxWidth : ""}
                    onChange={(e) => handleUpdateField("styles", "maxWidth", e.target.value)}
                    placeholder="none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Min Height</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:border-indigo-500 focus:outline-none"
                    value={nodeStyles.minHeight !== undefined ? nodeStyles.minHeight : ""}
                    onChange={(e) => handleUpdateField("styles", "minHeight", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Max Height</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:border-indigo-500 focus:outline-none"
                    value={nodeStyles.maxHeight !== undefined ? nodeStyles.maxHeight : ""}
                    onChange={(e) => handleUpdateField("styles", "maxHeight", e.target.value)}
                    placeholder="none"
                  />
                </div>
              </div>

              {/* Paddings Spacing */}
              <div className="space-y-2 border border-appborder p-2.5 rounded bg-appbg/40">
                <span className="block text-[10px] font-bold text-mutedtext uppercase mb-1">Padding Spacing (px)</span>
                <div className="grid grid-cols-4 gap-1">
                  <div>
                    <label className="block text-[9px] text-mutedtext">Top</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.paddingTop !== undefined ? nodeStyles.paddingTop : ""}
                      onChange={(e) => handleUpdateField("styles", "paddingTop", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Right</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.paddingRight !== undefined ? nodeStyles.paddingRight : ""}
                      onChange={(e) => handleUpdateField("styles", "paddingRight", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Bottom</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.paddingBottom !== undefined ? nodeStyles.paddingBottom : ""}
                      onChange={(e) => handleUpdateField("styles", "paddingBottom", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Left</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.paddingLeft !== undefined ? nodeStyles.paddingLeft : ""}
                      onChange={(e) => handleUpdateField("styles", "paddingLeft", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Margins Spacing */}
              <div className="space-y-2 border border-appborder p-2.5 rounded bg-appbg/40">
                <span className="block text-[10px] font-bold text-mutedtext uppercase mb-1">Margin Spacing (px)</span>
                <div className="grid grid-cols-4 gap-1">
                  <div>
                    <label className="block text-[9px] text-mutedtext">Top</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.marginTop !== undefined ? nodeStyles.marginTop : ""}
                      onChange={(e) => handleUpdateField("styles", "marginTop", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Right</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.marginRight !== undefined ? nodeStyles.marginRight : ""}
                      onChange={(e) => handleUpdateField("styles", "marginRight", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Bottom</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.marginBottom !== undefined ? nodeStyles.marginBottom : ""}
                      onChange={(e) => handleUpdateField("styles", "marginBottom", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Left</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.marginLeft !== undefined ? nodeStyles.marginLeft : ""}
                      onChange={(e) => handleUpdateField("styles", "marginLeft", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Typography Accordion */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("typography")}
            className="w-full flex items-center justify-between py-2 px-3 bg-headerbg hover:bg-appbg rounded-lg text-xs font-bold uppercase tracking-wider text-apptext border border-appborder/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-indigo-500" />
              <span>Typography</span>
            </div>
            <span className="text-mutedtext font-mono">{openSections.typography ? "−" : "+"}</span>
          </button>
          
          {openSections.typography && (
            <div className="p-3 border border-appborder rounded-lg bg-panelbg space-y-3 mt-1">
              {/* Text Color */}
              <div>
                <label className="block text-xs font-medium text-apptext/85 mb-1">Text Color</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    className="w-8 h-8 p-0 border border-appborder rounded cursor-pointer"
                    value={nodeStyles.color?.startsWith("#") ? nodeStyles.color : "#000000"}
                    onChange={(e) => handleUpdateField("styles", "color", e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full text-xs px-1.5 py-1 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                    value={nodeStyles.color || ""}
                    onChange={(e) => handleUpdateField("styles", "color", e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Font Family</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 border border-appborder rounded focus:outline-none focus:border-indigo-500 bg-panelbg text-apptext"
                  value={nodeStyles.fontFamily || ""}
                  onChange={(e) => handleUpdateField("styles", "fontFamily", e.target.value)}
                  placeholder="e.g. Arial, sans-serif"
                />
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Font Size</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded focus:outline-none focus:border-indigo-500 bg-panelbg text-apptext"
                    value={nodeStyles.fontSize !== undefined ? nodeStyles.fontSize : ""}
                    onChange={(e) => handleUpdateField("styles", "fontSize", e.target.value)}
                    placeholder="e.g. 14 or 1rem"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Weight</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded focus:indigo-500 focus:outline-none bg-panelbg text-apptext"
                    value={nodeStyles.fontWeight !== undefined ? nodeStyles.fontWeight : ""}
                    onChange={(e) => handleUpdateField("styles", "fontWeight", e.target.value)}
                    placeholder="e.g. 400 or bold"
                  />
                </div>
              </div>

              {/* Line Height & Letter Spacing */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Line Height</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded focus:outline-none focus:border-indigo-500 bg-panelbg text-apptext"
                    value={nodeStyles.lineHeight !== undefined ? nodeStyles.lineHeight : ""}
                    onChange={(e) => handleUpdateField("styles", "lineHeight", e.target.value)}
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Letter Spacing</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded focus:outline-none focus:border-indigo-500 bg-panelbg text-apptext"
                    value={nodeStyles.letterSpacing !== undefined ? nodeStyles.letterSpacing : ""}
                    onChange={(e) => handleUpdateField("styles", "letterSpacing", e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Text Align</label>
                <select
                  className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none focus:border-indigo-500"
                  value={nodeStyles.textAlign || nodeStyles.align || ""}
                  onChange={(e) => {
                    handleUpdateField("styles", "textAlign", e.target.value || undefined);
                    handleUpdateField("styles", "align", e.target.value || undefined);
                  }}
                >
                  <option value="">Default</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>

              {/* Style & Decor & Transform */}
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[9px] font-medium text-mutedtext mb-0.5">Style</label>
                  <select
                    className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.fontStyle || ""}
                    onChange={(e) => handleUpdateField("styles", "fontStyle", e.target.value || undefined)}
                  >
                    <option value="">normal</option>
                    <option value="italic">italic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-mutedtext mb-0.5">Decor</label>
                  <select
                    className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.textDecoration || ""}
                    onChange={(e) => handleUpdateField("styles", "textDecoration", e.target.value || undefined)}
                  >
                    <option value="">none</option>
                    <option value="underline">underline</option>
                    <option value="line-through">line-thru</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-mutedtext mb-0.5">Transform</label>
                  <select
                    className="w-full text-[11px] p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.textTransform || ""}
                    onChange={(e) => handleUpdateField("styles", "textTransform", e.target.value || undefined)}
                  >
                    <option value="">none</option>
                    <option value="uppercase">UPPER</option>
                    <option value="lowercase">lower</option>
                    <option value="capitalize">Capital</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Borders & Corners Accordion */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("border")}
            className="w-full flex items-center justify-between py-2 px-3 bg-headerbg hover:bg-appbg rounded-lg text-xs font-bold uppercase tracking-wider text-apptext border border-appborder/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Borders & Corners</span>
            </div>
            <span className="text-mutedtext font-mono">{openSections.border ? "−" : "+"}</span>
          </button>
          
          {openSections.border && (
            <div className="p-3 border border-appborder rounded-lg bg-panelbg space-y-3 mt-1">
              {/* Border Color */}
              <div>
                <label className="block text-xs font-medium text-apptext/85 mb-1">Border Color</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    className="w-8 h-8 p-0 border border-appborder rounded cursor-pointer"
                    value={nodeStyles.borderColor?.startsWith("#") ? nodeStyles.borderColor : "#000000"}
                    onChange={(e) => handleUpdateField("styles", "borderColor", e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full text-xs px-1.5 py-1 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                    value={nodeStyles.borderColor || ""}
                    onChange={(e) => handleUpdateField("styles", "borderColor", e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Border Style & Width */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Border Style</label>
                  <select
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.borderStyle || ""}
                    onChange={(e) => handleUpdateField("styles", "borderStyle", e.target.value || undefined)}
                  >
                    <option value="">Default</option>
                    <option value="none">none</option>
                    <option value="solid">solid</option>
                    <option value="dashed">dashed</option>
                    <option value="dotted">dotted</option>
                    <option value="double">double</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Width</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.borderWidth !== undefined ? nodeStyles.borderWidth : ""}
                    onChange={(e) => handleUpdateField("styles", "borderWidth", e.target.value)}
                    placeholder="e.g. 1 or 2px"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Border Radius</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                  value={nodeStyles.borderRadius !== undefined ? nodeStyles.borderRadius : ""}
                  onChange={(e) => handleUpdateField("styles", "borderRadius", e.target.value)}
                  placeholder="e.g. 4 or 8px"
                />
              </div>

              {/* Specific Side Borders */}
              <div className="space-y-1.5 pt-2 border-t border-appborder">
                <span className="block text-[9px] font-bold text-mutedtext uppercase">Specific Side Borders (CSS)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-mutedtext">Top</label>
                    <input
                      type="text"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.borderTop || ""}
                      onChange={(e) => handleUpdateField("styles", "borderTop", e.target.value)}
                      placeholder="1px solid red"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Right</label>
                    <input
                      type="text"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.borderRight || ""}
                      onChange={(e) => handleUpdateField("styles", "borderRight", e.target.value)}
                      placeholder="1px solid red"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-mutedtext">Bottom</label>
                    <input
                      type="text"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.borderBottom || ""}
                      onChange={(e) => handleUpdateField("styles", "borderBottom", e.target.value)}
                      placeholder="1px solid red"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-mutedtext">Left</label>
                    <input
                      type="text"
                      className="w-full text-xs p-1 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                      value={nodeStyles.borderLeft || ""}
                      onChange={(e) => handleUpdateField("styles", "borderLeft", e.target.value)}
                      placeholder="1px solid red"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Backgrounds Accordion */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("background")}
            className="w-full flex items-center justify-between py-2 px-3 bg-headerbg hover:bg-appbg rounded-lg text-xs font-bold uppercase tracking-wider text-apptext border border-appborder/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Paintbrush className="w-3.5 h-3.5 text-indigo-500" />
              <span>Backgrounds</span>
            </div>
            <span className="text-mutedtext font-mono">{openSections.background ? "−" : "+"}</span>
          </button>
          
          {openSections.background && (
            <div className="p-3 border border-appborder rounded-lg bg-panelbg space-y-3 mt-1">
              {/* Bg Color */}
              <div>
                <label className="block text-xs font-medium text-apptext/85 mb-1">Bg Color</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    className="w-8 h-8 p-0 border border-appborder rounded cursor-pointer"
                    value={nodeStyles.backgroundColor?.startsWith("#") ? nodeStyles.backgroundColor : "#ffffff"}
                    onChange={(e) => handleUpdateField("styles", "backgroundColor", e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full text-xs px-1.5 py-1 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                    value={nodeStyles.backgroundColor || ""}
                    onChange={(e) => handleUpdateField("styles", "backgroundColor", e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Background Image URL */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Bg Image URL</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                  value={nodeStyles.backgroundImage || ""}
                  onChange={(e) => handleUpdateField("styles", "backgroundImage", e.target.value)}
                  placeholder="url(https://...)"
                />
              </div>

              {/* Background Size & Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Size</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.backgroundSize || ""}
                    onChange={(e) => handleUpdateField("styles", "backgroundSize", e.target.value)}
                    placeholder="cover/contain"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-mutedtext mb-1">Position</label>
                  <input
                    type="text"
                    className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                    value={nodeStyles.backgroundPosition || ""}
                    onChange={(e) => handleUpdateField("styles", "backgroundPosition", e.target.value)}
                    placeholder="center center"
                  />
                </div>
              </div>

              {/* Background Repeat */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Bg Repeat</label>
                <select
                  className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                  value={nodeStyles.backgroundRepeat || ""}
                  onChange={(e) => handleUpdateField("styles", "backgroundRepeat", e.target.value || undefined)}
                >
                  <option value="">Default</option>
                  <option value="no-repeat">no-repeat</option>
                  <option value="repeat">repeat</option>
                  <option value="repeat-x">repeat-x</option>
                  <option value="repeat-y">repeat-y</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Shadows & Effects Accordion */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("effects")}
            className="w-full flex items-center justify-between py-2 px-3 bg-headerbg hover:bg-appbg rounded-lg text-xs font-bold uppercase tracking-wider text-apptext border border-appborder/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>Shadows & Effects</span>
            </div>
            <span className="text-mutedtext font-mono">{openSections.effects ? "−" : "+"}</span>
          </button>
          
          {openSections.effects && (
            <div className="p-3 border border-appborder rounded-lg bg-panelbg space-y-3 mt-1">
              {/* Box Shadow */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Box Shadow</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                  value={nodeStyles.boxShadow || ""}
                  onChange={(e) => handleUpdateField("styles", "boxShadow", e.target.value)}
                  placeholder="e.g. 0 4px 6px rgba(0,0,0,0.1)"
                />
              </div>

              {/* Text Shadow */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Text Shadow</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                  value={nodeStyles.textShadow || ""}
                  onChange={(e) => handleUpdateField("styles", "textShadow", e.target.value)}
                  placeholder="e.g. 1px 1px 2px black"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Opacity (0-1)</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 border border-appborder rounded focus:border-indigo-500 focus:outline-none bg-panelbg text-apptext"
                  value={nodeStyles.opacity !== undefined ? nodeStyles.opacity : ""}
                  onChange={(e) => handleUpdateField("styles", "opacity", e.target.value)}
                  placeholder="e.g. 0.8 or 1"
                />
              </div>

              {/* Overflow */}
              <div>
                <label className="block text-[10px] font-medium text-mutedtext mb-1">Overflow</label>
                <select
                  className="w-full text-xs p-1.5 border border-appborder rounded bg-panelbg text-apptext focus:outline-none"
                  value={nodeStyles.overflow || ""}
                  onChange={(e) => handleUpdateField("styles", "overflow", e.target.value || undefined)}
                >
                  <option value="">Default</option>
                  <option value="visible">visible</option>
                  <option value="hidden">hidden</option>
                  <option value="scroll">scroll</option>
                  <option value="auto">auto</option>
                </select>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
