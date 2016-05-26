import Entity from './entity.jsx'
import Game from './game.jsx'
import Point from './point.jsx'

class Spider extends Entity {
  constructor(x, y) {
    super("s", "Spider", '#99C', '#000');
    this.position = Point.at([x, y]);
    this.state = 'roam';
    this.touchTriggers = new Set();
    for (var i = 0; i < 40; i+=1 ) {
      let targ = Point.at([Math.floor(Math.random()*20)+1, Math.floor(Math.random()*20)+1]);
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

  hunt_transitions() {
      if (this.position.eq(this.target)) {
          return 'roam';
      } else {
          return 'hunt';
      }
  }

  hunt_exec() {
    if (this.touchTriggers.has(Game.player.position)) {
        this.target = Game.player.position;
      }
    const path = Game.findPathTo(this.position, this.target);
    if (path.length < 2) {
      return;
    }
    this.moveInstantlyToAndTrigger(path[1]);
  }

  roam_transitions() {
    if (this.touchTriggers.has(Game.player.position)) {
        this.target = Game.player.position;
        return 'hunt';
    } else {
        return 'roam';
    }
  }
  roam_exec() {
    let options = [
       this.position.offset(0, 1),
       this.position.offset(0,-1),
       this.position.offset( 1,0),
       this.position.offset(-1,0),
    ];

    if (options.find(o => o.eq(Game.player.position))) {
        Game.logMessage("Gotcha!");
        return;
    }
    options = options.filter(o => Game.getTile(o).isWalkable());
    if (options.length == 0) {
        Game.logMessage("I'm stuck!");
    }
    this.moveInstantlyToAndTrigger(options.random());
  }

  draw() {
    // if (Game.player.canSee(this.position) && !this.touchTriggers.has(this.position)) {
      super.draw()
    // }
    this.touchTriggers.forEach(t => {
      if (Game.player.canSee(t)) {
        Game.displayAndSetMemory(t, '%', '#fff', '#aaa');
      }
    });
  }
}
export default Spider;

