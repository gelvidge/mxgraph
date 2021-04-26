import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Layers',
  argTypes: {
    ...globalTypes
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph,
    mxDomHelpers,
    mxCell,
    mxGraphModel,
    mxPoint
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

  // Creates the graph inside the given container using a model
  // with a custom root and two layers. Layers can also be added
  // dynamically using let layer = model.add(root, new mxCell()).
  const root = new mxCell();
  const layer0 = root.insert(new mxCell());
  const layer1 = root.insert(new mxCell());
  const model = new mxGraphModel(root);

  const graph = new mxGraph(container, model);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  model.beginUpdate();
  try {
    const v1 = graph.insertVertex(
      layer1,
      null,
      'Hello,',
      20,
      20,
      80,
      30,
      'fillColor=#C0C0C0'
    );
    const v2 = graph.insertVertex(
      layer1,
      null,
      'Hello,',
      200,
      20,
      80,
      30,
      'fillColor=#C0C0C0'
    );
    const v3 = graph.insertVertex(layer0, null, 'World!', 110, 150, 80, 30);
    const e1 = graph.insertEdge(
      layer1,
      null,
      '',
      v1,
      v3,
      'strokeColor=#0C0C0C'
    );
    e1.geometry.points = [new mxPoint(60, 165)];
    const e2 = graph.insertEdge(layer0, null, '', v2, v3);
    e2.geometry.points = [new mxPoint(240, 165)];
    const e3 = graph.insertEdge(
      layer0,
      null,
      '',
      v1,
      v2,
      'edgeStyle=topToBottomEdgeStyle'
    );
    e3.geometry.points = [new mxPoint(150, 30)];
    const e4 = graph.insertEdge(
      layer1,
      null,
      '',
      v2,
      v1,
      'strokeColor=#0C0C0C;edgeStyle=topToBottomEdgeStyle'
    );
    e4.geometry.points = [new mxPoint(150, 40)];
  } finally {
    // Updates the display
    model.endUpdate();
  }

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    mxDomHelpers.button('Layer 0', function() {
      model.setVisible(layer0, !layer0.isVisible());
    })
  );

  buttons.appendChild(
    mxDomHelpers.button('Layer 1', function() {
      model.setVisible(layer1, !layer1.isVisible());
    })
  );

  return div;
}

export const Default = Template.bind({});