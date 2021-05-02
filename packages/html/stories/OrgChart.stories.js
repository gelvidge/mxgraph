import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/OrgChart',
  argTypes: {
    ...globalTypes,
    contextMenu: {
      type: 'boolean',
      defaultValue: false
    }
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph,
    mxConstants,
    mxEvent,
    mxClient,
    mxPoint,
    mxOutline,
    mxEdgeStyle,
    mxKeyHandler,
    mxCompactTreeLayout,
    mxLayoutManager,
    mxCellOverlay,
    mxImage,
    mxUtils,
    mxToolbar
  } = mxgraph;

  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Makes the shadow brighter
  mxConstants.SHADOWCOLOR = '#C0C0C0';

  const outline = document.getElementById('outlineContainer');

  if (!args.contextMenu)
    mxEvent.disableContextMenu(container);

  // Sets a gradient background
  if (mxClient.IS_GC || mxClient.IS_SF) {
    container.style.background =
      '-webkit-gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), to(#E7E7E7))';
  } else if (mxClient.IS_NS) {
    container.style.background =
      '-moz-linear-gradient(top, #FFFFFF, #E7E7E7)';
  }

  // Creates the graph inside the given container
  const graph = new mxGraph(container);

  // Enables automatic sizing for vertices after editing and
  // panning by using the left mouse button.
  graph.setCellsMovable(false);
  graph.setAutoSizeCells(true);
  graph.setPanning(true);
  graph.centerZoom = false;
  graph.panningHandler.useLeftButtonForPanning = true;

  // Displays a popupmenu when the user clicks
  // on a cell (using the left mouse button) but
  // do not select the cell when the popup menu
  // is displayed
  graph.panningHandler.popupMenuHandler = false;

  // Creates the outline (navigator, overview) for moving
  // around the graph in the top, right corner of the window.
  const outln = new mxOutline(graph, outline);

  // Disables tooltips on touch devices
  graph.setTooltips(!mxClient.IS_TOUCH);

  // Set some stylesheet options for the visual appearance of vertices
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style[mxConstants.STYLE_SHAPE] = 'label';

  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
  style[mxConstants.STYLE_SPACING_LEFT] = 54;

  style[mxConstants.STYLE_GRADIENTCOLOR] = '#7d85df';
  style[mxConstants.STYLE_STROKECOLOR] = '#5d65df';
  style[mxConstants.STYLE_FILLCOLOR] = '#adc5ff';

  style[mxConstants.STYLE_FONTCOLOR] = '#1d258f';
  style[mxConstants.STYLE_FONTFAMILY] = 'Verdana';
  style[mxConstants.STYLE_FONTSIZE] = '12';
  style[mxConstants.STYLE_FONTSTYLE] = '1';

  style[mxConstants.STYLE_SHADOW] = '1';
  style[mxConstants.STYLE_ROUNDED] = '1';
  style[mxConstants.STYLE_GLASS] = '1';

  style[mxConstants.STYLE_IMAGE] = '/images/dude3.png';
  style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
  style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
  style[mxConstants.STYLE_SPACING] = 8;

  // Sets the default style for edges
  style = graph.getStylesheet().getDefaultEdgeStyle();
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_STROKEWIDTH] = 3;
  style[mxConstants.STYLE_EXIT_X] = 0.5; // center
  style[mxConstants.STYLE_EXIT_Y] = 1.0; // bottom
  style[mxConstants.STYLE_EXIT_PERIMETER] = 0; // disabled
  style[mxConstants.STYLE_ENTRY_X] = 0.5; // center
  style[mxConstants.STYLE_ENTRY_Y] = 0; // top
  style[mxConstants.STYLE_ENTRY_PERIMETER] = 0; // disabled

  // Disable the following for straight lines
  style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;

  // Stops editing on enter or escape keypress
  const keyHandler = new mxKeyHandler(graph);

  // Enables automatic layout on the graph and installs
  // a tree layout for all groups who's children are
  // being changed, added or removed.
  const layout = new mxCompactTreeLayout(graph, false);
  layout.useBoundingBox = false;
  layout.edgeRouting = false;
  layout.levelDistance = 60;
  layout.nodeDistance = 16;

  // Allows the layout to move cells even though cells
  // aren't movable in the graph
  layout.isVertexMovable = function(cell) {
    return true;
  };

  const layoutMgr = new mxLayoutManager(graph);

  layoutMgr.getLayout = function(cell) {
    if (cell.getChildCount() > 0) {
      return layout;
    }
  };

  // Installs a popupmenu handler using local function (see below).
  graph.popupMenuHandler.factoryMethod = function(menu, cell, evt) {
    return createPopupMenu(graph, menu, cell, evt);
  };

  // Fix for wrong preferred size
  const oldGetPreferredSizeForCell = graph.getPreferredSizeForCell;
  graph.getPreferredSizeForCell = function(cell) {
    const result = oldGetPreferredSizeForCell.apply(this, arguments);

    if (result != null) {
      result.width = Math.max(120, result.width - 40);
    }

    return result;
  };

  // Sets the maximum text scale to 1
  graph.cellRenderer.getTextScale = function(state) {
    return Math.min(1, state.view.scale);
  };

  // Dynamically adds text to the label as we zoom in
  // (without affecting the preferred size for new cells)
  graph.cellRenderer.getLabelValue = function(state) {
    let result = state.cell.value;

    if (state.cell.isVertex()) {
      if (state.view.scale > 1) {
        result += '\nDetails 1';
      }

      if (state.view.scale > 1.3) {
        result += '\nDetails 2';
      }
    }

    return result;
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds the root vertex of the tree
  graph.getModel().beginUpdate();
  try {
    const w = graph.container.offsetWidth;
    const v1 = graph.insertVertex(
      parent,
      'treeRoot',
      'Organization',
      w / 2 - 30,
      20,
      140,
      60,
      'image=/images/house.png'
    );
    graph.updateCellSize(v1);
    addOverlays(graph, v1, false);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  const content = document.createElement('div');
  content.style.padding = '4px';
  div.appendChild(content);
  const tb = new mxToolbar(content);

  tb.addItem('Zoom In', 'images/zoom_in32.png', function(evt) {
    graph.zoomIn();
  });

  tb.addItem('Zoom Out', 'images/zoom_out32.png', function(evt) {
    graph.zoomOut();
  });

  tb.addItem('Actual Size', 'images/view_1_132.png', function(evt) {
    graph.zoomActual();
  });

  tb.addItem('Print', 'images/print32.png', function(evt) {
    const preview = new mxPrintPreview(graph, 1);
    preview.open();
  });

  tb.addItem('Poster Print', 'images/press32.png', function(evt) {
    const pageCount = mxUtils.prompt('Enter maximum page count', '1');

    if (pageCount != null) {
      const scale = mxUtils.getScaleForPageCount(pageCount, graph);
      const preview = new mxPrintPreview(graph, scale);
      preview.open();
    }
  });

  // Function to create the entries in the popupmenu
  function createPopupMenu(graph, menu, cell, evt) {
    const model = graph.getModel();

    if (cell != null) {
      if (cell.isVertex()) {
        menu.addItem(
          'Add child',
          '/images/overlays/check.png',
          function() {
            addChild(graph, cell);
          }
        );
      }

      menu.addItem('Edit label', '/images/text.gif', function() {
        graph.startEditingAtCell(cell);
      });

      if (cell.id != 'treeRoot' && cell.isVertex()) {
        menu.addItem('Delete', '/images/delete.gif', function() {
          deleteSubtree(graph, cell);
        });
      }

      menu.addSeparator();
    }

    menu.addItem('Fit', '/images/zoom.gif', function() {
      graph.fit();
    });

    menu.addItem('Actual', '/images/zoomactual.gif', function() {
      graph.zoomActual();
    });

    menu.addSeparator();

    menu.addItem('Print', '/images/print.gif', function() {
      const preview = new mxPrintPreview(graph, 1);
      preview.open();
    });

    menu.addItem('Poster Print', '/images/print.gif', function() {
      const pageCount = mxUtils.prompt('Enter maximum page count', '1');

      if (pageCount != null) {
        const scale = mxUtils.getScaleForPageCount(pageCount, graph);
        const preview = new mxPrintPreview(graph, scale);
        preview.open();
      }
    });
  }

  function addOverlays(graph, cell, addDeleteIcon) {
    let overlay = new mxCellOverlay(
      new mxImage('images/add.png', 24, 24),
      'Add child'
    );
    overlay.cursor = 'hand';
    overlay.align = mxConstants.ALIGN_CENTER;
    overlay.addListener(
      mxEvent.CLICK,
      (sender, evt) => {
        addChild(graph, cell);
      }
    );

    graph.addCellOverlay(cell, overlay);

    if (addDeleteIcon) {
      overlay = new mxCellOverlay(
        new mxImage('images/close.png', 30, 30),
        'Delete'
      );
      overlay.cursor = 'hand';
      overlay.offset = new mxPoint(-4, 8);
      overlay.align = mxConstants.ALIGN_RIGHT;
      overlay.verticalAlign = mxConstants.ALIGN_TOP;
      overlay.addListener(
        mxEvent.CLICK,
        (sender, evt) => {
          deleteSubtree(graph, cell);
        }
      );

      graph.addCellOverlay(cell, overlay);
    }
  }

  function addChild(graph, cell) {
    const model = graph.getModel();
    const parent = graph.getDefaultParent();
    let vertex;

    model.beginUpdate();
    try {
      vertex = graph.insertVertex(parent, null, 'Double click to set name');
      const geometry = vertex.getGeometry();

      // Updates the geometry of the vertex with the
      // preferred size computed in the graph
      const size = graph.getPreferredSizeForCell(vertex);
      geometry.width = size.width;
      geometry.height = size.height;

      // Adds the edge between the existing cell
      // and the new vertex and executes the
      // automatic layout on the parent
      const edge = graph.insertEdge(parent, null, '', cell, vertex);

      // Configures the edge label "in-place" to reside
      // at the end of the edge (x = 1) and with an offset
      // of 20 pixels in negative, vertical direction.
      edge.geometry.x = 1;
      edge.geometry.y = 0;
      edge.geometry.offset = new mxPoint(0, -20);

      addOverlays(graph, vertex, true);
    } finally {
      model.endUpdate();
    }

    return vertex;
  }

  function deleteSubtree(graph, cell) {
    // Gets the subtree from cell downwards
    const cells = [];
    graph.traverse(cell, true, function(vertex) {
      cells.push(vertex);

      return true;
    });

    graph.removeCells(cells);
  }

  return div;
}

export const Default = Template.bind({});