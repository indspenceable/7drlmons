/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _srcGameJsx = __webpack_require__(1);

	var _srcGameJsx2 = _interopRequireDefault(_srcGameJsx);

	window.World = _srcGameJsx2['default'];

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _tileJsx = __webpack_require__(2);

	var _playerJsx = __webpack_require__(3);

	var _playerJsx2 = _interopRequireDefault(_playerJsx);

	var Game = {
	    display: null,
	    map: {},
	    engine: null,
	    player: null,
	    entities: [],
	    scheduler: null,
	    messages: [],
	    visibleTiles: [],
	    seenTiles: {},

	    init: function init() {
	        this.display = new ROT.Display({
	            // forceSquareRatio:true,
	            // spacing:0.75,
	        });
	        document.getElementById("game").appendChild(this.display.getContainer());
	        this.scheduler = new ROT.Scheduler.Simple();
	        this.engine = new ROT.Engine(this.scheduler);

	        this._generateMap();
	        this.redrawMap();
	        this._drawMapUIDivider();
	        this._drawUI();

	        this.engine.start();
	    },

	    findPathTo: function findPathTo(start, end) {
	        var path = [];
	        var passableCallback = function passableCallback(x, y) {
	            var monsterAtSpace = Game.monsterAt(x, y);
	            return (monsterAtSpace === undefined || monsterAtSpace === start || monsterAtSpace === end) && Game.getTile(x, y).isWalkable();
	        };
	        var astar = new ROT.Path.AStar(start.getX(), start.getY(), passableCallback, { topology: 4 });
	        astar.compute(end.getX(), end.getY(), function (x, y) {
	            path.push([x, y]);
	        });
	        return path;
	    },

	    getTile: function getTile(x, y) {
	        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
	            return undefined;
	        }
	        return this.map[y][x];
	    },

	    _generateMap: function _generateMap() {
	        var mapPrototype = ['###################################################', '#                                                ##', '#                       ###################       #', '#                       ###################       #', '#                                    ######       #', '#                                        ##       #', '#                                        ##      ##', '#######    ####################          ##    ####', '######### ###########                     # #######', '#         <                                 ##    #', '#          |   /                             #    #', '#          < |/                              ##   #', '#           <|               <  /          ####   #', '#            |                <|            ####  #', '#            |                 |/           ####  #', '#            |                 |           ####   #', '#          #####            #########      ####   #', '#   ################# #########################   #', '#         ########### ##########                  #', '#                 ### ########                    #', '#                  ## ####                        #', '#                   # #        ####################', '#                              ####################', '#               ###################################', '###################################################'];
	        this.map = [];
	        for (var y = 0; y < mapPrototype.length; y += 1) {
	            var currentRow = [];
	            this.map.push(currentRow);
	            for (var x = 0; x < mapPrototype[0].length; x += 1) {
	                var tileType = ({
	                    ' ': _tileJsx.Empty,
	                    '#': _tileJsx.Wall,
	                    '|': _tileJsx.GrippableBackground.build('|', '#a53', '#333'),
	                    '<': _tileJsx.GrippableBackground.build('\\', '#a53', '#333'),
	                    '/': _tileJsx.GrippableBackground.build('/', '#a53', '#333')

	                })[mapPrototype[y][x]];
	                currentRow.push(new tileType(x, y));
	            }
	        }
	        this._createPlayer(30, 1);
	        // this._createMonster(10,5,5, Mutant);
	    },

	    _createPlayer: function _createPlayer(x, y) {
	        this.player = new _playerJsx2['default'](x, y);
	        this.entities.push(this.player);
	        this.scheduler.add(this.player, true);
	    },

	    _createMonster: function _createMonster(x, y, hp, type) {
	        var monster = new type(x, y, hp);
	        this.entities.push(monster);
	        this.scheduler.add(monster, true);
	    },

	    // This is for drawing terrain etc.
	    drawMapTileAt: function drawMapTileAt(x, y) {
	        if (!this._canSee(x, y)) {
	            if (this._hasSeen(x, y)) {
	                this.getTile(x, y).drawFromMemory();
	            } else {
	                this.display.draw(x, y, " ");
	            }
	            return;
	        }
	        var m = this.monsterAt(x, y);
	        if (m !== undefined) {
	            m.draw();
	            return;
	        }

	        this.getTile(x, y).draw();
	    },

	    killMonster: function killMonster(monster) {
	        this.scheduler.remove(monster);
	        var index = this.entities.indexOf(monster);
	        if (index >= 0) {
	            this.entities.splice(index, 1);
	        }
	        this.drawMapTileAt(monster.getX(), monster.getY());
	    },

	    monsterAt: function monsterAt(x, y) {
	        for (var i = 0; i < this.entities.length; i += 1) {
	            if (this.entities[i].isAt(x, y)) {
	                return this.entities[i];
	            }
	        }
	        return undefined;
	    },

	    _drawWholeMap: function _drawWholeMap() {
	        for (var y = 0; y < this.map.length; y++) {
	            for (var x = 0; x < this.map[0].length; x++) {
	                this.drawMapTileAt(x, y);
	            }
	        }
	    },

	    redrawMap: function redrawMap() {
	        this._calculateFOV();
	        this._drawWholeMap();
	        this.player.draw();
	    },

	    _canSee: function _canSee(x, y) {
	        return this.visibleTiles[[x, y]] === true;
	    },
	    _hasSeen: function _hasSeen(x, y) {
	        return this.seenTiles[[x, y]] === true;
	    },

	    _calculateFOV: function _calculateFOV() {
	        var varRadius = 5;
	        var player = this.player;

	        var withinRange = function withinRange(x, y) {
	            var dx = player.getX() - x;
	            var dy = player.getY() - y;
	            return dx * dx + dy * dy < varRadius * varRadius;
	        };
	        var lightPasses = function lightPasses(x, y) {
	            var tile = Game.getTile(x, y);
	            return tile !== undefined && tile.canSeeThrough();
	        };

	        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
	        this.visibleTiles = [];
	        fov.compute(this.player.getX(), this.player.getY(), varRadius, function (x, y, r, canSee) {
	            if (withinRange(x, y)) {
	                Game.visibleTiles[[x, y]] = true;
	                Game.seenTiles[[x, y]] = true;
	            }
	        });
	    },

	    _drawMapUIDivider: function _drawMapUIDivider() {
	        var x = 55;
	        for (var y = 0; y < 25; y += 1) {
	            this.display.draw(x, y, "|");
	        }
	    },

	    _drawUI: function _drawUI() {
	        var x = 56;
	        var y = 0;
	        var width = 80 - 56;
	        var height = 25;

	        this._clearUIRow(x, y, width);
	        this.display.drawText(x, y, "@) " + this.player.getName());
	        y += 1;
	        this._clearUIRow(x, y, width);
	        this._drawMeter(x, y, this.player.gripStrength, 100, "Grip Strength", 20);
	        /*
	                this._clearUIRow(x, y, width)
	                this.display.drawText(x, y, "HP: " + this.player.getHp() + "/" + this.player.getMaxHp());
	                y+=1;
	        
	                this._clearUIRow(x, y, width)
	                this._drawMeter(x, y, this.player.getHp(), this.player.getMaxHp(), "Hp");
	        
	                for (var i = 0; i < 5; i+=1) {
	                    y+=1;
	                    this._clearUIRow(x,y, width);
	                    this._displayMon(x, y, i, this.player.mons[i]);
	                }
	        
	                y+=1;
	                y+=1;
	                this._clearUIRow(x, y, width)
	                this.displayMove(x, y, "q", this.player._currentMon.moves[0])
	                y+=1;
	                this._clearUIRow(x, y, width)
	                this.displayMove(x, y, "w", this.player._currentMon.moves[1])
	                y+=1;
	                this._clearUIRow(x, y, width)
	                this.displayMove(x, y, "e", this.player._currentMon.moves[2])
	                y+=1;
	                this._clearUIRow(x, y, width)
	                this.displayMove(x, y, "r", this.player._currentMon.moves[3])
	                y+=1;
	        */
	        this._clearAndDrawMessageLog();
	    },

	    _drawMeter: function _drawMeter(x, y, current, max, meterName, numberOfPips) {
	        if (current > max) {
	            current = max;
	        }
	        if (current < 0) {
	            current = 0;
	        }

	        var currentScaled = Math.floor(current * numberOfPips / max);
	        var maxScaled = numberOfPips;

	        this.display.drawText(x, y, "[" + "=".repeat(currentScaled) + " ".repeat(maxScaled - currentScaled) + "]", "#000", "#000");
	    },

	    _clearUIRow: function _clearUIRow(x, y, width) {
	        for (var j = 0; j < width; j += 1) {
	            this.display.draw(x + j, y, " ");
	        }
	    },

	    displayMove: function displayMove(x, y, label, move) {
	        if (move !== undefined) {
	            var defaultMelee = this.player.defaultMeleeAttack();
	            this.display.drawText(x, y, label + ") " + (move === defaultMelee ? '*' : ' ') + move.name() + " (" + move.pp + "/" + move.maxPP + ")");
	        }
	    },

	    _clearAndDrawMessageLog: function _clearAndDrawMessageLog() {
	        var x = 56;
	        var y = 15;
	        var width = 80 - 56;
	        var height = 25 - 15;

	        var index = this.messages.length;

	        this.display.drawText(x, y, Array(width).join("-"), "#000", "#000");
	        y += 1;
	        for (var i = 0; i < height - 1; i += 1) {
	            // clear the line
	            for (var j = 0; j < width; j += 1) {
	                this.display.draw(x + j, y, " ");
	            }

	            index -= 1;
	            if (index >= 0) {
	                // Draw this message
	                this.display.drawText(x, y, this.messages[index]);
	            }
	            y += 1;
	        }
	    },

	    logMessage: function logMessage(message) {
	        this.messages.push(message);
	        this._clearAndDrawMessageLog();
	    }
	};

	exports['default'] = Game;
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _gameJsx = __webpack_require__(1);

	var _gameJsx2 = _interopRequireDefault(_gameJsx);

	var Tile = (function () {
	  function Tile(c1, fg1, bg1) {
	    _classCallCheck(this, Tile);

	    this.c1 = c1;
	    this.fg1 = fg1;
	    this.bg1 = bg1;
	  }

	  _createClass(Tile, [{
	    key: "trigger",
	    value: function trigger() {}
	  }, {
	    key: "canSeeThrough",
	    value: function canSeeThrough() {
	      return true;
	    }
	  }, {
	    key: "isWalkable",
	    value: function isWalkable() {
	      return true;
	    }
	  }, {
	    key: "isGrippable",
	    value: function isGrippable() {
	      return false;
	    }
	  }, {
	    key: "draw",
	    value: function draw() {
	      _gameJsx2["default"].display.draw(this.x, this.y, this.c1, this.fg1, this.bg1);
	    }
	  }, {
	    key: "drawFromMemory",
	    value: function drawFromMemory() {
	      _gameJsx2["default"].display.draw(this.x, this.y, this.c1, "#ccc", "#222");
	    }
	  }], [{
	    key: "build",
	    value: function build(c1, fg1, bg1) {
	      return (function (_ref) {
	        _inherits(_class, _ref);

	        function _class(x, y) {
	          _classCallCheck(this, _class);

	          _get(Object.getPrototypeOf(_class.prototype), "constructor", this).call(this, c1, fg1, bg1);
	          this.x = x;
	          this.y = y;
	        }

	        return _class;
	      })(this);
	    }
	  }]);

	  return Tile;
	})();

	var GrippableBackground = (function (_Tile) {
	  _inherits(GrippableBackground, _Tile);

	  function GrippableBackground() {
	    _classCallCheck(this, GrippableBackground);

	    _get(Object.getPrototypeOf(GrippableBackground.prototype), "constructor", this).apply(this, arguments);
	  }

	  _createClass(GrippableBackground, [{
	    key: "isGrippable",
	    value: function isGrippable() {
	      return true;
	    }
	  }]);

	  return GrippableBackground;
	})(Tile);

	var Wall = (function (_Tile2) {
	  _inherits(Wall, _Tile2);

	  function Wall(x, y) {
	    _classCallCheck(this, Wall);

	    var browns = ['#DEB887', '#CD853F', '#A0522D', '#D2B48C'];

	    _get(Object.getPrototypeOf(Wall.prototype), "constructor", this).call(this, '#', browns.random(), '#000');
	    this.x = x;
	    this.y = y;
	  }

	  _createClass(Wall, [{
	    key: "isWalkable",
	    value: function isWalkable() {
	      return false;
	    }
	  }, {
	    key: "canSeeThrough",
	    value: function canSeeThrough() {
	      return false;
	    }
	  }, {
	    key: "isGrippable",
	    value: function isGrippable() {
	      return true;
	    }
	  }]);

	  return Wall;
	})(Tile);

	module.exports = {
	  GrippableBackground: GrippableBackground,
	  Empty: Tile.build(' ', '#fff', '#333'),
	  Wall: Wall
	};

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _entityJsx = __webpack_require__(4);

	var _entityJsx2 = _interopRequireDefault(_entityJsx);

	var _gameJsx = __webpack_require__(1);

	var _gameJsx2 = _interopRequireDefault(_gameJsx);

	var _inputJsx = __webpack_require__(5);

	var _inputJsx2 = _interopRequireDefault(_inputJsx);

	var EMPTY_DELEGATE = {
	  handleEvent: function handleEvent() {},
	  draw: function draw() {}
	};

	var Player = (function (_Entity) {
	  _inherits(Player, _Entity);

	  function Player(x, y) {
	    _classCallCheck(this, Player);

	    _get(Object.getPrototypeOf(Player.prototype), 'constructor', this).call(this, '@', 'player', '#fff', '#000');
	    this._x = x;
	    this._y = y;
	    this.delay = 0;

	    this.delegates = [];
	    this.gripStrength = 50;

	    this.knots = [];
	  }

	  _createClass(Player, [{
	    key: '_currentDelegate',
	    value: function _currentDelegate() {
	      return this.delegates[this.delegates.length - 1];
	    }
	  }, {
	    key: 'getHp',
	    value: function getHp() {
	      return this._hp;
	    }
	  }, {
	    key: 'getMaxHp',
	    value: function getMaxHp() {
	      return this._maxHp;
	    }
	  }, {
	    key: 'act',
	    value: function act() {
	      _gameJsx2['default'].engine.lock();
	      window.addEventListener("keydown", this);
	      if (this.delay > 0) {
	        this.delay -= 1;
	        this.finishTurn();
	      } else if (this.shouldFall()) {
	        // Falling logic!
	        this.doFall();
	      }
	    }
	  }, {
	    key: 'doFall',
	    value: function doFall() {
	      this.delegates.push(EMPTY_DELEGATE);
	      this.moveInstantlyToAndTrigger(this._x, this._y + 1);
	      _gameJsx2['default'].redrawMap();
	      var timeOut = 0;
	      if (this.shouldFall()) {
	        timeOut = 20;
	      }
	      setTimeout(this.finishTurn.bind(this), timeOut);
	    }
	  }, {
	    key: 'gripOffset',
	    value: function gripOffset(x, y) {
	      if (this.grip !== undefined) {
	        return [this.grip[0] - x, this.grip[1] - y];
	      }
	    }
	  }, {
	    key: 'currentlySupported',
	    value: function currentlySupported() {
	      var tile = _gameJsx2['default'].getTile(this._x, this._y + 1);
	      return !tile.isWalkable();
	    }
	  }, {
	    key: 'shouldFall',
	    value: function shouldFall() {
	      this.releaseGripIfInvalid();
	      this.releaseGripIfStrengthDepleted();
	      if (this.grip) {
	        return false;
	      }
	      return !this.currentlySupported();
	    }
	  }, {
	    key: 'releaseGripIfInvalid',
	    value: function releaseGripIfInvalid() {
	      if (this.grip !== undefined) {
	        var gx = this.grip[0];
	        var gy = this.grip[1];
	        if (Math.abs(this._x - gx) > 1 || Math.abs(this._y - gy) > 1) {
	          this.grip = undefined;
	        }
	      }
	    }
	  }, {
	    key: 'releaseGripIfStrengthDepleted',
	    value: function releaseGripIfStrengthDepleted() {
	      if (this.grip && this.gripStrength <= 0) {
	        this.grip = undefined;
	      }
	    }
	  }, {
	    key: 'handleEvent',
	    value: function handleEvent(e) {
	      if (this._currentDelegate() === undefined) {
	        return this.makeMove(e);
	      } else {
	        return this._currentDelegate().handleEvent(this, e);
	      }
	    }
	  }, {
	    key: 'makeMove',
	    value: function makeMove(e) {
	      // Entered a direction
	      if (_inputJsx2['default'].getDirection8(e) !== undefined) {
	        if (e.shiftKey) {
	          // Try to grip in that direction
	          var dir = ROT.DIRS[8][_inputJsx2['default'].getDirection8(e)];
	          this._attemptSetGrip(dir);
	        } else {
	          if (this.grip) {
	            var str = String.fromCharCode(e.which);
	            e.preventDefault();
	            this._attemptGrippingMovement(_inputJsx2['default'].getDirection8(e));
	          } else if (_inputJsx2['default'].groundDirection(e)) {
	            var str = String.fromCharCode(e.which);
	            e.preventDefault();
	            this._attemptHorizontalMovement(_inputJsx2['default'].getDirection8(e));
	          }
	        }
	      } else if (_inputJsx2['default'].setGrip(e)) {
	        this._attemptSetGrip([0, 0]);
	      } else if (_inputJsx2['default'].releaseGrip(e)) {
	        this.grip = undefined;
	        _gameJsx2['default'].redrawMap();
	        if (this.shouldFall()) {
	          this.doFall();
	        }
	      } else if (_inputJsx2['default'].wait(e)) {
	        this.finishTurn();
	      } else if (_inputJsx2['default'].piton(e)) {
	        if (this.knots.length == 0) {
	          this.addKnot();
	        } else {
	          this.knots = [];
	          _gameJsx2['default'].redrawMap();
	        }
	      }
	    }
	  }, {
	    key: 'addKnot',
	    value: function addKnot() {
	      this.knots.push([this._x, this._y]);
	    }
	  }, {
	    key: '_attemptSetGrip',
	    value: function _attemptSetGrip(dir) {
	      /* is there a free space? */
	      var targetX = this._x + dir[0];
	      var targetY = this._y + dir[1];

	      if (_gameJsx2['default'].getTile(targetX, targetY).isGrippable()) {
	        this.grip = [targetX, targetY];
	        _gameJsx2['default'].redrawMap();
	      }
	    }
	  }, {
	    key: '_attemptHorizontalMovement',
	    value: function _attemptHorizontalMovement(dirIndex) {
	      var dir = ROT.DIRS[8][dirIndex];
	      /* is there a free space? */
	      var newX = this._x + dir[0];
	      var newY = this._y + dir[1];
	      var monster = _gameJsx2['default'].monsterAt(newX, newY);

	      if (_gameJsx2['default'].getTile(newX, newY).isWalkable()) {
	        this._doMovement(newX, newY);
	      } else if (_gameJsx2['default'].getTile(this._x, this._y - 1).isWalkable() && _gameJsx2['default'].getTile(newX, this._y - 1).isWalkable()) {
	        this._doMovement(newX, this._y - 1);
	      }
	    }
	  }, {
	    key: '_attemptGrippingMovement',
	    value: function _attemptGrippingMovement(dirIndex) {
	      var dir = ROT.DIRS[8][dirIndex];
	      /* is there a free space? */
	      var newX = this._x + dir[0];
	      var newY = this._y + dir[1];

	      var monster = _gameJsx2['default'].monsterAt(newX, newY);
	      var legalOffset = function legalOffset(offset) {
	        return Math.abs(offset[0]) < 2 && Math.abs(offset[1]) < 2;
	      };
	      if (_gameJsx2['default'].getTile(newX, newY).isWalkable() && legalOffset(this.gripOffset(newX, newY))) {
	        this.moveInstantlyToAndTrigger(newX, newY);
	        if (this.currentlySupported()) {
	          this.grip = undefined;
	        }
	        _gameJsx2['default'].redrawMap();
	        this.finishTurn();
	      }
	    }
	  }, {
	    key: '_attemptToSelectAttack',
	    value: function _attemptToSelectAttack(attackIndex) {
	      _gameJsx2['default'].redrawMap();
	    }
	  }, {
	    key: '_doMovement',
	    value: function _doMovement(newX, newY) {
	      this.moveInstantlyToAndTrigger(newX, newY);
	      _gameJsx2['default'].redrawMap();
	      this.finishTurn();
	    }
	  }, {
	    key: 'takeHit',
	    value: function takeHit(damage, type) {
	      var rtn = _entityJsx2['default'].prototype.takeHit.call(this._currentMon, damage, type);
	      _gameJsx2['default']._drawUI();
	      return rtn;
	    }

	    //TODO this should live on the mon.
	  }, {
	    key: 'defaultMeleeAttack',
	    value: function defaultMeleeAttack() {}
	  }, {
	    key: '_doAttack',
	    value: function _doAttack(direction, monster) {
	      // TODO woop
	      var move = this.defaultMeleeAttack();
	      if (move !== undefined) {
	        move.selectedDirection = direction;
	        move.enact(this);
	        return;
	      }
	    }
	  }, {
	    key: 'draw',
	    value: function draw() {
	      if (this.grip) {
	        _gameJsx2['default'].display.draw(this.grip[0], this.grip[1], '+', '#f0f', '#000');
	      }
	      this.drawRope();
	      _get(Object.getPrototypeOf(Player.prototype), 'draw', this).call(this);
	      if (this._currentDelegate() !== undefined) {
	        this._currentDelegate().draw(this);
	      }
	    }
	  }, {
	    key: 'gainOrLoseGripStrength',
	    value: function gainOrLoseGripStrength() {
	      if (this.currentlySupported()) {
	        this.gripStrength += 1;
	      } else if (this.grip && !this.currentlySupported()) {
	        this.gripStrength -= 3;
	      }
	    }

	    // rope related stuff

	  }, {
	    key: 'bresenhem',
	    value: function bresenhem(x0, y0, x1, y1) {
	      var dx = Math.abs(x1 - x0);
	      var dy = Math.abs(y1 - y0);

	      var sx = x0 < x1 ? 1 : -1;
	      var sy = y0 < y1 ? 1 : -1;
	      var err = dx - dy;

	      var line = [];
	      for (var i = 0; i < 1000; i += 1) {
	        line.push([x0, y0]); // Do what you need to for this

	        if (x0 == x1 && y0 == y1) return line;
	        var e2 = 2 * err;
	        if (e2 > -dy) {
	          err -= dy;x0 += sx;
	        }
	        if (e2 < dx) {
	          err += dx;y0 += sy;
	        }
	      }
	    }
	  }, {
	    key: 'drawRope',
	    value: function drawRope() {
	      var knotsAndMe = this.knots.concat([[this._x, this._y]]);
	      for (var i = 0; i < this.knots.length; i += 1) {
	        var line = this.bresenhem.apply(this, _toConsumableArray(knotsAndMe[i]).concat(_toConsumableArray(knotsAndMe[i + 1])));
	        line.forEach(function (p) {
	          _gameJsx2['default'].display.draw(p[0], p[1], '*', '#fff', '#000');
	        });
	        _gameJsx2['default'].display.draw(line[0][0], line[0][1], '+', '#f00', '#000');
	      }
	    }
	  }, {
	    key: 'validConnection',
	    value: function validConnection(line) {
	      return !this.pointOfError(line);
	    }
	  }, {
	    key: 'pointOfError',
	    value: function pointOfError(line) {
	      return line.find(function (p) {
	        return !_gameJsx2['default'].getTile.apply(_gameJsx2['default'], _toConsumableArray(p)).isWalkable();
	      });
	    }
	  }, {
	    key: 'trimKnots',
	    value: function trimKnots() {
	      for (var i = 0; i < this.knots.length - 2; i += 1) {
	        var a = this.knots[i + 0];
	        // var b = this.knots[i+1];
	        var c = this.knots[i + 2];
	        if (this.validConnection(this.bresenhem.apply(this, _toConsumableArray(a).concat(_toConsumableArray(c))))) {
	          this.knots.splice(i + 1, 1);
	          return this.trimKnots();
	        }
	      }
	    }
	  }, {
	    key: 'addRequiredKnot',
	    value: function addRequiredKnot() {
	      var _this = this;

	      var lastKnot = this.knots[this.knots.length - 1];
	      var knotToMe = this.bresenhem.apply(this, _toConsumableArray(lastKnot).concat([this._x, this._y]));
	      var poe = this.pointOfError(knotToMe);
	      if (!poe) {
	        return;
	      }

	      //Check all adjacent spaces for one thats -
	      var sortedFilteredPoints = Array.from(ROT.DIRS[8]).sort(function (p) {
	        Math.abs(p[0] - lastKnot[0]) + Math.abs(p[1] - lastKnot[1]);
	      }).filter(function (p) {
	        var pos = [poe[0] + p[0], poe[1] + p[1]];
	        return pos[0] != lastKnot[0] || pos[1] != lastKnot[1];
	      }).filter(function (p) {
	        console.log('a');
	        var pos = [poe[0] + p[0], poe[1] + p[1]];
	        return _gameJsx2['default'].getTile.apply(_gameJsx2['default'], pos).isWalkable();
	      }).filter(function (p) {
	        console.log('b');
	        var pos = [poe[0] + p[0], poe[1] + p[1]];
	        var line = _this.bresenhem.apply(_this, _toConsumableArray(lastKnot).concat(pos));
	        return _this.validConnection(line);
	      });
	      // closest to the previous knot
	      // Has a path to the last knot
	      var point = sortedFilteredPoints.find(function (p) {
	        var pos = [poe[0] + p[0], poe[1] + p[1]];
	        return _this.validConnection(_this.bresenhem.apply(_this, pos.concat([_this._x, _this._y])));
	      });

	      if (point) {
	        this.knots.push([poe[0] + point[0], poe[1] + point[1]]);
	        this.trimKnots();
	      } else {
	        var point2 = sortedFilteredPoints[0];
	        var newKnot = [poe[0] + point2[0], poe[1] + point2[1]];
	        if (newKnot[0] == lastKnot[0] && newKnot[1] == lastKnot[1]) {
	          console.log("Bah!");
	          console.log(bollocks);
	        } else {
	          if (this.knots.length > 300) {
	            this.fail();
	          }
	          this.knots.push(newKnot);
	          this.addRequiredKnot();
	        }
	      }
	    }
	  }, {
	    key: 'trimLastKnotOld',
	    value: function trimLastKnotOld() {
	      if (this.knots.length > 1) {
	        var a = this.knots[this.knots.length - 2];
	        var b = this.knots[this.knots.length - 1];
	        var c = [this._x, this._y];

	        var oldToMe = this.bresenhem.apply(this, _toConsumableArray(a).concat(c));
	        var poe = this.pointOfError(oldToMe);
	        if (!poe) {
	          var mid = oldToMe[Math.floor(oldToMe.length / 2)];
	          var midToCurrent = this.bresenhem.apply(this, _toConsumableArray(b).concat(_toConsumableArray(mid)));

	          if (this.validConnection(midToCurrent)) {
	            this.knots.splice(this.knots.length - 1, 1);
	          }
	        }
	      }
	    }
	  }, {
	    key: 'trimLastKnot',
	    value: function trimLastKnot(i) {
	      var _this2 = this;

	      // if we have more than one knot, see if we can
	      if (this.knots.length > 1) {
	        var secondToLastPoint = this.knots[this.knots.length - 2];
	        var lastPoint = this.knots[this.knots.length - 1];

	        var secondToLastRopeSegement = this.bresenhem.apply(this, _toConsumableArray(secondToLastPoint).concat(_toConsumableArray(lastPoint)));

	        // if (secondToLastRopeSegement.length == 1) {
	        //   this.knots.splice(this.knots.length-1, 1);
	        //   console.log('a');
	        //   return true;
	        // }

	        var reversedSegment = secondToLastRopeSegement.reverse();

	        if (reversedSegment.length < 3) {
	          if (reversedSegment.every(function (p) {
	            console.log(p);
	            return _this2.validConnection(_this2.bresenhem.apply(_this2, _toConsumableArray(p).concat([_this2._x, _this2._y])));
	          })) {
	            this.knots.splice(this.knots.length - 1, 1);
	            // Re-add a knot if needed.
	            // this.addRequiredKnot();
	          }
	        } else {
	            var _loop = function () {
	              var checkPoint = reversedSegment[i];
	              var checkToPrev = _this2.bresenhem.apply(_this2, _toConsumableArray(secondToLastPoint).concat(_toConsumableArray(checkPoint)));
	              var checkToMe = _this2.bresenhem.apply(_this2, _toConsumableArray(checkPoint).concat([_this2._x, _this2._y]));
	              var drawOne = function drawOne(p) {
	                return _gameJsx2['default'].display.draw(p[0], p[1], '%', '#f0f', '#000');
	              };
	              var drawAll = function drawAll(line) {
	                return line.forEach(drawOne);
	              };

	              if (!_this2.validConnection(checkToMe) || !_this2.validConnection(checkToPrev)) {
	                if (i <= 1) {
	                  return {
	                    v: false
	                  };
	                } else {
	                  _this2.knots[_this2.knots.length - 1] = reversedSegment[i - 1];
	                  return {
	                    v: true
	                  };
	                }
	              }
	            };

	            for (var i = 0; i < reversedSegment.length; i += 1) {
	              var _ret = _loop();

	              if (typeof _ret === 'object') return _ret.v;
	            }
	            this.knots.splice(this.knots.length - 1, 1);
	            return false;
	          }
	      }
	      return false;
	    }
	  }, {
	    key: 'updateKnots',
	    value: function updateKnots(skipDraw) {
	      // Do nothing if we have no knots.
	      if (this.knots.length == 0) return;
	      this.addRequiredKnot();
	      var i = 0;
	      while (this.trimLastKnot(i += 1)) {
	        console.log('.');
	      }
	      if (!skipDraw) {
	        _gameJsx2['default'].redrawMap();
	      }
	    }
	  }, {
	    key: 'finishTurn',
	    value: function finishTurn() {
	      _gameJsx2['default']._drawUI();
	      this.delegates = [];
	      this.gainOrLoseGripStrength();
	      this.updateKnots();
	      window.updateKnots = this.updateKnots.bind(this);
	      window.removeEventListener("keydown", this);
	      _gameJsx2['default'].redrawMap();
	      _gameJsx2['default'].engine.unlock();
	    }
	  }, {
	    key: 'logVisible',
	    value: function logVisible(message) {
	      return _gameJsx2['default'].logMessage(message);
	    }
	  }, {
	    key: 'getName',
	    value: function getName() {
	      return "Player";
	    }
	  }]);

	  return Player;
	})(_entityJsx2['default']);

	exports['default'] = Player;
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _gameJsx = __webpack_require__(1);

	var _gameJsx2 = _interopRequireDefault(_gameJsx);

	var Entity = (function () {
	    function Entity(c1, name, fg1, bg1) {
	        _classCallCheck(this, Entity);

	        this.c1 = c1;
	        this._name = name;
	        this.fg1 = fg1;
	        this.bg1 = bg1;
	    }

	    _createClass(Entity, [{
	        key: "getX",
	        value: function getX() {
	            return this._x;
	        }
	    }, {
	        key: "getY",
	        value: function getY() {
	            return this._y;
	        }
	    }, {
	        key: "getName",
	        value: function getName() {
	            return this._name;
	        }

	        // Don't call this on player! lul
	    }, {
	        key: "stepTowardsPlayer",
	        value: function stepTowardsPlayer(path) {
	            if (path === undefined) {
	                path = _gameJsx2["default"].findPathTo(_gameJsx2["default"].player, this);
	            }
	            if (path.length < 3) {
	                return;
	            }
	            this.moveInstantlyToAndRedraw(path[1][0], path[1][1]);
	        }
	    }, {
	        key: "moveInstantlyToAndTrigger",
	        value: function moveInstantlyToAndTrigger(x, y) {
	            this._x = x;
	            this._y = y;
	            _gameJsx2["default"].getTile(this._x, this._y).trigger(this);
	        }
	    }, {
	        key: "moveInstantlyToAndRedraw",
	        value: function moveInstantlyToAndRedraw(x, y) {
	            var oldX = this._x;
	            var oldY = this._y;
	            this.moveInstantlyToAndTrigger(x, y);
	            _gameJsx2["default"].drawMapTileAt(oldX, oldY);
	            _gameJsx2["default"].drawMapTileAt(x, y);
	        }
	    }, {
	        key: "isAt",
	        value: function isAt(x, y) {
	            return x == this._x && y == this._y;
	        }
	    }, {
	        key: "takeHit",
	        value: function takeHit(damage, damageType) {
	            var diff = this.weaknessAndResistanceDiff(damageType);
	            this._hp -= Math.max(damage + diff, 1);
	            if (diff != 0) {
	                this.logVisible(this.weaknessMessage(diff));
	            }
	            if (this._hp <= 0) {
	                this.die();
	            }
	        }
	    }, {
	        key: "dealDamage",
	        value: function dealDamage(target, damage) {
	            target.takeHit(damage);
	        }
	    }, {
	        key: "die",
	        value: function die() {
	            _gameJsx2["default"].logMessage(this.getName() + " dies");
	            _gameJsx2["default"].killMonster(this);
	        }
	    }, {
	        key: "draw",
	        value: function draw() {
	            _gameJsx2["default"].display.draw(this._x, this._y, this.c1, this.fg1, this.bg1);
	        }
	    }, {
	        key: "act",
	        value: function act() {
	            if (this.delay > 0) {
	                this.delay -= 1;
	            } else {
	                this.doAction();
	            }
	        }
	    }, {
	        key: "logVisible",
	        value: function logVisible(message) {
	            if (_gameJsx2["default"]._canSee(this._x, this._y)) {
	                _gameJsx2["default"].logMessage(message);
	            }
	        }
	    }]);

	    return Entity;
	})();

	exports["default"] = Entity;
	module.exports = exports["default"];

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	var checkKeys = function checkKeys(chs) {
	  return function (e) {
	    return Array.from(chs).includes(String.fromCharCode(e.which));
	  };
	};
	var checkCode = function checkCode(codes) {
	  console.log(Array.from(codes));
	  return function (e) {
	    return Array.from(codes).includes(e.keyCode);
	  };
	};

	var getDirection4 = function getDirection4(e) {
	  return ({
	    'K': 0,
	    'L': 1,
	    'J': 2,
	    'H': 3
	  })[String.fromCharCode(e.which)];
	};
	var getDirection8 = function getDirection8(e) {
	  return ({
	    'K': 0,
	    'U': 1,
	    'L': 2,
	    'N': 3,
	    'J': 4,
	    'B': 5,
	    'H': 6,
	    'Y': 7
	  })[String.fromCharCode(e.which)];
	};

	var Input = {
	  getDirection4: getDirection4, getDirection8: getDirection8,
	  setGrip: checkKeys('G'),
	  releaseGrip: checkKeys(['R', 'F']),
	  groundDirection: checkKeys(['H', 'L']),
	  anyDirection: checkKeys(['H', 'J', 'K', 'L']),
	  wait: checkCode([190]),
	  piton: checkKeys('P')
	};

	exports['default'] = Input;
	module.exports = exports['default'];

/***/ }
/******/ ]);