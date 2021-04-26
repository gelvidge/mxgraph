import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Groups',
  argTypes: {
    ...globalTypes,
    rubberBand: {
      type: 'boolean',
      defaultValue: true
    }
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph,
    mxRubberband,
    mxGraphHandler,
    mxPopupMenuHandler
  } = mxgraph;

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Overrides check for valid roots
  mxGraph.prototype.isValidRoot = function() {
    return false;
  };

  // Don't clear selection if multiple cells selected
  const graphHandlerMouseDown = mxGraphHandler.prototype.mouseDown;
  mxGraphHandler.prototype.mouseDown = function(sender, me) {
    graphHandlerMouseDown.apply(this, arguments);

    if (
      this.graph.isCellSelected(me.getCell()) &&
      this.graph.getSelectionCount() > 1
    ) {
      this.delayedSelection = false;
    }
  };

  // Selects descendants before children selection mode
  const graphHandlerGetInitialCellForEvent =
    mxGraphHandler.prototype.getInitialCellForEvent;
  mxGraphHandler.prototype.getInitialCellForEvent = function(me) {
    const model = this.graph.getModel();
    const psel = this.graph.getSelectionCell().getParent();
    let cell = graphHandlerGetInitialCellForEvent.apply(this, arguments);
    let parent = cell.getParent();

    if (psel == null || (psel != cell && psel != parent)) {
      while (
        !this.graph.isCellSelected(cell) &&
        !this.graph.isCellSelected(parent) &&
        parent.isVertex() &&
        !this.graph.isValidRoot(parent)
      ) {
        cell = parent;
        parent = this.cell.getParent();
      }
    }

    return cell;
  };

  // Selection is delayed to mouseup if child selected
  const graphHandlerIsDelayedSelection =
    mxGraphHandler.prototype.isDelayedSelection;
  mxGraphHandler.prototype.isDelayedSelection = function(cell) {
    let result = graphHandlerIsDelayedSelection.apply(this, arguments);
    const model = this.graph.getModel();
    const psel = this.graph.getSelectionCell().getParent();
    const parent = cell.getParent();

    if (psel == null || (psel != cell && psel != parent)) {
      if (
        !this.graph.isCellSelected(cell) &&
        parent.isVertex() &&
        !this.graph.isValidRoot(parent)
      ) {
        result = true;
      }
    }

    return result;
  };

  // Delayed selection of parent group
  mxGraphHandler.prototype.selectDelayed = function(me) {
    let cell = me.getCell();

    if (cell == null) {
      cell = this.cell;
    }

    const model = this.graph.getModel();
    let parent = cell.getParent();

    while (
      this.graph.isCellSelected(cell) &&
      parent.isVertex() &&
      !this.graph.isValidRoot(parent)
    ) {
      cell = parent;
      parent = cell.getParent();
    }

    this.graph.selectCellForEvent(cell, me.getEvent());
  };

  // Returns last selected ancestor
  mxPopupMenuHandler.prototype.getCellForPopupEvent = function(me) {
    let cell = me.getCell();
    const model = this.graph.getModel();
    let parent = cell.getParent();

    while (parent.isVertex() && !this.graph.isValidRoot(parent)) {
      if (this.graph.isCellSelected(parent)) {
        cell = parent;
      }

      parent = parent.getParent();
    }

    return cell;
  };

  // Creates the graph inside the given container
  const graph = new mxGraph(container);
  graph.constrainChildren = false;
  graph.extendParents = false;
  graph.extendParentsOnAdd = false;

  // Uncomment the following if you want the container
  // to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand)
    new mxRubberband(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 120, 60);
    const v2 = graph.insertVertex(v1, null, 'World!', 90, 20, 60, 20);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return container;
}

export const Default = Template.bind({});