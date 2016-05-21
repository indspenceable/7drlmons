import Entity from './entity.jsx';
import Game from './game.jsx';
import Input from './input.jsx';

var EMPTY_DELEGATE = {
  handleEvent: function() {},
  draw: function() {},
};

class Player extends Entity{
  constructor(x, y) {
    super('@', 'player', '#fff', '#000');
    this._x = x;
    this._y = y;
    this.delay = 0;
    this.delegates = [];
  }

  _currentDelegate() {
    return this.delegates[this.delegates.length-1];
  }

  getHp() {
    return this._hp;
  }
  getMaxHp() {
    return this._maxHp;
  }

  act() {
    Game.engine.lock();
    window.addEventListener("keydown", this);
    if (this.delay > 0) {
      this.delay -= 1;
      this.finishTurn();
    }
  }

  handleEvent(e) {
    if (this._currentDelegate() === undefined) {
      return this.makeMove(e);
    } else {
      return this._currentDelegate().handleEvent(this, e);
    }
  }

  makeMove(e) {
    // Entered a direction
    if (Input.getDirection8(e) !== undefined) {
      var str = String.fromCharCode(e.which);
      e.preventDefault();
      this._attemptMovmement(Input.getDirection8(e));
    } else if (Input.wait(e)) {
      this.finishTurn()
    }
  }

  _attemptMovmement(dirIndex) {
    var dir = ROT.DIRS[8][dirIndex];
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var monster = Game.monsterAt(newX, newY);

    if (Game.getTile(newX, newY).isWalkable()) {
      this.moveInstantlyToAndTrigger(newX,newY);
      Game.redrawMap();
      this.finishTurn();
    }
  }

  _attemptToSelectAttack(attackIndex) {
    Game.redrawMap();
  }

  // takeHit(damage, type) {
  //   var rtn = Entity.prototype.takeHit.call(this._currentMon, damage, type);
  //   Game._drawUI();
  //   return rtn;
  // }

  // _doAttack(direction, monster) {
  //   // TODO woop
  //   var move = this.defaultMeleeAttack();
  //   if (move !== undefined) {
  //     move.selectedDirection = direction;
  //     move.enact(this);
  //     return;
  //   }
  // }

  draw() {
    super.draw();
    if (this._currentDelegate() !== undefined) {
      this._currentDelegate().draw(this);
    }
  }

  finishTurn() {
    Game._drawUI();
    this.delegates = [];
    window.removeEventListener("keydown", this);
    Game.redrawMap();
    Game.engine.unlock();
  }

  logVisible(message) {
    return Game.logMessage(message);
  }

  getName() {
    return "Player";
  }

}

export default Player;
