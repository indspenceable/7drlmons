import Game from './game.jsx';
var browns = ['#DEB887', '#CD853F', '#A0522D', '#D2B48C'];

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
  isTree() { return false; }

  draw(){ Game.display.draw(this.x, this.y, this.c1, this.fg1, this.bg1); }
  drawFromMemory(){ Game.display.draw(this.x, this.y, this.c1, "#ccc", "#222"); }
}

class GrippableBackground extends Tile {
  isGrippable() {return true;}
}

class Tree extends GrippableBackground.build('|', '#a53', '#333') {
  isTree() { return true; }
}
class FallenTree extends Tile {
  constructor(x, y) {
    super('#', browns.random(), '#333');
    this.x = x;
    this.y = y;
  }
  isGrippable() { return true; }
}

class Wall extends Tile {
  constructor(x, y) {
    super(' ', '#000', browns.random());
    this.x = x;
    this.y = y;
  }
  drawFromMemory(){
    Game.display.draw(this.x, this.y, this.c1, '#000', '#531');
  }
  isWalkable() { return false; }
  canSeeThrough() { return false; }
  isGrippable() { return true; }
}

module.exports = {
  GrippableBackground,
  Wall,
  Tree,
  Empty: Tile.build(' ', '#fff', '#333'),
  FallenTree,
}
