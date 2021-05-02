/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxShape from '../mxShape';
import mxPoint from '../../util/datatypes/mxPoint';
import mxUtils from '../../util/mxUtils';
import { LINE_ARCSIZE, STYLE_ARCSIZE } from '../../util/mxConstants';
import mxRectangle from '../../util/datatypes/mxRectangle';
import mxSvgCanvas2D from '../../util/canvas/mxSvgCanvas2D';

/**
 * Extends {@link mxShape} to implement a rhombus (aka diamond) shape.
 * This shape is registered under {@link mxConstants.SHAPE_RHOMBUS} in {@link mxCellRenderer}.
 * @class mxRhombus
 * @extends {mxShape}
 */
class mxRhombus extends mxShape {
  constructor(
    bounds: mxRectangle,
    fill: string,
    stroke: string,
    strokewidth: number = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokewidth = strokewidth;
  }

  /**
   * Adds roundable support.
   */
  // isRoundable(): boolean;
  isRoundable(): boolean {
    return true;
  }

  /**
   * Generic painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  // paintVertexShape(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintVertexShape(
    c: mxSvgCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const hw = w / 2;
    const hh = h / 2;

    const arcSize =
      mxUtils.getValue(this.style, STYLE_ARCSIZE, LINE_ARCSIZE) / 2;
    c.begin();
    this.addPoints(
      c,
      [
        new mxPoint(x + hw, y),
        new mxPoint(x + w, y + hh),
        new mxPoint(x + hw, y + h),
        new mxPoint(x, y + hh),
      ],
      this.isRounded,
      arcSize,
      true
    );
    c.fillAndStroke();
  }
}

export default mxRhombus;
