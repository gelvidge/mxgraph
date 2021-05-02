import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/FixedIcons',
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
    mxRectangle,
    mxConstants,
    mxUtils,
    mxLabel
  } = mxgraph;

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Overrides the image bounds code to change the position
  mxLabel.prototype.getImageBounds = function(x, y, w, h) {
    const iw = mxUtils.getValue(
      this.style,
      mxConstants.STYLE_IMAGE_WIDTH,
      mxConstants.DEFAULT_IMAGESIZE
    );
    const ih = mxUtils.getValue(
      this.style,
      mxConstants.STYLE_IMAGE_HEIGHT,
      mxConstants.DEFAULT_IMAGESIZE
    );

    // Places the icon
    const ix = (w - iw) / 2;
    const iy = h - ih;

    return new mxRectangle(x + ix, y + iy, iw, ih);
  };

  // Makes the shadow brighter
  mxConstants.SHADOWCOLOR = '#C0C0C0';

  // Creates the graph inside the given container
  const graph = new mxGraph(container);

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
    const v1 = graph.insertVertex(
      parent,
      null,
      'Fixed icon',
      20,
      20,
      80,
      50,
      'shape=label;image=images/plus.png;imageWidth=16;imageHeight=16;spacingBottom=10;' +
        'fillColor=#adc5ff;gradientColor=#7d85df;glass=1;rounded=1;shadow=1;'
    );
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return container;
}

export const Default = Template.bind({});