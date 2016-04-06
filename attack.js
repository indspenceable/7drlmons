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
    Game.redrawMap()
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
    player.delegates.push(EMPTY_DELEGATE)
    var that = this;
    this.animate(player, function() {
        var locationHit = this.targets(player.getX(), player.getY())[this.selectedDirection];
        for (var i = 0; i < locationHit.length; i += 1) {
            var x = locationHit[i][0];
            var y = locationHit[i][1];
            this.hitSpace(player, x, y);
        }

        this.finish(player);
    });
}
DirectionalAttack.prototype.draw = function(player) {
    var targets = this.targets(player.getX(),player.getY());
    for (var i = 0; i < targets.length; i+=1){
        var currentList = targets[i]
        for (var d in currentList) {
            var dx = currentList[d][0];
            var dy = currentList[d][1];
            Game.display.draw(dx, dy, "*", "#999", "#333");
        }
    }

    if ( this.selectedDirection != undefined ) {
        for (var d in targets[this.selectedDirection]) {
            var dx = targets[this.selectedDirection][d][0];
            var dy = targets[this.selectedDirection][d][1];
            Game.display.draw(dx, dy, "*", "#eee", "#333");
        }
    }
}
DirectionalAttack.prototype.finish = function(player) {
    this.pp -= 1;
    Game.redrawMap();
    player.finishTurn();
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
    Game.redrawMap();
}
AOEAttack.prototype.targets = function(player){
    // list of x,y pairs
    var list = [];
    for (var a = -this.radius; a < this.radius+1; a+=1) {
        for (var b = -this.radius; b < this.radius+1; b+=1) {
            if (Math.abs(a) + Math.abs(b) <= this.radius && (a != 0 || b != 0))
            list.push([player.getX() + a, player.getY() + b]);
        }
    }
    return list;
}
AOEAttack.prototype.enact = function(player) {
    player.delegates.push(EMPTY_DELEGATE)
    var that = this;
    this.animate(player, function() {
        var locationsHit = this.targets(player)
        for (var i = 0; i < locationsHit.length; i += 1) {
            var x = locationsHit[i][0];
            var y = locationsHit[i][1];
            this.hitSpace(player, x, y);
        }

        this.finish(player);
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
AOEAttack.prototype.finish = function(player) {
    this.pp -= 1;
    Game.redrawMap();
    player.finishTurn();
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

    for (var s = 0; s < 9; s += 1) {
        scaledTimeout(s, function(c){
            if (c%2 == 1) {
                Game.redrawMap();
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
EarthQuake.prototype.hitSpace = function(entity, x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.getName() + " is hit!");
        entity.dealDamage(monster, 2, Type.Ground)
    }
}
EarthQuake.prototype.name = function() {return "Earth Quake";}

var FlameThrower = function() {
    this.maxPP = 5;
    this.pp = this.maxPP;
};
FlameThrower.prototype = new DirectionalAttack(3, false);
FlameThrower.prototype.animate = function(player, callback) {
    var locationHit = this.targets(player.getX(), player.getY())[this.selectedDirection];
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

FlameThrower.prototype.hitSpace = function(entity, x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.getName() + " is burned!");
        entity.dealDamage(monster, 3, Type.Fire);
    }
}


FlameThrower.prototype.name = function() {return "Flame Thrower";}


var Bubble = function() {
    this.maxPP = 5;
    this.pp = this.maxPP;
};
Bubble.prototype = new DirectionalAttack(3, true);
Bubble.prototype.targets = function(x, y) {
    var targetted = [];
    // 4 directions
    for (directionIndex = 0; directionIndex < 4; directionIndex+=1) {
        targetted[directionIndex] = [];

        var offsetX = ROT.DIRS[4][directionIndex][0];
        var offsetY = ROT.DIRS[4][directionIndex][1];
        var failure = false;
        for (var i = -1; i < this.dist-1; i+=1) {
            if (!failure) {
                var cX = x + offsetX + offsetY*i;
                var cY = y + offsetY + offsetX*i;
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
Bubble.prototype.animate = function(player, callback) {
    var locationHit = this.targets(player.getX(), player.getY())[this.selectedDirection];
    var delay = 100;
    var scaledTimeout = function(i, cb) {
        setTimeout(function(){ cb(i) }, i*delay);
    }
    for (var i = 0; i < locationHit.length; i += 1) {
        scaledTimeout(i, function(c){
            var x = locationHit[c][0];
            var y = locationHit[c][1];
            Game.display.draw(x,y, '%', '#00F', '#000');
        });
    }
    scaledTimeout(locationHit.length + 1, callback.bind(this));
}

Bubble.prototype.hitSpace = function(entity, x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.getName() + " is hit!");
        entity.dealDamage(monster, 3, Type.Water);
    }
}


Bubble.prototype.name = function() {return "Bubble";}

var Slash = function() {
    this.maxPP = 15;
    this.pp = this.maxPP;
    this.isMelee = true;
};
Slash.prototype = new DirectionalAttack(1, true);
Slash.prototype.animate = function(player, callback) {
    var locationHit = this.targets(player.getX(), player.getY())[this.selectedDirection];
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

Slash.prototype.hitSpace = function(entity, x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.getName() + " is slashed!");
        entity.dealDamage(monster, 3, Type.Normal);
    }
}
Slash.prototype.name = function() {return "Slash";}


var SkullBash = function() {
    this.maxPP = 15;
    this.pp = this.maxPP;
    this.isMelee = true;
};
SkullBash.prototype = new DirectionalAttack(1, true);

SkullBash.prototype.animate = function(player, callback) {
    var locationHit = this.targets(player.getX(), player.getY())[this.selectedDirection];
    var delay = 250;
    var scaledTimeout = function(i, cb) {
        setTimeout(function(){ cb(i) }, i*delay);
    }
    if (locationHit.length > 0) {
        scaledTimeout(1, function(c){
            for (var i = -1; i <= 1; i += 2) {
                for (var j = -1; j <= 1; j += 2) {
                    var x = locationHit[0][0] + (i);
                    var y = locationHit[0][1] + (j);
                    Game.display.draw(x,y, 'x', '#fff', '#aaa');
                }
            }
        });
        scaledTimeout(2, function(c){
            var x = locationHit[0][0];
            var y = locationHit[0][1];
            Game.display.draw(x,y, 'o', '#fff', '#aaa');
        });
        scaledTimeout(3, callback.bind(this));
    } else {
        callback.bind(this)();
    }
}

SkullBash.prototype.hitSpace = function(entity, x,y) {
    var monster = Game.monsterAt(x,y);
    if (monster !== undefined) {
        Game.logMessage(monster.getName() + " is hit!!");
        entity.dealDamage(monster, 3, Type.Normal);
    }
}
SkullBash.prototype.finish = function(player) {
    player.delay += 1;
    this.__proto__.__proto__.finish.bind(this)(player);
}
SkullBash.prototype.name = function() {return "Skull Bash";}
