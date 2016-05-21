import Game from './game.jsx'

class Entity {
  constructor(c, name, fg, bg) {
    this.c = c;
    this._name = name;
    this.fg = fg;
    this.bg = bg;
  }

  getX() {
    return this._x;
  }
  getY() {
    return this._y;
  }

  getName() {
    return this._name;
  }

  moveInstantlyToAndTrigger(x,y) {
    this._x = x;
    this._y = y;
    Game.getTile(this._x, this._y).trigger(this);
  }

  isAt(x,y) {
    return x == this._x && y == this._y;
  }

  draw() {
    Game.displayAndSetMemory(this._x, this._y, this.c, this.fg, this.bg);
  }

  act() {
    if (this.delay > 0) {
      this.delay -= 1;
    } else {
      this.doAction();
    }
  }

  logVisible(message) {
    if (Game._canSee(this._x, this._y)) {
      Game.logMessage(message);
    }
  }
}

class Monster extends Entity {
  die() {
    Game.logMessage(this.getName() + " dies");
    Game.deregisterMonster(this);
  }
}

export default Entity;
