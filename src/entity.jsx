import Game from './game.jsx'
import Point from './point.jsx'

class Entity {
  constructor(c, name, fg, bg) {
    this.glyph = {
      c: c,
      fg: fg,
      bg: bg,
    }
    this.c = c;
    this._name = name;
    this.fg = fg;
    this.bg = bg;

    this.visibleTiles = new Set;
    this.delay = 0;
  }

  getName() {
    return this._name;
  }

  moveInstantlyToAndTrigger(point) {
    this.position = point;
    Game.getTile(point).trigger(this);
  }

  isAt(point) {
    return point.eq(this.position);
  }

  draw() {
    Game.displayAndSetMemory(this.position, this.c, this.fg, this.bg);
  }

  asVisualGlyph() {
    return this.glyph
  }

  act() {
    if (this.delay > 0) {
      this.delay -= 1;
    } else {
      this.doAction();
    }
  }

  logVisible(message) {
    if (Game._canSee(this.position)) {
      Game.logMessage(message);
    }
  }

  addFOVToVisibleTiles(pos, visionRadius, overrideParams={}) {
    const params = Object.assign({
      confirmVision: (e) => true,
    }, overrideParams);

    const withinRangeCallback = (x,y) => {
      // TODO make this a method on Point
      const dx = (pos._x - x);
      const dy = (pos._y - y);
      return (dx*dx) + (dy*dy) < (visionRadius*visionRadius);
    }
    const canSeeThroughCallback = (x,y) => {
      return Game.getTile(Point.at([x,y])).canSeeThrough() || this.position.eq(Point.at([x,y]));
    }

    const fovCalculator = new ROT.FOV.PreciseShadowcasting(canSeeThroughCallback);
    fovCalculator.compute(...pos.coords, visionRadius, (x, y, r, canSee) => {
      if (withinRangeCallback(x,y) && params.confirmVision(Point.at([x,y]))) {
        this.see(Point.at([x,y]));
      }
    });
  }

  see(p) {
    this.visibleTiles.add(p);
  }

  // This relies on calling addFOVToVisibleTiles()
  canSee(point) {
    return this.visibleTiles.has(point);
  }

  hear(location, sound) {

  }
}

class Monster extends Entity {
  die() {
    Game.logMessage(this.getName() + " dies");
    Game.deregisterEntity(this);
  }
}

export default Entity;
