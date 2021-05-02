/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxImage from '../util/image/mxImage';
import mxClient from '../mxClient';
import {
  DEFAULT_VALID_COLOR,
  DIALECT_MIXEDHTML,
  DIALECT_SVG,
  HIGHLIGHT_OPACITY,
  HIGHLIGHT_SIZE,
  HIGHLIGHT_STROKEWIDTH,
} from '../util/mxConstants';
import mxEvent from '../util/event/mxEvent';
import mxUtils from '../util/mxUtils';
import mxRectangle from '../util/datatypes/mxRectangle';
import mxImageShape from '../shape/node/mxImageShape';
import mxRectangleShape from '../shape/node/mxRectangleShape';
import { isShiftDown } from '../util/mxEventUtils';

/**
 * Handles constraints on connection targets. This class is in charge of
 * showing fixed points when the mouse is over a vertex and handles constraints
 * to establish new connections.
 *
 * @class mxConstraintHandler
 */
class mxConstraintHandler {
  constructor(graph) {
    this.graph = graph;

    // Adds a graph model listener to update the current focus on changes
    this.resetHandler = (sender, evt) => {
      if (
        this.currentFocus != null &&
        this.graph.view.getState(this.currentFocus.cell) == null
      ) {
        this.reset();
      } else {
        this.redraw();
      }
    };

    this.graph.model.addListener(mxEvent.CHANGE, this.resetHandler);
    this.graph.view.addListener(mxEvent.SCALE_AND_TRANSLATE, this.resetHandler);
    this.graph.view.addListener(mxEvent.TRANSLATE, this.resetHandler);
    this.graph.view.addListener(mxEvent.SCALE, this.resetHandler);
    this.graph.addListener(mxEvent.ROOT, this.resetHandler);
  }

  /**
   * {@link mxImage} to be used as the image for fixed connection points.
   */
  // pointImage: mxImage;
  pointImage = new mxImage(`${mxClient.imageBasePath}/point.gif`, 5, 5);

  /**
   * Reference to the enclosing {@link mxGraph}.
   */
  // graph: mxGraph;
  graph = null;

  /**
   * Specifies if events are handled. Default is true.
   */
  // enabled: boolean;
  enabled = true;

  /**
   * Specifies the color for the highlight. Default is {@link DEFAULT_VALID_COLOR}.
   */
  // highlightColor: string;
  highlightColor = DEFAULT_VALID_COLOR;

  /**
   * Returns true if events are handled. This implementation
   * returns {@link enabled}.
   */
  // isEnabled(): boolean;
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates {@link enabled}.
   *
   * Parameters:
   *
   * @param {boolean} enabled - Boolean that specifies the new enabled state.
   */
  // setEnabled(enabled: boolean): void;
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Resets the state of this handler.
   */
  // reset(): void;
  reset() {
    if (this.focusIcons != null) {
      for (let i = 0; i < this.focusIcons.length; i += 1) {
        this.focusIcons[i].destroy();
      }

      this.focusIcons = null;
    }

    if (this.focusHighlight != null) {
      this.focusHighlight.destroy();
      this.focusHighlight = null;
    }

    this.currentConstraint = null;
    this.currentFocusArea = null;
    this.currentPoint = null;
    this.currentFocus = null;
    this.focusPoints = null;
  }

  /**
   * Returns the tolerance to be used for intersecting connection points. This
   * implementation returns {@link mxGraph.tolerance}.
   *
   * Parameters:
   *
   * me - {@link mxMouseEvent} whose tolerance should be returned.
   */
  // getTolerance(me: mxMouseEvent): number;
  getTolerance(me) {
    return this.graph.getTolerance();
  }

  /**
   * Returns the tolerance to be used for intersecting connection points.
   */
  // getImageForConstraint(state: mxCellState, constraint: mxConnectionConstraint, point: mxPoint): mxImage;
  getImageForConstraint(state, constraint, point) {
    return this.pointImage;
  }

  /**
   * Returns true if the given {@link mxMouseEvent} should be ignored in {@link update}. This
   * implementation always returns false.
   */
  // isEventIgnored(me: mxMouseEvent, source: boolean): boolean;
  isEventIgnored(me, source) {
    return false;
  }

  /**
   * Returns true if the given state should be ignored. This always returns false.
   */
  // isStateIgnored(state: mxCellState, source: boolean): boolean;
  isStateIgnored(state, source) {
    return false;
  }

  /**
   * Destroys the {@link focusIcons} if they exist.
   */
  // destroyIcons(): void;
  destroyIcons() {
    if (this.focusIcons != null) {
      for (let i = 0; i < this.focusIcons.length; i += 1) {
        this.focusIcons[i].destroy();
      }

      this.focusIcons = null;
      this.focusPoints = null;
    }
  }

  /**
   * Destroys the {@link focusHighlight} if one exists.
   */
  // destroyFocusHighlight(): void;
  destroyFocusHighlight() {
    if (this.focusHighlight != null) {
      this.focusHighlight.destroy();
      this.focusHighlight = null;
    }
  }

  /**
   * Returns true if the current focused state should not be changed for the given event.
   * This returns true if shift and alt are pressed.
   */
  // isKeepFocusEvent(me: mxMouseEvent): boolean;
  isKeepFocusEvent(me) {
    return isShiftDown(me.getEvent());
  }

  /**
   * Returns the cell for the given event.
   */
  // getCellForEvent(me: mxMouseEvent, point: mxPoint): mxCell;
  getCellForEvent(me, point) {
    let cell = me.getCell();

    // Gets cell under actual point if different from event location
    if (
      cell == null &&
      point != null &&
      (me.getGraphX() !== point.x || me.getGraphY() !== point.y)
    ) {
      cell = this.graph.getCellAt(point.x, point.y);
    }

    // Uses connectable parent vertex if one exists
    if (cell != null && !cell.isConnectable()) {
      const parent = cell.getParent();

      if (parent.isVertex() && parent.isConnectable()) {
        cell = parent;
      }
    }

    if (cell) {
      return this.graph.isCellLocked(cell) ? null : cell;
    } else {
      return null;
    }
  }

  /**
   * Updates the state of this handler based on the given {@link mxMouseEvent}.
   * Source is a boolean indicating if the cell is a source or target.
   */
  // update(me: mxMouseEvent, source: mxCell, existingEdge: mxCell, point: mxPoint): void;
  update(me, source, existingEdge, point) {
    if (this.isEnabled() && !this.isEventIgnored(me)) {
      // Lazy installation of mouseleave handler
      if (this.mouseleaveHandler == null && this.graph.container != null) {
        this.mouseleaveHandler = () => {
          this.reset();
        };

        mxEvent.addListener(
          this.graph.container,
          'mouseleave',
          this.resetHandler
        );
      }

      const tol = this.getTolerance(me);
      const x = point != null ? point.x : me.getGraphX();
      const y = point != null ? point.y : me.getGraphY();
      const grid = new mxRectangle(x - tol, y - tol, 2 * tol, 2 * tol);
      const mouse = new mxRectangle(
        me.getGraphX() - tol,
        me.getGraphY() - tol,
        2 * tol,
        2 * tol
      );
      const state = this.graph.view.getState(this.getCellForEvent(me, point));

      // Keeps focus icons visible while over vertex bounds and no other cell under mouse or shift is pressed
      if (
        !this.isKeepFocusEvent(me) &&
        (this.currentFocusArea == null ||
          this.currentFocus == null ||
          state != null ||
          !this.currentFocus.cell.isVertex() ||
          !mxUtils.intersects(this.currentFocusArea, mouse)) &&
        state !== this.currentFocus
      ) {
        this.currentFocusArea = null;
        this.currentFocus = null;
        this.setFocus(me, state, source);
      }

      this.currentConstraint = null;
      this.currentPoint = null;
      let minDistSq = null;

      let tmp;

      if (
        this.focusIcons != null &&
        this.constraints != null &&
        (state == null || this.currentFocus === state)
      ) {
        const cx = mouse.getCenterX();
        const cy = mouse.getCenterY();

        for (let i = 0; i < this.focusIcons.length; i += 1) {
          const dx = cx - this.focusIcons[i].bounds.getCenterX();
          const dy = cy - this.focusIcons[i].bounds.getCenterY();
          tmp = dx * dx + dy * dy;

          if (
            (this.intersects(this.focusIcons[i], mouse, source, existingEdge) ||
              (point != null &&
                this.intersects(
                  this.focusIcons[i],
                  grid,
                  source,
                  existingEdge
                ))) &&
            (minDistSq == null || tmp < minDistSq)
          ) {
            this.currentConstraint = this.constraints[i];
            this.currentPoint = this.focusPoints[i];
            minDistSq = tmp;

            tmp = this.focusIcons[i].bounds.clone();
            tmp.grow(HIGHLIGHT_SIZE + 1);
            tmp.width -= 1;
            tmp.height -= 1;

            if (this.focusHighlight == null) {
              const hl = this.createHighlightShape();
              hl.dialect = DIALECT_SVG;
              hl.pointerEvents = false;

              hl.init(this.graph.getView().getOverlayPane());
              this.focusHighlight = hl;

              const getState = () => {
                return this.currentFocus != null ? this.currentFocus : state;
              };

              mxEvent.redirectMouseEvents(hl.node, this.graph, getState);
            }

            this.focusHighlight.bounds = tmp;
            this.focusHighlight.redraw();
          }
        }
      }

      if (this.currentConstraint == null) {
        this.destroyFocusHighlight();
      }
    } else {
      this.currentConstraint = null;
      this.currentFocus = null;
      this.currentPoint = null;
    }
  }

  /**
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  // redraw(): void;
  redraw() {
    if (
      this.currentFocus != null &&
      this.constraints != null &&
      this.focusIcons != null
    ) {
      const state = this.graph.view.getState(this.currentFocus.cell);
      this.currentFocus = state;
      this.currentFocusArea = new mxRectangle(
        state.x,
        state.y,
        state.width,
        state.height
      );

      for (let i = 0; i < this.constraints.length; i += 1) {
        const cp = this.graph.getConnectionPoint(state, this.constraints[i]);
        const img = this.getImageForConstraint(state, this.constraints[i], cp);

        const bounds = new mxRectangle(
          Math.round(cp.x - img.width / 2),
          Math.round(cp.y - img.height / 2),
          img.width,
          img.height
        );
        this.focusIcons[i].bounds = bounds;
        this.focusIcons[i].redraw();
        this.currentFocusArea.add(this.focusIcons[i].bounds);
        this.focusPoints[i] = cp;
      }
    }
  }

  /**
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  // setFocus(me: mxMouseEvent, state: mxCellState, source: mxCell): void;
  setFocus(me, state, source) {
    this.constraints =
      state != null &&
      !this.isStateIgnored(state, source) &&
      state.cell.isConnectable()
        ? this.isEnabled()
          ? this.graph.getAllConnectionConstraints(state, source) || []
          : []
        : null;

    // Only uses cells which have constraints
    if (this.constraints != null) {
      this.currentFocus = state;
      this.currentFocusArea = new mxRectangle(
        state.x,
        state.y,
        state.width,
        state.height
      );

      if (this.focusIcons != null) {
        for (let i = 0; i < this.focusIcons.length; i += 1) {
          this.focusIcons[i].destroy();
        }

        this.focusIcons = null;
        this.focusPoints = null;
      }

      this.focusPoints = [];
      this.focusIcons = [];

      for (let i = 0; i < this.constraints.length; i += 1) {
        const cp = this.graph.getConnectionPoint(state, this.constraints[i]);
        const img = this.getImageForConstraint(state, this.constraints[i], cp);

        const { src } = img;
        const bounds = new mxRectangle(
          Math.round(cp.x - img.width / 2),
          Math.round(cp.y - img.height / 2),
          img.width,
          img.height
        );
        const icon = new mxImageShape(bounds, src);
        icon.dialect =
          this.graph.dialect !== DIALECT_SVG ? DIALECT_MIXEDHTML : DIALECT_SVG;
        icon.preserveImageAspect = false;
        icon.init(this.graph.getView().getDecoratorPane());

        // Move the icon behind all other overlays
        if (icon.node.previousSibling != null) {
          icon.node.parentNode.insertBefore(
            icon.node,
            icon.node.parentNode.firstChild
          );
        }

        const getState = () => {
          return this.currentFocus != null ? this.currentFocus : state;
        };

        icon.redraw();

        mxEvent.redirectMouseEvents(icon.node, this.graph, getState);
        this.currentFocusArea.add(icon.bounds);
        this.focusIcons.push(icon);
        this.focusPoints.push(cp);
      }

      this.currentFocusArea.grow(this.getTolerance(me));
    } else {
      this.destroyIcons();
      this.destroyFocusHighlight();
    }
  }

  /**
   * Create the shape used to paint the highlight.
   *
   * Returns true if the given icon intersects the given point.
   */
  // createHighlightShape(): mxShape;
  createHighlightShape() {
    const hl = new mxRectangleShape(
      null,
      this.highlightColor,
      this.highlightColor,
      HIGHLIGHT_STROKEWIDTH
    );
    hl.opacity = HIGHLIGHT_OPACITY;

    return hl;
  }

  /**
   * Returns true if the given icon intersects the given rectangle.
   */
  // intersects(icon: mxShape, mouse: mxRectangle, source: mxCell, existingEdge: mxCell): boolean;
  intersects(icon, mouse, source, existingEdge) {
    return mxUtils.intersects(icon.bounds, mouse);
  }

  /**
   * Destroy this handler.
   */
  // destroy(): void;
  destroy() {
    this.reset();

    if (this.resetHandler != null) {
      this.graph.model.removeListener(this.resetHandler);
      this.graph.view.removeListener(this.resetHandler);
      this.graph.removeListener(this.resetHandler);
      this.resetHandler = null;
    }

    if (this.mouseleaveHandler != null && this.graph.container != null) {
      mxEvent.removeListener(
        this.graph.container,
        'mouseleave',
        this.mouseleaveHandler
      );
      this.mouseleaveHandler = null;
    }
  }
}

export default mxConstraintHandler;
