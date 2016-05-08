import Entity from './entity.jsx';
import Game from './game.jsx'

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
    } else if (this.shouldFall()) {
      // Falling logic!
      this.doFall();
    }
  }

  doFall() {
    this.delegates.push(EMPTY_DELEGATE);
    this.moveInstantlyToAndTrigger(this._x,this._y+1);
    Game.redrawMap();
    var timeOut = 0;
    if (this.shouldFall()) {
      timeOut = 20;
    }
    setTimeout(this.finishTurn.bind(this), timeOut);
  }

  gripOffset(x, y) {
    if (this.grip !== undefined) {
      return [this.grip[0] - x, this.grip[1] - y];
    }
  }

  filteredGripOffsets() {
    var POSSIBLE_GRIPS = [
      [ 0,  0],
      [ 1,  0],
      [ 1,  1],
      [ 0,  1],
      [-1,  1],
      [-1,  0],
      [-1, -1],
      [ 0, -1],
      [ 1, -1],
    ]

    var rtn = [];
    for (var i = 0; i < POSSIBLE_GRIPS.length; i+=1) {
      var current = POSSIBLE_GRIPS[i];
      if (Game.getTile(current[0] + this._x, current[1] + this._y).isGrippable()) {
        rtn.push(current);
      }
    }
    return rtn;
  }

  rotateGrip() {
    var findNextOffset = function(grip) {
      var currentPossibleGrips = this.filteredGripOffsets();
      for (var i = 0; i < currentPossibleGrips.length; i+= 1){
        if (grip[0] == currentPossibleGrips[i][0] &&
          grip[1] == currentPossibleGrips[i][1]) {
            return currentPossibleGrips[(i+1)%currentPossibleGrips.length];
          }
        }
      return currentPossibleGrips[0];
    }.bind(this);

  var offset = this.gripOffset(this._x, this._y) || [-10, -10];
    var newGripOffset = findNextOffset(offset);
    if ( newGripOffset !== undefined ) {
      this.grip = [newGripOffset[0] + this._x, newGripOffset[1] + this._y];
    }
  }

  shouldFall() {
    this.releaseGripIfInvalid();
    if (this.grip !== undefined) {
      return false;
    }

    var tile = Game.getTile(this._x, this._y + 1);
    return tile.isWalkable();
  }

  releaseGripIfInvalid() {
    if (this._grip !== undefined) {
      var gx = this._grip[0];
      var gy = this._grip[1];
      if (Math.abs(this._x - gx) > 1 || Math.abs(this._y - gy) > 1) {
        this._grip = undefined;
      }
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
    // var movementKeymap = { 38: 0, 33: 1, 39: 2, 34: 3, 40: 4, 35: 5, 37: 6, 36: 7, };
    var nonGripMovementKeymap = {
        // 38: 0,
        39: 1,
        // 40: 2,
        37: 3,
      }
      var grippingMovementKeymap = {
        38: 0,
        39: 1,
        40: 2,
        37: 3,
      }

    var code = e.keyCode;
    /* one of numpad directions? */

    if (code == 71) {
      // Grip! 'g'
      this.rotateGrip();
      Game.redrawMap();

    } else if (code == 82) {
      // Release grip! 'r'
      this.grip = undefined;
      Game.redrawMap();
      if (this.shouldFall()) {
        this.doFall();
      }
    } else if (code in nonGripMovementKeymap && this.grip === undefined) {
      event.preventDefault()
      this._attemptHorizontalMovement(nonGripMovementKeymap[code]);
    } else if (code in grippingMovementKeymap && this.grip !== undefined) {
      event.preventDefault()
      this._attemptGrippingMovement(grippingMovementKeymap[code]);
  } else if (e.keyCode == 190) {
        // . (wait)
        this.finishTurn()
      }
    }

    _attemptHorizontalMovement(dirIndex) {
      var dir = ROT.DIRS[4][dirIndex];
      /* is there a free space? */
      var newX = this._x + dir[0];
      var newY = this._y + dir[1];

      var monster = Game.monsterAt(newX, newY)
      if (Game.getTile(newX, newY).isWalkable()) {
        this._doMovement(newX, newY)
      } else if (Game.getTile(this._x, this._y-1).isWalkable() &&
       Game.getTile(newX,    this._y-1).isWalkable()) {
        this._doMovement(newX, this._y-1);
      }
    }

    _attemptGrippingMovement(dirIndex) {
      var dir = ROT.DIRS[4][dirIndex];
      /* is there a free space? */
      var newX = this._x + dir[0];
      var newY = this._y + dir[1];

      var monster = Game.monsterAt(newX, newY);
      var legalOffset = function(offset) {
        return (Math.abs(offset[0]) < 2) && (Math.abs(offset[1]) < 2);
      }
      if (Game.getTile(newX, newY).isWalkable() && legalOffset(this.gripOffset(newX, newY))) {
        this._doMovement(newX, newY);
        if (! Game.getTile(newX, newY+1).isWalkable()) {
          this.grip = undefined;
          Game.redrawMap();
        }
      }
    }

    _attemptToSelectAttack(attackIndex) {
      Game.redrawMap();
    }

    _doMovement(newX, newY) {
      this.moveInstantlyToAndTrigger(newX,newY);
      Game.redrawMap();
      this.finishTurn();
    }

    takeHit(damage, type) {
      var rtn = Entity.prototype.takeHit.call(this._currentMon, damage, type);
      Game._drawUI();
      return rtn;
    }

//TODO this should live on the mon.
defaultMeleeAttack() {
}

_doAttack(direction, monster) {
    // TODO woop
    var move = this.defaultMeleeAttack();
    if (move !== undefined) {
      move.selectedDirection = direction;
      move.enact(this);
      return;
    }
  }

  draw() {
    if (this.grip !== undefined) {
      Game.display.draw(this.grip[0], this.grip[1], '+', '#f0f', '#000');
    }
    super.draw();
    if (this._currentDelegate() !== undefined) {
      this._currentDelegate().draw(this);
    }
  }

  finishTurn() {
    Game._drawUI();
    this.delegates = [];
    window.removeEventListener("keydown", this);
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
