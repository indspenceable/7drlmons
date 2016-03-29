var Mon = function(char, fg, bg, name, hp, moves) {
    this._char = char;
    this._fg = fg;
    this._bg = bg;
    this._name = name;
    this._hp = hp;
    this._maxHp = hp;
    this.moves = moves;
}
Mon.prototype.drawAt = function(x, y) {
    Game.display.draw(x, y, this._char, this._fg, this._bg);
}
Mon.prototype.getName = function() {
    return this._name;
}
