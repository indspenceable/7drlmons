var EMPTY_DELEGATE = {
    handleEvent: function() {},
    draw: function() {},
};
var Player = function(x, y) {
    this._x = x;
    this._y = y;

    this.mons = [
        new Mon("C", '#c55', '#000', "Charizard", 15, [
            new FlameThrower(),
            new Slash(),
            new EarthQuake(),
        ], Type.Fire, Type.Flying),
        new Mon("s", '#aaf', '#000', "Squirtle",  5, [
            new SkullBash(),
            new Bubble(),
        ], Type.Water),
    ]

    this._currentMon = this.mons[0];
    this.delay = 0;

    this.delegates = [];
}

Player.prototype = new Entity();

Player.prototype._currentDelegate = function() {
    return this.delegates[this.delegates.length-1];
}

Player.prototype.getHp = function() {
    return this._currentMon._hp;
}
Player.prototype.getMaxHp = function() {
    return this._currentMon._maxHp;
}

Player.prototype.act = function() {
    Game.engine.lock();
    window.addEventListener("keydown", this);
    if (this.delay > 0) {
        this.delay -= 1;
        this.finishTurn();
    }
}

Player.prototype.handleEvent = function(e) {
    if (this._currentDelegate() === undefined) {
        return this.makeMove(e);
    } else {
        return this._currentDelegate().handleEvent(this, e);
    }
}

Player.prototype.makeMove = function(e) {
    // var movementKeymap = { 38: 0, 33: 1, 39: 2, 34: 3, 40: 4, 35: 5, 37: 6, 36: 7, };
    var movementKeymap = { 38: 0, 39: 1, 40: 2, 37: 3, }
    var swapMonKeymap = { 49: 0, 50: 1, 51: 2, 53: 3, 54: 4, 55: 5, };
    var attackKeymap = { 81: 0, 87: 1, 69: 2, 82: 3, };

    var code = e.keyCode;
    /* one of numpad directions? */
    if (code in movementKeymap) {
        event.preventDefault()
        this._attemptMovement(movementKeymap[code]);
    } else if (code in swapMonKeymap) {
        this._attemptToSwap(swapMonKeymap[code]);
    } else if (code in attackKeymap) {
        this._attemptToSelectAttack(attackKeymap[code]);
    } else if (e.keyCode == 190) {
        // . (wait)
        this.finishTurn()
    }
}

Player.prototype._attemptMovement = function(dirIndex) {
    var dir = ROT.DIRS[4][dirIndex];
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];

    var monster = Game.monsterAt(newX, newY)
    if (monster !== undefined) {
        this._doAttack(dirIndex, monster);
    } else if (Game.getTile(newX, newY).isWalkable()) {
        this._doMovement(newX, newY)
    }
}

Player.prototype._attemptToSelectAttack = function(attackIndex) {
    var attack = this._currentMon.moves[attackIndex];
    if (attack === undefined) {
        Game.logMessage(this.getName() + " doesn't know that move!");
    } else if (attack.pp <= 0) {
        Game.logMessage("out of PP!");
    } else {
        this.delegates.push(attack);
    }
    Game.redrawMap();
}

Player.prototype.pokeBall1 = function() {
    Game.redrawMap();
    Game.display.drawText(this._x-2, this._y-2, '/')
    Game.display.drawText(this._x,   this._y-2, '-')
    Game.display.drawText(this._x+2, this._y-2, '\\')

    Game.display.drawText(this._x-2, this._y,   '|')
    Game.display.drawText(this._x+2, this._y,   '|')

    Game.display.drawText(this._x-2, this._y+2, '\\')
    Game.display.drawText(this._x,   this._y+2, '-')
    Game.display.drawText(this._x+2, this._y+2, '/')
}
Player.prototype.pokeBall2 = function() {
    Game.redrawMap();
    Game.display.drawText(this._x-1, this._y-1, '/-\\')
    Game.display.drawText(this._x-1, this._y,   '|o|')
    Game.display.drawText(this._x-1, this._y+1,'\\-/')
}

Player.prototype.pokeBall3 = function() {
    Game.redrawMap();
    Game.display.draw(this._x, this._y, "o");
}

Player.prototype._attemptToSwap = function(slot) {
    if (this.mons[slot] !== undefined && this._currentMon != this.mons[slot]) {
        this.delegates.push(EMPTY_DELEGATE);
        setTimeout(this.pokeBall1.bind(this), 0);
        setTimeout(this.pokeBall2.bind(this), 150);
        setTimeout(this.pokeBall3.bind(this), 300);
        setTimeout((function(){
            Game.logMessage("Alright! Come back, " + this.getName() + "!");
            this._currentMon = this.mons[slot];
        }).bind(this), 301);

        setTimeout(this.pokeBall2.bind(this), 600);
        setTimeout(this.pokeBall1.bind(this), 800);
        setTimeout((function(){
            Game.logMessage("Go!" +  this.getName() + "!");
            Game.redrawMap();
            this.finishTurn();
        }).bind(this), 1000);

    } else if (this.mons[slot] == this._currentMon) {
        Game.logMessage(this.getName()  + " is already out!");
    }
}

Player.prototype._doMovement = function(newX, newY) {
    this._x = newX;
    this._y = newY;
    Game.redrawMap();
    Game.getTile(this._x, this._y).trigger(this);
    this.finishTurn();
}

Player.prototype.takeHit = function(damage, type) {
    var rtn = Entity.prototype.takeHit.call(this._currentMon, damage, type);
    Game._drawUI();
    return rtn;
}

//TODO this should live on the mon.
Player.prototype.defaultMeleeAttack = function() {
    for (var i = 0; i < this._currentMon.moves.length; i+=1) {
        var move = this._currentMon.moves[i];
        if (move.isMelee === true && move.pp > 0) {
            return move;
        }
    }
}

Player.prototype._doAttack = function(direction, monster) {
    // TODO woop
    var move = this.defaultMeleeAttack();
    if (move !== undefined) {
        move.selectedDirection = direction;
        move.enact(this);
        return;
    }
}

Player.prototype.draw = function() {
    this._currentMon.drawAt(this._x, this._y);
    if (this._currentDelegate() !== undefined) {
        this._currentDelegate().draw(this);
    }
}

Player.prototype.finishTurn = function() {
    Game._drawUI();
    this.delegates = [];
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype.isType = function(type) {
    return this._currentMon.isType(type);
}

Player.prototype.logVisible = function(message) {
    return this._currentMon.logVisible(message);
}

Player.prototype.getName = function() {
    return this._currentMon.getName();
}
