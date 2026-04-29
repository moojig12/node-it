import { useCategoryList } from '../../hooks/useCategoryList.js';

/**
 * Design-only scaffold for the canvas. Renders the host container, the
 * dot-grid background (via App.css `.canvas-host`), and the loading /
 * empty / error states.
 *
 * The actual category-as-dots rendering, dragging, and selection is left
 * for a Konva implementation — drop a <Stage> + <Layer> inside the
 * `<div className="canvas-host">` below and pull `list` from the hook.
 *
 * Reserved CSS classes that already match the brand: `.canvas-host`,
 * `.canvas-empty`, `.canvas-selection-bar`, `.csb-summary`, `.csb-name`,
 * `.csb-meta`, `.csb-actions`.
 */
function CanvasView() {
  const { list, error } = useCategoryList();

  if (error) {
    return (
      <div className="canvas-host">
        <div className="canvas-empty error-text">{error}</div>
      </div>
    );
  }

  if (list === null) {
    return (
      <div className="canvas-host">
        <div className="canvas-empty muted">Loading categories…</div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="canvas-host">
        <div className="canvas-empty">
          <p>No categories yet.</p>
          <p className="muted">
            Use <strong>+ New</strong> in the sidebar to create one.
          </p>
        </div>
      </div>
    );
  }

  return <div className="canvas-host" />;
}

export default CanvasView;
