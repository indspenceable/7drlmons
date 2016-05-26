import Game from './game.jsx';
import Point from './point.jsx';
var browns = ['#DEB887', '#CD853F', '#A0522D', '#D2B48C'];
var gray   = () => ROT.Color.toHex(ROT.Color.interpolate([0, 0, 0], [255, 255, 255], (Math.random()*0.5) + 0.25))

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
  get glyph() { return this._highest_priority('glyph', this._glyph); }
  attachComponent(component) {
    if(component.onAttach) {
      component.onAttach()
    }
    component.tile = this;
    this._components.add(component);
  }
  detachComponent(component) {
    console.log("detaching a component...");
    this._components.delete(component);
  }

  /* Private Methods */

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
    this.glyph = new StaticGlyph('#', gray(), '#000');
  }
  isWalkable() { return false; }
  canSeeThrough() { return false; }
  get priority() { return 0; }
}

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
    this.attachComponent(new SmokeComponent);
    console.log("Shouldn't be able to see through...", this.canSeeThrough());
  }
}

class SmokeComponent {
  constructor() {
    this.glyph = new SmokeGlyph;
    this.timeOut = 0;
  }
  canSeeThrough() { return false }
  get priority() { return 10; }
  onAttach() {
    Game.scheduler.add(this, true);
  }
  act() {
    this.timeOut += 1;
    if (this.timeOut>10) {
      Game.scheduler.remove(this);
      this.tile.detachComponent(this);
    }
  }
}

var Empty = Tile;
export {
  Wall,
  Empty,
  Smoke,
  StaticGlyph,
}
