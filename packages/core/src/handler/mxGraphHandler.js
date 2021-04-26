/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxClient from '../mxClient';
import mxEvent from '../util/event/mxEvent';
import mxUtils from '../util/mxUtils';
import mxRectangleShape from '../shape/node/mxRectangleShape';
import mxGuide from '../util/mxGuide';
import mxPoint from '../util/datatypes/mxPoint';
import mxConstants from '../util/mxConstants';
import mxDictionary from '../util/datatypes/mxDictionary';
import mxCellHighlight from './mxCellHighlight';
import mxRectangle from '../util/datatypes/mxRectangle';
import { getClientX, getClientY, isAltDown, isMultiTouchEvent } from '../util/mxEventUtils';

/**
 * Class: mxGraphHandler
 *
 * Graph event handler that handles selection. Individual cells are handled
 * separately using <mxVertexHandler> or one of the edge handlers. These
 * handlers are created using <mxGraph.createHandler> in
 * <mxGraphSelectionModel.cellAdded>.
 *
 * To avoid the container to scroll a moved cell into view, set
 * <scrollAfterMove> to false.
 *
 * Constructor: mxGraphHandler
 *
 * Constructs an event handler that creates handles for the
 * selection cells.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
class mxGraphHandler {
  constructor(graph) {
    this.graph = graph;
    this.graph.addMouseListener(this);

    // Repaints the handler after autoscroll
    this.panHandler = () => {
      if (!this.suspended) {
        this.updatePreview();
        this.updateHint();
      }
    };

    this.graph.addListener(mxEvent.PAN, this.panHandler);

    // Handles escape keystrokes
    this.escapeHandler = mxUtils.bind(this, (sender, evt) => {
      this.reset();
    });

    this.graph.addListener(mxEvent.ESCAPE, this.escapeHandler);

    // Updates the preview box for remote changes
    this.refreshHandler = (sender, evt) => {
      // Merges multiple pending calls
      if (this.refreshThread) {
        window.clearTimeout(this.refreshThread);
      }

      // Waits for the states and handlers to be updated
      this.refreshThread = window.setTimeout(
        mxUtils.bind(this, () => {
          this.refreshThread = null;

          if (this.first != null && !this.suspended) {
            // Updates preview with no translate to compute bounding box
            const dx = this.currentDx;
            const dy = this.currentDy;
            this.currentDx = 0;
            this.currentDy = 0;
            this.updatePreview();
            this.bounds = this.graph.getView().getBounds(this.cells);
            this.pBounds = this.getPreviewBounds(this.cells);

            if (this.pBounds == null && !this.livePreviewUsed) {
              this.reset();
            } else {
              // Restores translate and updates preview
              this.currentDx = dx;
              this.currentDy = dy;
              this.updatePreview();
              this.updateHint();

              if (this.livePreviewUsed) {
                // Forces update to ignore last visible state
                this.setHandlesVisibleForCells(
                  this.graph.selectionCellsHandler.getHandledSelectionCells(),
                  false,
                  true
                );
                this.updatePreview();
              }
            }
          }
        }),
        0
      );
    };

    this.graph.getModel().addListener(mxEvent.CHANGE, this.refreshHandler);
    this.graph.addListener(mxEvent.REFRESH, this.refreshHandler);

    this.keyHandler = e => {
      if (
        this.graph.container != null &&
        this.graph.container.style.visibility !== 'hidden' &&
        this.first != null &&
        !this.suspended
      ) {
        const clone =
          this.graph.isCloneEvent(e) &&
          this.graph.isCellsCloneable() &&
          this.isCloneEnabled();

        if (clone !== this.cloning) {
          this.cloning = clone;
          this.checkPreview();
          this.updatePreview();
        }
      }
    };

    if (typeof document !== 'undefined') {
      mxEvent.addListener(document, 'keydown', this.keyHandler);
      mxEvent.addListener(document, 'keyup', this.keyHandler);
    }
  }

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  // graph: mxGraph;
  graph = null;

  /**
   * Variable: maxCells
   *
   * Defines the maximum number of cells to paint subhandles
   * for. Default is 50 for Firefox and 20 for IE. Set this
   * to 0 if you want an unlimited number of handles to be
   * displayed. This is only recommended if the number of
   * cells in the graph is limited to a small number, eg.
   * 500.
   */
  // maxCells: number;
  maxCells = 50;

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  // enabled: boolean;
  enabled = true;

  /**
   * Variable: highlightEnabled
   *
   * Specifies if drop targets under the mouse should be enabled. Default is
   * true.
   */
  // highlightEnabled: boolean;
  highlightEnabled = true;

  /**
   * Variable: cloneEnabled
   *
   * Specifies if cloning by control-drag is enabled. Default is true.
   */
  // cloneEnabled: boolean;
  cloneEnabled = true;

  /**
   * Variable: moveEnabled
   *
   * Specifies if moving is enabled. Default is true.
   */
  // moveEnabled: boolean;
  moveEnabled = true;

  /**
   * Variable: guidesEnabled
   *
   * Specifies if other cells should be used for snapping the right, center or
   * left side of the current selection. Default is false.
   */
  // guidesEnabled: boolean;
  guidesEnabled = false;

  /**
   * Variable: handlesVisible
   *
   * Whether the handles of the selection are currently visible.
   */
  handlesVisible = true;

  /**
   * Variable: guide
   *
   * Holds the <mxGuide> instance that is used for alignment.
   */
  // guide: mxGuide;
  guide = null;

  /**
   * Variable: currentDx
   *
   * Stores the x-coordinate of the current mouse move.
   */
  // currentDx: number;
  currentDx = null;

  /**
   * Variable: currentDy
   *
   * Stores the y-coordinate of the current mouse move.
   */
  // currentDy: number;
  currentDy = null;

  /**
   * Variable: updateCursor
   *
   * Specifies if a move cursor should be shown if the mouse is over a movable
   * cell. Default is true.
   */
  // updateCursor: boolean;
  updateCursor = true;

  /**
   * Variable: selectEnabled
   *
   * Specifies if selecting is enabled. Default is true.
   */
  // selectEnabled: boolean;
  selectEnabled = true;

  /**
   * Variable: removeCellsFromParent
   *
   * Specifies if cells may be moved out of their parents. Default is true.
   */
  // removeCellsFromParent: boolean;
  removeCellsFromParent = true;

  /**
   * Variable: removeEmptyParents
   *
   * If empty parents should be removed from the model after all child cells
   * have been moved out. Default is true.
   */
  removeEmptyParents = false;

  /**
   * Variable: connectOnDrop
   *
   * Specifies if drop events are interpreted as new connections if no other
   * drop action is defined. Default is false.
   */
  // connectOnDrop: boolean;
  connectOnDrop = false;

  /**
   * Variable: scrollOnMove
   *
   * Specifies if the view should be scrolled so that a moved cell is
   * visible. Default is true.
   */
  // scrollOnMove: boolean;
  scrollOnMove = true;

  /**
   * Variable: minimumSize
   *
   * Specifies the minimum number of pixels for the width and height of a
   * selection border. Default is 6.
   */
  // minimumSize: number;
  minimumSize = 6;

  /**
   * Variable: previewColor
   *
   * Specifies the color of the preview shape. Default is black.
   */
  // previewColor: string;
  previewColor = 'black';

  /**
   * Variable: htmlPreview
   *
   * Specifies if the graph container should be used for preview. If this is used
   * then drop target detection relies entirely on <mxGraph.getCellAt> because
   * the HTML preview does not "let events through". Default is false.
   */
  // htmlPreview: boolean;
  htmlPreview = false;

  /**
   * Variable: shape
   *
   * Reference to the <mxShape> that represents the preview.
   */
  // shape: mxShape;
  shape = null;

  /**
   * Variable: scaleGrid
   *
   * Specifies if the grid should be scaled. Default is false.
   */
  // scaleGrid: boolean;
  scaleGrid = false;

  /**
   * Variable: rotationEnabled
   *
   * Specifies if the bounding box should allow for rotation. Default is true.
   */
  // rotationEnabled: boolean;
  rotationEnabled = true;

  /**
   * Variable: maxLivePreview
   *
   * Maximum number of cells for which live preview should be used.  Default is 0 which means no live preview.
   */
  // maxLivePreview: number;
  maxLivePreview = 0;

  /**
   * Variable allowLivePreview
   *
   * If live preview is allowed on this system.  Default is true for systems with SVG support.
   */
  // allowLivePreview: boolean;
  allowLivePreview = mxClient.IS_SVG;

  /**
   * Function: isEnabled
   *
   * Returns <enabled>.
   */
  // isEnabled(): boolean;
  isEnabled() {
    return this.enabled;
  }

  /**
   * Function: setEnabled
   *
   * Sets <enabled>.
   */
  // setEnabled(value: boolean): void;
  setEnabled(value) {
    this.enabled = value;
  }

  /**
   * Function: isCloneEnabled
   *
   * Returns <cloneEnabled>.
   */
  // isCloneEnabled(): boolean;
  isCloneEnabled() {
    return this.cloneEnabled;
  }

  /**
   * Function: setCloneEnabled
   *
   * Sets <cloneEnabled>.
   *
   * Parameters:
   *
   * value - Boolean that specifies the new clone enabled state.
   */
  // setCloneEnabled(value: boolean): void;
  setCloneEnabled(value) {
    this.cloneEnabled = value;
  }

  /**
   * Function: isMoveEnabled
   *
   * Returns <moveEnabled>.
   */
  // isMoveEnabled(): boolean;
  isMoveEnabled() {
    return this.moveEnabled;
  }

  /**
   * Function: setMoveEnabled
   *
   * Sets <moveEnabled>.
   */
  // setMoveEnabled(value: boolean): void;
  setMoveEnabled(value) {
    this.moveEnabled = value;
  }

  /**
   * Function: isSelectEnabled
   *
   * Returns <selectEnabled>.
   */
  // isSelectEnabled(): boolean;
  isSelectEnabled() {
    return this.selectEnabled;
  }

  /**
   * Function: setSelectEnabled
   *
   * Sets <selectEnabled>.
   */
  // setSelectEnabled(value: boolean): void;
  setSelectEnabled(value) {
    this.selectEnabled = value;
  }

  /**
   * Function: isRemoveCellsFromParent
   *
   * Returns <removeCellsFromParent>.
   */
  // isRemoveCellsFromParent(): boolean;
  isRemoveCellsFromParent() {
    return this.removeCellsFromParent;
  }

  /**
   * Function: setRemoveCellsFromParent
   *
   * Sets <removeCellsFromParent>.
   */
  // setRemoveCellsFromParent(value: boolean): void;
  setRemoveCellsFromParent(value) {
    this.removeCellsFromParent = value;
  }

  /**
   * Function: isPropagateSelectionCell
   *
   * Returns true if the given cell and parent should propagate
   * selection state to the parent.
   */
  isPropagateSelectionCell(cell, immediate, me) {
    const parent = cell.getParent();

    if (immediate) {
      const geo = cell.isEdge()
        ? null
        : this.graph.getCellGeometry(cell);

      return (
        !this.graph.isSiblingSelected(cell) &&
        ((geo != null && geo.relative) || !this.graph.isSwimlane(parent))
      );
    }
    return (
      (!this.graph.isToggleEvent(me.getEvent()) ||
        (!this.graph.isSiblingSelected(cell) &&
          !this.graph.isCellSelected(cell) &&
          !this.graph.isSwimlane(parent)) ||
        this.graph.isCellSelected(parent)) &&
      (this.graph.isToggleEvent(me.getEvent()) ||
        !this.graph.isCellSelected(parent))
    );
  }

  /**
   * Function: getInitialCellForEvent
   *
   * Hook to return initial cell for the given event.
   */
  // getInitialCellForEvent(me: mxMouseEvent): mxCell;
  getInitialCellForEvent(me) {
    let state = me.getState();

    if (
      (!this.graph.isToggleEvent(me.getEvent()) ||
        !isAltDown(me.getEvent())) &&
      state != null &&
      !this.graph.isCellSelected(state.cell)
    ) {
      const { model } = this.graph;
      let next = this.graph.view.getState(state.cell.getParent());

      while (
        next != null &&
        !this.graph.isCellSelected(next.cell) &&
        (next.cell.isVertex() || next.cell.isEdge()) &&
        this.isPropagateSelectionCell(state.cell, true, me)
      ) {
        state = next;
        next = this.graph.view.getState(
          state.cell.getParent()
        );
      }
    }

    return state != null ? state.cell : null;
  }

  /**
   * Function: isDelayedSelection
   *
   * Hook to return true for delayed selections.
   */
  // isDelayedSelection(cell: mxCell, me: mxMouseEvent): boolean;
  isDelayedSelection(cell, me) {
    if (
      !this.graph.isToggleEvent(me.getEvent()) ||
      !isAltDown(me.getEvent())
    ) {
      while (cell != null) {
        if (this.graph.selectionCellsHandler.isHandled(cell)) {
          return this.graph.cellEditor.getEditingCell() != cell;
        }

        cell = cell.getParent();
      }
    }

    return (
      this.graph.isToggleEvent(me.getEvent()) &&
      !isAltDown(me.getEvent())
    );
  }

  /**
   * Function: selectDelayed
   *
   * Implements the delayed selection for the given mouse event.
   */
  // selectDelayed(me: mxMouseEvent): void;
  selectDelayed(me) {
    if (!this.graph.popupMenuHandler.isPopupTrigger(me)) {
      let cell = me.getCell();

      if (cell == null) {
        cell = this.cell;
      }

      this.selectCellForEvent(cell, me);
    }
  }

  /**
   * Function: selectCellForEvent
   *
   * Selects the given cell for the given <mxMouseEvent>.
   */
  selectCellForEvent(cell, me) {
    const state = this.graph.view.getState(cell);

    if (state != null) {
      if (me.isSource(state.control)) {
        this.graph.selectCellForEvent(cell, me.getEvent());
      } else {
        if (
          !this.graph.isToggleEvent(me.getEvent()) ||
          !isAltDown(me.getEvent())
        ) {
          const model = this.graph.getModel();
          let parent = cell.getParent();

          while (
            this.graph.view.getState(parent) != null &&
            (parent.isVertex() || parent.isEdge()) &&
            this.isPropagateSelectionCell(cell, false, me)
          ) {
            cell = parent;
            parent = cell.getParent();
          }
        }

        this.graph.selectCellForEvent(cell, me.getEvent());
      }
    }

    return cell;
  }

  /**
   * Function: consumeMouseEvent
   *
   * Consumes the given mouse event. NOTE: This may be used to enable click
   * events for links in labels on iOS as follows as consuming the initial
   * touchStart disables firing the subsequent click evnent on the link.
   *
   * <code>
   * consumeMouseEvent(evtName, me)
   * {
   *   var source = mxEvent.getSource(me.getEvent());
   *
   *   if (!mxEvent.isTouchEvent(me.getEvent()) || source.nodeName != 'A')
   *   {
   *     me.consume();
   *   }
   * }
   * </code>
   */
  // consumeMouseEvent(evtName: string, me: mxMouseEvent): void;
  consumeMouseEvent(evtName, me) {
    me.consume();
  }

  /**
   * Function: mouseDown
   *
   * Handles the event by selecing the given cell and creating a handle for
   * it. By consuming the event all subsequent events of the gesture are
   * redirected to this handler.
   */
  // mouseDown(sender: any, me: mxMouseEvent): void;
  mouseDown(sender, me) {
    if (
      !me.isConsumed() &&
      this.isEnabled() &&
      this.graph.isEnabled() &&
      me.getState() != null &&
      !isMultiTouchEvent(me.getEvent())
    ) {
      const cell = this.getInitialCellForEvent(me);
      this.delayedSelection = this.isDelayedSelection(cell, me);
      this.cell = null;

      if (this.isSelectEnabled() && !this.delayedSelection) {
        this.graph.selectCellForEvent(cell, me.getEvent());
      }

      if (this.isMoveEnabled()) {
        const { model } = this.graph;
        const geo = cell.getGeometry();

        if (
          this.graph.isCellMovable(cell) &&
          (!cell.isEdge() ||
            this.graph.getSelectionCount() > 1 ||
            (geo.points != null && geo.points.length > 0) ||
            cell.getTerminal(true) == null ||
            cell.getTerminal(false) == null ||
            this.graph.allowDanglingEdges ||
            (this.graph.isCloneEvent(me.getEvent()) &&
              this.graph.isCellsCloneable()))
        ) {
          this.start(cell, me.getX(), me.getY());
        } else if (this.delayedSelection) {
          this.cell = cell;
        }

        this.cellWasClicked = true;
        this.consumeMouseEvent(mxEvent.MOUSE_DOWN, me);
      }
    }
  }

  /**
   * Function: getGuideStates
   *
   * Creates an array of cell states which should be used as guides.
   */
  // getGuideStates(): Array<mxCellState | mxPoint>;
  getGuideStates() {
    const parent = this.graph.getDefaultParent();
    const model = this.graph.getModel();

    const filter = mxUtils.bind(this, cell => {
      return (
        this.graph.view.getState(cell) != null &&
        cell.isVertex() &&
        cell.getGeometry() != null &&
        !cell.getGeometry().relative
      );
    });

    return this.graph.view.getCellStates(
      model.filterDescendants(filter, parent)
    );
  }

  /**
   * Function: getCells
   *
   * Returns the cells to be modified by this handler. This implementation
   * returns all selection cells that are movable, or the given initial cell if
   * the given cell is not selected and movable. This handles the case of moving
   * unselectable or unselected cells.
   *
   * Parameters:
   *
   * initialCell - <mxCell> that triggered this handler.
   */
  // getCells(initialCell: mxCell): mxCell[];
  getCells(initialCell) {
    if (!this.delayedSelection && this.graph.isCellMovable(initialCell)) {
      return [initialCell];
    }
    return this.graph.getMovableCells(this.graph.getSelectionCells());
  }

  /**
   * Function: getPreviewBounds
   *
   * Returns the <mxRectangle> used as the preview bounds for
   * moving the given cells.
   */
  // getPreviewBounds(cells: mxCell[]): mxRectangle;
  getPreviewBounds(cells) {
    const bounds = this.getBoundingBox(cells);

    if (bounds != null) {
      // Corrects width and height
      bounds.width = Math.max(0, bounds.width - 1);
      bounds.height = Math.max(0, bounds.height - 1);

      if (bounds.width < this.minimumSize) {
        const dx = this.minimumSize - bounds.width;
        bounds.x -= dx / 2;
        bounds.width = this.minimumSize;
      } else {
        bounds.x = Math.round(bounds.x);
        bounds.width = Math.ceil(bounds.width);
      }

      const tr = this.graph.view.translate;
      const s = this.graph.view.scale;

      if (bounds.height < this.minimumSize) {
        const dy = this.minimumSize - bounds.height;
        bounds.y -= dy / 2;
        bounds.height = this.minimumSize;
      } else {
        bounds.y = Math.round(bounds.y);
        bounds.height = Math.ceil(bounds.height);
      }
    }

    return bounds;
  }

  /**
   * Function: getBoundingBox
   *
   * Returns the union of the <mxCellStates> for the given array of <mxCells>.
   * For vertices, this method uses the bounding box of the corresponding shape
   * if one exists. The bounding box of the corresponding text label and all
   * controls and overlays are ignored. See also: <mxGraphView.getBounds> and
   * <mxGraph.getBoundingBox>.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounding box should be returned.
   */
  // getBoundingBox(cells: mxCell[]): mxRectangle;
  getBoundingBox(cells) {
    let result = null;

    if (cells != null && cells.length > 0) {
      const model = this.graph.getModel();

      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i].isVertex() || cells[i].isEdge()) {
          const state = this.graph.view.getState(cells[i]);

          if (state != null) {
            let bbox = state;

            if (
              cells[i].isVertex() &&
              state.shape != null &&
              state.shape.boundingBox != null
            ) {
              bbox = state.shape.boundingBox;
            }

            if (result == null) {
              result = mxRectangle.fromRectangle(bbox);
            } else {
              result.add(bbox);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Function: createPreviewShape
   *
   * Creates the shape used to draw the preview for the given bounds.
   */
  // createPreviewShape(bounds: mxRectangle): mxRectangleShape;
  createPreviewShape(bounds) {
    const shape = new mxRectangleShape(bounds, null, this.previewColor);
    shape.isDashed = true;

    if (this.htmlPreview) {
      shape.dialect = mxConstants.DIALECT_STRICTHTML;
      shape.init(this.graph.container);
    } else {
      // Makes sure to use either VML or SVG shapes in order to implement
      // event-transparency on the background area of the rectangle since
      // HTML shapes do not let mouseevents through even when transparent
      shape.dialect = mxConstants.DIALECT_SVG;
      shape.init(this.graph.getView().getOverlayPane());
      shape.pointerEvents = false;

      // Workaround for artifacts on iOS
      if (mxClient.IS_IOS) {
        shape.getSvgScreenOffset = () => {
          return 0;
        };
      }
    }

    return shape;
  }

  createGuide() {
    return new mxGuide(this.graph, this.getGuideStates());
  }

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  // start(cell: mxCell, x: number, y: number): void;
  start(cell, x, y, cells) {
    this.cell = cell;
    this.first = mxUtils.convertPoint(this.graph.container, x, y);
    this.cells = cells != null ? cells : this.getCells(this.cell);
    this.bounds = this.graph.getView().getBounds(this.cells);
    this.pBounds = this.getPreviewBounds(this.cells);
    this.allCells = new mxDictionary();
    this.cloning = false;
    this.cellCount = 0;

    for (let i = 0; i < this.cells.length; i += 1) {
      this.cellCount += this.addStates(this.cells[i], this.allCells);
    }

    if (this.guidesEnabled) {
      this.guide = this.createGuide();
      const parent = cell.getParent();
      const ignore = parent.getChildCount() < 2;

      // Uses connected states as guides
      const connected = new mxDictionary();
      const opps = this.graph.getOpposites(
        this.graph.getEdges(this.cell),
        this.cell
      );

      for (let i = 0; i < opps.length; i += 1) {
        const state = this.graph.view.getState(opps[i]);

        if (state != null && !connected.get(state)) {
          connected.put(state, true);
        }
      }

      this.guide.isStateIgnored = state => {
        const p = state.cell.getParent();

        return (
          state.cell != null &&
          ((!this.cloning && this.isCellMoving(state.cell)) ||
            (state.cell !== (this.target || parent) &&
              !ignore &&
              !connected.get(state) &&
              (this.target == null ||
                this.target.getChildCount() >= 2) &&
              p !== (this.target || parent)))
        );
      };
    }
  }

  /**
   * Adds the states for the given cell recursively to the given dictionary.
   * @param cell
   * @param dict
   */
  // addStates(cell: mxCell, dict: any): number;
  addStates(cell, dict) {
    const state = this.graph.view.getState(cell);
    let count = 0;

    if (state != null && dict.get(cell) == null) {
      dict.put(cell, state);
      count++;

      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        count += this.addStates(cell.getChildAt(i), dict);
      }
    }

    return count;
  }

  /**
   * Function: isCellMoving
   *
   * Returns true if the given cell is currently being moved.
   */
  isCellMoving(cell) {
    return this.allCells.get(cell) != null;
  }

  /**
   * Function: useGuidesForEvent
   *
   * Returns true if the guides should be used for the given <mxMouseEvent>.
   * This implementation returns <mxGuide.isEnabledForEvent>.
   */
  // useGuidesForEvent(me: mxMouseEvent): boolean;
  useGuidesForEvent(me) {
    return this.guide != null
      ? this.guide.isEnabledForEvent(me.getEvent()) &&
          !this.graph.isConstrainedEvent(me.getEvent())
      : true;
  }

  /**
   * Function: snap
   *
   * Snaps the given vector to the grid and returns the given mxPoint instance.
   */
  // snap(vector: mxPoint): mxPoint;
  snap(vector) {
    const scale = this.scaleGrid ? this.graph.view.scale : 1;

    vector.x = this.graph.snap(vector.x / scale) * scale;
    vector.y = this.graph.snap(vector.y / scale) * scale;

    return vector;
  }

  /**
   * Function: getDelta
   *
   * Returns an <mxPoint> that represents the vector for moving the cells
   * for the given <mxMouseEvent>.
   */
  // getDelta(me: mxMouseEvent): mxPoint;
  getDelta(me) {
    const point = mxUtils.convertPoint(
      this.graph.container,
      me.getX(),
      me.getY()
    );

    return new mxPoint(
      point.x - this.first.x - this.graph.panDx,
      point.y - this.first.y - this.graph.panDy
    );
  }

  /**
   * Function: updateHint
   *
   * Hook for subclassers do show details while the handler is active.
   */
  // updateHint(me: mxMouseEvent): void;
  updateHint(me) {}

  /**
   * Function: removeHint
   *
   * Hooks for subclassers to hide details when the handler gets inactive.
   */
  // removeHint(): void;
  removeHint() {}

  /**
   * Function: roundLength
   *
   * Hook for rounding the unscaled vector. This uses Math.round.
   */
  // roundLength(length: number): number;
  roundLength(length) {
    return Math.round(length * 100) / 100;
  }

  /**
   * Function: isValidDropTarget
   *
   * Returns true if the given cell is a valid drop target.
   */
  isValidDropTarget(target, me) {
    return this.cell.getParent() !== target;
  }

  /**
   * Function: checkPreview
   *
   * Updates the preview if cloning state has changed.
   */
  checkPreview() {
    if (this.livePreviewActive && this.cloning) {
      this.resetLivePreview();
      this.livePreviewActive = false;
    } else if (
      this.maxLivePreview >= this.cellCount &&
      !this.livePreviewActive &&
      this.allowLivePreview
    ) {
      if (!this.cloning || !this.livePreviewActive) {
        this.livePreviewActive = true;
        this.livePreviewUsed = true;
      }
    } else if (!this.livePreviewUsed && this.shape == null) {
      this.shape = this.createPreviewShape(this.bounds);
    }
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by highlighting possible drop targets and updating the
   * preview.
   */
  // mouseMove(sender: any, me: mxMouseEvent): void;
  mouseMove(sender, me) {
    const { graph } = this;

    if (
      !me.isConsumed() &&
      graph.isMouseDown &&
      this.cell != null &&
      this.first != null &&
      this.bounds != null &&
      !this.suspended
    ) {
      // Stops moving if a multi touch event is received
      if (isMultiTouchEvent(me.getEvent())) {
        this.reset();
        return;
      }

      let delta = this.getDelta(me);
      const tol = graph.tolerance;

      if (
        this.shape != null ||
        this.livePreviewActive ||
        Math.abs(delta.x) > tol ||
        Math.abs(delta.y) > tol
      ) {
        // Highlight is used for highlighting drop targets
        if (this.highlight == null) {
          this.highlight = new mxCellHighlight(
            this.graph,
            mxConstants.DROP_TARGET_COLOR,
            3
          );
        }

        const clone =
          graph.isCloneEvent(me.getEvent()) &&
          graph.isCellsCloneable() &&
          this.isCloneEnabled();
        const gridEnabled = graph.isGridEnabledEvent(me.getEvent());
        const cell = me.getCell();
        let hideGuide = true;
        let target = null;
        this.cloning = clone;

        if (graph.isDropEnabled() && this.highlightEnabled) {
          // Contains a call to getCellAt to find the cell under the mouse
          target = graph.getDropTarget(this.cells, me.getEvent(), cell, clone);
        }

        let state = graph.getView().getState(target);
        let highlight = false;

        if (state != null && (clone || this.isValidDropTarget(target, me))) {
          if (this.target !== target) {
            this.target = target;
            this.setHighlightColor(mxConstants.DROP_TARGET_COLOR);
          }

          highlight = true;
        } else {
          this.target = null;

          if (
            this.connectOnDrop &&
            cell != null &&
            this.cells.length === 1 &&
            cell.isVertex() &&
            graph.isCellConnectable(cell)
          ) {
            state = graph.getView().getState(cell);

            if (state != null) {
              const error = graph.getEdgeValidationError(null, this.cell, cell);
              const color =
                error == null
                  ? mxConstants.VALID_COLOR
                  : mxConstants.INVALID_CONNECT_TARGET_COLOR;
              this.setHighlightColor(color);
              highlight = true;
            }
          }
        }

        if (state != null && highlight) {
          this.highlight.highlight(state);
        } else {
          this.highlight.hide();
        }

        if (this.guide != null && this.useGuidesForEvent(me)) {
          delta = this.guide.move(this.bounds, delta, gridEnabled, clone);
          hideGuide = false;
        } else {
          delta = this.graph.snapDelta(
            delta,
            this.bounds,
            !gridEnabled,
            false,
            false
          );
        }

        if (this.guide != null && hideGuide) {
          this.guide.hide();
        }

        // Constrained movement if shift key is pressed
        if (graph.isConstrainedEvent(me.getEvent())) {
          if (Math.abs(delta.x) > Math.abs(delta.y)) {
            delta.y = 0;
          } else {
            delta.x = 0;
          }
        }

        this.checkPreview();

        if (this.currentDx !== delta.x || this.currentDy !== delta.y) {
          this.currentDx = delta.x;
          this.currentDy = delta.y;
          this.updatePreview();
        }
      }

      this.updateHint(me);
      this.consumeMouseEvent(mxEvent.MOUSE_MOVE, me);

      // Cancels the bubbling of events to the container so
      // that the droptarget is not reset due to an mouseMove
      // fired on the container with no associated state.
      mxEvent.consume(me.getEvent());
    } else if (
      (this.isMoveEnabled() || this.isCloneEnabled()) &&
      this.updateCursor &&
      !me.isConsumed() &&
      (me.getState() != null || me.sourceState != null) &&
      !graph.isMouseDown
    ) {
      let cursor = graph.getCursorForMouseEvent(me);

      if (
        cursor == null &&
        graph.isEnabled() &&
        graph.isCellMovable(me.getCell())
      ) {
        if (me.getCell().isEdge()) {
          cursor = mxConstants.CURSOR_MOVABLE_EDGE;
        } else {
          cursor = mxConstants.CURSOR_MOVABLE_VERTEX;
        }
      }

      // Sets the cursor on the original source state under the mouse
      // instead of the event source state which can be the parent
      if (cursor != null && me.sourceState != null) {
        me.sourceState.setCursor(cursor);
      }
    }
  }

  /**
   * Function: updatePreview
   *
   * Updates the bounds of the preview shape.
   */
  updatePreview(remote) {
    if (this.livePreviewUsed && !remote) {
      if (this.cells != null) {
        this.setHandlesVisibleForCells(
          this.graph.selectionCellsHandler.getHandledSelectionCells(),
          false
        );
        this.updateLivePreview(this.currentDx, this.currentDy);
      }
    } else {
      this.updatePreviewShape();
    }
  }

  /**
   * Function: updatePreviewShape
   *
   * Updates the bounds of the preview shape.
   */
  // updatePreviewShape(): void;
  updatePreviewShape() {
    if (this.shape != null && this.pBounds != null) {
      this.shape.bounds = new mxRectangle(
        Math.round(this.pBounds.x + this.currentDx),
        Math.round(this.pBounds.y + this.currentDy),
        this.pBounds.width,
        this.pBounds.height
      );
      this.shape.redraw();
    }
  }

  /**
   * Function: updateLivePreview
   *
   * Updates the bounds of the preview shape.
   */
  updateLivePreview(dx, dy) {
    if (!this.suspended) {
      const states = [];

      if (this.allCells != null) {
        this.allCells.visit(
          mxUtils.bind(this, (key, state) => {
            const realState = this.graph.view.getState(state.cell);

            // Checks if cell was removed or replaced
            if (realState !== state) {
              state.destroy();

              if (realState != null) {
                this.allCells.put(state.cell, realState);
              } else {
                this.allCells.remove(state.cell);
              }

              state = realState;
            }

            if (state != null) {
              // Saves current state
              const tempState = state.clone();
              states.push([state, tempState]);

              // Makes transparent for events to detect drop targets
              if (state.shape != null) {
                if (state.shape.originalPointerEvents == null) {
                  state.shape.originalPointerEvents = state.shape.pointerEvents;
                }

                state.shape.pointerEvents = false;

                if (state.text != null) {
                  if (state.text.originalPointerEvents == null) {
                    state.text.originalPointerEvents = state.text.pointerEvents;
                  }

                  state.text.pointerEvents = false;
                }
              }

              // Temporarily changes position
              if (state.cell.isVertex()) {
                state.x += dx;
                state.y += dy;

                // Draws the live preview
                if (!this.cloning) {
                  state.view.graph.cellRenderer.redraw(state, true);

                  // Forces redraw of connected edges after all states
                  // have been updated but avoids update of state
                  state.view.invalidate(state.cell);
                  state.invalid = false;

                  // Hides folding icon
                  if (state.control != null && state.control.node != null) {
                    state.control.node.style.visibility = 'hidden';
                  }
                }
                // Clone live preview may use text bounds
                else if (state.text != null) {
                  state.text.updateBoundingBox();

                  // Fixes preview box for edge labels
                  if (state.text.boundingBox != null) {
                    state.text.boundingBox.x += dx;
                    state.text.boundingBox.y += dy;
                  }

                  if (state.text.unrotatedBoundingBox != null) {
                    state.text.unrotatedBoundingBox.x += dx;
                    state.text.unrotatedBoundingBox.y += dy;
                  }
                }
              }
            }
          })
        );
      }

      // Resets the handler if everything was removed
      if (states.length === 0) {
        this.reset();
      } else {
        // Redraws connected edges
        const s = this.graph.view.scale;

        for (let i = 0; i < states.length; i += 1) {
          const state = states[i][0];

          if (state.cell.isEdge()) {
            const geometry = this.graph.getCellGeometry(state.cell);
            const points = [];

            if (geometry != null && geometry.points != null) {
              for (let j = 0; j < geometry.points.length; j++) {
                if (geometry.points[j] != null) {
                  points.push(
                    new mxPoint(
                      geometry.points[j].x + dx / s,
                      geometry.points[j].y + dy / s
                    )
                  );
                }
              }
            }

            let source = state.visibleSourceState;
            let target = state.visibleTargetState;
            const pts = states[i][1].absolutePoints;

            if (source == null || !this.isCellMoving(source.cell)) {
              const pt0 = pts[0];
              state.setAbsoluteTerminalPoint(
                new mxPoint(pt0.x + dx, pt0.y + dy),
                true
              );
              source = null;
            } else {
              state.view.updateFixedTerminalPoint(
                state,
                source,
                true,
                this.graph.getConnectionConstraint(state, source, true)
              );
            }

            if (target == null || !this.isCellMoving(target.cell)) {
              const ptn = pts[pts.length - 1];
              state.setAbsoluteTerminalPoint(
                new mxPoint(ptn.x + dx, ptn.y + dy),
                false
              );
              target = null;
            } else {
              state.view.updateFixedTerminalPoint(
                state,
                target,
                false,
                this.graph.getConnectionConstraint(state, target, false)
              );
            }

            state.view.updatePoints(state, points, source, target);
            state.view.updateFloatingTerminalPoints(state, source, target);
            state.view.updateEdgeLabelOffset(state);
            state.invalid = false;

            // Draws the live preview but avoids update of state
            if (!this.cloning) {
              state.view.graph.cellRenderer.redraw(state, true);
            }
          }
        }

        this.graph.view.validate();
        this.redrawHandles(states);
        this.resetPreviewStates(states);
      }
    }
  }

  /**
   * Function: redrawHandles
   *
   * Redraws the preview shape for the given states array.
   */
  redrawHandles(states) {
    for (let i = 0; i < states.length; i += 1) {
      const handler = this.graph.selectionCellsHandler.getHandler(
        states[i][0].cell
      );

      if (handler != null) {
        handler.redraw(true);
      }
    }
  }

  /**
   * Function: resetPreviewStates
   *
   * Resets the given preview states array.
   */
  resetPreviewStates(states) {
    for (let i = 0; i < states.length; i += 1) {
      states[i][0].setState(states[i][1]);
    }
  }

  /**
   * Function: suspend
   *
   * Suspends the livew preview.
   */
  suspend() {
    if (!this.suspended) {
      if (this.livePreviewUsed) {
        this.updateLivePreview(0, 0);
      }

      if (this.shape != null) {
        this.shape.node.style.visibility = 'hidden';
      }

      if (this.guide != null) {
        this.guide.setVisible(false);
      }

      this.suspended = true;
    }
  }

  /**
   * Function: resume
   *
   * Suspends the livew preview.
   */
  resume() {
    if (this.suspended) {
      this.suspended = null;

      if (this.livePreviewUsed) {
        this.livePreviewActive = true;
      }

      if (this.shape != null) {
        this.shape.node.style.visibility = 'visible';
      }

      if (this.guide != null) {
        this.guide.setVisible(true);
      }
    }
  }

  /**
   * Function: resetLivePreview
   *
   * Resets the livew preview.
   */
  resetLivePreview() {
    if (this.allCells != null) {
      this.allCells.visit((key, state) => {
        // Restores event handling
        if (state.shape != null && state.shape.originalPointerEvents != null) {
          state.shape.pointerEvents = state.shape.originalPointerEvents;
          state.shape.originalPointerEvents = null;

          // Forces repaint even if not moved to update pointer events
          state.shape.bounds = null;

          if (state.text != null) {
            state.text.pointerEvents = state.text.originalPointerEvents;
            state.text.originalPointerEvents = null;
          }
        }

        // Shows folding icon
        if (
          state.control != null &&
          state.control.node != null &&
          state.control.node.style.visibility === 'hidden'
        ) {
          state.control.node.style.visibility = '';
        }

        // Fixes preview box for edge labels
        if (!this.cloning) {
          if (state.text != null) {
            state.text.updateBoundingBox();
          }
        }

        // Forces repaint of connected edges
        state.view.invalidate(state.cell);
      });

      // Repaints all invalid states
      this.graph.view.validate();
    }
  }

  /**
   * Function: setHandlesVisibleForCells
   *
   * Sets wether the handles attached to the given cells are visible.
   *
   * Parameters:
   *
   * cells - Array of <mxCells>.
   * visible - Boolean that specifies if the handles should be visible.
   * force - Forces an update of the handler regardless of the last used value.
   */
  setHandlesVisibleForCells(cells, visible, force) {
    if (force || this.handlesVisible !== visible) {
      this.handlesVisible = visible;

      for (let i = 0; i < cells.length; i += 1) {
        const handler = this.graph.selectionCellsHandler.getHandler(cells[i]);

        if (handler != null) {
          handler.setHandlesVisible(visible);

          if (visible) {
            handler.redraw();
          }
        }
      }
    }
  }

  /**
   * Function: setHighlightColor
   *
   * Sets the color of the rectangle used to highlight drop targets.
   *
   * Parameters:
   *
   * color - String that represents the new highlight color.
   */
  // setHighlightColor(color: string): void;
  setHighlightColor(color) {
    if (this.highlight != null) {
      this.highlight.setHighlightColor(color);
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by applying the changes to the selection cells.
   */
  // mouseUp(sender: any, me: mxMouseEvent): void;
  mouseUp(sender, me) {
    if (!me.isConsumed()) {
      if (this.livePreviewUsed) {
        this.resetLivePreview();
      }

      if (
        this.cell != null &&
        this.first != null &&
        (this.shape != null || this.livePreviewUsed) &&
        this.currentDx != null &&
        this.currentDy != null
      ) {
        const { graph } = this;
        const cell = me.getCell();

        if (
          this.connectOnDrop &&
          this.target == null &&
          cell != null &&
          cell.isVertex() &&
          graph.isCellConnectable(cell) &&
          graph.isEdgeValid(null, this.cell, cell)
        ) {
          graph.connectionHandler.connect(this.cell, cell, me.getEvent());
        } else {
          const clone =
            graph.isCloneEvent(me.getEvent()) &&
            graph.isCellsCloneable() &&
            this.isCloneEnabled();
          const { scale } = graph.getView();
          const dx = this.roundLength(this.currentDx / scale);
          const dy = this.roundLength(this.currentDy / scale);
          const { target } = this;

          if (
            target &&
            graph.isSplitEnabled() &&
            graph.isSplitTarget(target, this.cells, me.getEvent())
          ) {
            graph.splitEdge(
              target,
              this.cells,
              null,
              dx,
              dy,
              me.getGraphX(),
              me.getGraphY()
            );
          } else {
            this.moveCells(
              this.cells,
              dx,
              dy,
              clone,
              this.target,
              me.getEvent()
            );
          }
        }
      } else if (
        this.isSelectEnabled() &&
        this.delayedSelection &&
        this.cell != null
      ) {
        this.selectDelayed(me);
      }
    }

    // Consumes the event if a cell was initially clicked
    if (this.cellWasClicked) {
      this.consumeMouseEvent(mxEvent.MOUSE_UP, me);
    }

    this.reset();
  }

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  // reset(): void;
  reset() {
    if (this.livePreviewUsed) {
      this.resetLivePreview();
      this.setHandlesVisibleForCells(
        this.graph.selectionCellsHandler.getHandledSelectionCells(),
        true
      );
    }

    this.destroyShapes();
    this.removeHint();

    this.delayedSelection = false;
    this.livePreviewActive = null;
    this.livePreviewUsed = null;
    this.cellWasClicked = false;
    this.suspended = null;
    this.currentDx = null;
    this.currentDy = null;
    this.cellCount = null;
    this.cloning = false;
    this.allCells = null;
    this.pBounds = null;
    this.guides = null;
    this.target = null;
    this.first = null;
    this.cells = null;
    this.cell = null;
  }

  /**
   * Function: shouldRemoveCellsFromParent
   *
   * Returns true if the given cells should be removed from the parent for the specified
   * mousereleased event.
   */
  // shouldRemoveCellsFromParent(parent: mxCell, cells: mxCell[], evt: Event): boolean;
  shouldRemoveCellsFromParent(parent, cells, evt) {
    if (parent.isVertex()) {
      const pState = this.graph.getView().getState(parent);

      if (pState != null) {
        let pt = mxUtils.convertPoint(
          this.graph.container,
          getClientX(evt),
          getClientY(evt)
        );
        const alpha = mxUtils.toRadians(
          mxUtils.getValue(pState.style, mxConstants.STYLE_ROTATION) || 0
        );

        if (alpha !== 0) {
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);
          const cx = new mxPoint(pState.getCenterX(), pState.getCenterY());
          pt = mxUtils.getRotatedPoint(pt, cos, sin, cx);
        }

        return !mxUtils.contains(pState, pt.x, pt.y);
      }
    }

    return false;
  }

  /**
   * Function: moveCells
   *
   * Moves the given cells by the specified amount.
   */
  // moveCells(cells: mxCell[], dx: number, dy: number, clone: boolean, target: mxCell, evt: Event): void;
  moveCells(cells, dx, dy, clone, target, evt) {
    if (clone) {
      cells = this.graph.getCloneableCells(cells);
    }

    // Removes cells from parent
    const parent = this.cell.getParent();

    if (
      target == null &&
      this.isRemoveCellsFromParent() &&
      this.shouldRemoveCellsFromParent(parent, cells, evt)
    ) {
      target = this.graph.getDefaultParent();
    }

    // Cloning into locked cells is not allowed
    clone =
      clone &&
      !this.graph.isCellLocked(target || this.graph.getDefaultParent());

    this.graph.getModel().beginUpdate();
    try {
      const parents = [];

      // Removes parent if all child cells are removed
      if (!clone && target != null && this.removeEmptyParents) {
        // Collects all non-selected parents
        const dict = new mxDictionary();

        for (let i = 0; i < cells.length; i += 1) {
          dict.put(cells[i], true);
        }

        // LATER: Recurse up the cell hierarchy
        for (let i = 0; i < cells.length; i += 1) {
          const par = cells[i].getParent();

          if (par != null && !dict.get(par)) {
            dict.put(par, true);
            parents.push(par);
          }
        }
      }

      // Passes all selected cells in order to correctly clone or move into
      // the target cell. The method checks for each cell if its movable.
      cells = this.graph.moveCells(cells, dx, dy, clone, target, evt);

      // Removes parent if all child cells are removed
      const temp = [];

      for (let i = 0; i < parents.length; i += 1) {
        if (this.shouldRemoveParent(parents[i])) {
          temp.push(parents[i]);
        }
      }

      this.graph.removeCells(temp, false);
    } finally {
      this.graph.getModel().endUpdate();
    }

    // Selects the new cells if cells have been cloned
    if (clone) {
      this.graph.setSelectionCells(cells);
    }

    if (this.isSelectEnabled() && this.scrollOnMove) {
      this.graph.scrollCellToVisible(cells[0]);
    }
  }

  /**
   * Function: shouldRemoveParent
   *
   * Returns true if the given parent should be removed after removal of child cells.
   */
  shouldRemoveParent(parent) {
    const state = this.graph.view.getState(parent);

    return (
      state != null &&
      (state.cell.isEdge() ||
        state.cell.isVertex()) &&
      this.graph.isCellDeletable(state.cell) &&
      state.cell.getChildCount() === 0 &&
      this.graph.isTransparentState(state)
    );
  }

  /**
   * Function: destroyShapes
   *
   * Destroy the preview and highlight shapes.
   */
  // destroyShapes(): void;
  destroyShapes() {
    // Destroys the preview dashed rectangle
    if (this.shape != null) {
      this.shape.destroy();
      this.shape = null;
    }

    if (this.guide != null) {
      this.guide.destroy();
      this.guide = null;
    }

    // Destroys the drop target highlight
    if (this.highlight != null) {
      this.highlight.destroy();
      this.highlight = null;
    }
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  // destroy(): void;
  destroy() {
    this.graph.removeMouseListener(this);
    this.graph.removeListener(this.panHandler);

    if (this.escapeHandler != null) {
      this.graph.removeListener(this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.refreshHandler != null) {
      this.graph.getModel().removeListener(this.refreshHandler);
      this.graph.removeListener(this.refreshHandler);
      this.refreshHandler = null;
    }

    mxEvent.removeListener(document, 'keydown', this.keyHandler);
    mxEvent.removeListener(document, 'keyup', this.keyHandler);

    this.destroyShapes();
    this.removeHint();
  }
}

export default mxGraphHandler;
