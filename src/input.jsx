var checkKeys = (chs) => {
  return e => Array.from(chs).includes(String.fromCharCode(e.which))
}
var checkCode = (codes) => {
  console.log(Array.from(codes))
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
  getDirection4, getDirection8,
  setGrip: checkKeys('G'),
  releaseGrip: checkKeys(['R', 'F']),
  groundDirection: checkKeys(['H', 'L']),
  anyDirection: checkKeys(['H','J','K','L']),
  wait: checkCode([190]),
  piton: checkKeys('P'),
}

export default Input;
