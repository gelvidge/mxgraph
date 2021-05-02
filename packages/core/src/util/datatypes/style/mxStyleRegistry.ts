/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import {
  EDGESTYLE_ELBOW,
  EDGESTYLE_ENTITY_RELATION,
  EDGESTYLE_LOOP,
  EDGESTYLE_ORTHOGONAL,
  EDGESTYLE_SEGMENT,
  EDGESTYLE_SIDETOSIDE,
  EDGESTYLE_TOPTOBOTTOM,
  PERIMETER_ELLIPSE,
  PERIMETER_HEXAGON,
  PERIMETER_RECTANGLE,
  PERIMETER_RHOMBUS,
  PERIMETER_TRIANGLE,
} from '../../mxConstants';
import mxEdgeStyle from './mxEdgeStyle';
import mxPerimeter from './mxPerimeter';

/**
 * @class mxStyleRegistry
 *
 * Singleton class that acts as a global converter from string to object values
 * in a style. This is currently only used to perimeters and edge styles.
 */
class mxStyleRegistry {
  /*
   * Variable: values
   *
   * Maps from strings to objects.
   */
  static values = <any>{};

  /**
   * Function: putValue
   *
   * Puts the given object into the registry under the given name.
   */
  static putValue(name: string, obj: any): void {
    mxStyleRegistry.values[name] = obj;
  }

  /**
   * Function: getValue
   *
   * Returns the value associated with the given name.
   */
  static getValue(name: string): any {
    return mxStyleRegistry.values[name];
  }

  /**
   * Function: getName
   *
   * Returns the name for the given value.
   */
  static getName(value: any): string | null {
    for (const key in mxStyleRegistry.values) {
      if (mxStyleRegistry.values[key] === value) {
        return key;
      }
    }
    return null;
  }
}

mxStyleRegistry.putValue(EDGESTYLE_ELBOW, mxEdgeStyle.ElbowConnector);
mxStyleRegistry.putValue(EDGESTYLE_ENTITY_RELATION, mxEdgeStyle.EntityRelation);
mxStyleRegistry.putValue(EDGESTYLE_LOOP, mxEdgeStyle.Loop);
mxStyleRegistry.putValue(EDGESTYLE_SIDETOSIDE, mxEdgeStyle.SideToSide);
mxStyleRegistry.putValue(EDGESTYLE_TOPTOBOTTOM, mxEdgeStyle.TopToBottom);
mxStyleRegistry.putValue(EDGESTYLE_ORTHOGONAL, mxEdgeStyle.OrthConnector);
mxStyleRegistry.putValue(EDGESTYLE_SEGMENT, mxEdgeStyle.SegmentConnector);

mxStyleRegistry.putValue(PERIMETER_ELLIPSE, mxPerimeter.EllipsePerimeter);
mxStyleRegistry.putValue(PERIMETER_RECTANGLE, mxPerimeter.RectanglePerimeter);
mxStyleRegistry.putValue(PERIMETER_RHOMBUS, mxPerimeter.RhombusPerimeter);
mxStyleRegistry.putValue(PERIMETER_TRIANGLE, mxPerimeter.TrianglePerimeter);
mxStyleRegistry.putValue(PERIMETER_HEXAGON, mxPerimeter.HexagonPerimeter);

export default mxStyleRegistry;
