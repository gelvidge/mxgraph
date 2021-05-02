import mxPoint from './datatypes/mxPoint';
import mxTemporaryCellStates from '../view/cell/mxTemporaryCellStates';
import mxCodec from '../serialization/mxCodec';
import { DIALECT_SVG, NS_SVG } from './mxConstants';

/**
 * Function: createXmlDocument
 *
 * Returns a new, empty XML document.
 */
export const createXmlDocument = () => {
  let doc = null;

  if (document.implementation && document.implementation.createDocument) {
    doc = document.implementation.createDocument('', '', null);
  } else if ('ActiveXObject' in window) {
    doc = mxUtils.createMsXmlDocument();
  }

  return doc;
};

/**
 * Function: createMsXmlDocument
 *
 * Returns a new, empty Microsoft.XMLDOM document using ActiveXObject.
 */
export const createMsXmlDocument = () => {
  const doc = new ActiveXObject('Microsoft.XMLDOM');
  doc.async = false;

  // Workaround for parsing errors with SVG DTD
  doc.validateOnParse = false;
  doc.resolveExternals = false;

  return doc;
};

/**
 * Function: parseXml
 *
 * Parses the specified XML string into a new XML document and returns the
 * new document.
 *
 * Example:
 *
 * (code)
 * let doc = mxUtils.parseXml(
 *   '<mxGraphModel><root><MyDiagram id="0"><mxCell/></MyDiagram>'+
 *   '<MyLayer id="1"><mxCell parent="0" /></MyLayer><MyObject id="2">'+
 *   '<mxCell style="strokeColor=blue;fillColor=red" parent="1" vertex="1">'+
 *   '<mxGeometry x="10" y="10" width="80" height="30" as="geometry"/>'+
 *   '</mxCell></MyObject></root></mxGraphModel>');
 * (end)
 *
 * Parameters:
 *
 * xml - String that contains the XML data.
 */
export const parseXml = (xml) => {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
};

/**
 * Function: getViewXml
 */
export const getViewXml = (graph, scale, cells, x0, y0) => {
  x0 = x0 != null ? x0 : 0;
  y0 = y0 != null ? y0 : 0;
  scale = scale != null ? scale : 1;

  if (cells == null) {
    const model = graph.getModel();
    cells = [model.getRoot()];
  }

  const view = graph.getView();
  let result = null;

  // Disables events on the view
  const eventsEnabled = view.isEventsEnabled();
  view.setEventsEnabled(false);

  // Workaround for label bounds not taken into account for image export.
  // Creates a temporary draw pane which is used for rendering the text.
  // Text rendering is required for finding the bounds of the labels.
  const { drawPane } = view;
  const { overlayPane } = view;

  if (graph.dialect === DIALECT_SVG) {
    view.drawPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into temporary container
    view.overlayPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.overlayPane);
  } else {
    view.drawPane = view.drawPane.cloneNode(false);
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into temporary container
    view.overlayPane = view.overlayPane.cloneNode(false);
    view.canvas.appendChild(view.overlayPane);
  }

  // Resets the translation
  const translate = view.getTranslate();
  view.translate = new mxPoint(x0, y0);

  // Creates the temporary cell states in the view
  const temp = new mxTemporaryCellStates(graph.getView(), scale, cells);

  try {
    const enc = new mxCodec();
    result = enc.encode(graph.getView());
  } finally {
    temp.destroy();
    view.translate = translate;
    view.canvas.removeChild(view.drawPane);
    view.canvas.removeChild(view.overlayPane);
    view.drawPane = drawPane;
    view.overlayPane = overlayPane;
    view.setEventsEnabled(eventsEnabled);
  }

  return result;
};
