import Game from './game.jsx';
var browns = ['#DEB887', '#CD853F', '#A0522D', '#D2B48C'];
var gray   = () => ROT.Color.toHex(ROT.Color.interpolate([0, 0, 0], [255, 255, 255], (Math.random()*0.5) + 0.25))

class Tile {
  constructor(c1,fg,bg) {
    this.c1 = c1;
    this.fg = fg;
    this.bg = bg;
    this.ropeGlyph = undefined;
  }

  trigger(){}
  canSeeThrough(){ return true; }
  isWalkable(){ return true; }

  glyph(){
    return [this.c1, this.fg, this.bg];
  }
}

class Wall extends Tile {
  constructor(x, y) {
    super('#', gray(), '#000');
    this.x = x;
    this.y = y;
  }
  isWalkable() { return false; }
  canSeeThrough() { return false; }
}

class Empty extends Tile {
  constructor(x, y) {
    super('.',
      gray(),
      '#000');
    this.x = x;
    this.y = y;
  }
}

module.exports = {
  Wall,
  Empty,
}
