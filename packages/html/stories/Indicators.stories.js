import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/Indicators',
  argTypes: {
    ...globalTypes
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph,
    mxEdgeStyle,
    mxConstants,
    mxKeyHandler
  } = mxgraph;

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Creates the graph inside the given container
  const graph = new mxGraph(container);
  graph.setConnectable(true);
  new mxKeyHandler(graph);

  // Enables moving of vertex labels
  graph.vertexLabelsMovable = true;

  // Creates a style with an indicator
  let style = graph.getStylesheet().getDefaultVertexStyle();

  style[mxConstants.STYLE_SHAPE] = 'label';
  style[mxConstants.STYLE_VERTICAL_ALIGN] = 'bottom';
  style[mxConstants.STYLE_INDICATOR_SHAPE] = 'ellipse';
  style[mxConstants.STYLE_INDICATOR_WIDTH] = 34;
  style[mxConstants.STYLE_INDICATOR_HEIGHT] = 34;
  style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = 'top'; // indicator v-alignment
  style[mxConstants.STYLE_IMAGE_ALIGN] = 'center';
  style[mxConstants.STYLE_INDICATOR_COLOR] = 'green';
  delete style[mxConstants.STYLE_STROKECOLOR]; // transparent
  delete style[mxConstants.STYLE_FILLCOLOR]; // transparent

  // Creates a style with an indicator
  style = graph.getStylesheet().getDefaultEdgeStyle();

  style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
  style[mxConstants.STYLE_ELBOW] = mxConstants.ELBOW_VERTICAL;
  style[mxConstants.STYLE_ROUNDED] = true;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    graph.insertVertex(parent, null, 'Bottom Label', 80, 80, 80, 60);
    graph.insertVertex(
      parent,
      null,
      'Top Label',
      200,
      80,
      60,
      60,
      'indicatorShape=actor;indicatorWidth=28;indicatorColor=blue;imageVerticalAlign=bottom;verticalAlign=top'
    );
    graph.insertVertex(
      parent,
      null,
      'Right Label',
      300,
      80,
      120,
      60,
      'indicatorShape=cloud;indicatorWidth=40;indicatorColor=#00FFFF;imageVerticalAlign=center;verticalAlign=middle;imageAlign=left;align=left;spacingLeft=44'
    );
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return container;
}

export const Default = Template.bind({});