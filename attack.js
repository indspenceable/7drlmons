var DirectionalAttack = function(dist, targetWalls) {
    this.dist = dist;
    this.targetWalls = targetWalls;
}
DirectionalAttack.prototype.handleEvent = function(player, e) {
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
DirectionalAttack.prototype.targets = function(x, y) {
    var targetted = [];
    // 4 directions
    for (directionIndex = 0; directionIndex < 4; directionIndex+=1) {
        targetted[directionIndex] = [];

        var offsetX = ROT.DIRS[4][directionIndex][0];
        var offsetY = ROT.DIRS[4][directionIndex][1];
        var failure = false;
        for (var i = 1; i < this.dist+1; i+=1) {
            if (!failure) {
                var cX = x + offsetX*i;
                var cY = y + offsetY*i;
                if (Game.getTile(cX, cY).isWalkable() || this.targetWalls) {
                    targetted[directionIndex].push([cX, cY]);
                } else {
                    failure = true;
                }
            }
        }
    }
    return targetted;
}
DirectionalAttack.prototype.enact = function(player) {
    player.delegates.push({
        handleEvent: function() {},
        draw: function() {},
    })
    var that = this;
    this.animate(player, function() {
        var locationHit = this.targets(player._x, player._y)[this.selectedDirection];
        for (var i = 0; i < locationHit.length; i += 1) {
            var x = locationHit[i][0];
            var y = locationHit[i][1];
            this.hitSpace(x,y);
        }

        that.pp -= 1;
        Game._redrawMap();
        player.finishTurn();
    });
}
DirectionalAttack.prototype.draw = function(player) {
    var targets = this.targets(player._x,player._y);
    for (var i = 0; i < targets.length; i+=1){
        var drawColor = "#999"
        if (i == this.selectedDirection) {
            drawColor = "#eee";
        }
        var currentList = targets[i]
        for (var d in currentList) {
            var dx = currentList[d][0];
            var dy = currentList[d][1];
            Game.display.draw(dx, dy, "*", drawColor, "#333");
        }
    }
}
var AOEAttack = function(distance) {
    this.radius = distance;
};
AOEAttack.prototype.handleEvent = function(player, e) {
    var code = e.keyCode;
    if (code == 13) {
        // Actually do the attack!
        this.enact(player);
    } else {
        player.delegates = [];
    }
    Game._redrawMap()
}
AOEAttack.prototype.targets = function(player){
    // list of x,y pairs
    var list = [];
    for (var a = -this.radius; a < this.radius+1; a+=1) {
        for (var b = -this.radius; b < this.radius+1; b+=1) {
            if (Math.abs(a) + Math.abs(b) <= this.radius && (a != 0 || b != 0))
            list.push([player._x + a, player._y + b]);
        }
    }
    return list;
}
AOEAttack.prototype.enact = function(player) {
    player.delegates.push({
        handleEvent: function() {},
        draw: function() {},
    })
    var that = this;
    this.animate(player, function() {
        var locationsHit = this.targets(player)
        for (var i = 0; i < locationsHit.length; i += 1) {
            var x = locationsHit[i][0];
            var y = locationsHit[i][1];
            this.hitSpace(x,y);
        }

        that.pp -= 1;
        Game._redrawMap();
        player.finishTurn();
    });
}
AOEAttack.prototype.draw = function(player) {
    var targets = this.targets(player);
    for (var i = 0; i < targets.length; i+=1){
        var drawColor = "#eee";
        var dx = targets[i][0];
        var dy = targets[i][1];
        Game.display.draw(dx, dy, "*", drawColor, "#333");
    }
}

var EarthQuake = function() {
    this.maxPP = 5;
    this.pp = this.maxPP;
};
EarthQuake.prototype = new AOEAttack(2);
EarthQuake.prototype.animate = function(player, callback) {
    // Duplicate array, then randomize order.
    var locationsHit = this.targets(player).slice(0).randomize();
    var delay = 200;
    var scaledTimeout = function(i, cb) {
        setTimeout(function(){ cb(i) }, i*delay);
    }

    for (var s = 0; s < 8; s += 1) {
        scaledTimeout(s, function(c){
            if (c%2 == 0) {
                Game._redrawMap();
            } else {
                for (var i = 0; i < locationsHit.length; i += 1) {
                    var x = locationsHit[i][0];
                    var y = locationsHit[i][1];
                    Game.display.draw(x,y, '~', '#c90', '#752');
                }
            }
        });
    }
    scaledTimeout(locationsHit.length + 1, callback.bind(this));
}
EarthQuake.prototype.hitSpace = function(x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.name() + " is hit!");
        monster.takeHit(2);
    }
}
EarthQuake.prototype.name = function() {return "EarthQuake";}

var FlameThrower = function() {
    this.maxPP = 5;
    this.pp = this.maxPP;
};
FlameThrower.prototype = new DirectionalAttack(3, false);
FlameThrower.prototype.animate = function(player, callback) {
    var locationHit = this.targets(player._x, player._y)[this.selectedDirection];
    var delay = 100;
    var scaledTimeout = function(i, cb) {
        setTimeout(function(){ cb(i) }, i*delay);
    }
    for (var i = 0; i < locationHit.length; i += 1) {
        scaledTimeout(i, function(c){
            var x = locationHit[c][0];
            var y = locationHit[c][1];
            Game.display.draw(x,y, '#', '#F00', '#000');
        });
    }
    scaledTimeout(locationHit.length + 1, callback.bind(this));
}

FlameThrower.prototype.hitSpace = function(x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.name() + " is burned!");
        monster.takeHit(3);
    }
}
FlameThrower.prototype.name = function() {return "FlameThrower";}

var Slash = function() {
    this.maxPP = 15;
    this.pp = this.maxPP;
    this.isMelee = true;
};
Slash.prototype = new DirectionalAttack(1, true);
Slash.prototype.animate = function(player, callback) {
    var locationHit = this.targets(player._x, player._y)[this.selectedDirection];
    var delay = 100;
    var scaledTimeout = function(i, cb) {
        setTimeout(function(){ cb(i) }, i*delay);
    }
    if (locationHit.length > 0) {
        for (var i = 0; i < 3; i += 1) {
            scaledTimeout(i, function(c){
                var x = locationHit[0][0] + (c-1);
                var y = locationHit[0][1] + (c-1);
                Game.display.draw(x,y, '\\', '#fff', '#aaa');
            });
        }
        scaledTimeout(6, callback.bind(this));
    } else {
        callback.bind(this)();
    }
}

Slash.prototype.hitSpace = function(x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.name() + " is slashed!");
        monster.takeHit(3);
    }
}
Slash.prototype.name = function() {return "Slash";}
