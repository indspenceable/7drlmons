import Entity from './entity.jsx'
import Game from './game.jsx'
import Point from './point.jsx'
import { StaticGlyph } from './tile.jsx'

class WebTrap {
  constructor(mySpider, position) {
    this.spider = mySpider;
    this.position = position;
    this.glyph = new StaticGlyph('%', '#000', '#373');
  }
  trigger(entity) {
    if (entity != this.player) {
      Game.logMessage("You stumble through the spiders web!");
      entity.delay += 1;
      this.spider.target = this.position;
    }
  }
  get priority() { return 5; }
  hides(entity) {
    return this.spider == entity;
  }
}

class Spider extends Entity {
  constructor(x, y) {
    super("s", "Spider", '#99C', '#000');
    this.position = Point.at([x, y]);
    this.state = 'roam';
    this.webs = new Set();
    for (var i = 0; i < 40; i+=1 ) {
      let targ = Point.at([Math.floor(Math.random()*20)+1, Math.floor(Math.random()*20)+1]);
      if (Game.getTile(targ).isWalkable()) {
          Game.getTile(targ).attachComponent(new WebTrap(this, targ));
          // this.touchTriggers.add(targ);
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
        this.target = null;
        return 'roam';
      } else {
          return 'hunt';
      }
  }

  hunt_exec() {
    const path = Game.findPathTo(this.position, this.target);
    if (path.length < 2) {
      return;
    }
    this.moveInstantlyToAndTrigger(path[1]);
  }

  roam_transitions() {
    if (this.target) {
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
    if (Game.player.canSee(this.position) && !Game.getTile(this.position)._any('hides', this)) {
      super.draw()
    }
  }
}
export default Spider;

