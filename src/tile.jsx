import Game from './game.jsx';
import Point from './point.jsx';
var browns = ['#DEB887', '#CD853F', '#A0522D', '#D2B48C'];
var gray   = () => ROT.Color.toHex(ROT.Color.interpolate([0, 0, 0], [255, 255, 255], (Math.random()*0.5) + 0.25))

class StaticGlyph {
  static makeStatic(glyph) {
    return new StaticGlyph(glyph.c, glyph.fg, glyph.bg);
  }

  constructor(c,fg,bg) {
    this._c = c;
    this._fg = fg;
    this._bg = bg;
  }

  get c() {
    return this._c;
  }
  get fg() {
    return this._fg;
  }
  get bg() {
    return this._bg;
  }
}

class Tile {
  constructor(glyph) {
    this._glyph = glyph;
  }
  trigger(){}
  canSeeThrough(){ return true; }
  isWalkable(){ return true; }
  get glyph() { return this._glyph; }
}

class Wall extends Tile {
  constructor(x, y) {
    super(new StaticGlyph('#', gray(), '#000'));
    this.position = Point.at([x,y]);
  }
  isWalkable() { return false; }
  canSeeThrough() { return false; }
}

class Empty extends Tile {
  constructor(x, y) {
    super(new StaticGlyph('.', gray(), '#000'));
    this.position = Point.at([x,y]);
  }
}

class SmokeGlyph {
  get c() { return '%'; }
  get fg() { return gray(); }
  get bg() { return '#000'; }
}

class Smoke extends Tile {
  constructor(x, y) {
    super(new SmokeGlyph());
    this.position = Point.at([x,y]);
  }

  canSeeThrough() { return false }
}

module.exports = {
  Wall,
  Empty,
  Smoke,
}
