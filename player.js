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
            new Fly(),
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
    } else if (this.shouldFall()) {
        // Falling logic!

        this.delegates.push(EMPTY_DELEGATE);
        this.moveInstantlyToAndTrigger(this._x,this._y+1);
        Game.redrawMap();
        var timeOut = 0;
        if (this.shouldFall()) {
            timeOut = 100;
        }
        setTimeout(this.finishTurn.bind(this), timeOut);
    }
}

var POSSIBLE_GRIPS = [
    [ 0,  0],
    [ 1,  0],
    [ 1,  1],
    [ 0,  1],
    [-1,  1],
    [-1,  0],
    [-1, -1],
    [ 0, -1],
    [ 1, -1],
]

Player.prototype.gripOffset = function(x, y) {
    if (this.grip !== undefined) {
        return [this.grip[0] - x, this.grip[1] - y];
    }
}

Player.prototype.filteredGripOffsets = function() {
    var rtn = [];
    for (var i = 0; i < POSSIBLE_GRIPS.length; i+=1) {
        var current = POSSIBLE_GRIPS[i];
        if (! Game.getTile(current[0] + this._x, current[1] + this._y).isWalkable()) {
            rtn.push(current);
        }
    }
    return rtn;
}

Player.prototype.rotateGrip = function() {
    var findNextOffset = function(grip) {
        currentPossibleGrips = this.filteredGripOffsets();
        for (var i = 0; i < currentPossibleGrips.length; i+= 1){
            if (grip[0] == currentPossibleGrips[i][0] &&
                grip[1] == currentPossibleGrips[i][1]) {
                return currentPossibleGrips[(i+1)%currentPossibleGrips.length];
            }
        }
        return currentPossibleGrips[0];
    }.bind(this);

    var offset = this.gripOffset(this._x, this._y) || [-10, -10];
    var newGripOffset = findNextOffset(offset);
    if ( newGripOffset !== undefined ) {
        this.grip = [newGripOffset[0] + this._x, newGripOffset[1] + this._y];
    }
}

Player.prototype.shouldFall = function() {
    this.releaseGripIfInvalid();
    if (this.grip !== undefined) {
        return false;
    }

    var tile = Game.getTile(this._x, this._y + 1);
    return tile.isWalkable();
}

Player.prototype.releaseGripIfInvalid = function() {
    if (this._grip !== undefined) {
        var gx = this._grip[0];
        var gy = this._grip[1];
        if (Math.abs(this._x - gx) > 1 || Math.abs(this._y - gy) > 1) {
            this._grip = undefined;
        }
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
    var nonGripMovementKeymap = {
        // 38: 0,
        39: 1,
        // 40: 2,
        37: 3,
    }
    var grippingMovementKeymap = {
        38: 0,
        39: 1,
        40: 2,
        37: 3,
    }
    // var attackKeymap = { 81: 0, 87: 1, 69: 2, 82: 3, };

    var code = e.keyCode;
    /* one of numpad directions? */
    if (code == 71) {
        this.rotateGrip();
        Game.redrawMap();
    } else if (code == 82) {
        this.grip = undefined;
        Game.redrawMap();
    } else if (code in nonGripMovementKeymap && this.grip === undefined) {
        event.preventDefault()
        this._attemptHorizontalMovement(nonGripMovementKeymap[code]);
    } else if (code in grippingMovementKeymap && this.grip !== undefined) {
        event.preventDefault()
        this._attemptGrippingMovement(grippingMovementKeymap[code]);
    // } else if (code in attackKeymap) {
    //     this._attemptToSelectAttack(attackKeymap[code]);
    } else if (e.keyCode == 190) {
        // . (wait)
        this.finishTurn()
    }
}

Player.prototype._attemptHorizontalMovement = function(dirIndex) {
    var dir = ROT.DIRS[4][dirIndex];
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];

    var monster = Game.monsterAt(newX, newY)
    if (Game.getTile(newX, newY).isWalkable()) {
        this._doMovement(newX, newY)
    } else if (Game.getTile(this._x, this._y-1).isWalkable() &&
               Game.getTile(newX,    this._y-1).isWalkable()) {
        this._doMovement(newX, this._y-1);
    }
}

Player.prototype._attemptGrippingMovement = function(dirIndex) {
    var dir = ROT.DIRS[4][dirIndex];
    /* is there a free space? */
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];

    var monster = Game.monsterAt(newX, newY);
    var legalOffset = function(offset) {
        console.log(offset);
        return (Math.abs(offset[0]) < 2) && (Math.abs(offset[1]) < 2);
    }
    if (Game.getTile(newX, newY).isWalkable() && legalOffset(this.gripOffset(newX, newY))) {
        this._doMovement(newX, newY);
        if (! Game.getTile(newX, newY+1).isWalkable()) {
            this.grip = undefined;
            Game.redrawMap();
        }
    }
}

Player.prototype._attemptToSelectAttack = function(attackIndex) {
    var attack = this._currentMon.moves[attackIndex];
    if (attack === undefined) {
        Game.logMessage(this.getName() + " doesn't know that move!");
    } else if (attack.pp <= 0) {
        Game.logMessage("out of PP!");
    } else {
        attack.reset(this);
        this.delegates.push(attack);
    }
    Game.redrawMap();
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
    this.moveInstantlyToAndTrigger(newX,newY);
    Game.redrawMap();
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
    if (this.grip !== undefined) {
        Game.display.draw(this.grip[0], this.grip[1], '+', '#f0f', '#000');
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
