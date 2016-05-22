import {Empty, Wall, Smoke} from './tile.jsx';
import Player from './player.jsx'
import {bresenhem, validConnection} from './util.jsx';
import HunterSeeker from './hunter_seeker.jsx';

class Game {
  constructor() {
    // set up variables
    this.display = null
    this.map = {}
    this.engine = null
    this.player = null
    this.entities = []
    this.scheduler = null
    this.messages = []
    this.visibleTiles = []
    this._memory = {}
  }

  init() {
    // Setup ROT.js
    this.display = new ROT.Display({
        // forceSquareRatio:true,
        // spacing:0.75,
      });
    document.getElementById("game").appendChild(this.display.getContainer());
    this.scheduler = new ROT.Scheduler.Simple();
    this.engine = new ROT.Engine(this.scheduler);

    this._generateMap();
    this.redrawMap();
    this._drawMapUIDivider();
    this._drawUI();

    this.engine.start();
  }

  // TODO this should be done in the entity itself.
  findPathTo(sx, sy, ex, ey, entitiesToIgnore=[]) {
    var path = [];
    var passableCallback = (x,y) => {
      return this.getTile(x,y).isWalkable();
    }
    var astar = new ROT.Path.AStar(ex, ey, passableCallback, {topology: 8});
    astar.compute(sx, sy, function(x,y) {
      path.push([x,y]);
    });
    return path;
  }

  getTile(x, y) {
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
      // throw "Attempting to access out-of-bounds tile: " + x + ", " + y;
      return new Wall();
    }
    return this.map[y][x];
  }

  _generateMap() {
    var mapPrototype = [
    '###################################################',
    '#....................#............................#',
    '#....................#............................#',
    '#....................#............................#',
    '#....................#............................#',
    '#....................#............................#',
    '#....................#............................#',
    '#........%%%%........#............................#',
    '#........%%%%........#............................#',
    '#....%%%%%%%%........#............................#',
    '#....%%%%..%%%.........#..........................#',
    '#....%%%%..%%%.%%%%....#..........................#',
    '#.......%%%%%%%%%%%....#..........................#',
    '#.......%%%%%%%%%%%....#..........................#',
    '#.......%%%%%%%%.......#..........................#',
    '#......................#..........................#',
    '#......................#..........................#',
    '#......................#..........................#',
    '#......................#..........................#',
    '###################################################',
    ]
    this.map = [];
    for (var y = 0; y < mapPrototype.length; y+=1) {
      var currentRow = [];
      this.map.push(currentRow);
      for (var x = 0; x < mapPrototype[0].length; x+=1) {
        var tileType = {
          '.': Empty,
          '#': Wall,
          '%': Smoke,

        }[mapPrototype[y][x]];
        currentRow.push(new tileType(x, y));
      }
    }
    this.player = new Player(5,5);
    this._registerEntity(this.player)
    this._registerEntity(new HunterSeeker(20, 5));
    this._registerEntity(new HunterSeeker(40, 5));
  }

  _registerEntity(entity) {
    this.entities.push(entity);
    this.scheduler.add(entity, true);
  }

   // This is for drawing terrain etc.
  drawMapTileAt(x,y) {
    if (!this._canSee(x,y)) {
      if (this._memory[[x,y]]) {
        this.display.draw(x, y, ...this._memory[[x,y]]);
      } else {
        this.display.draw(x,y," ");
      }
      return;
    }
    this.displayAndSetMemory(x, y, ...this.getTile(x,y).glyph());
  }

  displayAndSetMemory(x, y, ch, fg, bg) {
    if (ch != ' ') {
      this._memory[[x,y]] = [ch, '#555', '#222'];
    } else {
      this._memory[[x,y]] = [ch, '#222', '#555'];
    }
    this.display.draw(x, y, ch||' ', fg, bg);
  }

  deregisterEntity(monster) {
    this.scheduler.remove(monster);
    var index = this.entities.indexOf(monster);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }
    this.drawMapTileAt(monster.getX(), monster.getY());
  }

  monsterAt(x,y) {
    for(var i = 0; i < this.entities.length; i+= 1) {
      if (this.entities[i].isAt(x,y)) {
        return this.entities[i];
      }
    }
    return undefined;
  }

  _drawWholeMap() {
    for (var y = 0; y < this.map.length; y++) {
      for (var x = 0; x < this.map[0].length; x++) {
        this.drawMapTileAt(x,y);
      }
    }
  }

  redrawMap() {
    this._calculateFOV();
    this._drawWholeMap();
    this.entities.forEach(e => e.draw());
    // this.player.draw();
  }

  _canSee(x,y) {
    return this.visibleTiles[[x,y]] === true;
  }

  _hasSeen(x,y) {
    return this._memory[[x,y]] === true;
  }

  // TODO this should work for players and monsters.
  _calculateFOV() {
    var varRadius = 5;
    var player = this.player;

    var withinRange = (x,y) => {
      var dx = (player.getX() - x);
      var dy = (player.getY() - y);
      return (dx*dx) + (dy*dy) < (varRadius*varRadius);
    }
    var lightPasses = (x,y) => {
      var tile = this.getTile(x,y);
      return tile.canSeeThrough() || (this.player._x == x && this.player._y == y)
    }

    var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
    this.visibleTiles = [];
    fov.compute(this.player.getX(), this.player.getY(), varRadius, (x,y,r,canSee) => {
      if (withinRange(x,y)) {
        this.visibleTiles[[x,y]] = true;
        this._memory[[x,y]] = true;
      }
    });
  }

  // UI - move this to it's own shit later?
  _drawMapUIDivider() {
    var x = 55;
    for (var y = 0; y < 25; y+=1) {
      this.display.draw(x, y, "|");
    }
  }

  _drawUI() {
    var x = 56;
    var y = 0;
    var width = 80-56;
    var height = 25;

    this._clearUIRow(x, y, width)
    this.display.drawText(x, y, "@) " + this.player.getName());

    this._clearAndDrawMessageLog();
  }

  _drawMeter(x, y, current, max, meterName, numberOfPips) {
    if (current > max) {
      current = max;
    }
    if (current < 0) {
      current = 0;
    }

    var currentScaled = Math.floor(current*numberOfPips/max);
    var maxScaled = numberOfPips;

    this.display.drawText(x, y, "[" +
      "=".repeat(currentScaled) +
      " ".repeat(maxScaled - currentScaled) +
      "]", "#000", "#000");
  }

  _clearUIRow(x, y, width) {
    for (var j = 0; j < width; j+=1) {
      this.display.draw(x+j, y, " ");
    }
  }

  displayMove(x, y, label, move) {
    if (move !== undefined) {
      var defaultMelee = this.player.defaultMeleeAttack();
      this.display.drawText(x, y,
        label +
        ") " +
      (move === defaultMelee ? '*' : ' ') +
      move.name() +
      " (" +
        move.pp +
        "/" +
        move.maxPP +
        ")");
    }
  }

  _clearAndDrawMessageLog() {
    var x = 56;
    var y = 15;
    var width = 80-56;
    var height = 25-15;

    var index = this.messages.length;

    this.display.drawText(x, y, Array(width).join("-"), "#000", "#000");
    y+=1
    for (var i = 0; i < height-1; i+=1) {
    // clear the line
    for (var j = 0; j < width; j+=1) {
      this.display.draw(x+j, y, " ");
    }

    index -= 1;
    if (index >= 0) {
        // Draw this message
        this.display.drawText(x, y, this.messages[index])
      }
      y+=1;
    }
  }

  logMessage(message) {
    this.messages.push(message);
    this._clearAndDrawMessageLog();
  }
};

export default new Game();
