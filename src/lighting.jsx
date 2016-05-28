import Point from './point.jsx'
import Game from './game.jsx'

class Lighting {
  constructor() {
    this.pointData = new Map
    this.lights = new Map;
    this._dirty = false;
  }
  registerLight(light, color) {
    this.dirty();
    this.lights.set(light, color);
  }
  removeLight(light) {
    this.lights.delete(light);
  }
  dirty() {
    this._dirty = true;
  }
  lightAt(point) {
    if (this._dirty) {
      console.log("Dirty!");
      this._dirty = false;
      this.calculate();
    }
    return this.pointData.get(point) || [0,0,0];
  }
  calculate() {
    this.pointData.clear();
    const canSeeThroughCallback = (x,y) => {
      return Game.getTile(Point.at([x,y])).canSeeThrough();
    }
    // const reflectivityCallback = (x, y) => canSeeThrough(x,y) ? 0.3 : 0;
    const fovCalculator = new ROT.FOV.PreciseShadowcasting(canSeeThroughCallback);
    const reflectivityCallback = (x, y) => (Game.getTile(Point.at([x,y])).canSeeThrough() ? 0.00001 : 0);
    const lighting = new ROT.Lighting(reflectivityCallback, {passes: 1, range: 30})
    lighting.setFOV(fovCalculator);
    this.lights.forEach((color, key) => {
      return lighting.setLight(...key.position.coords, color)
    });
    const lightingCallback = (x, y, color) => {
      this.pointData.set(Point.at([x,y]), color)
    };
    lighting.compute(lightingCallback);
  }
}

export default Lighting;
