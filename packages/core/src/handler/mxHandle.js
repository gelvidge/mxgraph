/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxUtils from '../util/mxUtils';
import mxPoint from '../util/datatypes/mxPoint';
import mxImageShape from '../shape/node/mxImageShape';
import mxRectangle from '../util/datatypes/mxRectangle';
import mxRectangleShape from '../shape/node/mxRectangleShape';
import {
  DIALECT_STRICTHTML,
  DIALECT_SVG,
  HANDLE_FILLCOLOR,
  HANDLE_SIZE,
  HANDLE_STROKECOLOR,
} from '../util/mxConstants';
import mxEvent from '../util/event/mxEvent';

/**
 * Implements a single custom handle for vertices.
 *
 * @class mxHandle
 */
class mxHandle {
  constructor(state, cursor, image, shape) {
    this.graph = state.view.graph;
    this.state = state;
    this.cursor = cursor != null ? cursor : this.cursor;
    this.image = image != null ? image : this.image;
    this.shape = shape != null ? shape : null;
    this.init();
  }

  /**
   * Specifies the cursor to be used for this handle. Default is 'default'.
   */
  // cursor: string;
  cursor = 'default';

  /**
   * Specifies the <mxImage> to be used to render the handle. Default is null.
   */
  // image: mxImage;
  image = null;

  /**
   * Default is false.
   */
  // ignoreGrid: boolean;
  ignoreGrid = false;

  /**
   * Hook for subclassers to return the current position of the handle.
   */
  // getPosition(bounds: mxRectangle): any;
  getPosition(bounds) {}

  /**
   * Hooks for subclassers to update the style in the <state>.
   */
  // setPosition(bounds: mxRectangle, pt: any, me: any): any;
  setPosition(bounds, pt, me) {}

  /**
   * Hook for subclassers to execute the handle.
   */
  // execute(me: mxMouseEvent): void;
  execute(me) {}

  /**
   * Sets the cell style with the given name to the corresponding value in <state>.
   */
  // copyStyle(key: string): void;
  copyStyle(key) {
    this.graph.setCellStyles(key, this.state.style[key], [this.state.cell]);
  }

  /**
   * Processes the given <mxMouseEvent> and invokes <setPosition>.
   */
  // processEvent(me: mxMouseEvent): void;
  processEvent(me) {
    const { scale } = this.graph.view;
    const tr = this.graph.view.translate;
    let pt = new mxPoint(
      me.getGraphX() / scale - tr.x,
      me.getGraphY() / scale - tr.y
    );

    // Center shape on mouse cursor
    if (this.shape != null && this.shape.bounds != null) {
      pt.x -= this.shape.bounds.width / scale / 4;
      pt.y -= this.shape.bounds.height / scale / 4;
    }

    // Snaps to grid for the rotated position then applies the rotation for the direction after that
    const alpha1 = -mxUtils.toRadians(this.getRotation());
    const alpha2 = -mxUtils.toRadians(this.getTotalRotation()) - alpha1;
    pt = this.flipPoint(
      this.rotatePoint(
        this.snapPoint(
          this.rotatePoint(pt, alpha1),
          this.ignoreGrid || !this.graph.isGridEnabledEvent(me.getEvent())
        ),
        alpha2
      )
    );
    this.setPosition(this.state.getPaintBounds(), pt, me);
    this.redraw();
  }

  /**
   * Should be called after <setPosition> in <processEvent>.
   * This repaints the state using <mxCellRenderer>.
   */
  // positionChanged(): void;
  positionChanged() {
    if (this.state.text != null) {
      this.state.text.apply(this.state);
    }

    if (this.state.shape != null) {
      this.state.shape.apply(this.state);
    }

    this.graph.cellRenderer.redraw(this.state, true);
  }

  /**
   * Returns the rotation defined in the style of the cell.
   */
  // getRotation(): number;
  getRotation() {
    if (this.state.shape != null) {
      return this.state.shape.getRotation();
    }

    return 0;
  }

  /**
   * Returns the rotation from the style and the rotation from the direction of
   * the cell.
   */
  // getTotalRotation(): number;
  getTotalRotation() {
    if (this.state.shape != null) {
      return this.state.shape.getShapeRotation();
    }

    return 0;
  }

  /**
   * Creates and initializes the shapes required for this handle.
   */
  // init(): void;
  init() {
    const html = this.isHtmlRequired();

    if (this.image != null) {
      this.shape = new mxImageShape(
        new mxRectangle(0, 0, this.image.width, this.image.height),
        this.image.src
      );
      this.shape.preserveImageAspect = false;
    } else if (this.shape == null) {
      this.shape = this.createShape(html);
    }

    this.initShape(html);
  }

  /**
   * Creates and returns the shape for this handle.
   */
  // createShape(html: any): mxShape;
  createShape(html) {
    const bounds = new mxRectangle(0, 0, HANDLE_SIZE, HANDLE_SIZE);

    return new mxRectangleShape(bounds, HANDLE_FILLCOLOR, HANDLE_STROKECOLOR);
  }

  /**
   * Initializes <shape> and sets its cursor.
   */
  // initShape(html: any): void;
  initShape(html) {
    if (html && this.shape.isHtmlAllowed()) {
      this.shape.dialect = DIALECT_STRICTHTML;
      this.shape.init(this.graph.container);
    } else {
      this.shape.dialect =
        this.graph.dialect !== DIALECT_SVG ? DIALECT_MIXEDHTML : DIALECT_SVG;

      if (this.cursor != null) {
        this.shape.init(this.graph.getView().getOverlayPane());
      }
    }

    mxEvent.redirectMouseEvents(this.shape.node, this.graph, this.state);
    this.shape.node.style.cursor = this.cursor;
  }

  /**
   * Renders the shape for this handle.
   */
  // redraw(): void;
  redraw() {
    if (this.shape != null && this.state.shape != null) {
      let pt = this.getPosition(this.state.getPaintBounds());

      if (pt != null) {
        const alpha = mxUtils.toRadians(this.getTotalRotation());
        pt = this.rotatePoint(this.flipPoint(pt), alpha);

        const { scale } = this.graph.view;
        const tr = this.graph.view.translate;
        this.shape.bounds.x = Math.floor(
          (pt.x + tr.x) * scale - this.shape.bounds.width / 2
        );
        this.shape.bounds.y = Math.floor(
          (pt.y + tr.y) * scale - this.shape.bounds.height / 2
        );

        // Needed to force update of text bounds
        this.shape.redraw();
      }
    }
  }

  /**
   * Returns true if this handle should be rendered in HTML. This returns true if
   * the text node is in the graph container.
   */
  // isHtmlRequired(): boolean;
  isHtmlRequired() {
    return (
      this.state.text != null &&
      this.state.text.node.parentNode === this.graph.container
    );
  }

  /**
   * Rotates the point by the given angle.
   */
  // rotatePoint(pt: mxPoint, alpha: boolean): mxPoint;
  rotatePoint(pt, alpha) {
    const bounds = this.state.getCellBounds();
    const cx = new mxPoint(bounds.getCenterX(), bounds.getCenterY());
    const cos = Math.cos(alpha);
    const sin = Math.sin(alpha);

    return mxUtils.getRotatedPoint(pt, cos, sin, cx);
  }

  /**
   * Flips the given point vertically and/or horizontally.
   */
  // flipPoint(pt: mxPoint): mxPoint;
  flipPoint(pt) {
    if (this.state.shape != null) {
      const bounds = this.state.getCellBounds();

      if (this.state.shape.flipH) {
        pt.x = 2 * bounds.x + bounds.width - pt.x;
      }

      if (this.state.shape.flipV) {
        pt.y = 2 * bounds.y + bounds.height - pt.y;
      }
    }

    return pt;
  }

  /**
   * Snaps the given point to the grid if ignore is false. This modifies
   * the given point in-place and also returns it.
   */
  // snapPoint(pt: mxPoint, ignore: boolean): mxPoint;
  snapPoint(pt, ignore) {
    if (!ignore) {
      pt.x = this.graph.snap(pt.x);
      pt.y = this.graph.snap(pt.y);
    }

    return pt;
  }

  /**
   * Shows or hides this handle.
   */
  // setVisible(visible: boolean): void;
  setVisible(visible) {
    if (this.shape != null && this.shape.node != null) {
      this.shape.node.style.display = visible ? '' : 'none';
    }
  }

  /**
   * Resets the state of this handle by setting its visibility to true.
   */
  // reset(): void;
  reset() {
    this.setVisible(true);
    this.state.style = this.graph.getCellStyle(this.state.cell);
    this.positionChanged();
  }

  /**
   * Destroys this handle.
   */
  // destroy(): void;
  destroy() {
    if (this.shape != null) {
      this.shape.destroy();
      this.shape = null;
    }
  }
}

export default mxHandle;
