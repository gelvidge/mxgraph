import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Connections/PortRefs',
  argTypes: {
    ...globalTypes
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph, 
    mxRubberband, 
    mxPoint,
    mxEdgeHandler,
    mxConstraintHandler,
    mxImage,
    mxShape,
    mxTriangle,
    mxConstants,
    mxConnectionConstraint,
    mxClient
  } = mxgraph;

  mxClient.setImageBasePath('/images');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Replaces the port image
  mxConstraintHandler.prototype.pointImage = new mxImage(
    '/images/dot.gif',
    10,
    10
  );

  const graph = new mxGraph(container);
  graph.setConnectable(true);

  // Disables automatic handling of ports. This disables the reset of the
  // respective style in mxGraph.cellConnected. Note that this feature may
  // be useful if floating and fixed connections are combined.
  graph.setPortsEnabled(false);

  // Enables rubberband selection
  new mxRubberband(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Ports are equal for all shapes...
  const ports = new Array();

  // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
  ports.w = { x: 0, y: 0.5, perimeter: true, constraint: 'west' };
  ports.e = { x: 1, y: 0.5, perimeter: true, constraint: 'east' };
  ports.n = { x: 0.5, y: 0, perimeter: true, constraint: 'north' };
  ports.s = { x: 0.5, y: 1, perimeter: true, constraint: 'south' };
  ports.nw = { x: 0, y: 0, perimeter: true, constraint: 'north west' };
  ports.ne = { x: 1, y: 0, perimeter: true, constraint: 'north east' };
  ports.sw = { x: 0, y: 1, perimeter: true, constraint: 'south west' };
  ports.se = { x: 1, y: 1, perimeter: true, constraint: 'south east' };

  // ... except for triangles
  const ports2 = new Array();

  // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
  ports2.in1 = { x: 0, y: 0, perimeter: true, constraint: 'west' };
  ports2.in2 = { x: 0, y: 0.25, perimeter: true, constraint: 'west' };
  ports2.in3 = { x: 0, y: 0.5, perimeter: true, constraint: 'west' };
  ports2.in4 = { x: 0, y: 0.75, perimeter: true, constraint: 'west' };
  ports2.in5 = { x: 0, y: 1, perimeter: true, constraint: 'west' };

  ports2.out1 = {
    x: 0.5,
    y: 0,
    perimeter: true,
    constraint: 'north east',
  };
  ports2.out2 = { x: 1, y: 0.5, perimeter: true, constraint: 'east' };
  ports2.out3 = {
    x: 0.5,
    y: 1,
    perimeter: true,
    constraint: 'south east',
  };

  // Extends shapes classes to return their ports
  mxShape.prototype.getPorts = function() {
    return ports;
  };

  mxTriangle.prototype.getPorts = function() {
    return ports2;
  };

  // Disables floating connections (only connections via ports allowed)
  graph.connectionHandler.isConnectableCell = function(cell) {
    return false;
  };
  mxEdgeHandler.prototype.isConnectableCell = function(cell) {
    return graph.connectionHandler.isConnectableCell(cell);
  };

  // Disables existing port functionality
  graph.view.getTerminalPort = function(state, terminal, source) {
    return terminal;
  };

  // Returns all possible ports for a given terminal
  graph.getAllConnectionConstraints = function(terminal, source) {
    if (
      terminal != null &&
      terminal.shape != null &&
      terminal.shape.stencil != null
    ) {
      // for stencils with existing constraints...
      if (terminal.shape.stencil != null) {
        return terminal.shape.stencil.constraints;
      }
    } else if (terminal != null && terminal.cell.isVertex()) {
      if (terminal.shape != null) {
        const ports = terminal.shape.getPorts();
        const cstrs = new Array();

        for (const id in ports) {
          const port = ports[id];

          const cstr = new mxConnectionConstraint(
            new mxPoint(port.x, port.y),
            port.perimeter
          );
          cstr.id = id;
          cstrs.push(cstr);
        }

        return cstrs;
      }
    }

    return null;
  };

  // Sets the port for the given connection
  graph.setConnectionConstraint = function(
    edge,
    terminal,
    source,
    constraint
  ) {
    if (constraint != null) {
      const key = source
        ? mxConstants.STYLE_SOURCE_PORT
        : mxConstants.STYLE_TARGET_PORT;

      if (constraint == null || constraint.id == null) {
        this.setCellStyles(key, null, [edge]);
      } else if (constraint.id != null) {
        this.setCellStyles(key, constraint.id, [edge]);
      }
    }
  };

  // Returns the port for the given connection
  graph.getConnectionConstraint = function(edge, terminal, source) {
    const key = source
      ? mxConstants.STYLE_SOURCE_PORT
      : mxConstants.STYLE_TARGET_PORT;
    const id = edge.style[key];

    if (id != null) {
      const c = new mxConnectionConstraint(null, null);
      c.id = id;

      return c;
    }

    return null;
  };

  // Returns the actual point for a port by redirecting the constraint to the port
  const graphGetConnectionPoint = graph.getConnectionPoint;
  graph.getConnectionPoint = function(vertex, constraint) {
    if (constraint.id != null && vertex != null && vertex.shape != null) {
      const port = vertex.shape.getPorts()[constraint.id];

      if (port != null) {
        constraint = new mxConnectionConstraint(
          new mxPoint(port.x, port.y),
          port.perimeter
        );
      }
    }

    return graphGetConnectionPoint.apply(this, arguments);
  };

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'A', 20, 20, 100, 40);
    const v2 = graph.insertVertex(
      parent,
      null,
      'B',
      80,
      100,
      100,
      100,
      'shape=ellipse;perimeter=ellipsePerimeter'
    );
    const v3 = graph.insertVertex(
      parent,
      null,
      'C',
      190,
      30,
      100,
      60,
      'shape=triangle;perimeter=trianglePerimeter;direction=south'
    );
    const e1 = graph.insertEdge(
      parent,
      null,
      '',
      v1,
      v2,
      'sourcePort=s;targetPort=nw'
    );
    const e2 = graph.insertEdge(
      parent,
      null,
      '',
      v1,
      v3,
      'sourcePort=e;targetPort=out3'
    );
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  // Comming soon... Integration with orthogonal edge style
  // Sets default edge style to use port constraints (needs to be moved up when uncommented)
  // graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';
  /* let mxUtilsGetPortConstraints = mxUtils.getPortConstraints;
    mxUtils.getPortConstraints = function(terminal, edge, source, defaultValue)
    {
      let key = (source) ? mxConstants.STYLE_SOURCE_PORT : mxConstants.STYLE_TARGET_PORT;
      let id = edge.style[key];

      let port = terminal.shape.getPorts()[id];

      // TODO: Add support for rotation, direction
      if (port != null)
      {
        return port.constraint;
      }

      return mxUtilsGetPortConstraints.apply(this, arguments);
    };
    // Connect preview
    graph.connectionHandler.createEdgeState = function(me)
    {
      let edge = graph.createEdge(null, null, null, null, null);

      return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    };
    */

  return container;
}

export const Default = Template.bind({});