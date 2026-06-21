export const mapStylesToCss = (styles: any, nodeType?: string) => {
  const css: any = styles ? { ...styles } : {};

  // Set default styles to prevent content overflow on structural wrapper nodes
  const wrapperNodes = ["html", "body", "container", "section", "row", "column"];
  if (nodeType && wrapperNodes.includes(nodeType)) {
    if (!css.boxSizing) {
      css.boxSizing = "border-box";
    }
    if (!css.overflowWrap) {
      css.overflowWrap = "break-word";
    }
    if (!css.width) {
      css.width = "100%";
    }
    // Default background color to white (except html)
    if (nodeType !== "html" && !css.backgroundColor) {
      css.backgroundColor = "#ffffff";
    }
  }

  // Enforce container max-width does not exceed 600px
  if (nodeType === "container") {
    css.maxWidth = "600px";
    if (typeof css.width === "number" && css.width > 600) {
      css.width = 600;
    } else if (typeof css.width === "string" && css.width.endsWith("px")) {
      const w = parseInt(css.width, 10);
      if (!isNaN(w) && w > 600) {
        css.width = "600px";
      }
    }
  }

  // Convert numeric spacing properties to px if they are plain numbers
  const pxFields = [
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "width",
    "height",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "borderRadius",
    "borderWidth",
    "fontSize",
    "letterSpacing",
    "gap",
  ];

  for (const field of pxFields) {
    if (typeof css[field] === "number") {
      css[field] = `${css[field]}px`;
    }
  }

  // Map alignment property to standard CSS properties
  if (css.align) {
    css.textAlign = css.align;

    if (nodeType === "container") {
      if (css.align === "center") {
        css.marginLeft = "auto";
        css.marginRight = "auto";
      } else if (css.align === "left") {
        css.marginLeft = "0";
        css.marginRight = "auto";
      }
    }
  }

  // Map vertical alignment for columns
  if (css.verticalAlign) {
    if (css.verticalAlign === "top") css.verticalAlign = "top";
    if (css.verticalAlign === "middle") css.verticalAlign = "middle";
    if (css.verticalAlign === "bottom") css.verticalAlign = "bottom";
  }

  return css;
};
