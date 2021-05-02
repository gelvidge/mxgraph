import mxCell from "./mxCell";
import mxDictionary from "../../util/datatypes/mxDictionary";
import mxObjectIdentity from "../../util/datatypes/mxObjectIdentity";

class mxCells extends Array<mxCell> {
  constructor(...items: mxCell[]) {
    super(...items);
  }

  /**
   * Returns the cells from the given array where the given filter function
   * returns true.
   */
  // filterCells(cells: Array<mxCell>, filter: (...args: any) => boolean): Array<mxCell>;
  filterCells(filter: Function): mxCell[] {
    let result = [];

    for (let i = 0; i < this.length; i += 1) {
      if (filter(this[i])) {
        result.push(this[i]);
      }
    }
    return result;
  }

  /**
   * Returns all opposite vertices wrt terminal for the given edges, only
   * returning sources and/or targets as specified. The result is returned
   * as an array of {@link mxCell}.
   *
   * @param {mxCell} terminal  that specifies the known end of the edges.
   * @param sources  Boolean that specifies if source terminals should be contained
   * in the result. Default is true.
   * @param targets  Boolean that specifies if target terminals should be contained
   * in the result. Default is true.
   */
  // getOpposites(edges: Array<mxCell>, terminal: mxCell, sources?: boolean, targets?: boolean): Array<mxCell>;
  getOpposites(terminal: mxCell,
               sources: boolean=true,
               targets: boolean=true): mxCell[] {

    const terminals = [];

    for (let i = 0; i < this.length; i += 1) {
      const source = this[i].getTerminal(true);
      const target = this[i].getTerminal(false);

      // Checks if the terminal is the source of
      // the edge and if the target should be
      // stored in the result
      if (
        source === terminal &&
        target != null &&
        target !== terminal &&
        targets
      ) {
        terminals.push(target);
      }

        // Checks if the terminal is the taget of
        // the edge and if the source should be
      // stored in the result
      else if (
        target === terminal &&
        source != null &&
        source !== terminal &&
        sources
      ) {
        terminals.push(source);
      }
    }
    return terminals;
  }

  /**
   * Returns the topmost cells of the hierarchy in an array that contains no
   * descendants for each {@link mxCell} that it contains. Duplicates should be
   * removed in the cells array to improve performance.
   */
  // getTopmostCells(cells: Array<mxCell>): Array<mxCell>;
  getTopmostCells(): mxCell[] {
    const dict = new mxDictionary();
    const tmp = [];

    for (let i = 0; i < this.length; i += 1) {
      dict.put(this[i], true);
    }

    for (let i = 0; i < this.length; i += 1) {
      const cell = this[i];
      let topmost = true;
      let parent = cell.getParent();

      while (parent != null) {
        if (dict.get(parent)) {
          topmost = false;
          break;
        }
        parent = parent.getParent();
      }

      if (topmost) {
        tmp.push(cell);
      }
    }
    return tmp;
  }

  /**
   * Returns an array that represents the set (no duplicates) of all parents
   * for the given array of cells.
   */
  // getParents(cells: Array<mxCell>): Array<mxCell>;
  getParents() {
    const parents = [];
    const dict = new mxDictionary();

    for (const cell of this) {
      const parent = cell.getParent();
      if (parent != null && !dict.get(parent)) {
        dict.put(parent, true);
        parents.push(parent);
      }
    }
    return parents;
  }

  /**
   * Returns an array of clones for the given array of {@link mxCell}`.
   * Depending on the value of includeChildren, a deep clone is created for
   * each cell. Connections are restored based if the corresponding
   * cell is contained in the passed in array.
   *
   * @param includeChildren  Boolean indicating if the cells should be cloned
   * with all descendants.
   * @param mapping  Optional mapping for existing clones.
   */
  // cloneCells(cells: Array<mxCell>, includeChildren?: boolean, mapping?: any): Array<mxCell>;
  cloneCells(includeChildren: boolean=true,
             mapping: any={}): mxCell[] {

    const clones: mxCell[] = [];

    for (const cell of this) {
      clones.push(this.cloneCellImpl(cell, mapping, includeChildren));
    }

    for (let i = 0; i < clones.length; i += 1) {
      if (clones[i] != null) {
        this.restoreClone(<mxCell>clones[i], this[i], mapping);
      }
    }
    return clones;
  }

  /**
   * Inner helper method for cloning cells recursively.
   *
   * @private
   */
  // cloneCellImpl(cell: mxCell, mapping?: any, includeChildren?: boolean): mxCell;
  cloneCellImpl(cell: mxCell,
                mapping: any={},
                includeChildren: boolean): mxCell {

    const ident = mxObjectIdentity.get(cell);
    let clone = mapping ? mapping[ident] : null;

    if (clone == null) {
      clone = cell.clone();
      mapping[ident] = clone;

      if (includeChildren) {
        const childCount = cell.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          const cloneChild = this.cloneCellImpl(
            <mxCell>cell.getChildAt(i),
            mapping,
            true
          );
          clone.insert(cloneChild);
        }
      }
    }
    return clone;
  }

  /**
   * Inner helper method for restoring the connections in
   * a network of cloned cells.
   *
   * @private
   */
  // restoreClone(clone: mxCell, cell: mxCell, mapping?: any): void;
  restoreClone(clone: mxCell,
               cell: mxCell,
               mapping: any): void {

    const source = cell.getTerminal(true);

    if (source != null) {
      const tmp = mapping[mxObjectIdentity.get(source)];
      if (tmp != null) {
        tmp.insertEdge(clone, true);
      }
    }

    const target = cell.getTerminal(false);
    if (target != null) {
      const tmp = mapping[mxObjectIdentity.get(target)];
      if (tmp != null) {
        tmp.insertEdge(clone, false);
      }
    }

    const childCount = clone.getChildCount();
    for (let i = 0; i < childCount; i += 1) {
      this.restoreClone(
        <mxCell>clone.getChildAt(i),
        <mxCell>cell.getChildAt(i),
        mapping
      );
    }
  }
}

export default mxCells;
