import Entity from './entity.jsx';
import Game from './game.jsx';
import Input from './input.jsx'

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

    this.knots = [];
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
      if (this.knots.length == 0) {
        this.addKnot();
      } else {
        this.knots = [];
        Game.redrawMap();
      }
    }
  }

  addKnot() {
    this.knots.push([this._x, this._y]);
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
    this.drawRope();
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

  // rope related stuff

  bresenhem(x0, y0, x1, y1){
    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);

    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx-dy;

    var line = []
    for (var i = 0; i < 1000; i+=1){
       line.push([x0,y0]);  // Do what you need to for this

       if ((x0==x1) && (y0==y1)) return line;
       var e2 = 2*err;
       if (e2 >-dy){ err -= dy; x0 += sx; }
       if (e2 < dx){ err += dx; y0 += sy; }
    }
  }

  drawRope() {
    const knotsAndMe = this.knots.concat([[this._x, this._y]]);
    for (var i = 0; i < this.knots.length; i+=1) {
      let dupLine = knotsAndMe[i].filter(p=>true)
      // if (i>0){
      //   let previousLine = this.bresenhem(knotsAndMe[i-1], knotsAndMe[i]);
      //   dupLine.unshift(previousLine[previousLine.length-1]);
      // }
      Game.drawLine(dupLine, knotsAndMe[i+1],  '#fff', '#000');
      Game.display.draw(...knotsAndMe[i], '+', '#f00', '#000');
    }
  }

  validConnection(line) {
    return !this.pointOfError(line);
  }

  pointOfError(line) {
    return line.reverse().find(p => !Game.getTile(...p).isWalkable());
  }

  trimKnots() {
    for (var i = 0; i < this.knots.length-2; i+=1) {
      var a = this.knots[i+0];
      // var b = this.knots[i+1];
      var c = this.knots[i+2];
      if (this.validConnection(this.bresenhem(...a, ...c))) {
        this.knots.splice(i+1, 1);
        return this.trimKnots();
      }
    }
  }

  addRequiredKnot() {
    const lastKnot = this.knots[this.knots.length-1];
    const knotToMe = this.bresenhem(...lastKnot, this._x, this._y);
    const poe = this.pointOfError(knotToMe);
    if (!poe) {
      return
    }

    //Check all adjacent spaces for one thats -
    const sortedFilteredPoints = Array.from(ROT.DIRS[8]).sort(p =>{
      Math.abs(p[0]-lastKnot[0]) + Math.abs(p[1]-lastKnot[1])
    }).filter(p => {
      const pos = [poe[0] + p[0], poe[1]+p[1]];
      return pos[0] != lastKnot[0] || pos[1] != lastKnot[1];
    }).filter(p => {
      const pos = [poe[0] + p[0], poe[1]+p[1]];
      return Game.getTile(...pos).isWalkable();
    }).filter(p => {
      const pos = [poe[0] + p[0], poe[1]+p[1]];
      const line = this.bresenhem(...lastKnot, ...pos);
      return this.validConnection(line);
    })
    // closest to the previous knot
    // Has a path to the last knot
    const point = sortedFilteredPoints.find(p => {
      const pos = [poe[0] + p[0], poe[1]+p[1]];
      return this.validConnection(this.bresenhem(...pos, this._x, this._y));
    });

    if (point){
      this.knots.push([poe[0] + point[0], poe[1] + point[1]]);
      this.trimKnots();
    } else {
      const point2 = sortedFilteredPoints[0];
      const newKnot =[poe[0] + point2[0], poe[1] + point2[1]];
      if (newKnot[0] == lastKnot[0] && newKnot[1] == lastKnot[1]) {
        this.fail();
      } else {
        if (this.knots.length > 300) {
          this.fail();
        }
        this.knots.push(newKnot);
        this.addRequiredKnot();
      }
    }
  }

  trimLastKnotOld() {
    if (this.knots.length > 1) {
      const a = this.knots[this.knots.length-2];
      const b = this.knots[this.knots.length-1];
      const c = [this._x, this._y];

      var oldToMe = this.bresenhem(...a, ...c);
      var poe = this.pointOfError(oldToMe)
      if (!poe) {
        var mid = oldToMe[Math.floor(oldToMe.length/2)];
        var midToCurrent = this.bresenhem(...b, ...mid)

        if (this.validConnection(midToCurrent)) {
          this.knots.splice(this.knots.length-1, 1);
        }
      }
    }
  }

  trimLastKnot(i) {
    // if we have more than one knot, see if we can
    if (this.knots.length > 1) {
      const secondToLastPoint = this.knots[this.knots.length-2];
      const lastPoint = this.knots[this.knots.length-1];

      const secondToLastRopeSegement = this.bresenhem(...secondToLastPoint, ...lastPoint);

      // if (secondToLastRopeSegement.length == 1) {
      //   this.knots.splice(this.knots.length-1, 1);
      //   console.log('a');
      //   return true;
      // }

      const reversedSegment = secondToLastRopeSegement.reverse();

      if (reversedSegment.length < 3) {
        if (reversedSegment.every(p=>{
            console.log(p);
            return this.validConnection(this.bresenhem(...p, this._x, this._y));
          })) {
          this.knots.splice(this.knots.length-1, 1);
          // Re-add a knot if needed.
          // this.addRequiredKnot();
        }
      } else {
        for (var i = 0; i < reversedSegment.length; i+=1) {
          const checkPoint = reversedSegment[i];
          const checkToPrev = this.bresenhem(...secondToLastPoint, ...checkPoint);
          const checkToMe = this.bresenhem(...checkPoint, this._x, this._y);
          const drawOne = p => Game.display.draw(p[0], p[1], '%', '#f0f', '#000');
          const drawAll = line => line.forEach(drawOne);

          if (!this.validConnection(checkToMe) || !this.validConnection(checkToPrev)) {
            if (i <= 1) {
              return false;
            } else {
              this.knots[this.knots.length-1] = reversedSegment[i-1];
              return true;
            }
          }
        }
        this.knots.splice(this.knots.length-1, 1);
        return false;
      }
    }
    return false;
  }

  updateKnots(skipDraw) {
    // Do nothing if we have no knots.
    if (this.knots.length == 0) return;
    this.addRequiredKnot();
    var i = 0;
    while(this.trimLastKnot(i += 1)) {
      console.log('.');
    }
    if (!skipDraw) {
      Game.redrawMap();
    }
  }

  finishTurn() {
    Game._drawUI();
    this.delegates = [];
    this.gainOrLoseGripStrength();
    this.updateKnots();
    window.updateKnots = this.updateKnots.bind(this);
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
