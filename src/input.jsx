var checkKeys = (chs) => {
  return e => Array.from(chs).includes(String.fromCharCode(e.which))
}
var checkCode = (codes) => {
  return e => Array.from(codes).includes(e.keyCode)
}

var getDirection4 = (e) => {
  return {
    'K': 0,
    'L': 1,
    'J': 2,
    'H': 3,
  }[String.fromCharCode(e.which)]
}
var getDirection8 = (e) => {
  return {
    'K': 0,
    'U': 1,
    'L': 2,
    'N': 3,
    'J': 4,
    'B': 5,
    'H': 6,
    'Y': 7,
  }[String.fromCharCode(e.which)]
}


var Input = {
  getDirection8,
  wait: checkCode([190]),
}

export default Input;
