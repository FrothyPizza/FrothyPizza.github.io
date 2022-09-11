

const Globals = {
	// # is solid blocks, _ is blocks only enemies can fall through, S crate spawn locations
	map: [  "#########    #########",
			"#      ##    ##      #",
			"#                    #",
			"#      SS    SS      #",
			"#     ##########     #",
			"#                    #",
			"#                    #",
			"# SSS            SSS #",
			"######          ######",
			"#                    #",
			"#                    #",
			"#      S S  S S      #",
			"#     ##########     #",
			"#                    #",
			"#  S S S      S S S  #",
			"##########__##########",
		],
	crateLocations: []
};

for(let y = 0; y < Globals.map.length; ++y) {
	for(let x = 0; x < Globals.map[y].length; ++x) {
		if(Globals.map[y][x] == "S") Globals.crateLocations.push(new Vec2(x * 8, y * 8));
	}
}