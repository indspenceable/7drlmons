var checkKeys = (chs) => {
  return e => Array.from(chs).includes(String.fromCharCode(e.which))
}

var getDirection = (e) => {
  return {
    'K': 0,
    'L': 1,
    'J': 2,
    'H': 3,
  }[String.fromCharCode(e.which)]
}

var Input = {
  getDirection,
  startGrip: checkKeys('G'),
  releaseGrip: checkKeys(['R', 'F']),
  standardDirection: checkKeys(['H', 'L']),
  anyDirection: checkKeys(['H','J','K','L']),
  wait: checkKeys('.'),
}

export default Input;
