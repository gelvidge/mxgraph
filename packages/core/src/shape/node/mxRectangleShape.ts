/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import {
  LINE_ARCSIZE,
  NONE,
  RECTANGLE_ROUNDING_FACTOR,
  STYLE_ABSOLUTE_ARCSIZE,
  STYLE_ARCSIZE,
  STYLE_POINTER_EVENTS,
} from '../../util/mxConstants';
import mxUtils from '../../util/mxUtils';
import mxShape from '../mxShape';
import mxAbstractCanvas2D from '../../util/canvas/mxAbstractCanvas2D';
import mxRectangle from '../../util/datatypes/mxRectangle';
import mxSvgCanvas2D from '../../util/canvas/mxSvgCanvas2D';

/**
 * Extends {@link mxShape} to implement a rectangle shape.
 * This shape is registered under {@link mxConstants.SHAPE_RECTANGLE} in {@link mxCellRenderer}.
 * @class mxRectangleShape
 * @extends {mxShape}
 */
class mxRectangleShape extends mxShape {
  constructor(
    bounds: mxRectangle | null = null,
    fill: string | null = '#FFFFFF',
    stroke: string | null = '#000000',
    strokewidth: number = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokewidth = strokewidth;
  }

  // TODO: Document me!
  strokewidth: number;

  /**
   * Returns true for non-rounded, non-rotated shapes with no glass gradient.
   */
  // isHtmlAllowed(): boolean;
  isHtmlAllowed(): boolean {
    let events = true;

    if (this.style != null) {
      events = mxUtils.getValue(this.style, STYLE_POINTER_EVENTS, '1') == '1';
    }

    return (
      !this.isRounded &&
      !this.glass &&
      this.rotation === 0 &&
      (events || (this.fill != null && this.fill !== NONE))
    );
  }

  /**
   * Generic background painting implementation.
   */
  // paintBackground(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintBackground(
    c: mxSvgCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    let events = true;

    if (this.style != null) {
      events = mxUtils.getValue(this.style, STYLE_POINTER_EVENTS, '1') == '1';
    }

    if (
      events ||
      (this.fill != null && this.fill !== NONE) ||
      (this.stroke != null && this.stroke !== NONE)
    ) {
      if (!events && (this.fill == null || this.fill === NONE)) {
        c.pointerEvents = false;
      }

      if (this.isRounded) {
        let r = 0;

        if (mxUtils.getValue(this.style, STYLE_ABSOLUTE_ARCSIZE, 0) == '1') {
          r = Math.min(
            w / 2,
            Math.min(
              h / 2,
              mxUtils.getValue(this.style, STYLE_ARCSIZE, LINE_ARCSIZE) / 2
            )
          );
        } else {
          const f =
            mxUtils.getValue(
              this.style,
              STYLE_ARCSIZE,
              RECTANGLE_ROUNDING_FACTOR * 100
            ) / 100;
          r = Math.min(w * f, h * f);
        }

        c.roundrect(x, y, w, h, r, r);
      } else {
        c.rect(x, y, w, h);
      }

      c.fillAndStroke();
    }
  }

  /**
   * Adds roundable support.
   */
  // isRoundable(c?: mxAbstractCanvas2D, x?: number, y?: number, w?: number, h?: number): boolean;
  isRoundable(
    c: mxAbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean {
    return true;
  }

  /**
   * Generic background painting implementation.
   */
  // paintForeground(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintForeground(
    c: mxSvgCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    if (
      this.glass &&
      !this.outline &&
      this.fill != null &&
      this.fill !== NONE
    ) {
      this.paintGlassEffect(
        c,
        x,
        y,
        w,
        h,
        this.getArcSize(w + this.strokewidth, h + this.strokewidth)
      );
    }
  }
}

export default mxRectangleShape;
