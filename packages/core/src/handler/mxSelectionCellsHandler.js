/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxEventSource from '../util/event/mxEventSource';
import mxDictionary from '../util/datatypes/mxDictionary';
import mxEventObject from '../util/event/mxEventObject';
import mxEvent from '../util/event/mxEvent';
import mxUtils from '../util/mxUtils';

/**
 * Class: mxSelectionCellsHandler
 *
 * An event handler that manages cell handlers and invokes their mouse event
 * processing functions.
 *
 * Group: Events
 *
 * Event: mxEvent.ADD
 *
 * Fires if a cell has been added to the selection. The <code>state</code>
 * property contains the <mxCellState> that has been added.
 *
 * Event: mxEvent.REMOVE
 *
 * Fires if a cell has been remove from the selection. The <code>state</code>
 * property contains the <mxCellState> that has been removed.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
class mxSelectionCellsHandler extends mxEventSource {
  constructor(graph) {
    super();

    this.graph = graph;
    this.handlers = new mxDictionary();
    this.graph.addMouseListener(this);

    this.refreshHandler = (sender, evt) => {
      if (this.isEnabled()) {
        this.refresh();
      }
    };

    this.graph
      .getSelectionModel()
      .addListener(mxEvent.CHANGE, this.refreshHandler);
    this.graph.getModel().addListener(mxEvent.CHANGE, this.refreshHandler);
    this.graph.getView().addListener(mxEvent.SCALE, this.refreshHandler);
    this.graph.getView().addListener(mxEvent.TRANSLATE, this.refreshHandler);
    this.graph
      .getView()
      .addListener(mxEvent.SCALE_AND_TRANSLATE, this.refreshHandler);
    this.graph.getView().addListener(mxEvent.DOWN, this.refreshHandler);
    this.graph.getView().addListener(mxEvent.UP, this.refreshHandler);
  }

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  // graph: mxGraph;
  graph = null;

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  // enabled: boolean;
  enabled = true;

  /**
   * Variable: refreshHandler
   *
   * Keeps a reference to an event listener for later removal.
   */
  // refreshHandler: any;
  refreshHandler = null;

  /**
   * Variable: maxHandlers
   *
   * Defines the maximum number of handlers to paint individually. Default is 100.
   */
  // maxHandlers: number;
  maxHandlers = 100;

  /**
   * Variable: handlers
   *
   * <mxDictionary> that maps from cells to handlers.
   */
  // handlers: mxDictionary<any>;
  handlers = null;

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
   * Function: getHandler
   *
   * Returns the handler for the given cell.
   */
  // getHandler(cell: mxCell): any;
  getHandler(cell) {
    return this.handlers.get(cell);
  }

  /**
   * Function: isHandled
   *
   * Returns true if the given cell has a handler.
   */
  isHandled(cell) {
    return this.getHandler(cell) != null;
  }

  /**
   * Function: reset
   *
   * Resets all handlers.
   */
  // reset(): void;
  reset() {
    this.handlers.visit((key, handler) => {
      handler.reset.apply(handler);
    });
  }

  /**
   * Function: getHandledSelectionCells
   *
   * Reloads or updates all handlers.
   */
  getHandledSelectionCells() {
    return this.graph.getSelectionCells();
  }

  /**
   * Function: refresh
   *
   * Reloads or updates all handlers.
   */
  // refresh(): void;
  refresh() {
    // Removes all existing handlers
    const oldHandlers = this.handlers;
    this.handlers = new mxDictionary();

    // Creates handles for all selection cells
    const tmp = mxUtils.sortCells(this.getHandledSelectionCells(), false);

    // Destroys or updates old handlers
    for (let i = 0; i < tmp.length; i += 1) {
      const state = this.graph.view.getState(tmp[i]);

      if (state != null) {
        let handler = oldHandlers.remove(tmp[i]);

        if (handler != null) {
          if (handler.state !== state) {
            handler.destroy();
            handler = null;
          } else if (!this.isHandlerActive(handler)) {
            if (handler.refresh != null) {
              handler.refresh();
            }

            handler.redraw();
          }
        }

        if (handler != null) {
          this.handlers.put(tmp[i], handler);
        }
      }
    }

    // Destroys unused handlers
    oldHandlers.visit(
      (key, handler) => {
        this.fireEvent(
          new mxEventObject(mxEvent.REMOVE, 'state', handler.state)
        );
        handler.destroy();
      }
    );

    // Creates new handlers and updates parent highlight on existing handlers
    for (let i = 0; i < tmp.length; i += 1) {
      const state = this.graph.view.getState(tmp[i]);

      if (state != null) {
        let handler = this.handlers.get(tmp[i]);

        if (handler == null) {
          handler = this.graph.createHandler(state);
          this.fireEvent(new mxEventObject(mxEvent.ADD, 'state', state));
          this.handlers.put(tmp[i], handler);
        } else {
          handler.updateParentHighlight();
        }
      }
    }
  }

  /**
   * Function: isHandlerActive
   *
   * Returns true if the given handler is active and should not be redrawn.
   */
  // isHandlerActive(handler: any): boolean;
  isHandlerActive(handler) {
    return handler.index != null;
  }

  /**
   * Function: updateHandler
   *
   * Updates the handler for the given shape if one exists.
   */
  // updateHandler(state: mxCellState): void;
  updateHandler(state) {
    let handler = this.handlers.remove(state.cell);

    if (handler != null) {
      // Transfers the current state to the new handler
      const { index } = handler;
      const x = handler.startX;
      const y = handler.startY;

      handler.destroy();
      handler = this.graph.createHandler(state);

      if (handler != null) {
        this.handlers.put(state.cell, handler);

        if (index != null && x != null && y != null) {
          handler.start(x, y, index);
        }
      }
    }
  }

  /**
   * Function: mouseDown
   *
   * Redirects the given event to the handlers.
   */
  // mouseDown(sender: Event, me: Event): void;
  mouseDown(sender, me) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      const args = [sender, me];

      this.handlers.visit((key, handler) => {
        handler.mouseDown.apply(handler, args);
      });
    }
  }

  /**
   * Function: mouseMove
   *
   * Redirects the given event to the handlers.
   */
  // mouseMove(sender: Event, me: Event): void;
  mouseMove(sender, me) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      const args = [sender, me];

      this.handlers.visit((key, handler) => {
        handler.mouseMove.apply(handler, args);
      });
    }
  }

  /**
   * Function: mouseUp
   *
   * Redirects the given event to the handlers.
   */
  // mouseUp(sender: Event, me: Event): void;
  mouseUp(sender, me) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      const args = [sender, me];

      this.handlers.visit((key, handler) => {
        handler.mouseUp.apply(handler, args);
      });
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

    if (this.refreshHandler != null) {
      this.graph.getSelectionModel().removeListener(this.refreshHandler);
      this.graph.getModel().removeListener(this.refreshHandler);
      this.graph.getView().removeListener(this.refreshHandler);
      this.refreshHandler = null;
    }
  }
}

export default mxSelectionCellsHandler;
