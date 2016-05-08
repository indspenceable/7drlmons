var checkKeys = (chs) => {
  return e => Array.from(chs).includes(String.fromCharCode(e.which))
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
    'M': 3,
    'J': 4,
    'N': 5,
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
  wait: checkKeys('.'),
}

export default Input;
