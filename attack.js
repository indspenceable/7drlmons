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

var FlameThrower = function() {};
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

var Slash = function() {};
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
