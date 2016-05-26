import Game from './game.jsx'
import Point from './point.jsx'

class Entity {
  constructor(c, name, fg, bg) {
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


  calculateFOV() {
    const visionRadius = 6;

    const withinRangeCallback = (x,y) => {
      // TODO make this a method on Point
      const dx = (this.position._x - x);
      const dy = (this.position._y - y);
      return (dx*dx) + (dy*dy) < (visionRadius*visionRadius);
    }
    const canSeeThroughCallback = (x,y) => {
      return Game.getTile(Point.at([x,y])).canSeeThrough() || this.position.eq(Point.at([x,y]));
    }

    const fovCalculator = new ROT.FOV.PreciseShadowcasting(canSeeThroughCallback);
    this.visibleTiles.clear();
    this.startFOV();
    fovCalculator.compute(...this.position.coords, visionRadius, (x, y, r, canSee) => {
      if (withinRangeCallback(x,y)) {
        this.see(Point.at([x,y]));
      }
    });
  }

  startFOV() {}
  see(p) {
    this.visibleTiles.add(p);
  }

  // This relies on calling calculateFOV()
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
