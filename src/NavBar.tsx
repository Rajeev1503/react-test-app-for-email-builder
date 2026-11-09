import { Toolbar, brandMark, useBrandProfile, useEditorTheme, type DeviceSize } from "@react-email-builder/react/toolbar";
import { AiButton, useTheme } from "@react-email-builder/react";
import { exportErrorPrompt } from "@react-email-builder/react/inbox";
// History persistence ships from its own entry point.
import { useTemplateHistory } from "@react-email-builder/react/history";
import { Check, ChevronDown, Clipboard, Eye, Monitor, Moon, Palette, Smartphone, Sun, Tablet, Trash2, TriangleAlert, MonitorSmartphone, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Asks before something that can't be undone. In the page rather than the
 * browser's own confirm, so it looks like the app and works the same everywhere.
 */
function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancel.current?.focus();
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, onCancel]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 reb-animate-fade-in" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-[340px] rounded-lg border border-appborder bg-panelbg p-4 shadow-2xl text-apptext reb-animate-zoom-in"
        onClick={(event) => event.stopPropagation()}
        data-testid="confirm-dialog"
      >
        <h2 id="confirm-title" className="text-sm font-bold">{title}</h2>
        <p id="confirm-message" className="mt-1.5 text-xs text-mutedtext leading-relaxed">{message}</p>
        <div className="mt-4 flex justify-end gap-2 text-xs font-semibold">
          <button ref={cancel} type="button" onClick={onCancel} className="h-[30px] px-3 rounded border border-appborder bg-appbg hover:bg-headerbg cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-[30px] px-3 rounded border border-red-600 bg-red-600 text-white hover:bg-red-700 cursor-pointer" data-testid="confirm-action">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Clearing deletes the saved revisions too, so it only exists with history on. Asks first, everywhere. */
function ClearCanvasButton({ full = false, onCleared }: { full?: boolean; onCleared?: () => void }) {
  const { clearCanvas } = useTemplateHistory();
  const [asking, setAsking] = useState(false);

  const clear = async () => {
    setAsking(false);
    try {
      await clearCanvas();
      onCleared?.();
    } catch (e) {
      console.error(e);
      alert("Failed to clear canvas: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <>
      <button
        type="button"
        className={
          full
            ? "w-full h-[32px] px-3 rounded border border-red-500/60 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            : "h-[28px] px-2 rounded transition-all cursor-pointer border border-red-500/30 bg-panelbg text-red-400 hover:bg-red-500/10 hover:text-red-500 shadow-sm flex items-center justify-center"
        }
        onClick={() => setAsking(true)}
        title="Clear canvas and start fresh"
        aria-label="Clear canvas"
        data-testid="clear-canvas"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {full && <span>Clear canvas</span>}
      </button>
      <ConfirmDialog
        open={asking}
        title="Clear the canvas?"
        message="This removes everything in the email and deletes its saved revisions. It can't be undone."
        confirmLabel="Clear canvas"
        onConfirm={clear}
        onCancel={() => setAsking(false)}
      />
    </>
  );
}

/**
 * The brand's name and logo once the brand profile has them, or the app's name.
 * A logo that doesn't load is left out rather than shown broken.
 */
function BrandTitle() {
  const { resolvedTheme } = useTheme();
  const { name, logoUrl } = brandMark(useBrandProfile(), resolvedTheme);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showLogo = logoUrl !== null && logoUrl !== failedUrl;

  return (
    <span className="flex items-center gap-2 min-w-0" data-testid="brand-title">
      {showLogo && (
        <img src={logoUrl} alt="" className="h-5 w-auto max-w-[120px] object-contain" onError={() => setFailedUrl(logoUrl)} />
      )}
      {name ? (
        <span className="text-xs font-bold text-apptext truncate">{name}</span>
      ) : (
        <span className="text-xs font-bold text-apptext tracking-wide uppercase">EmailBuilder</span>
      )}
    </span>
  );
}

function MenuItem({ selected, disabled, onSelect, icon, label, hint }: { selected: boolean; disabled?: boolean; onSelect: () => void; icon: ReactNode; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-apptext hover:bg-headerbg disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {hint && <span className="block text-[10px] font-normal text-mutedtext">{hint}</span>}
      </span>
      {selected && <Check className="w-3.5 h-3.5 text-accent" />}
    </button>
  );
}

/** Light or dark, then the default colors or the brand's: in the theme menu, or listed in the nav drawer. */
function ThemeChoices({ onChosen }: { onChosen?: () => void }) {
  const { mode, setMode, palette, setPalette, brandAvailable } = useEditorTheme();
  const choose = (action: () => void) => {
    action();
    onChosen?.();
  };
  return (
    <>
      <div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-mutedtext">Mode</div>
      <MenuItem selected={mode === "light"} onSelect={() => choose(() => setMode("light"))} icon={<Sun className="w-3.5 h-3.5" />} label="Light" />
      <MenuItem selected={mode === "dark"} onSelect={() => choose(() => setMode("dark"))} icon={<Moon className="w-3.5 h-3.5" />} label="Dark" />
      <div className="my-1 h-px bg-appborder" />
      <div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-mutedtext">Colors</div>
      <MenuItem selected={palette === "default"} onSelect={() => choose(() => setPalette("default"))} icon={<span className="w-3 h-3 rounded-full bg-[#0c6f78]" />} label="Default" />
      <MenuItem
        selected={palette === "brand"}
        disabled={!brandAvailable}
        onSelect={() => choose(() => setPalette("brand"))}
        icon={<Palette className="w-3.5 h-3.5" />}
        label="Brand"
        hint={brandAvailable ? "Your brand's colors and font, light or dark" : "Add a primary color in the Brand tab first"}
      />
    </>
  );
}

/** Two small switches side by side, light or dark and default or brand colors, for the menu drawer. */
function ThemeSwitches() {
  const { mode, setMode, palette, setPalette, brandAvailable } = useEditorTheme();
  // Stretch to the group's inner height, so their highlight never spills past its border.
  const seg = "px-2 flex items-center gap-1 rounded leading-none cursor-pointer text-mutedtext hover:text-apptext aria-checked:bg-accent aria-checked:text-white disabled:opacity-45 disabled:cursor-not-allowed";
  const group = "h-[28px] flex items-stretch gap-0.5 bg-appbg p-0.5 border border-appborder rounded";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div role="radiogroup" aria-label="Mode" className={group}>
        <button type="button" role="radio" aria-checked={mode === "light"} onClick={() => setMode("light")} className={seg} title="Light">
          <Sun className="w-3.5 h-3.5" /><span>Light</span>
        </button>
        <button type="button" role="radio" aria-checked={mode === "dark"} onClick={() => setMode("dark")} className={seg} title="Dark">
          <Moon className="w-3.5 h-3.5" /><span>Dark</span>
        </button>
      </div>
      <div role="radiogroup" aria-label="Colors" className={group}>
        <button type="button" role="radio" aria-checked={palette === "default"} onClick={() => setPalette("default")} className={seg} title="The editor's own colors">
          <span>Default</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={palette === "brand"}
          disabled={!brandAvailable}
          onClick={() => setPalette("brand")}
          className={seg}
          title={brandAvailable ? "Your brand's colors and font" : "Add a primary color in the Brand tab first"}
        >
          <Palette className="w-3.5 h-3.5" /><span>Brand</span>
        </button>
      </div>
    </div>
  );
}

/** Light or dark, then the default colors or the brand's, in one menu. */
function ThemeMenu() {
  const { mode, palette } = useEditorTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const ModeIcon = mode === "dark" ? Moon : Sun;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        title="Theme"
        className="h-[28px] px-2 rounded transition-all cursor-pointer border border-appborder bg-panelbg text-apptext hover:bg-appbg shadow-sm flex items-center gap-1"
      >
        <ModeIcon className="w-3.5 h-3.5" />
        {palette === "brand" && <Palette className="w-3.5 h-3.5 text-accent" />}
        <ChevronDown className="w-3 h-3 text-mutedtext" />
      </button>
      {open && (
        <div role="menu" aria-label="Theme" className="absolute right-0 top-full mt-1 z-50 w-56 p-1 rounded-md border border-appborder bg-panelbg shadow-lg text-[11px] font-semibold">
          <ThemeChoices onChosen={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

const divider = <Toolbar.Separator className="w-px h-4 bg-appborder mx-0.5" />;

const deviceButton =
  "px-2 flex items-center rounded transition-all cursor-pointer text-apptext hover:bg-panelbg hover:text-accent data-[state=on]:bg-accent data-[state=on]:text-white";

interface NavBarProps {
  panelToggles: ReactNode;
  /** The preview: the email as exported, in email clients, and its inbox score. */
  previewOpen: boolean;
  onTogglePreview: () => void;
  /** The device toolbar around the email, as a browser's "Toggle device toolbar". */
  deviceToolbar: boolean;
  onDeviceToolbarChange: (on: boolean) => void;
  deviceSize: DeviceSize;
  setDeviceSize: (size: DeviceSize) => void;
  /** A narrow screen: the controls move into a menu drawer, the panel toggles stay in the bar. */
  compact?: boolean;
}

function DeviceSizes({ deviceSize, setDeviceSize }: Pick<NavBarProps, "deviceSize" | "setDeviceSize">) {
  return (
    <Toolbar.DeviceGroup value={deviceSize} onValueChange={setDeviceSize} className="h-[28px] flex items-stretch gap-0.5 bg-appbg p-0.5 border border-appborder rounded">
      <Toolbar.DeviceButton device="desktop" title="Desktop view" className={deviceButton}>
        <Monitor className="w-3.5 h-3.5" />
      </Toolbar.DeviceButton>
      <Toolbar.DeviceButton device="tablet" title="Tablet view" className={deviceButton}>
        <Tablet className="w-3.5 h-3.5" />
      </Toolbar.DeviceButton>
      <Toolbar.DeviceButton device="mobile" title="Mobile view" className={deviceButton}>
        <Smartphone className="w-3.5 h-3.5" />
      </Toolbar.DeviceButton>
    </Toolbar.DeviceGroup>
  );
}

function DeviceToolbarButton({ deviceToolbar, onDeviceToolbarChange, label }: Pick<NavBarProps, "deviceToolbar" | "onDeviceToolbarChange"> & { label?: boolean }) {
  return (
    <Toolbar.DeviceToolbarToggle
      on={deviceToolbar}
      onOnChange={onDeviceToolbarChange}
      title={deviceToolbar ? "Hide the device toolbar" : "Toggle device toolbar: resize the email to any screen"}
      className={`h-[28px] ${label ? "px-2 gap-1.5" : "w-[28px]"} rounded transition-all cursor-pointer border shadow-sm bg-panelbg border-appborder text-mutedtext hover:text-apptext hover:bg-appbg flex items-center justify-center data-[state=on]:bg-accent data-[state=on]:border-accent data-[state=on]:text-white`}
    >
      <MonitorSmartphone className="w-3.5 h-3.5" />
      {label && <span className="text-[11px] leading-none">Device toolbar</span>}
    </Toolbar.DeviceToolbarToggle>
  );
}

function PreviewButton({ previewOpen, onTogglePreview, iconOnly }: Pick<NavBarProps, "previewOpen" | "onTogglePreview"> & { iconOnly?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={previewOpen}
      onClick={onTogglePreview}
      title={previewOpen ? "Back to the editor" : "The email as it will be sent, in Outlook and Gmail, and its inbox score"}
      aria-label="Preview"
      className={`h-[28px] ${iconOnly ? "w-[28px] justify-center" : "px-2"} rounded transition-all cursor-pointer border shadow-sm bg-panelbg border-appborder text-apptext hover:bg-appbg flex items-center gap-1 aria-pressed:bg-accent aria-pressed:border-accent aria-pressed:text-white`}
    >
      <Eye className="w-3.5 h-3.5" />
      {!iconOnly && <span className="text-[11px] leading-none">Preview</span>}
    </button>
  );
}

/** Clipboard refusals come from the browser, not the email, so only an export error goes to Envoy. */
const isClipboardError = (message: string) => /clipboard|permission|NotAllowed|denied|document is not focused/i.test(message);

function ExportButton() {
  const [failure, setFailure] = useState<string | null>(null);
  return (
    <>
      <Toolbar.CopyEmail
        title="Copy the email as HTML and plain text"
        onCopyFailed={(e) => setFailure(e instanceof Error ? e.message : String(e))}
        className="h-[28px] px-2 leading-none rounded transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold text-white border border-accent/25 bg-accent hover:bg-accent/90 data-[state=copied]:bg-emerald-600 data-[state=failed]:bg-red-600"
      >
        {({ state }) =>
          state === "copied" ? (
            <><Check className="w-3.5 h-3.5" /><span>Copied!</span></>
          ) : state === "failed" ? (
            <><TriangleAlert className="w-3.5 h-3.5" /><span>Failed</span></>
          ) : (
            <><Clipboard className="w-3.5 h-3.5" /><span>Export</span></>
          )
        }
      </Toolbar.CopyEmail>
      {failure && <ExportFailedDialog message={failure} onClose={() => setFailure(null)} />}
    </>
  );
}

/** Why the export failed, with a way to hand an email problem to Envoy. */
function ExportFailedDialog({ message, onClose }: { message: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const clipboard = isClipboardError(message);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose} data-testid="export-failed">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="export-failed-title"
        aria-describedby="export-failed-message"
        className="w-full max-w-md max-h-[min(80vh,520px)] rounded-lg border border-appborder bg-panelbg p-4 text-apptext shadow-2xl flex flex-col gap-3 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <TriangleAlert className="w-4 h-4 text-red-600 shrink-0" aria-hidden />
          <h2 id="export-failed-title" className="text-sm font-semibold">
            {clipboard ? "The email couldn't be copied" : "The email couldn't be exported"}
          </h2>
        </div>
        {/* A long error, such as a stack, scrolls here so the buttons stay in view. */}
        <div className="min-h-0 flex-1 overflow-auto flex flex-col gap-2 pr-1" data-testid="export-failed-details">
          <p id="export-failed-message" className="text-xs text-mutedtext break-words whitespace-pre-wrap">
            {clipboard
              ? "The browser didn't allow copying to the clipboard. Click in the page and try again, or allow clipboard access for this site."
              : message}
          </p>
          {clipboard && <p className="text-[11px] text-mutedtext break-words whitespace-pre-wrap">{message}</p>}
        </div>
        <div className="flex justify-end gap-2 shrink-0">
          {!clipboard && <AiButton request={{ kind: "task", title: "Fix the export error", prompt: exportErrorPrompt(message) }} />}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="h-[28px] px-3 rounded border border-appborder text-xs cursor-pointer hover:bg-appbg"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The header's controls in a drawer from the right, for a screen too narrow for the bar. */
function NavDrawer({ open, onClose, ...props }: NavBarProps & { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, onClose]);

  const section = (title: string) => <div className="text-[10px] font-bold uppercase tracking-wide text-mutedtext">{title}</div>;
  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} aria-hidden />
      <nav
        aria-label="Menu"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-[61] w-[min(300px,85vw)] flex flex-col bg-panelbg border-l border-appborder shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        data-testid="nav-drawer"
      >
        <div className="h-[var(--reb-header-height)] px-3 flex items-center justify-between border-b border-appborder bg-headerbg">
          <span className="text-xs font-bold uppercase tracking-wide text-apptext">Menu</span>
          <button type="button" onClick={onClose} aria-label="Close the menu" className="p-1 rounded text-mutedtext hover:text-apptext hover:bg-panelbg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 text-[11px] font-semibold flex flex-col gap-3">
          <section className="flex flex-col gap-1.5">
            {section("View")}
            <div className="flex flex-wrap items-center gap-1.5">
              <DeviceSizes deviceSize={props.deviceSize} setDeviceSize={props.setDeviceSize} />
              <DeviceToolbarButton deviceToolbar={props.deviceToolbar} onDeviceToolbarChange={props.onDeviceToolbarChange} />
              <PreviewButton previewOpen={props.previewOpen} onTogglePreview={() => { props.onTogglePreview(); onClose(); }} />
            </div>
          </section>
          <section className="flex flex-col gap-1.5">
            {section("Theme")}
            <ThemeSwitches />
          </section>
          <section className="flex flex-col gap-1.5">
            {section("Email")}
            <ExportButton />
          </section>
        </div>
        {/* Out of the way at the bottom, as it can't be undone. */}
        <div className="p-3 border-t border-appborder">
          <ClearCanvasButton full onCleared={onClose} />
        </div>
      </nav>
    </>
  );
}

/**
 * The page header. The library's toolbar parts bring the behavior; every bit of
 * the look here is the app's own. On a narrow screen, the controls move into a
 * menu drawer from the right, and the panel toggles stay in the bar.
 */
export function NavBar(props: NavBarProps) {
  const { compact = false, panelToggles } = props;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Toolbar.Root aria-label="Email builder" className="h-[var(--reb-header-height)] px-3 border-b border-appborder flex gap-1.5 items-center bg-headerbg text-apptext shadow-sm select-none w-full">
      {/* Left: the name only. Right: every control. */}
      <BrandTitle />

      {compact ? (
        <div className="ml-auto flex items-center gap-1.5">
          {panelToggles}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open the menu"
            aria-expanded={menuOpen}
            className="h-[28px] w-[28px] rounded border border-appborder bg-panelbg text-apptext hover:bg-appbg shadow-sm flex items-center justify-center cursor-pointer"
            data-testid="nav-menu-button"
          >
            <Menu className="w-4 h-4" />
          </button>
          <NavDrawer {...props} open={menuOpen} onClose={() => setMenuOpen(false)} />
        </div>
      ) : (
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold">
          <DeviceSizes deviceSize={props.deviceSize} setDeviceSize={props.setDeviceSize} />
          <DeviceToolbarButton deviceToolbar={props.deviceToolbar} onDeviceToolbarChange={props.onDeviceToolbarChange} />
          {divider}
          <PreviewButton previewOpen={props.previewOpen} onTogglePreview={props.onTogglePreview} />
          {divider}
          <ThemeMenu />
          {divider}
          <ClearCanvasButton />
          {divider}
          <ExportButton />
          {divider}
          {panelToggles}
        </div>
      )}
    </Toolbar.Root>
  );
}
