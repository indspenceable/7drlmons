class Point {
  static at(ary) {
    if (Point.cache === undefined) {
      Point.cache = {}
    }
    if (Point.cache[ary] === undefined) {
      Point.cache[ary] = Object.freeze(new Point(...ary));
    }
    return Point.cache[ary];
  }
  constructor(x,y) {
    this._x = x;
    this._y = y;
  }
  get coords() {
    return [this._x, this._y];
  }
  eq(o) {
    return o._x == this._x && o._y == this._y;
  }
  plus(o) {
    return Point.at([this._x + o._x, this._y + o._y]);
  }
  offset(x,y) {
    return Point.at([this._x + x, this._y + y]);
  }
  toString() {
    return "POINT[" + this._x + "," + this._y + "]";
  }
  distance(o) {
    return Math.abs(o._x - this._x) + Math.abs(o._y - this._y);
  }
}
export default Point;

