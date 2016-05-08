class TargettedAction {
    reset(player) {
        this._cursorX = player.getX();
        this._cursorY = player.getY();
    }
    handleEvent(player, e) {
        var movementKeymap = { 38: 0, 39: 1, 40: 2, 37: 3, }
        var code = e.keyCode;

        if (code in movementKeymap) {
            // arrow key => move cursor
            this.moveCursor(movementKeymap[code]);
        } else if (code == 13 && this.validSelection(player)) {
            // 'enter' => do it
            this.enact(player);
        } else if (code == 81) {
            // 'q' => cancel action
            player.delegates = [];
        }
        Game.redrawMap()
    }

    validSelection(player) {
        return !!this.targets(player).find(target => target == [this._cursorX, this._cursorY]);
    }

    enact(player) {
        player.delegates.push(EMPTY_DELEGATE)
        var that = this;
        this.animate(player, => {
            this.hitSpace(player, this._cursorX, this._cursorY);
            this.finish(player);
        });
    }

    draw(player) {
        var targets = this.targets(player);
        for (var i = 0; i < targets.length; i+=1){
            var drawColor = "#eee";
            var dx = targets[i][0];
            var dy = targets[i][1];
            Game.display.draw(dx, dy, "*", drawColor, "#333");
        }

        if (this.validSelection(player)) {
            Game.display.draw(this._cursorX, this._cursorY, "X", "#00f", "#333");
        } else {
            Game.display.draw(this._cursorX, this._cursorY, "X", "#f00", "#333");
        }
    }

    finish(player) {
        Game.redrawMap();
        player.finishTurn();
    }

    moveCursor(direction) {
        var offsetX = ROT.DIRS[4][direction][0];
        var offsetY = ROT.DIRS[4][direction][1];
        this._cursorX += offsetX;
        this._cursorY += offsetY;
    }
}

