import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/ContextIcons',
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
    mxEvent, 
    mxRubberband, 
    mxEventUtils,
    mxUtils,
    mxVertexHandler
  } = mxgraph;

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  class mxVertexToolHandler extends mxVertexHandler {
    // Defines a subclass for mxVertexHandler that adds a set of clickable
    // icons to every selected vertex.

    domNode = null;

    init() {
      super.init();

      // In this example we force the use of DIVs for images in IE. This
      // handles transparency in PNG images properly in IE and fixes the
      // problem that IE routes all mouse events for a gesture via the
      // initial IMG node, which means the target vertices
      this.domNode = document.createElement('div');
      this.domNode.style.position = 'absolute';
      this.domNode.style.whiteSpace = 'nowrap';

      // Workaround for event redirection via image tag in quirks and IE8
      const createImage = src => {
        return mxUtils.createImage(src);
      };

      // Delete
      let img = createImage('images/delete2.png');
      img.setAttribute('title', 'Delete');
      img.style.cursor = 'pointer';
      img.style.width = '16px';
      img.style.height = '16px';
      mxEvent.addGestureListeners(img, evt => {
        // Disables dragging the image
        mxEvent.consume(evt);
      });
      mxEvent.addListener(img, 'click', evt => {
        this.graph.removeCells([this.state.cell]);
        mxEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      // Size
      img = createImage('images/fit_to_size.png');
      img.setAttribute('title', 'Resize');
      img.style.cursor = 'se-resize';
      img.style.width = '16px';
      img.style.height = '16px';

      mxEvent.addGestureListeners(img, evt => {
        this.start(mxEventUtils.getClientX(evt), mxEventUtils.getClientY(evt), 7);
        this.graph.isMouseDown = true;
        this.graph.isMouseTrigger = mxEventUtils.isMouseEvent(evt);
        mxEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      // Move
      img = createImage('images/plus.png');
      img.setAttribute('title', 'Move');
      img.style.cursor = 'move';
      img.style.width = '16px';
      img.style.height = '16px';

      mxEvent.addGestureListeners(img, evt => {
        this.graph.graphHandler.start(
          this.state.cell,
          mxEventUtils.getClientX(evt),
          mxEventUtils.getClientY(evt)
        );
        this.graph.graphHandler.cellWasClicked = true;
        this.graph.isMouseDown = true;
        this.graph.isMouseTrigger = mxEventUtils.isMouseEvent(evt);
        mxEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      // Connect
      img = createImage('images/check.png');
      img.setAttribute('title', 'Connect');
      img.style.cursor = 'pointer';
      img.style.width = '16px';
      img.style.height = '16px';

      mxEvent.addGestureListeners(img, evt => {
        const pt = mxUtils.convertPoint(
          this.graph.container,
          mxEventUtils.getClientX(evt),
          mxEventUtils.getClientY(evt)
        );
        this.graph.connectionHandler.start(this.state, pt.x, pt.y);
        this.graph.isMouseDown = true;
        this.graph.isMouseTrigger = mxEventUtils.isMouseEvent(evt);
        mxEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      this.graph.container.appendChild(this.domNode);
      this.redrawTools();
    }

    redraw() {
      super.redraw();
      this.redrawTools();
    }

    redrawTools() {
      if (this.state != null && this.domNode != null) {
        const dy = 4;
        this.domNode.style.left = `${this.state.x + this.state.width - 56}px`;
        this.domNode.style.top = `${this.state.y + this.state.height + dy}px`;
      }
    }

    destroy(sender, me) {
      super.destroy(sender, me);

      if (this.domNode != null) {
        this.domNode.parentNode.removeChild(this.domNode);
        this.domNode = null;
      }
    }
  }

  class MyCustomGraph extends mxGraph {
    createHandler(state) {
      if (state != null && state.cell.isVertex()) {
        return new mxVertexToolHandler(state);
      }
      return super.createHandler(state);
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setConnectable(true);
  graph.connectionHandler.createTarget = true;

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
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
    });
    const e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
  });

  return container;
}

export const Default = Template.bind({});