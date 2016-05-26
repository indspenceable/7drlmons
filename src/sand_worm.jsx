import Entity from './entity.jsx'
import Game from './game.jsx'
import Point from './point.jsx'

class SandWorm extends Entity {
  constructor(x, y) {
    super("S", "Sandworm", '#954', '#000');
    this.position = Point.at([x, y]);
    this.state = 'rest';
    this.touchTriggers = new Set;
    for (var i = 0; i < 40; i+=1 ) {
      let targ = Point.at([Math.floor(Math.random()*50)+1, Math.floor(Math.random()*50)+1]);
      if (Game.getTile(targ).isWalkable()) {
          this.touchTriggers.add(targ);
      }
    }
    this.target = null;
  }

  // State Machine
  doAction() {
    this.transitionTo(this[this.state+'_transitions']())
    this[this.state+'_exec']();
  }

  transitionTo(newState) {
    if (this.state != newState) {
      this.state = newState;
    }
  }

  kill_transitions() {
    // We'll transition at the end of the kill action automatically.
    return 'kill';
  }

  kill_exec() {
    Game.playSound(this.position, 'rumble');
    this.countdownTimer -= 1;
    if (this.countdownTimer == 0) {
      if(this.position.eq(Game.player.position)) {
        Game.logMessage("GOTCHA");
      } else {
        Game.logMessage("maybe next time...");
      }
      this.transitionTo('rest');
    }
  }

  seek_transitions() {
      if (this.position.eq(this.target)) {
        if (this.position.eq(Game.player.position)) {
          this.countdownTimer = 5;
          return 'kill';
        } else {
          return 'rest';
        }
      } else {
          return 'seek';
      }
  }

  seek_exec() {
    const path = Game.findPathTo(this.position, this.target);
    if (path.length < 2) {
      return;
    }
    this.moveInstantlyToAndTrigger(path[1]);
  }

  rest_transitions() {
    if (this.playerInTargetZone()) {
      console.log("moving from rest...");
        this.target = Game.player.position;
        return 'seek';
    } else {
        return 'rest';
    }
  }

  playerInTargetZone() {
    for (let t of this.touchTriggers) {
      if (t.distance(Game.player.position) < 3) {
        return true;
      }
    }
    return Game.player.position.distance(this.position) < 3;
  }

  rest_exec() {
    // Do nothing!
  }

  draw() {
    // if (Game.player.canSee(this.position) && !this.touchTriggers.has(this.position)) {
      super.draw()
    // }
    this.touchTriggers.forEach(t => {
      if (Game.player.canSee(t)) {
        Game.displayAndSetMemory(t, 'X', '#fff', '#aaa');
      }
    });
  }
}
export default SandWorm;

