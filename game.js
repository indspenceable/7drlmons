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
        this._redrawMap();
        this._drawMapUIDivider();
        this._drawUI();

        this.engine.start();
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
        var astar = new ROT.Path.AStar(start._x, start._y, passableCallback, {topology: 4});
        astar.compute(end._x, end._y, function(x,y) {
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
        this.map = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,2,0,0,0,0,0,2,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,2,2,2,2,2,2,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,0,0,0,2,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,0,0,3,0,2,2,2,2,2,2,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,0,0,0,0,0,0,0,2,2,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,2,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,2,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,2,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ]
        for (var y = 0; y < this.map.length; y+=1) {
            for (var x = 0; x < this.map[0].length; x+=1) {
                var tileType = [
                    EmptySpaceTile, WallTile, MuckTile, IceTile
                ][this.map[y][x]];
                this.map[y][x] = new tileType(x, y);
            }
        }
        this._createPlayer(20,5);
        this._createMonster(10,5,5, Mutant);
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
        this.drawMapTileAt(monster._x, monster._y);
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

    _redrawMap: function() {
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
        varRadius = 10;
        var player = this.player;

        var noBlock = function(x,y) {
            return Math.abs(player._x - x) + Math.abs(player._y - y) < varRadius;
        }
        var lightPasses = function(x,y) {
            var tile = Game.getTile(x,y);
            return tile !== undefined && tile.canSeeThrough();
        }
        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
        this.visibleTiles = [];
        fov.compute(this.player._x, this.player._y, varRadius, function(x,y,r,canSee) {
            Game.visibleTiles[[x,y]] = true;
            Game.seenTiles[[x,y]] = true;
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

        this._clearUIRow(x,y, width)
        this.display.drawText(x, y, "Current Poke: " + this.player.currentMon.getName());
        y+=1;

        this._clearUIRow(x,y, width)
        this.display.drawText(x, y, "" + this.player.getHp() + "/" + this.player.getMaxHp());
        y+=1;

        this._clearUIRow(x,y, width)
        this._drawMeter(x, y, this.player.getHp(), this.player.getMaxHp(), "Hp");
        y+=1;
        y+=1;
        y+=1;
        y+=1;
        y+=1;
        y+=1;
        this._clearAndDrawMessageLog();
    },

    _drawMeter: function(x, y, current, max, meterName) {
        if (current > max) {
            current = max;
        }

        this.display.drawText(x, y, "[" +
            Array(current+1).join("=") +
            Array(max - current + 1).join(" ") +
            "]", "#000", "#000");
    },

    _clearUIRow: function(x, y, width) {
        for (var j = 0; j < width; j+=1) {
            this.display.draw(x+j, y, " ");
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

var Tile = function(c1,fg1,bg1) {
    this.c1 = c1;
    this.fg1 = fg1;
    this.bg1 = bg1;
}
Tile.prototype.trigger = function() {}
Tile.prototype.canSeeThrough = function() {return true;}
Tile.prototype.draw = function() {
    Game.display.draw(this.x, this.y, this.c1, this.fg1, this.bg1);
}
Tile.prototype.drawFromMemory = function() {
    Game.display.draw(this.x, this.y, this.c1, "#ccc", "#222");
}

var EmptySpaceTile = function(x,y) {
    this.x = x;
    this.y = y;
}

EmptySpaceTile.prototype = new Tile('.', '#f99', '#000')
EmptySpaceTile.prototype.isWalkable = function(world) {
    return true;
}

var WallTile = function(x,y) {
    this.x = x;
    this.y = y;
}

WallTile.prototype = new Tile('#', '#999', '#000')
WallTile.prototype.isWalkable = function(world) {
    return false;
}
WallTile.prototype.canSeeThrough = function() {
    return false;
}

var MuckTile = function(x,y) {
    this.x = x;
    this.y = y;
}

MuckTile.prototype = new Tile('~', '#9f9', '#99f')
MuckTile.prototype.isWalkable = function(world) {
    return true;
}
MuckTile.prototype.trigger = function() {
    Game.logMessage("You're bogged down in the slime!")
    Game.player.delay += 1;
}


var IceTile = function(x, y) {
    this.x = x;
    this.y = y;
}

IceTile.prototype = new Tile('_', '#244', '#599')
IceTile.prototype.isWalkable = function(world) {
    return true;
}

IceTile.prototype.trigger = function() {
    Game.logMessage("You slide on the ice. But not really.")
}

var ThingInATile = function(c1,fg1,bg1) {
    this.c1 = c1;
    this.fg1 = fg1;
    this.bg1 = bg1;
}

// Don't call this on player! lul
ThingInATile.prototype.stepTowardsPlayer = function(path) {
    if (path === undefined) {
        path = Game.findPathTo(Game.player, this);
    }
    if (path.length < 3) {
        return;
    }
    this.moveInstantlyToAndRedraw(path[1][0], path[1][1]);
}

ThingInATile.prototype.moveInstantlyToAndRedraw = function(x,y) {
    var oldX = this._x;
    var oldY = this._y;

    this._x = x;
    this._y = y;
    Game.drawMapTileAt(oldX, oldY);
    Game.drawMapTileAt(x, y);

    // this.draw();
}

ThingInATile.prototype.isAt = function(x,y) {
    return x == this._x && y == this._y;
}

ThingInATile.prototype.takeHit = function(damage) {
    this._hp -= damage;
    if (this._hp <= 0) {
        this.die()
    }
}

ThingInATile.prototype.die = function() {
    Game.logMessage(this.name() + " dies");
    Game.killMonster(this);
}

ThingInATile.prototype.draw = function() {
    Game.display.draw(this._x, this._y, this.c1, this.fg1, this.bg1);
}

var Mutant = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Mutant.prototype = new ThingInATile("M", "#000", "#fff");

Mutant.prototype.act = function() {
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length == 2) {
        Game.logMessage("The massive mutant hits you!");
        Game.player.takeHit(2);
    } else {
        this.stepTowardsPlayer(path);
    }
}

Mutant.prototype.name = function() {
    return "Mutant";
}

var Ranger = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Ranger.prototype = new ThingInATile("}", "#39a", "#222");

Ranger.prototype.act = function() {
    var range = 5;
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length <= range+1) {
        Game.logMessage("The Ranger shoots an arrow at you from afar!");
        Game.player.takeHit(1);
    } else {
        this.stepTowardsPlayer(path);
    }
}

Ranger.prototype.name = function() {
    return "Ranger";
}

var FlameThrower = function() {
    this.selectedDirection = undefined;
};

FlameThrower.prototype.targets = function(x, y) {
    var targetted = [];
    // 4 directions
    for (directionIndex = 0; directionIndex < 4; directionIndex+=1) {
        targetted[directionIndex] = [];

        var offsetX = ROT.DIRS[4][directionIndex][0];
        var offsetY = ROT.DIRS[4][directionIndex][1];
        var failure = false;
        for (var i = 1; i < 4; i+=1) {
            if (!failure) {
                var cX = x + offsetX*i;
                var cY = y + offsetY*i;
                if (Game.getTile(cX, cY).isWalkable()) {
                    targetted[directionIndex].push([cX, cY]);
                } else {
                    failure = true;
                }
            }
        }
    }
    return targetted;
}

// Draw while targetting
// Flamethrower.
FlameThrower.prototype.draw = function(player) {
    var targets = this.targets(player._x,player._y);
    for (var i = 0; i < targets.length; i+=1){
        var drawColor = "#aaa"
        if (i == this.selectedDirection) {
            drawColor = "#faa";
        }
        var currentList = targets[i]
        for (var d in currentList) {
            var dx = currentList[d][0];
            var dy = currentList[d][1];
            Game.display.draw(dx, dy, "*", drawColor, "#333");
        }
    }
}
FlameThrower.prototype.handleEvent = function(player, e) {
    var movementKeymap = { 38: 0, 39: 1, 40: 2, 37: 3, }
    var code = e.keyCode;

    if (code in movementKeymap) {
        this.selectedDirection = movementKeymap[code];
    } else if (code == 13 && this.selectedDirection !== undefined) {
        // Actually do the attack!
        this.enact(player);
    } else {
        player.delegates = [];
    }
    Game._redrawMap()
}

FlameThrower.prototype.enact = function(player) {
    var locationHit = this.targets(player._x, player._y)[this.selectedDirection];
    for (var i = 0; i < locationHit.length; i += 1) {
        var x = locationHit[i][0];
        var y = locationHit[i][1];
        var monster = Game.monsterAt(x,y);
        if (monster !== undefined) {
            Game.logMessage(monster.name() + " is burned!");
            monster.takeHit(3);
            // Finally, finish turn.
        }
    }
    player.finishTurn();
}

var Mon = function(char, fg, bg, name, hp, moves) {
    this._char = char;
    this._fg = fg;
    this._bg = bg;
    this._name = name;
    this._hp = hp;
    this._maxHp = hp;
    this.moves = moves;
}
Mon.prototype.drawAt = function(x, y) {
    Game.display.draw(x, y, this._char, this._fg, this._bg);
}
Mon.prototype.getName = function() {
    return this._name;
}

var Player = function(x, y) {
    this._x = x;
    this._y = y;

    this.mons = [
        new Mon("C", '#c55', '#000', "Charizard", 15, [
            FlameThrower,
        ]),
        new Mon("s", '#aaf', '#000', "Squirtle",  5, []),
    ]

    this.currentMon = this.mons[0];
    this.delay = 0;

    this.delegates = [];
}

Player.prototype = new ThingInATile();

Player.prototype._currentDelegate = function() {
    return this.delegates[this.delegates.length-1];
}

Player.prototype.getHp = function() {
    return this.currentMon._hp;
}
Player.prototype.getMaxHp = function() {
    return this.currentMon._maxHp;
}

Player.prototype.act = function() {
    Game.engine.lock();
    window.addEventListener("keydown", this);
    if (this.delay > 0) {
        this.delay -= 1;
        this.finishTurn();
    }
}

Player.prototype.handleEvent = function(e) {
    if (this._currentDelegate() === undefined) {
        return this.makeMove(e);
    } else {
        return this._currentDelegate().handleEvent(this, e);
    }
}

Player.prototype.makeMove = function(e) {
    // var movementKeymap = { 38: 0, 33: 1, 39: 2, 34: 3, 40: 4, 35: 5, 37: 6, 36: 7, };
    var movementKeymap = { 38: 0, 39: 1, 40: 2, 37: 3, }
    var swapMonKeymap = { 49: 0, 50: 1, 51: 2, 53: 3, 54: 4, 55: 5, };
    var attackKeymap = { 81: 0, 87: 1, 69: 2, 82: 3, };

    var code = e.keyCode;
    /* one of numpad directions? */
    if (code in movementKeymap) {
        event.preventDefault()
        this._attemptMovement(ROT.DIRS[4][movementKeymap[code]]);
    } else if (code in swapMonKeymap) {
        this._attemptToSwap(swapMonKeymap[code]);
    } else if (code in attackKeymap) {
        this._attemptToSelectAttack(attackKeymap[code]);
    } else if (e.keyCode == 190) {
        // . (wait)
        this.finishTurn()
    }
}

Player.prototype._attemptMovement = function(dir) {
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];

    var monster = Game.monsterAt(newX, newY)
    if (monster !== undefined) {
        this._doAttack(monster);
    } else if (Game.getTile(newX, newY).isWalkable()) {
        this._doMovement(newX, newY)
    }
}

Player.prototype._attemptToSelectAttack = function(attackIndex) {
    this.delegates.push(new this.currentMon.moves[attackIndex]());
    Game._redrawMap();
}

Player.prototype._attemptToSwap = function(slot) {
    if (this.mons[slot] !== undefined && this.currentMon != this.mons[slot]) {
        Game.logMessage("Alright! Come back, " + this.currentMon.getName() + "!");
        this.currentMon = this.mons[slot];
        Game.logMessage("Go!" +  this.currentMon.getName() + "!");
        Game._redrawMap();
        this.finishTurn();
    } else if (this.mons[slot] == this.currentMon) {
        Game.logMessage(this.currentMon.getName()  + " is already out!");
    }
}

Player.prototype._doMovement = function(newX, newY) {
    this._x = newX;
    this._y = newY;
    Game._redrawMap();
    Game.getTile(this._x, this._y).trigger();
    this.finishTurn();
}

Player.prototype.takeHit = function(damage) {
    var rtn = ThingInATile.prototype.takeHit.call(this.currentMon, damage);
    Game._drawUI();
    return rtn;
}

Player.prototype._doAttack = function(monster) {
    // TODO woop
    monster.takeHit(1);
    Game.logMessage("You hit the "+monster.name()+"!");
    this.finishTurn();
}

Player.prototype.draw = function() {
    this.currentMon.drawAt(this._x, this._y);
    if (this._currentDelegate() !== undefined) {
        this._currentDelegate().draw(this);
    }
}

Player.prototype.finishTurn = function() {
    Game._drawUI();
    this.delegates = [];
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}
