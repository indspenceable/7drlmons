var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    entities: [],
    scheduler: null,
    currentWorld: 0,
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
            [1,1,1,1,1,1,1,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
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
                    EmptySpaceTile, WallTile, MuckTile, AppearingWallTile, IceTile
                ][this.map[y][x]];
                this.map[y][x] = new tileType(x, y);
            }
        }
        this._createPlayer(20,5);
        this._createMonster(7,7,3, Shade);
        this._createMonster(7,5,3, Bobomb);
        this._createMonster(10,5,5, Mutant);
        this._createMonster(30,5,5, Gargoyle);
        this._createMonster(3,5,5, Bowyer);
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

    // This is for drawing the player + enemies etc.
    drawCharacterByWorld: function(x, y, chr1, fg1, bg1, chr2, fg2, bg2) {
        if (this.currentWorld == 0) {
            this.display.draw(x, y, chr1, fg1, bg1);
        } else {
            this.display.draw(x, y, chr2, fg2, bg2);
        }
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

        var worldName = this.currentWorld == 0 ? "Badlands" : "Subspace";
        this.display.drawText(x, y, "World: " + worldName);
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

    swapWorld: function() {
        this.currentWorld = this.otherWorld();
        this._redrawMap();
    },

    otherWorld: function() {
        return (this.currentWorld + 1)%2;
    }
};

var Tile = function(c1,fg1,bg1,c2,fg2,bg2) {
    this.c1 = c1;
    this.fg1 = fg1;
    this.bg1 = bg1;
    this.c2 = c2;
    this.fg2 = fg2;
    this.bg2 = bg2;
}
Tile.prototype.trigger = function() {}
Tile.prototype.canSeeThrough = function() {return true;}
Tile.prototype.draw = function() {
    Game.drawCharacterByWorld(this.x, this.y, this.c1, this.fg1, this.bg1,
                                              this.c2, this.fg2, this.bg2);
}
Tile.prototype.drawFromMemory = function() {
    Game.drawCharacterByWorld(this.x, this.y, this.c1, "#ccc", "#222",
                                              this.c2, "#222", "#ccc");
}

var EmptySpaceTile = function(x,y) {
    this.x = x;
    this.y = y;
}

EmptySpaceTile.prototype = new Tile('.', '#f99', '#000', ' ', '#000', '#99f')
EmptySpaceTile.prototype.isWalkable = function(world) {
    return true;
}

var WallTile = function(x,y) {
    this.x = x;
    this.y = y;
}

WallTile.prototype = new Tile('#', '#f99', '#000', 'U', '#000', '#99f')
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

MuckTile.prototype = new Tile('~', '#f99', '#922', '~', '#9f9', '#99f')
MuckTile.prototype.isWalkable = function(world) {
    return true;
}
MuckTile.prototype.trigger = function() {
    if (Game.currentWorld == 0) {
        Game.logMessage("the lava singes you!");
        Game.player.takeHit(1);
    } else {
        Game.logMessage("You're bogged down in the slime!")
        Game.player.delay += 1;
    }
}


var AppearingWallTile = function(x,y) {
    this.x = x;
    this.y = y;
}

AppearingWallTile.prototype = new Tile('_', '#555', '#000',' ', '#fff', '#222')
AppearingWallTile.prototype.isWalkable = function(world) {
    if (world === undefined) {
        world = Game.currentWorld;
    }
    return world == 0;
}

var IceTile = function(x, y) {
    this.x = x;
    this.y = y;
}

IceTile.prototype = new Tile(' ', '#599', '#fff', '_', '#244', '#599')
IceTile.prototype.isWalkable = function(world) {
    return true;
}

IceTile.prototype.trigger = function() {
    if (Game.currentWorld == 0) {
        Game.logMessage("You're encased in a cloud of steam!");
    } else {
        Game.logMessage("You slide on the ice. But not really.")
    }
}
IceTile.prototype.canSeeThrough = function() {
    return Game.currentWorld == 1;
}


var ThingInATile = function(c1,fg1,bg1,c2,fg2,bg2) {
    this.c1 = c1;
    this.fg1 = fg1;
    this.bg1 = bg1;
    this.c2 = c2;
    this.fg2 = fg2;
    this.bg2 = bg2;
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
        Game.drawCharacterByWorld(this._x, this._y, this.c1, this.fg1, this.bg1,
                                                    this.c2, this.fg2, this.bg2);
    // } else {
        // console.log('can"t see')
    // }
}

var Mutant = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Mutant.prototype = new ThingInATile("m", "#fff", "#000", "M", "#000", "#fff");

Mutant.prototype.act = function() {
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length == 2) {
        if (Game.currentWorld == 0) {
            Game.logMessage("The wimpy monster hits you!");
            Game.player.takeHit(1);
        } else {
            Game.logMessage("The massive mutant hits you!");
            Game.player.takeHit(2);
        }
    } else {
        this.stepTowardsPlayer(path);
    }
}

Mutant.prototype.name = function() {
    return "Mutant";
}

var Shade = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Shade.prototype = new ThingInATile("_", "#fff", "#000", "S", "#000", "#fff");

Shade.prototype.act = function() {
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length == 2) {
        if (Game.currentWorld == 0) {
            Game.logMessage("Something hits you");
            Game.player.takeHit(2);
        } else {
            Game.logMessage("The shade hits you!");
            Game.player.takeHit(1);
        }
    } else {
        this.stepTowardsPlayer(path);
    }
}

Shade.prototype.draw = function() {
    if (Game.currentWorld == 1) {
        return ThingInATile.prototype.draw.call(this);
    } else {
        Game.getTile(this._x, this._y).draw();
    }
}

Shade.prototype.name = function() {
    return "Shade";
}

var Gargoyle = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Gargoyle.prototype = new ThingInATile("o", "#333", "#aaa", "8", "#aaa", "#333");
Gargoyle.prototype.act = function() {
    if (Game.currentWorld == 1) {
        return;
    }
    var path = Game.findPathTo(Game.player, this);

    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length == 2) {
        Game.logMessage("The Gargoyle hits you");
        Game.player.takeHit(1);
    } else {
        this.stepTowardsPlayer(path);
    }
}

Gargoyle.prototype.takeHit = function(damage) {
    if (Game.currentWorld == 0) {
        return ThingInATile.prototype.takeHit.call(this, damage);
    } else {
        Game.logMessage("Hitting the statue does nothing.");
    }
}

Gargoyle.prototype.name = function() {
    return "Gargoyle";
}

var Bowyer = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Bowyer.prototype = new ThingInATile("}", "#39a", "#222", ")", "#a93", "#222");

Bowyer.prototype.act = function() {
    var range = (Game.currentWorld == 1) ? 1 : 5;
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length <= range+1) {
        if (Game.currentWorld == 0) {
            Game.logMessage("The Bowyer shoots an arrow at you from afar!");
            Game.player.takeHit(1);
        } else {
            Game.logMessage("The Bowyer hits you w/ his bow");
            Game.player.takeHit(1);
        }
    } else {
        this.stepTowardsPlayer(path);
    }
}

Bowyer.prototype.name = function() {
    return "Bowyer";
}

var Bobomb = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; this.countdown = 5;}
Bobomb.prototype = new ThingInATile("*", "#f22", "#000",  "*", "#f22", "#000");
Bobomb.prototype.act = function() {
    if (this.countdown > 0) {
        this.countdown -= 1;
    }
    if (this.countdown == 0) {
        this.explode();
        return;
    }

    var dx = Game.player._x - this._x;
    var dy = Game.player._y - this._y;

    var mult = Game.currentWorld == 0 ? -1 : 1;
    var choices = [
        [dx/Math.abs(dx)*mult, 0],
        [0, dy/Math.abs(dy)*mult],
    ]
    // Reverse our order
    if (Math.abs(dy) > Math.abs(dx)) {
        choices = [choices[1], choices[0]];
    }
    for (var i = 0; i < choices.length; i += 1) {
        var targetX = this._x+choices[i][0];
        var targetY = this._y+choices[i][1];
        if (!(isNaN(targetX) || isNaN(targetY)) && Game.getTile(targetX, targetY).isWalkable()) {
            this.moveInstantlyToAndRedraw(targetX, targetY);
            return;
        }
    }
    // Uh oh, we're stuck!
}

Bobomb.prototype.explode = function() {
    Game.engine.lock();
    var that = this;
    var delays = [100,200,300]
    for (var i = 0; i < 3; i+=1) {
        setTimeout(function() {
            that.displayExplosion();
        }, delays[i]);
    }
    setTimeout(function() {
        that.die();
        for (var x = -1; x < 2; x += 1) {
            for (var y = -1; y < 2; y += 1) {
                var monst = Game.monsterAt(that._x + x, that._y + y);
                if (monst !== undefined) {
                    Game.logMessage("The " + monst.name() + " is caught in the explosion!");
                    monst.takeHit(7);
                }
            }
        }
        Game._redrawMap();
        Game.engine.unlock();
    }, 400);
}

Bobomb.prototype.displayExplosion = function() {
    for (var x = -1; x < 2; x += 1) {
        for (var y = -1; y < 2; y += 1) {
            fgcolor = ROT.Color.toRGB([
                Math.floor(Math.random()*50) + 200,
                Math.floor(Math.random()*50),
                Math.floor(Math.random()*50)
            ]);
            bgcolor = ROT.Color.toRGB([
                Math.floor(Math.random()*50) + 150,
                Math.floor(Math.random()*25),
                Math.floor(Math.random()*25)
            ]);
            Game.drawCharacterByWorld(this._x+x, this._y+y, "*", fgcolor, bgcolor,
                                                            "*", fgcolor, bgcolor);
        }
    }
}

Bobomb.prototype.name = function() {
    return "Bobomb";
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
    Game.drawCharacterByWorld(this._x, this._y, "@", "#fff", "#000",
                                                "@", "#000", "#fff");
}

Player.prototype.finishTurn = function() {
    if (this.sickness > 0) {
        this.sickness -= 1;
    }
    Game._drawUI();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}
