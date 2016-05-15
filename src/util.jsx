function bresenhem(x0, y0, x1, y1){
  var dx = Math.abs(x1-x0);
  var dy = Math.abs(y1-y0);

  var sx = (x0 < x1) ? 1 : -1;
  var sy = (y0 < y1) ? 1 : -1;
  var err = dx-dy;

  var line = []
  for (var i = 0; i < 1000; i+=1){
     line.push([x0,y0]);  // Do what you need to for this

     if ((x0==x1) && (y0==y1)) return line;
     var e2 = 2*err;
     if (e2 >-dy){ err -= dy; x0 += sx; }
     if (e2 < dx){ err += dx; y0 += sy; }
  }
}

export  {
  bresenhem
}
