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
