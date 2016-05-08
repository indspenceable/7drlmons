import Game from './game.jsx';

class Tile {
  constructor(c1,fg1,bg1) {
    this.c1 = c1;
    this.fg1 = fg1;
    this.bg1 = bg1;
  }

  static build(c1,fg1,bg1) {
    return class extends this {
      constructor(x, y) {
        super(c1,fg1,bg1);
        this.x = x;
        this.y = y;
      }
    }
  }

  trigger(){}
  canSeeThrough(){ return true; }
  isWalkable(){ return true; }
  isGrippable(){ return false; }

  draw(){ Game.display.draw(this.x, this.y, this.c1, this.fg1, this.bg1); }
  drawFromMemory(){ Game.display.draw(this.x, this.y, this.c1, "#ccc", "#222"); }
}

class GrippableBackground extends Tile {
  isGrippable() {return true;}
}

class Wall extends Tile {
  constructor(x, y) {
    super('#', '#999', '#000');
    this.x = x;
    this.y = y;
  }
  isWalkable() { return false; }
  canSeeThrough() { return false; }
  isGrippable() { return true; }
}

module.exports = {
  GrippableBackground: GrippableBackground,
  Empty: Tile.build(' ', '#fff', '#333'),
  Wall: Wall,
}
