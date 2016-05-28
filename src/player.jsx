import Entity from './entity.jsx';
import Game from './game.jsx';
import Input from './input.jsx';
import Point from './point.jsx'

var EMPTY_DELEGATE = {
  handleEvent: function() {},
  draw: function() {},
};


class AnimationWithFrames {
  constructor(location, frames, color) {
    this.location = location;
    this.frame = 0;
    this.color = color;
    this.positionPatterns=frames;
  }
  done() {
    return this.frame > this.positionPatterns.length-1;
  }
  nextFrame() {
    this.frame += 1;
    return this.done();
  }
  draw() {
    const [position,...patterns] = this.positionPatterns[this.frame];
    for (var y = 0; y < patterns.length; y+=1) {
      for ( var x = 0; x < patterns[y].length; x+=1) {
        var c = patterns[y][x];
        if ( c != ' ' ) {
          console.log(c, position.plus(Point.at([x,y])));
          Game.display.draw(...position.plus(Point.at([x,y])).coords, c, this.color, '#000');
        }
      }
    }
    // Game.display.drawText(...position.coords, "%c{#0ff}" + pattern)
  }
}

class PingAnimation extends AnimationWithFrames {
  constructor(location, color) {
    super(location, [
      [
        location,
        '*'
      ],
      [
        location.plus(Point.at([-1,-1])),
         ' ^ ',
         '| |',
         ' v '
      ],
      [
        location.plus(Point.at([-1,-1])),
         '/-\\',
         '| |',
        '\\-/'
      ],
      [
        location.plus(Point.at([-2,-2])),
         ' /-\\ ',
         '/   \\',
         '|   |',
        '\\   /',
        ' \\--/ '
      ],
      [
        location.plus(Point.at([-2,-2])),
         '/- -\\',
         '|   |',
         '     ',
         '|   |',
        '\\- -/'
      ],

    ], color);
  }
}

class Player extends Entity{
  constructor(x, y) {
    super('@', 'player', '#fff', '#000');
    this.position = Point.at([x, y]);
    this.delay = 0;
    this.delegates = [];

    this.sounds = new Map();
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
    Game.displayAnimations(() =>{
      Game.redrawMap();
      window.addEventListener("keydown", this);
      if (this.delay > 0) {
        this.delay -= 1;
        this.finishTurn();
      }
    })
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
    const dir = Point.at(ROT.DIRS[8][dirIndex]);
    /* is there a free space? */
    const dest = this.position.plus(dir);
    var monster = Game.monsterAt(dest);

    if (Game.getTile(dest).isWalkable()) {
      this.moveInstantlyToAndTrigger(dest);
      Game.redrawMap();
      this.finishTurn();
    }
  }

  _attemptToSelectAttack(attackIndex) {
    Game.redrawMap();
  }

  // moveInstantlyToAndTrigger(...args) {
  //   super.moveInstantlyToAndTrigger(...args);
  //   Game.lighting.dirty();
  // }

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

  soundColor(originalColor, age) {
    let pct = (age/50.0);
    if (pct > 1)
      pct = 1;

    let colorArray = ROT.Color.fromString(originalColor);
    colorArray = ROT.Color.interpolate(colorArray, [0,0,0], pct);
    return ROT.Color.toRGB(colorArray);
  }

  drawSounds() {
    this.sounds.forEach((value, key) => {
      const [sound, age] = value;
      switch(sound) {
        case 'patrol':
          Game.display.draw(...key.coords, '?', '#000', this.soundColor("#0f0", age));
          break;
        case 'hunt':
          Game.display.draw(...key.coords, '?', '#000', this.soundColor("#f00", age));
          break;
      }
    })
  }
  see(l) {
    super.see(l);
    if (this.sounds.has(l) && this.sounds.get(l)[1] > 0) {
      this.sounds.delete(l);
    }
  }

  draw() {
    super.draw();
    this.drawSounds();
    if (this._currentDelegate() !== undefined) {
      this._currentDelegate().draw(this);
    }
  }

  finishTurn() {
    Game._drawUI();
    this.delegates = [];
    window.removeEventListener("keydown", this);
    this.sounds.forEach((value,key) => value[1] += 1);
    Game.redrawMap();
    Game.engine.unlock();
  }

  logVisible(message) {
    return Game.logMessage(message);
  }

  getName() {
    return "Player";
  }

  hear(location, sound) {
    var path = Game.findPathTo(location, this.position, 20);
    if (path && path.length > 0 && path.length < 20) {
      switch(sound) {
      case 'patrol':
        // Game.queueAnimation(new PingAnimation(location, '#f0f'));
        this.sounds.set(location, [sound, 0]);
        break;
      case 'hunt':
        // Game.queueAnimation(new PingAnimation(location, '#f00'));
        this.sounds.set(location, [sound, 0]);
        break;
      }
    }
  }
}

export default Player;
