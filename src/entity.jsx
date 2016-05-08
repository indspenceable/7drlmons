var Entity = function(c1, name, fg1, bg1) {
    this.c1 = c1;
    this._name = name;
    this.fg1 = fg1;
    this.bg1 = bg1;
}

Entity.prototype.getX = function() {
    return this._x;
}
Entity.prototype.getY = function() {
    return this._y;
}

Entity.prototype.getName = function() {
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

Entity.prototype.moveInstantlyToAndTrigger = function(x,y) {
    this._x = x;
    this._y = y;
    Game.getTile(this._x, this._y).trigger(this);
}

Entity.prototype.moveInstantlyToAndRedraw = function(x,y) {
    var oldX = this._x;
    var oldY = this._y;
    this.moveInstantlyToAndTrigger(x,y);
    Game.drawMapTileAt(oldX, oldY);
    Game.drawMapTileAt(x, y);
}

Entity.prototype.isAt = function(x,y) {
    return x == this._x && y == this._y;
}
Entity.prototype.takeHit = function(damage, damageType) {
    var diff = this.weaknessAndResistanceDiff(damageType);
    this._hp -= Math.max(damage + diff, 1);
    if (diff != 0) {
        this.logVisible(this.weaknessMessage(diff));
    }
    if (this._hp <= 0) {
        this.die()
    }
}

Entity.prototype.dealDamage = function(target, damage) {
    target.takeHit(damage);
}

Entity.prototype.die = function() {
    Game.logMessage(this.getName() + " dies");
    Game.killMonster(this);
}
Entity.prototype.draw = function() {
    Game.display.draw(this._x, this._y, this.c1, this.fg1, this.bg1);
}
Entity.prototype.act = function() {
    if (this.delay > 0) {
        this.delay -= 1;
    } else {
        this.doAction();
    }
}

Entity.prototype.logVisible = function(message) {
    if (Game._canSee(this._x, this._y)) {
        Game.logMessage(message);
    }
}

var Mutant = function(x, y, hp) {
    this._x = x;
    this._y = y;
    this._hp = hp;
    this.delay = 0;
}
Mutant.prototype = new Entity("M", "Mutant", "#000", "#fff");
Mutant.prototype.doAction = function() {
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length == 2) {
        Game.logMessage("The massive mutant hits you!");
        this.dealDamage(Game.player, 2, Type.Ground);
    } else {
        this.stepTowardsPlayer(path);
    }
}

var Ranger = function(x, y, hp) {
    this._x = x;
    this._y = y;
    this._hp = hp;
    this.delay = 0;
}
Ranger.prototype = new Entity("}", "Ranger", "#39a", "#222");
Ranger.prototype.doAction = function() {
    var range = 5;
    var path = Game.findPathTo(Game.player, this);
    if (path.length <= 1) {
        //No path! Ignore
    } else if (path.length <= range+1) {
        Game.logMessage("The Ranger shoots an arrow at you from afar!");
        entity.dealDamage(monster, 1, Type.Normal);
    } else {
        this.stepTowardsPlayer(path);
    }
}

export default Entity;
