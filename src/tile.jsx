var Tile = function(c1,fg1,bg1) {
    this.c1 = c1;
    this.fg1 = fg1;
    this.bg1 = bg1;
}
Tile.prototype.trigger = function() {}
Tile.prototype.canSeeThrough = function() {
    return true;
}
Tile.prototype.isWalkable = function() {
    return true;
}
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
EmptySpaceTile.prototype = new Tile(' ', '#f99', '#333')


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

var WaterTile = function(x,y) {
    this.x = x;
    this.y = y;
}
WaterTile.prototype = new Tile('~', '#9f9', '#99f')
WaterTile.prototype.isWalkable = function(world) {
    return true;
}
WaterTile.prototype.trigger = function(entity) {
    if (!entity.isType(Type.Water)) {
        entity.logVisible(entity.getName() + " is bogged down in the water!");
        entity.delay += 1;
    } else {
        entity.logVisible(entity.getName() + " easily swims through the water.");
    }
}

var FireTile = function(x, y) {
    this.x = x;
    this.y = y;
}
FireTile.prototype = new Tile('#', '#000', '#000')

FireTile.prototype.draw = function() {
    var first = ['f','e','d'].random();
    var second = ['6','4','2'].random();
    var third = ['6','4','2'].random();
    var fg = '#' + first + second + third;

    Game.display.draw(this.x, this.y, this.c1, fg, this.bg1);
}

FireTile.prototype.trigger = function(entity) {
    if (!entity.isType(Type.Fire)) {
        entity.logVisible(entity.getName() + " is burned by the fire!");
        entity.takeHit(1, Type.Fire);
    } else {
        entity.logVisible(entity.getName() + " is by a warm feeling.")
    }
}

module.exports = {
    Empty: EmptySpaceTile,
    Wall: WallTile,
}
