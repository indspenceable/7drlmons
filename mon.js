var Mon = function(char, fg, bg, name, hp, moves, type1, type2) {
    this._char = char;
    this._fg = fg;
    this._bg = bg;
    this._name = name;
    this._hp = hp;
    this._maxHp = hp;
    this.moves = moves;
    this._type1 = type1;
    this._type2 = type2;
}
Mon.prototype.drawAt = function(x, y) {
    Game.display.draw(x, y, this._char, this._fg, this._bg);
}
Mon.prototype.getName = function() {
    return this._name;
}
Mon.prototype.isType = function(type) {
    return this._type1 == type || this._type2 == type;
}
