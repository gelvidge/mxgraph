import mxgraph from '@mxgraph/core';
import { popup } from '@mxgraph/core/src/util/gui/mxWindow';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Xml_Json/JsonData',
  argTypes: {
    ...globalTypes
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph,
    mxObjectCodec,
    mxDomHelpers,
    mxCodecRegistry,
    mxEvent,
    mxClient,
    mxCodec,
    mxDomUtils,
    mxUtils
  } = mxgraph;

  mxClient.setImageBasePath('/images');

  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Register a new codec
  function CustomData(value) {
    this.value = value;
  }
  const codec = new mxObjectCodec(new CustomData());
  codec.encode = function(enc, obj) {
    const node = enc.document.createElement('CustomData');
    mxDomUtils.setTextContent(node, JSON.stringify(obj));
    return node;
  };
  codec.decode = function(dec, node, into) {
    const obj = JSON.parse(mxDomUtils.getTextContent(node));
    obj.constructor = CustomData;

    return obj;
  };
  mxCodecRegistry.register(codec);

  // Disables the built-in context menu
  if (!args.contextMenu)
    mxEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new mxGraph(container);

  // Enables rubberband selection
  if (args.rubberBand)
    new mxRubberband(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    v1.data = new CustomData('v1');
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    v2.data = new CustomData('v2');
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    mxDomHelpers.button('Show JSON', function() {
      const encoder = new mxCodec();
      const node = encoder.encode(graph.getModel());
      popup(mxUtils.getXml(node), true);
    })
  );

  return div;
}

export const Default = Template.bind({});