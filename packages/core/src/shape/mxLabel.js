/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxRectangle from '../util/datatypes/mxRectangle';
import {
  ALIGN_BOTTOM,
  ALIGN_CENTER,
  ALIGN_LEFT,
  ALIGN_MIDDLE,
  ALIGN_RIGHT,
  ALIGN_TOP,
  DEFAULT_IMAGESIZE,
  STYLE_IMAGE_ALIGN,
  STYLE_IMAGE_HEIGHT,
  STYLE_IMAGE_VERTICAL_ALIGN,
  STYLE_IMAGE_WIDTH,
  STYLE_INDICATOR_HEIGHT,
  STYLE_INDICATOR_WIDTH,
  STYLE_SPACING,
} from '../util/mxConstants';
import mxRectangleShape from './node/mxRectangleShape';
import mxUtils from '../util/mxUtils';

/**
 * Class: mxLabel
 *
 * Extends <mxShape> to implement an image shape with a label.
 * This shape is registered under <mxConstants.SHAPE_LABEL> in
 * <mxCellRenderer>.
 *
 * Constructor: mxLabel
 *
 * Constructs a new label shape.
 *
 * Parameters:
 *
 * bounds - <mxRectangle> that defines the bounds. This is stored in
 * <mxShape.bounds>.
 * fill - String that defines the fill color. This is stored in <fill>.
 * stroke - String that defines the stroke color. This is stored in <stroke>.
 * strokewidth - Optional integer that defines the stroke width. Default is
 * 1. This is stored in <strokewidth>.
 */
class mxLabel extends mxRectangleShape {
  constructor(bounds, fill, stroke, strokewidth) {
    super(bounds, fill, stroke, strokewidth);
  }

  /**
   * Default width and height for the image.
   * @default mxConstants.DEFAULT_IMAGESIZE
   */
  // imageSize: number;
  imageSize = DEFAULT_IMAGESIZE;

  /**
   * Default value for image spacing
   * @type {number}
   * @default 2
   */
  // spacing: number;
  spacing = 2;

  /**
   * Default width and height for the indicicator.
   * @type {number}
   * @default 10
   */
  // indicatorSize: number;
  indicatorSize = 10;

  /**
   * Default spacing between image and indicator
   * @default 2
   * @type {number}
   */
  // indicatorSpacing: number;
  indicatorSpacing = 2;

  /**
   * Initializes the shape and the <indicator>.
   */
  // init(container: HTMLElement): void;
  init(container) {
    super.init(container);

    if (this.indicatorShape != null) {
      this.indicator = new this.indicatorShape();
      this.indicator.dialect = this.dialect;
      this.indicator.init(this.node);
    }
  }

  /**
   * Reconfigures this shape. This will update the colors of the indicator
   * and reconfigure it if required.
   */
  // redraw(): void;
  redraw() {
    if (this.indicator != null) {
      this.indicator.fill = this.indicatorColor;
      this.indicator.stroke = this.indicatorStrokeColor;
      this.indicator.gradient = this.indicatorGradientColor;
      this.indicator.direction = this.indicatorDirection;
      this.indicator.redraw();
    }
    super.redraw();
  }

  /**
   * Returns true for non-rounded, non-rotated shapes with no glass gradient and
   * no indicator shape.
   */
  // isHtmlAllowed(): boolean;
  isHtmlAllowed() {
    return (
      super.isHtmlAllowed() &&
      this.indicatorColor == null &&
      this.indicatorShape == null
    );
  }

  /**
   * Generic background painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  // paintForeground(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintForeground(c, x, y, w, h) {
    this.paintImage(c, x, y, w, h);
    this.paintIndicator(c, x, y, w, h);
    super.paintForeground(c, x, y, w, h);
  }

  /**
   * Generic background painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  // paintImage(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintImage(c, x, y, w, h) {
    if (this.image != null) {
      const bounds = this.getImageBounds(x, y, w, h);
      c.image(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        this.image,
        false,
        false,
        false
      );
    }
  }

  /**
   * Generic background painting implementation.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  // getImageBounds(x: number, y: number, w: number, h: number): mxRectangle;
  getImageBounds(x, y, w, h) {
    const align = mxUtils.getValue(this.style, STYLE_IMAGE_ALIGN, ALIGN_LEFT);
    const valign = mxUtils.getValue(
      this.style,
      STYLE_IMAGE_VERTICAL_ALIGN,
      ALIGN_MIDDLE
    );
    const width = mxUtils.getNumber(
      this.style,
      STYLE_IMAGE_WIDTH,
      DEFAULT_IMAGESIZE
    );
    const height = mxUtils.getNumber(
      this.style,
      STYLE_IMAGE_HEIGHT,
      DEFAULT_IMAGESIZE
    );
    const spacing =
      mxUtils.getNumber(this.style, STYLE_SPACING, this.spacing) + 5;

    if (align === ALIGN_CENTER) {
      x += (w - width) / 2;
    } else if (align === ALIGN_RIGHT) {
      x += w - width - spacing;
    } // default is left
    else {
      x += spacing;
    }

    if (valign === ALIGN_TOP) {
      y += spacing;
    } else if (valign === ALIGN_BOTTOM) {
      y += h - height - spacing;
    } // default is middle
    else {
      y += (h - height) / 2;
    }

    return new mxRectangle(x, y, width, height);
  }

  /**
   * Generic background painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  // paintIndicator(c: mxAbstractCanvas2D, x: number, y: number, w: number, h: number): void;
  paintIndicator(c, x, y, w, h) {
    if (this.indicator != null) {
      this.indicator.bounds = this.getIndicatorBounds(x, y, w, h);
      this.indicator.paint(c);
    } else if (this.indicatorImage != null) {
      const bounds = this.getIndicatorBounds(x, y, w, h);
      c.image(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        this.indicatorImage,
        false,
        false,
        false
      );
    }
  }

  /**
   * Generic background painting implementation.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @returns {mxRectangle}
   */
  // getIndicatorBounds(x: number, y: number, w: number, h: number): mxRectangle;
  getIndicatorBounds(x, y, w, h) {
    const align = mxUtils.getValue(this.style, STYLE_IMAGE_ALIGN, ALIGN_LEFT);
    const valign = mxUtils.getValue(
      this.style,
      STYLE_IMAGE_VERTICAL_ALIGN,
      ALIGN_MIDDLE
    );
    const width = mxUtils.getNumber(
      this.style,
      STYLE_INDICATOR_WIDTH,
      this.indicatorSize
    );
    const height = mxUtils.getNumber(
      this.style,
      STYLE_INDICATOR_HEIGHT,
      this.indicatorSize
    );
    const spacing = this.spacing + 5;

    if (align === ALIGN_RIGHT) {
      x += w - width - spacing;
    } else if (align === ALIGN_CENTER) {
      x += (w - width) / 2;
    } // default is left
    else {
      x += spacing;
    }

    if (valign === ALIGN_BOTTOM) {
      y += h - height - spacing;
    } else if (valign === ALIGN_TOP) {
      y += spacing;
    } // default is middle
    else {
      y += (h - height) / 2;
    }

    return new mxRectangle(x, y, width, height);
  }

  /**
   * Generic background painting implementation.
   */
  // redrawHtmlShape(): void;
  redrawHtmlShape() {
    super.redrawHtmlShape();

    // Removes all children
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild);
    }

    if (this.image != null) {
      const node = document.createElement('img');
      node.style.position = 'relative';
      node.setAttribute('border', '0');

      const bounds = this.getImageBounds(
        this.bounds.x,
        this.bounds.y,
        this.bounds.width,
        this.bounds.height
      );
      bounds.x -= this.bounds.x;
      bounds.y -= this.bounds.y;

      node.style.left = `${Math.round(bounds.x)}px`;
      node.style.top = `${Math.round(bounds.y)}px`;
      node.style.width = `${Math.round(bounds.width)}px`;
      node.style.height = `${Math.round(bounds.height)}px`;

      node.src = this.image;

      this.node.appendChild(node);
    }
  }
}

export default mxLabel;
