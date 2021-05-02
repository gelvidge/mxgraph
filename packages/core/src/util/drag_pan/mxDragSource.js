/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxRectangle from '../datatypes/mxRectangle';
import mxCellHighlight from '../../handler/mxCellHighlight';
import mxUtils from '../mxUtils';
import mxEvent from '../event/mxEvent';
import mxClient from '../../mxClient';
import mxGuide from '../mxGuide';
import { DROP_TARGET_COLOR } from '../mxConstants';
import mxPoint from '../datatypes/mxPoint';
import {
  getClientX,
  getClientY,
  getSource,
  isConsumed,
  isMouseEvent,
  isPenEvent,
  isTouchEvent,
} from '../mxEventUtils';

/**
 * @class mxDragSource
 *
 * Wrapper to create a drag source from a DOM element so that the element can
 * be dragged over a graph and dropped into the graph as a new cell.
 *
 * Problem is that in the dropHandler the current preview location is not
 * available, so the preview and the dropHandler must match.
 *
 */
class mxDragSource {
  constructor(element, dropHandler) {
    this.element = element;
    this.dropHandler = dropHandler;

    // Handles a drag gesture on the element
    mxEvent.addGestureListeners(element, (evt) => {
      this.mouseDown(evt);
    });

    // Prevents native drag and drop
    mxEvent.addListener(element, 'dragstart', (evt) => {
      mxEvent.consume(evt);
    });

    this.eventConsumer = (sender, evt) => {
      const evtName = evt.getProperty('eventName');
      const me = evt.getProperty('event');

      if (evtName !== mxEvent.MOUSE_DOWN) {
        me.consume();
      }
    };
  }

  /**
   * Reference to the DOM node which was made draggable.
   */
  // element: HTMLElement;
  element = null;

  /**
   * Holds the DOM node that is used to represent the drag preview. If this is
   * null then the source element will be cloned and used for the drag preview.
   */
  // dropHandler: Function;
  dropHandler = null;

  /**
   * {@link mxPoint} that specifies the offset of the {@link dragElement}. Default is null.
   */
  // dragOffset: mxPoint;
  dragOffset = null;

  /**
   * Holds the DOM node that is used to represent the drag preview. If this is
   * null then the source element will be cloned and used for the drag preview.
   */
  // dragElement: HTMLElement;
  dragElement = null;

  /**
   * Optional {@link mxRectangle} that specifies the unscaled size of the preview.
   */
  // previewElement: mxRectangle;
  previewElement = null;

  /**
   * Variable: previewOffset
   *
   * Optional <mxPoint> that specifies the offset of the preview in pixels.
   */
  previewOffset = null;

  /**
   * Specifies if this drag source is enabled. Default is true.
   */
  // enabled: boolean;
  enabled = true;

  /**
   * Reference to the {@link mxGraph} that is the current drop target.
   */
  // currentGraph: mxGraph;
  currentGraph = null;

  /**
   * Holds the current drop target under the mouse.
   */
  // currentDropTarget: mxCell;
  currentDropTarget = null;

  /**
   * Holds the current drop location.
   */
  // currentPoint: mxPoint;
  currentPoint = null;

  /**
   * Holds an {@link mxGuide} for the {@link currentGraph} if {@link dragPreview} is not null.
   */
  // currentGuide: mxGuide;
  currentGuide = null;

  /**
   * Holds an {@link mxGuide} for the {@link currentGraph} if {@link dragPreview} is not null.
   * @note wrong doc
   */
  // currentHighlight: mxCellHighlight;
  currentHighlight = null;

  /**
   * Specifies if the graph should scroll automatically. Default is true.
   */
  // autoscroll: boolean;
  autoscroll = true;

  /**
   * Specifies if {@link mxGuide} should be enabled. Default is true.
   */
  // guidesEnabled: boolean;
  guidesEnabled = true;

  /**
   * Specifies if the grid should be allowed. Default is true.
   */
  // gridEnabled: boolean;
  gridEnabled = true;

  /**
   * Specifies if drop targets should be highlighted. Default is true.
   */
  // highlightDropTargets: boolean;
  highlightDropTargets = true;

  /**
   * ZIndex for the drag element. Default is 100.
   */
  // dragElementZIndex: number;
  dragElementZIndex = 100;

  /**
   * Opacity of the drag element in %. Default is 70.
   */
  // dragElementOpacity: number;
  dragElementOpacity = 70;

  /**
   * Whether the event source should be checked in {@link graphContainerEvent}. Default
   * is true.
   */
  // checkEventSource: boolean;
  checkEventSource = true;

  /**
   * Returns {@link enabled}.
   */
  // isEnabled(): boolean;
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sets {@link enabled}.
   */
  // setEnabled(value: boolean): void;
  setEnabled(value) {
    this.enabled = value;
  }

  /**
   * Returns {@link guidesEnabled}.
   */
  // isGuidesEnabled(): boolean;
  isGuidesEnabled() {
    return this.guidesEnabled;
  }

  /**
   * Sets {@link guidesEnabled}.
   */
  // setGuidesEnabled(value: boolean): void;
  setGuidesEnabled(value) {
    this.guidesEnabled = value;
  }

  /**
   * Returns {@link gridEnabled}.
   */
  // isGridEnabled(): boolean;
  isGridEnabled() {
    return this.gridEnabled;
  }

  /**
   * Sets {@link gridEnabled}.
   */
  // setGridEnabled(value: boolean): void;
  setGridEnabled(value) {
    this.gridEnabled = value;
  }

  /**
   * Returns the graph for the given mouse event. This implementation returns
   * null.
   */
  // getGraphForEvent(evt: MouseEvent): mxGraph;
  getGraphForEvent(evt) {
    return null;
  }

  /**
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses {@link mxGraph.getCellAt}.
   */
  // getDropTarget(graph: mxGraph, x: number, y: number, evt: PointerEvent): mxCell;
  getDropTarget(graph, x, y, evt) {
    return graph.getCellAt(x, y);
  }

  /**
   * Creates and returns a clone of the {@link dragElementPrototype} or the {@link element}
   * if the former is not defined.
   */
  // createDragElement(evt: Event): Node;
  createDragElement(evt) {
    return this.element.cloneNode(true);
  }

  /**
   * Creates and returns an element which can be used as a preview in the given
   * graph.
   */
  // createPreviewElement(graph: mxGraph): HTMLElement;
  createPreviewElement(graph) {
    return null;
  }

  /**
   * Returns true if this drag source is active.
   */
  // isActive(): boolean;
  isActive() {
    return this.mouseMoveHandler != null;
  }

  /**
   * Stops and removes everything and restores the state of the object.
   */
  // reset(): void;
  reset() {
    if (this.currentGraph != null) {
      this.dragExit(this.currentGraph);
      this.currentGraph = null;
    }

    this.removeDragElement();
    this.removeListeners();
    this.stopDrag();
  }

  /**
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses {@link mxGraph.getCellAt}.
   *
   * To ignore popup menu events for a drag source, this function can be
   * overridden as follows.
   *
   * @example
   * ```javascript
   * var mouseDown = dragSource.mouseDown;
   *
   * dragSource.mouseDown(evt)
   * {
   *   if (!mxEvent.isPopupTrigger(evt))
   *   {
   *     mouseDown.apply(this, arguments);
   *   }
   * };
   * ```
   */
  // mouseDown(evt: mxMouseEvent): void;
  mouseDown(evt) {
    if (this.enabled && !isConsumed(evt) && this.mouseMoveHandler == null) {
      this.startDrag(evt);
      this.mouseMoveHandler = this.mouseMove.bind(this);
      this.mouseUpHandler = this.mouseUp.bind(this);
      mxEvent.addGestureListeners(
        document,
        null,
        this.mouseMoveHandler,
        this.mouseUpHandler
      );

      if (mxClient.IS_TOUCH && !isMouseEvent(evt)) {
        this.eventSource = getSource(evt);
        mxEvent.addGestureListeners(
          this.eventSource,
          null,
          this.mouseMoveHandler,
          this.mouseUpHandler
        );
      }
    }
  }

  /**
   * Creates the {@link dragElement} using {@link createDragElement}.
   */
  // startDrag(evt: mxMouseEvent): void;
  startDrag(evt) {
    this.dragElement = this.createDragElement(evt);
    this.dragElement.style.position = 'absolute';
    this.dragElement.style.zIndex = this.dragElementZIndex;
    mxUtils.setOpacity(this.dragElement, this.dragElementOpacity);

    if (this.checkEventSource && mxClient.IS_SVG) {
      this.dragElement.style.pointerEvents = 'none';
    }
  }

  /**
   * Invokes {@link removeDragElement}.
   */
  // stopDrag(): void;
  stopDrag() {
    // LATER: This used to have a mouse event. If that is still needed we need to add another
    // final call to the DnD protocol to add a cleanup step in the case of escape press, which
    // is not associated with a mouse event and which currently calles this method.
    this.removeDragElement();
  }

  /**
   * Removes and destroys the {@link dragElement}.
   */
  // removeDragElement(): void;
  removeDragElement() {
    if (this.dragElement != null) {
      if (this.dragElement.parentNode != null) {
        this.dragElement.parentNode.removeChild(this.dragElement);
      }

      this.dragElement = null;
    }
  }

  /**
   * Returns the topmost element under the given event.
   */
  // getElementForEvent(evt: Event): Element;
  getElementForEvent(evt) {
    return isTouchEvent(evt) || isPenEvent(evt)
      ? document.elementFromPoint(getClientX(evt), getClientY(evt))
      : getSource(evt);
  }

  /**
   * Returns true if the given graph contains the given event.
   */
  // graphContainsEvent(graph: mxGraph, evt: Event): boolean;
  graphContainsEvent(graph, evt) {
    const x = getClientX(evt);
    const y = getClientY(evt);
    const offset = mxUtils.getOffset(graph.container);
    const origin = mxUtils.getScrollOrigin();
    let elt = this.getElementForEvent(evt);

    if (this.checkEventSource) {
      while (elt != null && elt !== graph.container) {
        elt = elt.parentNode;
      }
    }

    // Checks if event is inside the bounds of the graph container
    return (
      elt != null &&
      x >= offset.x - origin.x &&
      y >= offset.y - origin.y &&
      x <= offset.x - origin.x + graph.container.offsetWidth &&
      y <= offset.y - origin.y + graph.container.offsetHeight
    );
  }

  /**
   * Gets the graph for the given event using {@link getGraphForEvent}, updates the
   * {@link currentGraph}, calling {@link dragEnter} and {@link dragExit} on the new and old graph,
   * respectively, and invokes {@link dragOver} if {@link currentGraph} is not null.
   */
  // mouseMove(evt: MouseEvent): void;
  mouseMove(evt) {
    let graph = this.getGraphForEvent(evt);

    // Checks if event is inside the bounds of the graph container
    if (graph != null && !this.graphContainsEvent(graph, evt)) {
      graph = null;
    }

    if (graph !== this.currentGraph) {
      if (this.currentGraph != null) {
        this.dragExit(this.currentGraph, evt);
      }

      this.currentGraph = graph;

      if (this.currentGraph != null) {
        this.dragEnter(this.currentGraph, evt);
      }
    }

    if (this.currentGraph != null) {
      this.dragOver(this.currentGraph, evt);
    }

    if (
      this.dragElement != null &&
      (this.previewElement == null ||
        this.previewElement.style.visibility !== 'visible')
    ) {
      let x = getClientX(evt);
      let y = getClientY(evt);

      if (this.dragElement.parentNode == null) {
        document.body.appendChild(this.dragElement);
      }

      this.dragElement.style.visibility = 'visible';

      if (this.dragOffset != null) {
        x += this.dragOffset.x;
        y += this.dragOffset.y;
      }

      const offset = mxUtils.getDocumentScrollOrigin(document);

      this.dragElement.style.left = `${x + offset.x}px`;
      this.dragElement.style.top = `${y + offset.y}px`;
    } else if (this.dragElement != null) {
      this.dragElement.style.visibility = 'hidden';
    }

    mxEvent.consume(evt);
  }

  /**
   * Processes the mouse up event and invokes {@link drop}, {@link dragExit} and {@link stopDrag}
   * as required.
   */
  // mouseUp(evt: MouseEvent): void;
  mouseUp(evt) {
    if (this.currentGraph != null) {
      if (
        this.currentPoint != null &&
        (this.previewElement == null ||
          this.previewElement.style.visibility !== 'hidden')
      ) {
        const { scale } = this.currentGraph.view;
        const tr = this.currentGraph.view.translate;
        const x = this.currentPoint.x / scale - tr.x;
        const y = this.currentPoint.y / scale - tr.y;

        this.drop(this.currentGraph, evt, this.currentDropTarget, x, y);
      }

      this.dragExit(this.currentGraph);
      this.currentGraph = null;
    }

    this.stopDrag();
    this.removeListeners();

    mxEvent.consume(evt);
  }

  /**
   * Actives the given graph as a drop target.
   */
  // removeListeners(): void;
  removeListeners() {
    if (this.eventSource != null) {
      mxEvent.removeGestureListeners(
        this.eventSource,
        null,
        this.mouseMoveHandler,
        this.mouseUpHandler
      );
      this.eventSource = null;
    }

    mxEvent.removeGestureListeners(
      document,
      null,
      this.mouseMoveHandler,
      this.mouseUpHandler
    );
    this.mouseMoveHandler = null;
    this.mouseUpHandler = null;
  }

  /**
   * Actives the given graph as a drop target.
   */
  // dragEnter(graph: mxGraph, evt: Event): void;
  dragEnter(graph, evt) {
    graph.isMouseDown = true;
    graph.isMouseTrigger = isMouseEvent(evt);
    this.previewElement = this.createPreviewElement(graph);

    if (
      this.previewElement != null &&
      this.checkEventSource &&
      mxClient.IS_SVG
    ) {
      this.previewElement.style.pointerEvents = 'none';
    }

    // Guide is only needed if preview element is used
    if (this.isGuidesEnabled() && this.previewElement != null) {
      this.currentGuide = new mxGuide(
        graph,
        graph.graphHandler.getGuideStates()
      );
    }

    if (this.highlightDropTargets) {
      this.currentHighlight = new mxCellHighlight(graph, DROP_TARGET_COLOR);
    }

    // Consumes all events in the current graph before they are fired
    graph.addListener(mxEvent.FIRE_MOUSE_EVENT, this.eventConsumer);
  }

  /**
   * Deactivates the given graph as a drop target.
   */
  // dragExit(graph: mxGraph, evt: Event): void;
  dragExit(graph, evt) {
    this.currentDropTarget = null;
    this.currentPoint = null;
    graph.isMouseDown = false;

    // Consumes all events in the current graph before they are fired
    graph.removeListener(this.eventConsumer);

    if (this.previewElement != null) {
      if (this.previewElement.parentNode != null) {
        this.previewElement.parentNode.removeChild(this.previewElement);
      }

      this.previewElement = null;
    }

    if (this.currentGuide != null) {
      this.currentGuide.destroy();
      this.currentGuide = null;
    }

    if (this.currentHighlight != null) {
      this.currentHighlight.destroy();
      this.currentHighlight = null;
    }
  }

  /**
   * Implements autoscroll, updates the {@link currentPoint}, highlights any drop
   * targets and updates the preview.
   */
  // dragOver(graph: mxGraph, evt: Event): void;
  dragOver(graph, evt) {
    const offset = mxUtils.getOffset(graph.container);
    const origin = mxUtils.getScrollOrigin(graph.container);
    let x = getClientX(evt) - offset.x + origin.x - graph.panDx;
    let y = getClientY(evt) - offset.y + origin.y - graph.panDy;

    if (graph.autoScroll && (this.autoscroll == null || this.autoscroll)) {
      graph.scrollPointToVisible(x, y, graph.autoExtend);
    }

    // Highlights the drop target under the mouse
    if (this.currentHighlight != null && graph.isDropEnabled()) {
      this.currentDropTarget = this.getDropTarget(graph, x, y, evt);
      const state = graph.getView().getState(this.currentDropTarget);
      this.currentHighlight.highlight(state);
    }

    // Updates the location of the preview
    if (this.previewElement != null) {
      if (this.previewElement.parentNode == null) {
        graph.container.appendChild(this.previewElement);

        this.previewElement.style.zIndex = '3';
        this.previewElement.style.position = 'absolute';
      }

      const gridEnabled = this.isGridEnabled() && graph.isGridEnabledEvent(evt);
      let hideGuide = true;

      // Grid and guides
      if (
        this.currentGuide != null &&
        this.currentGuide.isEnabledForEvent(evt)
      ) {
        // LATER: HTML preview appears smaller than SVG preview
        const w = parseInt(this.previewElement.style.width);
        const h = parseInt(this.previewElement.style.height);
        const bounds = new mxRectangle(0, 0, w, h);
        let delta = new mxPoint(x, y);
        delta = this.currentGuide.move(bounds, delta, gridEnabled, true);
        hideGuide = false;
        x = delta.x;
        y = delta.y;
      } else if (gridEnabled) {
        const { scale } = graph.view;
        const tr = graph.view.translate;
        const off = graph.gridSize / 2;
        x = (graph.snap(x / scale - tr.x - off) + tr.x) * scale;
        y = (graph.snap(y / scale - tr.y - off) + tr.y) * scale;
      }

      if (this.currentGuide != null && hideGuide) {
        this.currentGuide.hide();
      }

      if (this.previewOffset != null) {
        x += this.previewOffset.x;
        y += this.previewOffset.y;
      }

      this.previewElement.style.left = `${Math.round(x)}px`;
      this.previewElement.style.top = `${Math.round(y)}px`;
      this.previewElement.style.visibility = 'visible';
    }

    this.currentPoint = new mxPoint(x, y);
  }

  /**
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses {@link mxGraph.getCellAt}.
   */
  // drop(graph: mxGraph, evt: Event, dropTarget: mxCell, x: number, y: number): void;
  drop(graph, evt, dropTarget, x, y) {
    this.dropHandler(graph, evt, dropTarget, x, y);

    // Had to move this to after the insert because it will
    // affect the scrollbars of the window in IE to try and
    // make the complete container visible.
    // LATER: Should be made optional.
    if (graph.container.style.visibility !== 'hidden') {
      graph.container.focus();
    }
  }
}

export default mxDragSource;
