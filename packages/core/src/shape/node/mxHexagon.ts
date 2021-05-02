/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxActor from '../mxActor';
import mxPoint from '../../util/datatypes/mxPoint';
import mxUtils from '../../util/mxUtils';
import { LINE_ARCSIZE, STYLE_ARCSIZE } from '../../util/mxConstants';
import mxSvgCanvas2D from '../../util/canvas/mxSvgCanvas2D';

/**
 * Implementation of the hexagon shape.
 * @class mxHexagon
 * @extends {mxActor}
 */
class mxHexagon extends mxActor {
  constructor() {
    super();
  }

  /**
   * Draws the path for this shape.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  // redrawPath(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  redrawPath(c: mxSvgCanvas2D, x: number, y: number, w: number, h: number) {
    const arcSize =
      mxUtils.getValue(this.style, STYLE_ARCSIZE, LINE_ARCSIZE) / 2;
    this.addPoints(
      c,
      [
        new mxPoint(0.25 * w, 0),
        new mxPoint(0.75 * w, 0),
        new mxPoint(w, 0.5 * h),
        new mxPoint(0.75 * w, h),
        new mxPoint(0.25 * w, h),
        new mxPoint(0, 0.5 * h),
      ],
      this.isRounded,
      arcSize,
      true
    );
  }
}

export default mxHexagon;
