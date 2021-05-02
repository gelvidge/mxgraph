/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxUtils from '../../util/mxUtils';
import {
  STYLE_IMAGE_ASPECT,
  STYLE_IMAGE_BACKGROUND,
  STYLE_IMAGE_BORDER,
} from '../../util/mxConstants';
import mxRectangleShape from './mxRectangleShape';
import mxRectangle from '../../util/datatypes/mxRectangle';
import mxCellState from '../../view/cell/mxCellState';
import mxSvgCanvas2D from '../../util/canvas/mxSvgCanvas2D';
import mxCellOverlay from '../../view/cell/mxCellOverlay';

/**
 * Extends {@link mxShape} to implement an image shape.
 * This shape is registered under {@link mxConstants.SHAPE_IMAGE} in {@link mxCellRenderer}.
 *
 * @class mxImageShape
 * @extends {mxRectangleShape}
 */
class mxImageShape extends mxRectangleShape {
  constructor(
    bounds: mxRectangle,
    image: string,
    fill: string = '#FFFFFF',
    stroke: string = '#000000',
    strokewidth: number = 1
  ) {
    super();
    this.bounds = bounds;
    this.image = image;
    this.fill = fill;
    this.stroke = stroke;
    this.strokewidth = strokewidth;
    this.shadow = false;
  }

  // TODO: Document me!!
  shadow: boolean;

  image: string;

  // Used in mxCellRenderer
  overlay: mxCellOverlay | null = null;

  /**
   * Switch to preserve image aspect. Default is true.
   * @default true
   */
  // preserveImageAspect: boolean;
  preserveImageAspect = true;

  /**
   * Disables offset in IE9 for crisper image output.
   */
  // getSvgScreenOffset(): number;
  getSvgScreenOffset(): number {
    return 0;
  }

  /**
   * Overrides {@link mxShape.apply} to replace the fill and stroke colors with the
   * respective values from {@link mxConstants.STYLE_IMAGE_BACKGROUND} and
   * {@link mxConstants.STYLE_IMAGE_BORDER}.
   *
   * Applies the style of the given {@link mxCellState} to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - {@link mxConstants.STYLE_IMAGE_BACKGROUND} => fill
   * - {@link mxConstants.STYLE_IMAGE_BORDER} => stroke
   *
   * @param {mxCellState} state   {@link mxCellState} of the corresponding cell.
   */
  // apply(state: mxCellState): void;
  apply(state: mxCellState) {
    super.apply(state);

    this.fill = null;
    this.stroke = null;
    this.gradient = null;

    if (this.style != null) {
      this.preserveImageAspect =
        mxUtils.getNumber(this.style, STYLE_IMAGE_ASPECT, 1) == 1;

      // Legacy support for imageFlipH/V
      this.flipH =
        this.flipH || mxUtils.getValue(this.style, 'imageFlipH', 0) == 1;
      this.flipV =
        this.flipV || mxUtils.getValue(this.style, 'imageFlipV', 0) == 1;
    }
  }

  /**
   * Returns true if HTML is allowed for this shape. This implementation always
   * returns false.
   */
  // isHtmlAllowed(): boolean;
  isHtmlAllowed(): boolean {
    return !this.preserveImageAspect;
  }

  /**
   * Creates and returns the HTML DOM node(s) to represent
   * this shape. This implementation falls back to <createVml>
   * so that the HTML creation is optional.
   */
  // createHtml(): HTMLElement;
  createHtml(): HTMLElement {
    const node = document.createElement('div');
    node.style.position = 'absolute';
    return node;
  }

  /**
   * Disables inherited roundable support.
   */
  // isRoundable(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): boolean;
  isRoundable(
    c: mxSvgCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean {
    return false;
  }

  /**
   * Generic background painting implementation.
   */
  // paintVertexShape(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintVertexShape(
    c: mxSvgCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    if (this.image != null) {
      const fill = mxUtils.getValue(this.style, STYLE_IMAGE_BACKGROUND, null);
      let stroke = mxUtils.getValue(this.style, STYLE_IMAGE_BORDER, null);

      if (fill != null) {
        // Stroke rendering required for shadow
        c.setFillColor(fill);
        c.setStrokeColor(stroke);
        c.rect(x, y, w, h);
        c.fillAndStroke();
      }

      // FlipH/V are implicit via mxShape.updateTransform
      c.image(x, y, w, h, this.image, this.preserveImageAspect, false, false);

      stroke = mxUtils.getValue(this.style, STYLE_IMAGE_BORDER, null);

      if (stroke != null) {
        c.setShadow(false);
        c.setStrokeColor(stroke);
        c.rect(x, y, w, h);
        c.stroke();
      }
    } else {
      this.paintBackground(c, x, y, w, h);
    }
  }
}

export default mxImageShape;
