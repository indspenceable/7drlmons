import Entity from './entity.jsx'
import Game from './game.jsx'

class HunterSeeker extends Entity {
  constructor(x, y) {
    super("H", "Hunter Seeker", '#f00', '#000');
    this._x = x;
    this._y = y;

    this.state = 'roam';

    this.patrols = [];
    for (var i = 0; i < 20; i+=1 ) {
      let targ =[Math.floor(Math.random()*30)+1, Math.floor(Math.random()*20)+1];
      if (Game.getTile(...targ).isWalkable()) {
        this.patrols.push(targ);
      }
    }
    this.lastSeen = {}
    this.patrols.forEach(p => this.lastSeen[p] = Math.floor(Math.random()*50));
  }

  // TODO this should work for players and monsters.
  _calculateFOV() {
    var varRadius = 6;

    var withinRange = (x,y) => {
      var dx = (this._x - x);
      var dy = (this._y - y);
      return (dx*dx) + (dy*dy) < (varRadius*varRadius);
    }
    var lightPasses = (x,y) => {
      var tile = Game.getTile(x,y);
      return tile.canSeeThrough();
    }

    var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
    this.visibleTiles = [];
    fov.compute(this._x, this._y, varRadius, (x,y,r,canSee) => {
      if (withinRange(x,y)) {
        this.visibleTiles.push([x,y]);
        if (this.lastSeen[[x,y]] !== undefined) {
          this.lastSeen[[x,y]] = 0;
        }
      }
    });
  }

  incrementSeenTimes() {
    for (var p in this.lastSeen) {
      this.lastSeen[p] += 1;
    }
  }

  // Utility function
  stepOnPath(path) {
    if (path.length < 2) {
      return;
    }
    this.moveInstantlyToAndTrigger(...path[1]);
  }

  selectTarget() {
    return this.patrols.map(p => [
      p,
      Math.abs(p[0] - this._x) + Math.abs(p[1] - this._y) - this.lastSeen[p]
    ]).sort((p1, p2) => {
      if (p1[1] < p2[1]) {
        return -1;
      } else if (p1[1] > p2[1]) {
        return 1;
      } else {
        return 0;
      }
    })[0][0];
  }

  // State Machine
  doAction() {
    this.state = (this[this.state]() || this.state)
  }

  moveAlongPatrol() {
    this._calculateFOV();
    const target = this.selectTarget();
    const path = Game.findPathTo(this.getX(), this.getY(), ...target, [this, Game.player]);
    this.stepOnPath(path);
    this.incrementSeenTimes();
    this._calculateFOV();
  }

  canSeePlayer() {
    for (var i in this.visibleTiles) {
      var p = this.visibleTiles[i];
      if (Game.player._x == p[0] && Game.player._y == p[1]) {
        this.lastSighting = p;
        return true;
      }
    }
    return false;
  }

  hunt() {
    this._calculateFOV();
    if ( this.canSeePlayer() ) {
      const path = Game.findPathTo(this.getX(), this.getY(), Game.player.getX(), Game.player.getY());
      if (path.length >= 3) {
        this.stepOnPath(path);
      } else {
        console.log("BLLEEP BLOOOOSPP");
      }
      return 'hunt';
    } else {
      return this.roam();
    }
  }

  roam() {
    if ( this.canSeePlayer() ) {
      return this.hunt();
    } else {
      this.moveAlongPatrol();
      return 'roam';
    }
  }

  draw() {
    // if (Game._canSee(this._x, this._y)) {
      super.draw();
      if (this.state == 'roam') {
        Game.display.draw(...this.selectTarget(), 'X', '#0f0', '#000');
      }
      if (this.state == 'hunt') {
        Game.display.draw(...this.lastSighting, 'X', '#0f0', '#000');
      }
    // }
  }
}

export default HunterSeeker;
