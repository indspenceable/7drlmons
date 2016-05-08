import Game from './game.jsx'

class Entity {
    constructor(c1, name, fg1, bg1) {
        this.c1 = c1;
        this._name = name;
        this.fg1 = fg1;
        this.bg1 = bg1;
    }

    getX() {
        return this._x;
    }
    getY() {
        return this._y;
    }

    getName() {
        return this._name;
    }

    // Don't call this on player! lul
    stepTowardsPlayer(path) {
        if (path === undefined) {
            path = Game.findPathTo(Game.player, this);
        }
        if (path.length < 3) {
            return;
        }
        this.moveInstantlyToAndRedraw(path[1][0], path[1][1]);
    }

    moveInstantlyToAndTrigger(x,y) {
        this._x = x;
        this._y = y;
        Game.getTile(this._x, this._y).trigger(this);
    }

    moveInstantlyToAndRedraw(x,y) {
        var oldX = this._x;
        var oldY = this._y;
        this.moveInstantlyToAndTrigger(x,y);
        Game.drawMapTileAt(oldX, oldY);
        Game.drawMapTileAt(x, y);
    }

    isAt(x,y) {
        return x == this._x && y == this._y;
    }

    takeHit(damage, damageType) {
        var diff = this.weaknessAndResistanceDiff(damageType);
        this._hp -= Math.max(damage + diff, 1);
        if (diff != 0) {
            this.logVisible(this.weaknessMessage(diff));
        }
        if (this._hp <= 0) {
            this.die()
        }
    }

    dealDamage(target, damage) {
        target.takeHit(damage);
    }

    die() {
        Game.logMessage(this.getName() + " dies");
        Game.killMonster(this);
    }

    draw() {
        Game.display.draw(this._x, this._y, this.c1, this.fg1, this.bg1);
    }

    act() {
        if (this.delay > 0) {
            this.delay -= 1;
        } else {
            this.doAction();
        }
    }

    logVisible(message) {
        if (Game._canSee(this._x, this._y)) {
            Game.logMessage(message);
        }
    }
}

export default Entity;
