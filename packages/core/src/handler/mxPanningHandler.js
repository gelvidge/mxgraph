/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxEventSource from '../util/event/mxEventSource';
import mxUtils from '../util/mxUtils';
import mxEventObject from '../util/event/mxEventObject';
import mxEvent from '../util/event/mxEvent';
import { isConsumed, isControlDown, isLeftMouseButton, isMultiTouchEvent, isPopupTrigger, isShiftDown } from '../util/mxEventUtils';

/**
 * Class: mxPanningHandler
 *
 * Event handler that pans and creates popupmenus. To use the left
 * mousebutton for panning without interfering with cell moving and
 * resizing, use <isUseLeftButton> and <isIgnoreCell>. For grid size
 * steps while panning, use <useGrid>. This handler is built-into
 * <mxGraph.panningHandler> and enabled using <mxGraph.setPanning>.
 *
 * Constructor: mxPanningHandler
 *
 * Constructs an event handler that creates a <mxPopupMenu>
 * and pans the graph.
 *
 * Event: mxEvent.PAN_START
 *
 * Fires when the panning handler changes its <active> state to true. The
 * <code>event</code> property contains the corresponding <mxMouseEvent>.
 *
 * Event: mxEvent.PAN
 *
 * Fires while handle is processing events. The <code>event</code> property contains
 * the corresponding <mxMouseEvent>.
 *
 * Event: mxEvent.PAN_END
 *
 * Fires when the panning handler changes its <active> state to false. The
 * <code>event</code> property contains the corresponding <mxMouseEvent>.
 */
class mxPanningHandler extends mxEventSource {
  constructor(graph) {
    super();

    if (graph != null) {
      this.graph = graph;
      this.graph.addMouseListener(this);

      // Handles force panning event
      this.forcePanningHandler = (sender, evt) => {
        const evtName = evt.getProperty('eventName');
        const me = evt.getProperty('event');

        if (evtName === mxEvent.MOUSE_DOWN && this.isForcePanningEvent(me)) {
          this.start(me);
          this.active = true;
          this.fireEvent(new mxEventObject(mxEvent.PAN_START, 'event', me));
          me.consume();
        }
      };

      this.graph.addListener(
        mxEvent.FIRE_MOUSE_EVENT,
        this.forcePanningHandler
      );

      // Handles pinch gestures
      this.gestureHandler = (sender, eo) => {
        if (this.isPinchEnabled()) {
          const evt = eo.getProperty('event');

          if (!isConsumed(evt) && evt.type === 'gesturestart') {
            this.initialScale = this.graph.view.scale;

            // Forces start of panning when pinch gesture starts
            if (!this.active && this.mouseDownEvent != null) {
              this.start(this.mouseDownEvent);
              this.mouseDownEvent = null;
            }
          } else if (evt.type === 'gestureend' && this.initialScale != null) {
            this.initialScale = null;
          }

          if (this.initialScale != null) {
            this.zoomGraph(evt);
          }
        }
      };

      this.graph.addListener(mxEvent.GESTURE, this.gestureHandler);

      this.mouseUpListener = () => {
        if (this.active) {
          this.reset();
        }
      };

      // Stops scrolling on every mouseup anywhere in the document
      mxEvent.addListener(document, 'mouseup', this.mouseUpListener);
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
   * Variable: useLeftButtonForPanning
   *
   * Specifies if panning should be active for the left mouse button.
   * Setting this to true may conflict with <mxRubberband>. Default is false.
   */
  // useLeftButtonForPanning: boolean;
  useLeftButtonForPanning = false;

  /**
   * Variable: usePopupTrigger
   *
   * Specifies if <mxEvent.isPopupTrigger> should also be used for panning.
   */
  // usePopupTrigger: boolean;
  usePopupTrigger = true;

  /**
   * Variable: ignoreCell
   *
   * Specifies if panning should be active even if there is a cell under the
   * mousepointer. Default is false.
   */
  // ignoreCell: boolean;
  ignoreCell = false;

  /**
   * Variable: previewEnabled
   *
   * Specifies if the panning should be previewed. Default is true.
   */
  // previewEnabled: boolean;
  previewEnabled = true;

  /**
   * Variable: useGrid
   *
   * Specifies if the panning steps should be aligned to the grid size.
   * Default is false.
   */
  // useGrid: boolean;
  useGrid = false;

  /**
   * Variable: panningEnabled
   *
   * Specifies if panning should be enabled. Default is true.
   */
  // panningEnabled: boolean;
  panningEnabled = true;

  /**
   * Variable: pinchEnabled
   *
   * Specifies if pinch gestures should be handled as zoom. Default is true.
   */
  // pinchEnabled: boolean;
  pinchEnabled = true;

  /**
   * Variable: maxScale
   *
   * Specifies the maximum scale. Default is 8.
   */
  // maxScale: number;
  maxScale = 8;

  /**
   * Variable: minScale
   *
   * Specifies the minimum scale. Default is 0.01.
   */
  // minScale: number;
  minScale = 0.01;

  /**
   * Variable: dx
   *
   * Holds the current horizontal offset.
   */
  // dx: number;
  dx = null;

  /**
   * Variable: dy
   *
   * Holds the current vertical offset.
   */
  // dy: number;
  dy = null;

  /**
   * Variable: startX
   *
   * Holds the x-coordinate of the start point.
   */
  // startX: number;
  startX = 0;

  /**
   * Variable: startY
   *
   * Holds the y-coordinate of the start point.
   */
  // startY: number;
  startY = 0;

  /**
   * Function: isActive
   *
   * Returns true if the handler is currently active.
   */
  // isActive(): boolean;
  isActive() {
    return this.active || this.initialScale != null;
  }

  /**
   * Function: isPanningEnabled
   *
   * Returns <panningEnabled>.
   */
  // isPanningEnabled(): boolean;
  isPanningEnabled() {
    return this.panningEnabled;
  }

  /**
   * Function: setPanningEnabled
   *
   * Sets <panningEnabled>.
   */
  // setPanningEnabled(value: boolean): void;
  setPanningEnabled(value) {
    this.panningEnabled = value;
  }

  /**
   * Function: isPinchEnabled
   *
   * Returns <pinchEnabled>.
   */
  // isPinchEnabled(): boolean;
  isPinchEnabled() {
    return this.pinchEnabled;
  }

  /**
   * Function: setPinchEnabled
   *
   * Sets <pinchEnabled>.
   */
  // setPinchEnabled(value: boolean): void;
  setPinchEnabled(value) {
    this.pinchEnabled = value;
  }

  /**
   * Function: isPanningTrigger
   *
   * Returns true if the given event is a panning trigger for the optional
   * given cell. This returns true if control-shift is pressed or if
   * <usePopupTrigger> is true and the event is a popup trigger.
   */
  // isPanningTrigger(me: mxMouseEvent): boolean;
  isPanningTrigger(me) {
    const evt = me.getEvent();

    return (
      (this.useLeftButtonForPanning &&
        me.getState() == null &&
        isLeftMouseButton(evt)) ||
      (isControlDown(evt) && isShiftDown(evt)) ||
      (this.usePopupTrigger && isPopupTrigger(evt))
    );
  }

  /**
   * Function: isForcePanningEvent
   *
   * Returns true if the given <mxMouseEvent> should start panning. This
   * implementation always returns true if <ignoreCell> is true or for
   * multi touch events.
   */
  // isForcePanningEvent(me: mxMouseEvent): boolean;
  isForcePanningEvent(me) {
    return this.ignoreCell || isMultiTouchEvent(me.getEvent());
  }

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating the panning. By consuming the event all
   * subsequent events of the gesture are redirected to this handler.
   */
  // mouseDown(sender: any, me: mxMouseEvent): void;
  mouseDown(sender, me) {
    this.mouseDownEvent = me;

    if (
      !me.isConsumed() &&
      this.isPanningEnabled() &&
      !this.active &&
      this.isPanningTrigger(me)
    ) {
      this.start(me);
      this.consumePanningTrigger(me);
    }
  }

  /**
   * Function: start
   *
   * Starts panning at the given event.
   */
  // start(me: mxMouseEvent): void;
  start(me) {
    this.dx0 = -this.graph.container.scrollLeft;
    this.dy0 = -this.graph.container.scrollTop;

    // Stores the location of the trigger event
    this.startX = me.getX();
    this.startY = me.getY();
    this.dx = null;
    this.dy = null;

    this.panningTrigger = true;
  }

  /**
   * Function: consumePanningTrigger
   *
   * Consumes the given <mxMouseEvent> if it was a panning trigger in
   * <mouseDown>. The default is to invoke <mxMouseEvent.consume>. Note that this
   * will block any further event processing. If you haven't disabled built-in
   * context menus and require immediate selection of the cell on mouseDown in
   * Safari and/or on the Mac, then use the following code:
   *
   * (code)
   * consumePanningTrigger(me)
   * {
   *   if (me.evt.preventDefault)
   *   {
   *     me.evt.preventDefault();
   *   }
   *
   *   // Stops event processing in IE
   *   me.evt.returnValue = false;
   *
   *   // Sets local consumed state
   *   if (!mxClient.IS_SF && !mxClient.IS_MAC)
   *   {
   *     me.consumed = true;
   *   }
   * };
   * (end)
   */
  // consumePanningTrigger(me: mxMouseEvent): void;
  consumePanningTrigger(me) {
    me.consume();
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the panning on the graph.
   */
  // mouseMove(sender: any, me: mxMouseEvent): void;
  mouseMove(sender, me) {
    this.dx = me.getX() - this.startX;
    this.dy = me.getY() - this.startY;

    if (this.active) {
      if (this.previewEnabled) {
        // Applies the grid to the panning steps
        if (this.useGrid) {
          this.dx = this.graph.snap(this.dx);
          this.dy = this.graph.snap(this.dy);
        }

        this.graph.panGraph(this.dx + this.dx0, this.dy + this.dy0);
      }

      this.fireEvent(new mxEventObject(mxEvent.PAN, 'event', me));
    } else if (this.panningTrigger) {
      const tmp = this.active;

      // Panning is activated only if the mouse is moved
      // beyond the graph tolerance
      this.active =
        Math.abs(this.dx) > this.graph.tolerance ||
        Math.abs(this.dy) > this.graph.tolerance;

      if (!tmp && this.active) {
        this.fireEvent(new mxEventObject(mxEvent.PAN_START, 'event', me));
      }
    }

    if (this.active || this.panningTrigger) {
      me.consume();
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by setting the translation on the view or showing the
   * popupmenu.
   */
  // mouseUp(sender: any, me: mxMouseEvent): void;
  mouseUp(sender, me) {
    if (this.active) {
      if (this.dx != null && this.dy != null) {
        // Ignores if scrollbars have been used for panning
        if (
          !this.graph.useScrollbarsForPanning ||
          !mxUtils.hasScrollbars(this.graph.container)
        ) {
          const { scale } = this.graph.getView();
          const t = this.graph.getView().translate;
          this.graph.panGraph(0, 0);
          this.panGraph(t.x + this.dx / scale, t.y + this.dy / scale);
        }

        me.consume();
      }

      this.fireEvent(new mxEventObject(mxEvent.PAN_END, 'event', me));
    }

    this.reset();
  }

  /**
   * Function: zoomGraph
   *
   * Zooms the graph to the given value and consumed the event if needed.
   */
  zoomGraph(evt) {
    let value = Math.round(this.initialScale * evt.scale * 100) / 100;

    if (this.minScale != null) {
      value = Math.max(this.minScale, value);
    }

    if (this.maxScale != null) {
      value = Math.min(this.maxScale, value);
    }

    if (this.graph.view.scale !== value) {
      this.graph.zoomTo(value);
      mxEvent.consume(evt);
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by setting the translation on the view or showing the
   * popupmenu.
   */
  // reset(): void;
  reset() {
    this.panningTrigger = false;
    this.mouseDownEvent = null;
    this.active = false;
    this.dx = null;
    this.dy = null;
  }

  /**
   * Function: panGraph
   *
   * Pans <graph> by the given amount.
   */
  // panGraph(dx: number, dy: number): void;
  panGraph(dx, dy) {
    this.graph.getView().setTranslate(dx, dy);
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  // destroy(): void;
  destroy() {
    this.graph.removeMouseListener(this);
    this.graph.removeListener(this.forcePanningHandler);
    this.graph.removeListener(this.gestureHandler);
    mxEvent.removeListener(document, 'mouseup', this.mouseUpListener);
  }
}

export default mxPanningHandler;
