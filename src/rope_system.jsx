import {bresenhem, pointOfError, validConnection} from './util.jsx';
import Game from './game.jsx';

class RopeSystem {
  constructor() {
    this._knots = [];
    this._previousRopeSystem = undefined;
  }

  tiedIn() {
    return this._knots.length > 0;
  }

  tieIn(currentPosition) {
    this._knots = [currentPosition];
    this._previousRopeSystem = undefined;
  }

  getFirstPiton() {
    if (this._previousRopeSystem) {
      return this._previousRopeSystem.getFirstPiton();
    } else {
      return this._knots[0];
    }
  }

  getLastPiton() {
    return this._knots[this._knots.length-1]
  }

  eachPiton(cb) {
    if (this._previousRopeSystem) {
      this._previousRopeSystem.eachPiton(cb);
    }
    cb(this._knots[0]);
    cb(this.getLastPiton());
  }

  hammerPiton(currentPosition) {
    if (JSON.stringify(this._knots[0]) != JSON.stringify(currentPosition)) {
      console.log('a');
      const newSystem = new RopeSystem();
      this._knots.push(currentPosition);
      newSystem._knots = this._knots;
      newSystem._previousRopeSystem = this._previousRopeSystem
      this._previousRopeSystem = newSystem;
      this._knots = [currentPosition];
    } else {
      console.log('b')
      this.tieOut(currentPosition);
    }
  }

  tieOut(currentPosition) {
    const rs = new RopeSystem();
    this._knots.push(currentPosition);
    rs._knots = this._knots
    rs._previousRopeSystem = this._previousRopeSystem;
    this._knots = [];
    this._previousRopeSystem = undefined;
    Game.attachRopes(rs);
  }

  // rope related stuff
  eachRope(currentPosition, cb) {
    if (this._previousRopeSystem) {
      this._previousRopeSystem.eachRope(undefined, cb);
    }
    const knotsAndMe = this._knots.concat([currentPosition]).filter(el=>el);
    for (var i = 0; i < knotsAndMe.length-1; i+=1) {
      // let dupLine = knotsAndMe[i].filter(p=>true)
      // if (i>0){
      //   let previousLine = bresenhem(knotsAndMe[i-1], knotsAndMe[i]);
      //   dupLine.unshift(previousLine[previousLine.length-1]);
      // }

      cb(bresenhem(...knotsAndMe[i], ...knotsAndMe[i+1]))
      // Game.drawLine(dupLine, knotsAndMe[i+1],  '#fff', '#000');
      // Game.display.draw(...knotsAndMe[i], '+', '#f00', '#000');
    }
  }

  trimKnots(currentPosition) {
    const knotsAndMe = this._knots.concat([currentPosition]);
    for (var i = 0; i < knotsAndMe.length-2; i+=1) {
      var a = knotsAndMe[i+0];
      // var b = knotsAndMe[i+1];
      var c = knotsAndMe[i+2];
      if (validConnection(bresenhem(...a, ...c))) {
        this._knots.splice(i+1, 1);
        return this.trimKnots(currentPosition);
      }
    }
  }

  addRequiredKnot(currentPosition) {

    const lastKnot = this._knots[this._knots.length-1];

    const knotToMe = bresenhem(...lastKnot, ...currentPosition);
    const poe = pointOfError(knotToMe);
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
      const line = bresenhem(...lastKnot, ...pos);
      return validConnection(line);
    })
    // closest to the previous knot
    // Has a path to the last knot
    const point = sortedFilteredPoints.find(p => {
      const pos = [poe[0] + p[0], poe[1]+p[1]];
      return validConnection(bresenhem(...pos, ...currentPosition));
    });

    if (point){
      this._knots.push([poe[0] + point[0], poe[1] + point[1]]);
      this.trimKnots(currentPosition);
    } else if (sortedFilteredPoints.length > 0) {
      const point2 = sortedFilteredPoints[0];
      const newKnot =[poe[0] + point2[0], poe[1] + point2[1]];
      if (newKnot[0] == lastKnot[0] && newKnot[1] == lastKnot[1]) {
        this.fail();
      } else {
        if (this._knots.length > 300) {
          this.fail();
        }
        this._knots.push(newKnot);
        this.addRequiredKnot(currentPosition);
      }
    } else {
      this._knots.push(this.previousLocation);
      while (this.trimLastKnot(currentPosition)) {};
      this.addRequiredKnot(currentPosition);
    }
  }

  trimLastKnotOld() {
    if (this._knots.length > 1) {
      const a = this._knots[this._knots.length-2];
      const b = this._knots[this._knots.length-1];
      const c = [this._x, this._y];

      var oldToMe = bresenhem(...a, ...c);
      var poe = pointOfError(oldToMe)
      if (!poe) {
        var mid = oldToMe[Math.floor(oldToMe.length/2)];
        var midToCurrent = bresenhem(...b, ...mid)

        if (validConnection(midToCurrent)) {
          this._knots.splice(this._knots.length-1, 1);
        }
      }
    }
  }

  trimLastKnot(currentPosition, j) {
    // if we have more than one knot, see if we can
    if (this._knots.length > 1) {
      const secondToLastPoint = this._knots[this._knots.length-2];
      const lastPoint = this._knots[this._knots.length-1];

      const secondToLastRopeSegement = bresenhem(...secondToLastPoint, ...lastPoint);

      // if (secondToLastRopeSegement.length == 1) {
      //   this._knots.splice(this._knots.length-1, 1);
      //   return true;
      // }

      const reversedSegment = secondToLastRopeSegement.reverse();

      if (reversedSegment.length < 3) {
        if (reversedSegment.every(p=>{
            return validConnection(bresenhem(...p, ...currentPosition));
          })) {
          this._knots.splice(this._knots.length-1, 1);
          // Re-add a knot if needed.
          // this.addRequiredKnot(currentPosition);
        }
      } else {
        for (var i = 0; i < reversedSegment.length; i+=1) {
          const checkPoint = reversedSegment[i];
          const checkToPrev = bresenhem(...secondToLastPoint, ...checkPoint);
          const checkToMe = bresenhem(...checkPoint, ...currentPosition);
          const drawOne = p => Game.display.draw(p[0], p[1], '%', '#f0f', '#000');
          const drawAll = line => line.forEach(drawOne);

          if (!validConnection(checkToMe) || !validConnection(checkToPrev)) {
            if (i <= 1) {
              return false;
            } else {
              this._knots[this._knots.length-1] = reversedSegment[i-1];
              return true;
            }
          }
        }
        this._knots.splice(this._knots.length-1, 1);
        return true;
      }
    }
    return false;
  }

  shouldRevertToBackupKnots(currentPosition) {
    const knotsAndMe = this._knots.concat([currentPosition]);
    for (var i = 0; i < this._knots.length; i+=1) {
      const c = knotsAndMe[i];
      const n = knotsAndMe[i+1];
      if (!validConnection(bresenhem(...c, ...n))) {
        return true
      }
    }
    return false;
  }

  // In order to update knots...
  // 1) If there's an issue between the last knot and our current postion,
  //    add a new knot.
  // 2) At that point, if we can trim knots from the end of the list and still
  //    be OK, do it.

  // 3) Find any sets of 3 knots where we don't need the middle knot, and get
  //    rid of the middle knot.

  updateKnots(currentPosition) {
    // Do nothing if we have no knots.
    if (this._knots.length == 0) return;

    const backupKnots = this._knots.filter(p=>true);
    this.addRequiredKnot(currentPosition);
    var i = 0;
    while(this.trimLastKnot(currentPosition, i += 1)) {
    }
    if (this.shouldRevertToBackupKnots(currentPosition)) {
      this._knots = [...backupKnots, this.previousLocation];
    }
    this.trimKnots(currentPosition);

    this.previousLocation = [...currentPosition];
  }
}

export default RopeSystem;
