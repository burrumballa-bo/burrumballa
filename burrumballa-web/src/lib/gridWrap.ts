/**
 * True when a `cols`-column grid holding `total` items wraps into more than
 * one row AND the trailing row is shorter than the others — the case where
 * CSS Grid leaves the last row's items flush left instead of centered.
 * A single row that simply doesn't fill every column (total <= cols) is not
 * included: that row never wraps, so it keeps Grid's default alignment.
 */
export function rowNeedsCentering(total: number, cols: number): boolean {
  return cols > 1 && total > cols && total % cols !== 0;
}
