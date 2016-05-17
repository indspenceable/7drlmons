import Entity from './entity.jsx';
import Game from './game.jsx';
import Input from './input.jsx';
import RopeSystem from './rope_system.jsx';

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
    this.gripStrength = 50;

    this.ropeSystem = new RopeSystem();
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

  currentlySupported() {
    var tile = Game.getTile(this._x, this._y+1);
    return !tile.isWalkable();
  }

  shouldFall() {
    this.releaseGripIfInvalid();
    this.releaseGripIfStrengthDepleted();
    if (this.grip) {
      return false;
    }
    return !this.currentlySupported();
  }

  releaseGripIfInvalid() {
    if (this.grip !== undefined) {
      var gx = this.grip[0];
      var gy = this.grip[1];
      if (Math.abs(this._x - gx) > 1 || Math.abs(this._y - gy) > 1) {
        this.grip = undefined;
      }
    }
  }

  releaseGripIfStrengthDepleted() {
    if (this.grip && this.gripStrength <= 0) {
      this.grip = undefined;
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
      if (e.shiftKey) {
        // Try to grip in that direction
        var dir = ROT.DIRS[8][Input.getDirection8(e)];
        this._attemptSetGrip(dir);
      } else {
        if (this.grip) {
          var str = String.fromCharCode(e.which);
          e.preventDefault();
          this._attemptGrippingMovement(Input.getDirection8(e));
        } else if(Input.groundDirection(e)) {
          var str = String.fromCharCode(e.which);
          e.preventDefault();
          this._attemptHorizontalMovement(Input.getDirection8(e));
        }
      }
    } else if (Input.setGrip(e)) {
      this._attemptSetGrip([0, 0]);
    } else if (Input.releaseGrip(e)) {
      this.grip = undefined;
      Game.redrawMap();
      if (this.shouldFall()) {
        this.doFall();
      }
    } else if (Input.wait(e)) {
      // this.finishTurn()
      Game.chopDownTree(this._x, this._y);
    } else if (Input.piton(e)) {
      if (this.ropeSystem.tiedIn()) {
        this.ropeSystem.tieOut([this._x, this._y]);
      } else {
        this.ropeSystem.tieIn([this._x, this._y]);
      }
      Game.redrawMap();
    }
  }

  _attemptSetGrip(dir) {
    /* is there a free space? */
    var targetX = this._x + dir[0];
    var targetY = this._y + dir[1];

    if (Game.getTile(targetX, targetY).isGrippable()) {
      this.grip = [targetX, targetY];
      Game.redrawMap();
    }
  }

  _attemptHorizontalMovement(dirIndex) {
    var dir = ROT.DIRS[8][dirIndex];
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var monster = Game.monsterAt(newX, newY);

    if (Game.getTile(newX, newY).isWalkable()) {
      this._doMovement(newX, newY)
    } else if (Game.getTile(this._x, this._y-1).isWalkable() &&
      Game.getTile(newX, this._y-1).isWalkable()) {
      this._doMovement(newX, this._y-1);
    }
  }

  _attemptGrippingMovement(dirIndex) {
    var dir = ROT.DIRS[8][dirIndex];
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];

    var monster = Game.monsterAt(newX, newY);
    var legalOffset = function(offset) {
      return (Math.abs(offset[0]) < 2) && (Math.abs(offset[1]) < 2);
    }
    if (Game.getTile(newX, newY).isWalkable() && legalOffset(this.gripOffset(newX, newY))) {
      this.moveInstantlyToAndTrigger(newX,newY);
      if (this.currentlySupported()) {
        this.grip = undefined;
      }
      Game.redrawMap();
      this.finishTurn();
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
    if (this.grip) {
      Game.display.draw(this.grip[0], this.grip[1], '+', '#f0f', '#000');
    }
    if (this.ropeSystem.tiedIn()) {
      this.ropeSystem.eachRope([this._x, this._y], line => Game.drawAsLine(line, '#742', '#321'));
      Game.display.draw(...this.ropeSystem.knots[0], 'o',  '#742', '#321');
    }
    super.draw();
    if (this._currentDelegate() !== undefined) {
      this._currentDelegate().draw(this);
    }
  }


  gainOrLoseGripStrength() {
    if (this.currentlySupported()) {
      this.gripStrength += 1;
    } else if (this.grip && !this.currentlySupported()) {
      this.gripStrength -= 3;
    }
  }


  finishTurn() {
    Game._drawUI();
    this.delegates = [];
    this.gainOrLoseGripStrength();
    this.ropeSystem.updateKnots([this._x, this._y]);
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
