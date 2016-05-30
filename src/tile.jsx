import Game from './game.jsx';
import Point from './point.jsx';
var browns = ['#DEB887', '#CD853F', '#A0522D', '#D2B48C'];
var gray   = () => ROT.Color.toHex(ROT.Color.interpolate([0, 0, 0], [255, 255, 255], (Math.random()*0.5) + 0.25))
var flame  = () => ROT.Color.toHex(ROT.Color.fromString(['coral', 'orange', 'orangered', 'darkorange'].random()));

class StaticGlyph {
  static makeStatic(glyph) {
    return new StaticGlyph(glyph.c, glyph.fg, glyph.bg);
  }

  constructor(c,fg,bg) {
    this._c = c;
    this._fg = fg;
    this._bg = bg;
  }

  get c() {
    return this._c;
  }
  get fg() {
    return this._fg;
  }
  get bg() {
    return this._bg;
  }
}

class Tile {
  constructor(x, y) {
    this.position = Point.at([x,y]);
    this._glyph = new StaticGlyph('.', gray(), '#000');
    this._components = new Set;
  }
  trigger(entity){ return this._components.forEach(c => c.trigger ? c.trigger(entity) : null); }
  canSeeThrough(){ return this._all('canSeeThrough'); }
  isWalkable(){ return this._all('isWalkable'); }
  isLit() { return this._injected('light', (a, b) => a+b, 0) > 0}
  get glyph() { return this._highest_priority('glyph', this._glyph); }
  attachComponent(component) {
    if(component.attach) {
      component.attach()
    }
    component.tile = this;
    this._components.add(component);
  }
  detachComponent(component) {
    if(component.detach) {
      component.detach()
    }
    this._components.delete(component);
  }
  getComponent(componentType) {return this._sortedComponentArray().find(c => c.constructor == componentType)}

  /* Private Methods */
  _injected(propertyName, operation, defaultValue) {
    return this._sortedComponentArray().reduce((val, element) => {
      if (element[propertyName]) {
        return operation(val, element[propertyName]());
      } else {
        return val;
      }
    }, defaultValue);
  }
  _highest_priority(propertyName, defaultReturnValue) {
    const component = this._sortedComponentArray().find(c => c[propertyName]);
    return component ? component[propertyName] : defaultReturnValue;
  }
  _any(propertyName, ...args) {
    return this._sortedComponentArray().filter(c => c[propertyName]).some(c => c[propertyName](...args));
  }
  _none(propertyName, ...args) {
    return !(this._sortedComponentArray().filter(c => c[propertyName]).some(c => c[propertyName](...args)));
  }
  _all(propertyName, ...args) {
    return !(this._sortedComponentArray().filter(c => c[propertyName]).some(c => !c[propertyName](...args)));
  }
  _sortedComponentArray() {
    return Array.from(this._components).sort((l,r) =>{
      if (l.priority < r.priority) {
        return -1;
      } else if (l.priority > r.priority) {
        return 1;
      } else {
        return 0;
      }
    });
  }
}

class WallComponent {
  constructor() {
    this.glyph = {c: '#', fg: gray(), bg: '#000'}
  }
  isWalkable() { return false; }
  canSeeThrough() { return false; }
  get priority() { return 0; }
  light() {
    return 5;
  }
}
window.WallComponent = WallComponent;

class Wall extends Tile {
  constructor(x,y) {
    super(x,y);
    this.attachComponent(new WallComponent);
  }
}
class SmokeGlyph {
  get c() { return '%'; }
  get fg() { return gray(); }
  get bg() { return '#000'; }
}

class Smoke extends Tile {
  constructor(x,y) {
    super(x,y);
    this.attachComponent(new SmokeComponent(this.position, 0));
  }
}

class SmokeComponent {
  constructor(position, time) {
    this.position = position;
    this.glyph = new SmokeGlyph;
    this.timeOut = time;
  }
  canSeeThrough() { return false }
  get priority() { return 10; }
  attach() {
    Game.scheduler.add(this, true);
    Game.lighting.dirty();
  }
  detach() {
    Game.scheduler.remove(this);
    Game.lighting.dirty();
  }
  act() {
    this.timeOut += 1;
    if (this.timeOut>30) {
      this.tile.detachComponent(this);
      return;
    }
    ROT.DIRS[8].forEach(o => {
      if (Math.random()*30 >1) { return; }
      const tile = Game.getTile(this.position.offset(...o));
      if (!tile.getComponent(SmokeComponent)) {
        tile.attachComponent(new SmokeComponent(tile.position, this.timeOut + 2));
      }
    })
  }
}


class TorchGlyph {
  get c() { return '^'; }
  get fg() { return flame(); }
  get bg() { return '#000' }
}

class TorchComponent {
  constructor(position) {
    this.position = position;
    this.glyph = new TorchGlyph;
  }
  get priority() { return 10; }
  attach() {
    Game.lighting.registerLight(this, ROT.Color.fromString(flame()));
    Game.lighting.dirty();
  }
  detach() {
    Game.lighting.removeLight(this);
    Game.lighting.dirty();
  }
}

class TorchTile extends Tile {
  constructor(x,y) {
    super(x,y);
    this.attachComponent(new TorchComponent(this.position));
  }
}

var Empty = Tile;
export {
  Wall,
  Empty,
  Smoke,
  StaticGlyph,
  TorchTile,
}
