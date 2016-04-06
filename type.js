
Type = (function(){
    var buildType = function(name, weak, resist) {
        if (weak === undefined) {
            weak = [];
        }
        if (resist === undefined) {
            resist = [];
        }

        var builder = {
            name: name,
        };
        for (var i = 0; i < weak.length; i+=1) {
            builder[weak[i]] = 1;
        }
        for (var i = 0; i < resist.length; i+=1) {
            builder[resist[i]] = -1;
        }

        return builder;
    }
    var allTypes = [
        buildType('Normal', [], []),
        buildType('Fire', ['Water', 'Ground'], ['Fire']),
        buildType('Water', [], ['Water', 'Fire']),
        buildType('Flying', [], ['Ground']),
        buildType('Ground', ['Water'], []),
    ];

    var typeDict = {}

    for (var i = 0; i < allTypes.length; i += 1) {
        for (var j = 0; j < allTypes.length; j+=1) {
            var typeName = allTypes[j].name;
            if (allTypes[i][typeName] === undefined) {
                allTypes[i][typeName] = 0;
            }
        }
        typeDict[allTypes[i].name] = allTypes[i];
    }

    return typeDict;
}());
