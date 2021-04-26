import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Xml_Json/UserObject',
  argTypes: {
    ...globalTypes
  }
};

const Template = ({ label, ...args }) => {
  const {
    mxGraph,
    mxRectangle,
    mxDomHelpers,
    mxKeyHandler,
    mxEvent,
    mxWindow,
    mxXmlUtils,
    mxCodec,
    mxConstants,
    mxUtils,
    mxEdgeStyle,
    mxDomUtils,
    mxForm,
    mxCellAttributeChange
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

  // Note that these XML nodes will be enclosing the
  // mxCell nodes for the model cells in the output
  const doc = mxXmlUtils.createXmlDocument();

  const person1 = doc.createElement('Person');
  person1.setAttribute('firstName', 'Daffy');
  person1.setAttribute('lastName', 'Duck');

  const person2 = doc.createElement('Person');
  person2.setAttribute('firstName', 'Bugs');
  person2.setAttribute('lastName', 'Bunny');

  const relation = doc.createElement('Knows');
  relation.setAttribute('since', '1985');

  // Creates the graph inside the given container
  const graph = new mxGraph(container);

  // Optional disabling of sizing
  graph.setCellsResizable(false);

  // Configures the graph contains to resize and
  // add a border at the bottom, right
  graph.setResizeContainer(true);
  graph.minimumContainerSize = new mxRectangle(0, 0, 500, 380);
  graph.setBorder(60);

  // Stops editing on enter key, handles escape
  new mxKeyHandler(graph);

  // Overrides method to disallow edge label editing
  graph.isCellEditable = function(cell) {
    return !cell.isEdge();
  };

  // Overrides method to provide a cell label in the display
  graph.convertValueToString = function(cell) {
    if (mxDomUtils.isNode(cell.value)) {
      if (cell.value.nodeName.toLowerCase() == 'person') {
        const firstName = cell.getAttribute('firstName', '');
        const lastName = cell.getAttribute('lastName', '');

        if (lastName != null && lastName.length > 0) {
          return `${lastName}, ${firstName}`;
        }

        return firstName;
      }
      if (cell.value.nodeName.toLowerCase() == 'knows') {
        return `${cell.value.nodeName} (Since ${cell.getAttribute(
          'since',
          ''
        )})`;
      }
    }

    return '';
  };

  // Overrides method to store a cell label in the model
  const { cellLabelChanged } = graph;
  graph.cellLabelChanged = function(cell, newValue, autoSize) {
    if (
      mxDomUtils.isNode(cell.value) &&
      cell.value.nodeName.toLowerCase() == 'person'
    ) {
      const pos = newValue.indexOf(' ');

      const firstName = pos > 0 ? newValue.substring(0, pos) : newValue;
      const lastName =
        pos > 0 ? newValue.substring(pos + 1, newValue.length) : '';

      // Clones the value for correct undo/redo
      const elt = cell.value.cloneNode(true);

      elt.setAttribute('firstName', firstName);
      elt.setAttribute('lastName', lastName);

      newValue = elt;
      autoSize = true;
    }

    cellLabelChanged.apply(this, arguments);
  };

  // Overrides method to create the editing value
  const { getEditingValue } = graph;
  graph.getEditingValue = function(cell) {
    if (
      mxDomUtils.isNode(cell.value) &&
      cell.value.nodeName.toLowerCase() == 'person'
    ) {
      const firstName = cell.getAttribute('firstName', '');
      const lastName = cell.getAttribute('lastName', '');

      return `${firstName} ${lastName}`;
    }
  };

  // Adds a special tooltip for edges
  graph.setTooltips(true);

  const { getTooltipForCell } = graph;
  graph.getTooltipForCell = function(cell) {
    // Adds some relation details for edges
    if (cell.isEdge()) {
      const src = this.getLabel(cell.getTerminal(true));
      const trg = this.getLabel(cell.getTerminal(false));

      return `${src} ${cell.value.nodeName} ${trg}`;
    }

    return getTooltipForCell.apply(this, arguments);
  };

  // Enables rubberband selection
  if (args.rubberBand)
    new mxRubberband(graph);

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  const properties = document.createElement('div');
  div.appendChild(properties);

  // Adds an option to view the XML of the graph
  buttons.appendChild(
    mxDomHelpers.button('View XML', function() {
      const encoder = new mxCodec();
      const node = encoder.encode(graph.getModel());
      mxWindow.popup(mxUtils.getPrettyXml(node), true);
    })
  );

  // Changes the style for match the markup
  // Creates the default style for vertices
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style[mxConstants.STYLE_STROKECOLOR] = 'gray';
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_SHADOW] = true;
  style[mxConstants.STYLE_FILLCOLOR] = '#DFDFDF';
  style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
  style[mxConstants.STYLE_FONTCOLOR] = 'black';
  style[mxConstants.STYLE_FONTSIZE] = '12';
  style[mxConstants.STYLE_SPACING] = 4;

  // Creates the default style for edges
  style = graph.getStylesheet().getDefaultEdgeStyle();
  style[mxConstants.STYLE_STROKECOLOR] = '#0C0C0C';
  style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
  style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_FONTCOLOR] = 'black';
  style[mxConstants.STYLE_FONTSIZE] = '10';

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, person1, 40, 40, 80, 30);
    const v2 = graph.insertVertex(parent, null, person2, 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, relation, v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  // Implements a properties panel that uses
  // mxCellAttributeChange to change properties
  graph
    .getSelectionModel()
    .addListener(mxEvent.CHANGE, function(sender, evt) {
      selectionChanged(graph);
    });

  selectionChanged(graph);

  /**
   * Updates the properties panel
   */
  function selectionChanged(graph) {
    const div = properties;

    // Forces focusout in IE
    graph.container.focus();

    // Clears the DIV the non-DOM way
    div.innerHTML = '';

    // Gets the selection cell
    const cell = graph.getSelectionCell();

    if (cell == null) {
      mxDomUtils.writeln(div, 'Nothing selected.');
    } else {
      // Writes the title
      const center = document.createElement('center');
      mxDomUtils.writeln(center, `${cell.value.nodeName} (${cell.id})`);
      div.appendChild(center);
      mxDomUtils.br(div);

      // Creates the form from the attributes of the user object
      const form = new mxForm();

      const attrs = cell.value.attributes;

      for (let i = 0; i < attrs.length; i++) {
        createTextField(graph, form, cell, attrs[i]);
      }

      div.appendChild(form.getTable());
      mxDomUtils.br(div);
    }
  }

  /**
   * Creates the textfield for the given property.
   */
  function createTextField(graph, form, cell, attribute) {
    const input = form.addText(`${attribute.nodeName}:`, attribute.nodeValue);

    const applyHandler = function() {
      const newValue = input.value || '';
      const oldValue = cell.getAttribute(attribute.nodeName, '');

      if (newValue != oldValue) {
        graph.getModel().beginUpdate();

        try {
          const edit = new mxCellAttributeChange(
            cell,
            attribute.nodeName,
            newValue
          );
          graph.getModel().execute(edit);
          graph.updateCellSize(cell);
        } finally {
          graph.getModel().endUpdate();
        }
      }
    };

    mxEvent.addListener(input, 'keypress', function(evt) {
      // Needs to take shift into account for textareas
      if (evt.keyCode == /* enter */ 13 && !mxEvent.isShiftDown(evt)) {
        input.blur();
      }
    });

    // Note: Known problem is the blurring of fields in
    // Firefox by changing the selection, in which case
    // no event is fired in FF and the change is lost.
    // As a workaround you should use a local variable
    // that stores the focused field and invoke blur
    // explicitely where we do the graph.focus above.
    mxEvent.addListener(input, 'blur', applyHandler);
  }

  return div;
}

export const Default = Template.bind({});