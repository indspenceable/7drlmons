import {Empty, Wall, Tree, FallenTree, GrippableBackground} from './tile.jsx';
import Player from './player.jsx'
import {bresenhem, validConnection} from './util.jsx';

var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    entities: [],
    scheduler: null,
    messages: [],
    visibleTiles: [],
    seenTiles: {},

    init: function() {
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
    },

    attachRopes: function(ropeSystem) {
        ropeSystem.eachRope(null, line => this.eachGlyphInLine(line,
            (x,y,ch) => this.getTile(x,y).ropeGlyph = ch));
        ropeSystem.eachPiton(pos => this.getTile(...pos).ropeGlyph = 'o');
        // this.getTile(...ropeSystem.getFirstPiton()).ropeGlyph = 'o';
        // this.getTile(...ropeSystem.getLastPiton()).ropeGlyph = 'o';
    },

    findPathTo: function(start, end) {
        var path = [];
        var passableCallback = function(x,y) {
            var monsterAtSpace = Game.monsterAt(x,y)
            return ((monsterAtSpace === undefined) ||
                    (monsterAtSpace === start) ||
                    (monsterAtSpace === end)) &&
                    Game.getTile(x,y).isWalkable();
        }
        var astar = new ROT.Path.AStar(start.getX(), start.getY(), passableCallback, {topology: 4});
        astar.compute(end.getX(), end.getY(), function(x,y) {
            path.push([x,y]);
        });
        return path;
    },

    getTile: function(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return undefined;
        }
        return this.map[y][x];
    },

    _generateMap: function() {
        var mapPrototype = [
            '###################################################',
            '#                     |                          ##',
            '#                     | ###################       #',
            '#                     | ###################       #',
            '#                     |              ######       #',
            '#                     |            ##    ##       #',
            '#                     |            ##    ##      ##',
            '#######    ####################|   ##    ##    ####',
            '######### ###########          |          # #######',
            '#         <                    |            ##    #',
            '#          |   /               |             #    #',
            '#          < |/                |             ##   #',
            '#           <|                 |       ########   #',
            '#            |                 |   #####    ####  #',
            '#            |                 |            ####  #',
            '#            |                 |           ####   #',
            '#          #####            #########      ####   #',
            '#   ################# #########################   #',
            '#         ########### ##########                  #',
            '#                 ### ########                    #',
            '#                  ## ####                        #',
            '#                   # #        ####################',
            '#                              ####################',
            '#               ###################################',
            '###################################################',
        ]
        this.map = [];
        for (var y = 0; y < mapPrototype.length; y+=1) {
            var currentRow = [];
            this.map.push(currentRow);
            for (var x = 0; x < mapPrototype[0].length; x+=1) {
                var tileType = {
                    ' ': Empty,
                    '#': Wall,
                    '|': Tree,
                    '<': GrippableBackground.build('\\', '#a53', '#333'),
                    '/': GrippableBackground.build('/', '#a53', '#333'),

                }[mapPrototype[y][x]];
                currentRow.push(new tileType(x, y));
            }
        }
        this._createPlayer(31,10);
        // this._createMonster(10,5,5, Mutant);
    },

    _createPlayer: function(x, y) {
        this.player = new Player(x, y);
        this.entities.push(this.player);
        this.scheduler.add(this.player, true);
    },

    _createMonster: function(x,y,hp,type) {
        var monster = new type(x,y,hp);
        this.entities.push(monster);
        this.scheduler.add(monster, true);
    },

    drawAsLine: function(line, fg, bg) {
        this.eachGlyphInLine(line, (x, y, ch) =>
            Game.display.draw(x, y, ch, fg, bg));
    },

    //call a callback for each element of line with x, y, and glyph
    eachGlyphInLine: function(line, cb) {
      // const line = bresenhem(...start, ...end);
      for (var j = 0; j < line.length-1; j+=1) {
        const prev = j == 0 ? line[j] : line[j-1];
        const curr = line[j];
        const next = j == line.length-1 ? line[j] : line[j+1];
        var ch = '?';
        if (prev[0] == next[0]) {
          ch = '|';
        } else if (prev[1] == next[1]) {
          ch = '-';
        } else if (!(prev[0] < next[0]) ^ !(prev[1] < next[1])) {
          ch = '/';
        } else {
          ch = '\\';
        }
        cb(...curr, ch);
      }
    },

    chopDownTree: function(x, y) {
      if (this.getTile(x, y).isTree()) {
        const DELAY = 100;

        this.player.delegates.push({makeMove: ()=>{}, handleEvent: ()=>{}});
        // Measure the tree height
        let treeHeight = 0;
        while(true) {
          // Over the top!
          if (treeHeight == y) break;
          if (!this.getTile(x, y-treeHeight).isTree()) break;
          this.map[y-treeHeight][x] = new Empty(x, y-treeHeight);
          treeHeight += 1;
        }
        treeHeight-=0.5;
        const getX = (a) => Math.floor(Math.cos(a/180*Math.PI) * treeHeight) + x;
        const getY = (a) => -Math.floor(Math.sin(a/180*Math.PI) * treeHeight) + y;


        console.log(2)
        //Find the frames of animation
        const animationFrames = [90];
        let angle = 90;
        while (angle > -20) {
            let lastAngel = animationFrames[animationFrames.length-1];
            if (!validConnection(bresenhem(x, y, getX(angle), getY(angle)))) {
            break;
            }
            if (getX(angle) != getX(lastAngel) || getY(angle) != getY(lastAngel)) {
            animationFrames.push(angle);
            }
            console.log(angle);
            angle -= 1;
        }

        console.log(animationFrames, animationFrames.map(f => [getX(f), getY(f)]));
        // Display the animation!
        animationFrames.forEach((frame, idx) => {
          console.log(idx);
          setTimeout(() => {
            console.log(5);
            if (idx > 0) {
              let a = animationFrames[idx-1];
              bresenhem(x, y, getX(a), getY(a)).forEach(p => {
                this.display.draw(...p, ' ', '#000', '#222')
              });
            }
            this.drawAsLine(bresenhem(x, y, getX(frame), getY(frame)), '#f00', '#0f0');
          }, DELAY*idx);
        });


        setTimeout(() => {
            this.player.delegates = [];
            const lastFrame = animationFrames[animationFrames.length-1];
            bresenhem(x, y, getX(lastFrame), getY(lastFrame)).forEach((p) => {
                this.map[p[1]][p[0]] = new FallenTree(...p);
            })
            this.redrawMap();
        }, animationFrames.length * DELAY);
      }
    },

    // This is for drawing terrain etc.
    drawMapTileAt: function(x,y) {
        if (!this._canSee(x,y)) {
            if (this._hasSeen(x,y)) {
                this.getTile(x,y).drawFromMemory();
            } else {
                this.display.draw(x,y," ");
            }
            return;
        }
        var m = this.monsterAt(x,y);
        if (m !== undefined) {
            m.draw();
            return;
        }

        this.getTile(x,y).draw();
    },

    killMonster: function(monster) {
        this.scheduler.remove(monster);
        var index = this.entities.indexOf(monster);
        if (index >= 0) {
            this.entities.splice(index, 1);
        }
        this.drawMapTileAt(monster.getX(), monster.getY());
    },

    monsterAt: function(x,y) {
       for(var i = 0; i < this.entities.length; i+= 1) {
            if (this.entities[i].isAt(x,y)) {
                return this.entities[i];
            }
        }
        return undefined;
    },

    _drawWholeMap: function() {
        for (var y = 0; y < this.map.length; y++) {
            for (var x = 0; x < this.map[0].length; x++) {
                this.drawMapTileAt(x,y);
            }
        }
    },

    redrawMap: function() {
        this._calculateFOV();
        this._drawWholeMap();
        this.player.draw();
    },

    _canSee: function(x,y) {
        return this.visibleTiles[[x,y]] === true;
    },
    _hasSeen: function(x,y) {
        return this.seenTiles[[x,y]] === true;
    },

    _calculateFOV: function() {
        var varRadius = 5;
        var player = this.player;

        var withinRange = function(x,y) {
            var dx = (player.getX() - x);
            var dy = (player.getY() - y);
            return (dx*dx) + (dy*dy) < (varRadius*varRadius);
        }
        var lightPasses = function(x,y) {
            var tile = Game.getTile(x,y);
            return tile !== undefined && tile.canSeeThrough();
        }

        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
        this.visibleTiles = [];
        fov.compute(this.player.getX(), this.player.getY(), varRadius, function(x,y,r,canSee) {
            if (withinRange(x,y)) {
                Game.visibleTiles[[x,y]] = true;
                Game.seenTiles[[x,y]] = true;
            }
        });
    },

    _drawMapUIDivider: function() {
        var x = 55;
        for (var y = 0; y < 25; y+=1) {
            this.display.draw(x, y, "|");
        }
    },

    _drawUI: function() {
        var x = 56;
        var y = 0;
        var width = 80-56;
        var height = 25;

        this._clearUIRow(x, y, width)
        this.display.drawText(x, y, "@) " + this.player.getName());
        y+=1;
        this._clearUIRow(x, y, width)
        this._drawMeter(x, y, this.player.gripStrength, 100, "Grip Strength", 20);
/*
        this._clearUIRow(x, y, width)
        this.display.drawText(x, y, "HP: " + this.player.getHp() + "/" + this.player.getMaxHp());
        y+=1;

        this._clearUIRow(x, y, width)
        this._drawMeter(x, y, this.player.getHp(), this.player.getMaxHp(), "Hp");

        for (var i = 0; i < 5; i+=1) {
            y+=1;
            this._clearUIRow(x,y, width);
            this._displayMon(x, y, i, this.player.mons[i]);
        }

        y+=1;
        y+=1;
        this._clearUIRow(x, y, width)
        this.displayMove(x, y, "q", this.player._currentMon.moves[0])
        y+=1;
        this._clearUIRow(x, y, width)
        this.displayMove(x, y, "w", this.player._currentMon.moves[1])
        y+=1;
        this._clearUIRow(x, y, width)
        this.displayMove(x, y, "e", this.player._currentMon.moves[2])
        y+=1;
        this._clearUIRow(x, y, width)
        this.displayMove(x, y, "r", this.player._currentMon.moves[3])
        y+=1;
*/
        this._clearAndDrawMessageLog();
    },

    _drawMeter: function(x, y, current, max, meterName, numberOfPips) {
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
    },

    _clearUIRow: function(x, y, width) {
        for (var j = 0; j < width; j+=1) {
            this.display.draw(x+j, y, " ");
        }
    },

    displayMove: function(x, y, label, move) {
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
    },

    _clearAndDrawMessageLog: function() {
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
    },

    logMessage: function(message) {
        this.messages.push(message);
        this._clearAndDrawMessageLog();
    },
};

export default Game;
