var Entity = function(c1, name, fg1, bg1) {
    this.c1 = c1;
    this._name = name;
    this.fg1 = fg1;
    this.bg1 = bg1;
}
Entity.prototype.name = function() {
    return this._name;
}
// Don't call this on player! lul
Entity.prototype.stepTowardsPlayer = function(path) {
    if (path === undefined) {
        path = Game.findPathTo(Game.player, this);
    }
    if (path.length < 3) {
        return;
    }
    this.moveInstantlyToAndRedraw(path[1][0], path[1][1]);
}

Entity.prototype.moveInstantlyToAndRedraw = function(x,y) {
    var oldX = this._x;
    var oldY = this._y;

    this._x = x;
    this._y = y;
    Game.drawMapTileAt(oldX, oldY);
    Game.drawMapTileAt(x, y);

    // this.draw();
}
Entity.prototype.isAt = function(x,y) {
    return x == this._x && y == this._y;
}
Entity.prototype.takeHit = function(damage) {
    this._hp -= damage;
    if (this._hp <= 0) {
        this.die()
    }
}
Entity.prototype.die = function() {
    Game.logMessage(this.name() + " dies");
    Game.killMonster(this);
}
Entity.prototype.draw = function() {
    Game.display.draw(this._x, this._y, this.c1, this.fg1, this.bg1);
}



var Mutant = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Mutant.prototype = new Entity("M", "Mutant", "#000", "#fff");
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

var Ranger = function(x, y, hp) { this._x = x; this._y = y; this._hp = hp; }
Ranger.prototype = new Entity("}", "Ranger", "#39a", "#222");
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
