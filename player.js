
var Player = function(x, y) {
    this._x = x;
    this._y = y;

    this.mons = [
        new Mon("C", '#c55', '#000', "Charizard", 15, [
            new FlameThrower(),
            new Slash(),
            new EarthQuake(),
        ]),
        new Mon("s", '#aaf', '#000', "Squirtle",  5, [
            new SkullBash(),
        ]),
    ]

    this.currentMon = this.mons[0];
    this.delay = 0;

    this.delegates = [];
}

Player.prototype = new Entity();

Player.prototype._currentDelegate = function() {
    return this.delegates[this.delegates.length-1];
}

Player.prototype.getHp = function() {
    return this.currentMon._hp;
}
Player.prototype.getMaxHp = function() {
    return this.currentMon._maxHp;
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
    var attack = this.currentMon.moves[attackIndex];
    if (attack === undefined) {
        Game.logMessage(this.currentMon.getName() + " doesn't know that move!");
    } else if (attack.pp <= 0) {
        Game.logMessage("out of PP!");
    } else {
        this.delegates.push(attack);
    }
    Game._redrawMap();
}

Player.prototype._attemptToSwap = function(slot) {
    if (this.mons[slot] !== undefined && this.currentMon != this.mons[slot]) {
        Game.logMessage("Alright! Come back, " + this.currentMon.getName() + "!");
        this.currentMon = this.mons[slot];
        Game.logMessage("Go!" +  this.currentMon.getName() + "!");
        Game._redrawMap();
        this.finishTurn();
    } else if (this.mons[slot] == this.currentMon) {
        Game.logMessage(this.currentMon.getName()  + " is already out!");
    }
}

Player.prototype._doMovement = function(newX, newY) {
    this._x = newX;
    this._y = newY;
    Game._redrawMap();
    Game.getTile(this._x, this._y).trigger();
    this.finishTurn();
}

Player.prototype.takeHit = function(damage) {
    var rtn = Entity.prototype.takeHit.call(this.currentMon, damage);
    Game._drawUI();
    return rtn;
}

//TODO this should live on the mon.
Player.prototype.defaultMeleeAttack = function() {
    for (var i = 0; i < this.currentMon.moves.length; i+=1) {
        var move = this.currentMon.moves[i];
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
    this.currentMon.drawAt(this._x, this._y);
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
