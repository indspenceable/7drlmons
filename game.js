var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    entities: [],
    scheduler: null,
    messages: ["Back log of messages!", "Which we should show"],
    maxHp: 15,
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
        this._createMonster(3,5,5, Ranger);
    },

    _createPlayer: function(x, y) {
        this.player = new Player(x, y, this.maxHp);
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
                this.display.draw(x,y,"/");
            }
            return;
        }
        var m = this.monsterAt(x,y);
        if (m !== undefined) {
            console.log("we ended up drawing", m);
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
        this.player._draw();
    },

    _canSee: function(x,y) {
        return this.visibleTiles[[x,y]] === true;
    },
    _hasSeen: function(x,y) {
        return this.seenTiles[[x,y]] === true;
    },

    _calculateFOV: function() {
        var lightPasses = function(x,y) {
            var tile = Game.getTile(x,y);
            return tile !== undefined && tile.canSeeThrough();
        }
        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
        this.visibleTiles = [];
        fov.compute(this.player._x, this.player._y, 5, function(x,y,r,canSee) {
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

        this.display.drawText(x, y, "Current Poke: Charizard");
        y+=1;
        for (var j = 0; j < width; j+=1) {
            this.display.draw(x+j, y, " ");
        }

        this.display.drawText(x, y, "" + this.player._hp + "/" + this.maxHp);
        y+=1;
        this._drawMeter(x, y, this.player._hp, this.maxHp, "Hp");
        y+=1;
        this._drawMeter(x, y, this.player.sickness, 5, "sickness");
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

WallTile.prototype = new Tile('#', '#f99', '#000')
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
    Game.killMonster(this);
}

ThingInATile.prototype.draw = function() {
    // if (Game._canSee(this._x, this._y)) {
        console.log("can see!", this);
        Game.display.draw(this._x, this._y, this.c1, this.fg1, this.bg1);
    // } else {
        // console.log('can"t see')
    // }
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

var Player = function(x, y, hp) {
    this._x = x;
    this._y = y;
    this._hp = hp;
    this.delay = 0;
    this.sickness = 0;
}

Player.prototype = new ThingInATile();

Player.prototype.act = function() {
    Game.engine.lock();
    window.addEventListener("keydown", this);
    if (this.delay > 0) {
        this.delay -= 1;
        this.finishTurn();
    }
}

Player.prototype.handleEvent = function(e) {
    var movementKeymap = {};
    movementKeymap[38] = 0;
    movementKeymap[33] = 1;
    movementKeymap[39] = 2;
    movementKeymap[34] = 3;
    movementKeymap[40] = 4;
    movementKeymap[35] = 5;
    movementKeymap[37] = 6;
    movementKeymap[36] = 7;

    var code = e.keyCode;
    /* one of numpad directions? */
    if ((code in movementKeymap)) {
        event.preventDefault()
        this._attemptMovement(ROT.DIRS[8][movementKeymap[code]]);
    } else if (e.keyCode == 190) {
        // . (wait)
        this.finishTurn()
    } else if (e.keyCode == 32) {
        event.preventDefault()
        // Spacebar (worldswap)
        if (!this.canSwapWorldHere()) {
            Game.logMessage("You're unable to phase to the other world in this location.")
            return;
        } else if (!this.readyToSwap()) {
            Game.logMessage("You're still recovering from your last swap.")
            return;
        }
        Game.swapWorld();
        this.sickness = 6;
        this.finishTurn();
    }
}

Player.prototype.canSwapWorldHere = function() {
    return Game.getTile(this._x, this._y).isWalkable(Game.otherWorld());
}

Player.prototype.readyToSwap = function() {
    return this.sickness == 0;
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

Player.prototype._doMovement = function(newX, newY) {
    this._x = newX;
    this._y = newY;
    Game._redrawMap();
    Game.getTile(this._x, this._y).trigger();
    this.finishTurn();
}

Player.prototype.takeHit = function(damage) {
    var rtn = ThingInATile.prototype.takeHit.call(this, damage);
    Game._drawUI();
    return rtn;
}

Player.prototype._doAttack = function(monster) {
    monster.takeHit(1);
    Game.logMessage("You hit the "+monster.name()+"!");
    this.finishTurn();
}

Player.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "@", "#fff", "#000");
}

Player.prototype.finishTurn = function() {
    if (this.sickness > 0) {
        this.sickness -= 1;
    }
    Game._drawUI();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}
