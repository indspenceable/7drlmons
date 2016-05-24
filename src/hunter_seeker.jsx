import Entity from './entity.jsx'
import Game from './game.jsx'
import Point from './point.jsx'

class HunterSeeker extends Entity {
  constructor(x, y) {
    super("é", "Hunter Seeker", '#f00', '#000');
    this.position = Point.at([x, y]);

    this.state = 'roam';

    this.patrols = [];
    for (var i = 0; i < 20; i+=1 ) {
      let targ = Point.at([Math.floor(Math.random()*30)+1, Math.floor(Math.random()*20)+1]);
      if (Game.getTile(targ).isWalkable()) {
        this.patrols.push(targ);
      }
    }
    this.lastSeen = {}
    this.patrols.forEach(p => this.lastSeen[p] = Math.floor(Math.random()*50));
    this.target = this.position;
  }

  see(p) {
    super.see(p);
    if (this.lastSeen[p] !== undefined) {
      this.lastSeen[p] = 0;
    }
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
    this.moveInstantlyToAndTrigger(path[1]);
  }

  selectTarget() {
    // map points to [point, score] pairs;
    return this.patrols.map(p => [
      p,
      Math.abs(p._x - this.position._x) + Math.abs(p._y - this.position._y) - this.lastSeen[p]
    ]).sort((p1, p2) => {
      // sort by score
      if (p1[1] < p2[1]) {
        return -1;
      } else if (p1[1] > p2[1]) {
        return 1;
      } else {
        return 0;
      }
      // Return the point of the top rated.
    })[0][0];
  }

  // State Machine
  doAction() {
    this.state = (this[this.state]() || this.state)
  }

  moveAlongPatrol() {
    this.calculateFOV();
    this.setTarget(this.selectTarget());
    const path = Game.findPathTo(this.position, this.target);
    this.stepOnPath(path);
    this.incrementSeenTimes();
    this.calculateFOV();
  }

  canSeePlayer() {
    for (var i in this.visibleTiles) {
      // i is a string rep of location
      if (Game.player.position.coords.toString() == i) {
        this.lastSighting = Game.player.position;
        return true;
      }
    }
    return false;
  }

  setTarget(targ) {
    if (! targ.eq(this.target)) {
      Game.playSound(targ, "foo");
      // Game.queueAnimation(new PingAnimation(targ));
      this.target = targ;
    }
  }

  hunt() {
    this.calculateFOV();
    if ( this.canSeePlayer() ) {
      this.setTarget(Game.player.position);
      const path = Game.findPathTo(this.position, this.target);
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
    if (Game.player.canSee(this.position)) {
      console.log('can see...', this.position)
      super.draw();
    }

      // Game.display.draw(...this.selectTarget().coords, 'X', '#0f0', '#000');
    // }
      // if (this.state == 'hunt') {
      //   Game.display.draw(...this.lastSighting, 'X', '#0f0', '#000');
      // }
    // }
  }
}

export default HunterSeeker;
