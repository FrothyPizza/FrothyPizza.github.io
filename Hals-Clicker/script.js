let clickCount = 0; 
let totalBlocksProduced = 0;
let clicksPerSecond = 0;
let towers = [];
let clickMultiplier = 1;

class Tower {
	constructor(name, price, owned, autoCPS=0) {
		this.name = name;
		this.price = price;
		this.owned = owned;
		this.multiplier = 1;

		this.autoCPS = autoCPS;

		this.updateInnerHTML();

	}


	
	updateInnerHTML() {
		let container = document.getElementById(this.name).childNodes[1];
		let price = container.childNodes[0];
		let owned = container.childNodes[1];
		price.innerHTML = "Price: " + this.price.toLocaleString();;//Math.round(this.price)//
		owned.innerHTML = "Owned: " + this.owned.toLocaleString();;//Math.round(this.owned)//

		// update tooltip to say how many blocks per second
		let tooltip = document.getElementById(this.name + "tooltip");
		tooltip.innerHTML = "Total BPS: " + (this.autoCPS * this.owned * this.multiplier).toLocaleString() +
			"<br>Single BPS: " + (this.autoCPS * this.multiplier).toLocaleString();
		
	}

	buy() {
		if(this.price > clickCount)
			return;
		clickCount -= this.price;
		this.price *= 1.15;
		++this.owned;
		this.updateInnerHTML();
	}

	updateAll(time) {
		clickCount += this.autoCPS * this.owned * time * this.multiplier;
		totalBlocksProduced += this.autoCPS * this.owned * time * this.multiplier;
	}


}






function addTower(name, price, autoCPS, tooltipText="hello") {

	let container = document.getElementById('towers');

	let tower = document.createElement('div');
	tower.id = name;
	tower.classList = "tower";

	// tower.innerHTML = '<button class="tooltip">'+name+'<span class="tooltiptext">' + tooltipText+'</span></button><div class="tower-information"><p class="price">Price: 0</p><p class="owned">Owned: 0</p></div>';

	tower.innerHTML = '<button>'+name+'</button><div class="tower-information"><p class="price">Price: 0</p><p class="owned">Owned: 0</p></div>';

	// add tooltip
	let tooltip = document.createElement('span');
	tooltip.id = name + "tooltip";
	tooltip.classList.add('tooltiptext');
	tooltip.innerHTML = tooltipText;
	tower.childNodes[0].appendChild(tooltip);
	tower.childNodes[0].classList.add('tooltip');


	container.appendChild(tower);

	let newTower = new Tower(name, price, 0, autoCPS);
	towers.push(newTower);


	let num = towers.length-1;
	document.getElementById(towers[num].name).childNodes[0].onclick = function() {
		towers[num].buy();
	}


}

let boughtUpgrades = [];

class Upgrade {
	constructor(name, price, callback, additionThreshold, tooltiptext) {
		this.name = name;
		this.price = price;
		this.callback = callback;
		this.additionThreshold = additionThreshold;

		console.log(tooltiptext);	
		this.tooltiptext = tooltiptext;
	}

	addHTML() {
		let container = document.getElementById('upgrades');

		let upgrade = document.createElement('div');
		upgrade.id = this.name;
		upgrade.classList = "upgrade";

		// upgrade.innerHTML = '<button>'+this.name+'</button><div class="upgrade-information"><p class="price">Price: '+this.price.toLocaleString()+'</p></div>';

		upgrade.innerHTML = '<button class="tooltip">'+this.name+'<span class="tooltiptext">' + this.tooltiptext +'</span></button><div class="upgrade-information"><p class="price">Price: '+this.price.toLocaleString()+'</p></div>';


		container.appendChild(upgrade);

		document.getElementById(this.name).childNodes[0].onclick = () => {
			if(this.price > clickCount) return;
			clickCount -= this.price;
			document.getElementById('upgrades').removeChild(upgrade);
			this.callback();

			boughtUpgrades.push(this.name);

			// update all towers
			for(let i = 0; i < towers.length; ++i) {
				towers[i].updateInnerHTML();
			}
		};
	}
}

let upgradesToBeAdded = [];

function addTowerUpgrage(name, price, callback, additionThreshold=0, tooltiptext="") {
	if(boughtUpgrades.includes(name)) return;

	upgradesToBeAdded.push(new Upgrade(name, price, callback, additionThreshold, tooltiptext));

}

// Adds the towers that need to be added if the addition threshold is met
function updateTowerUpgrades() {

	for(let i = 0; i < upgradesToBeAdded.length; ++i) {
		if(clickCount > upgradesToBeAdded[i].additionThreshold) {
			upgradesToBeAdded[i].addHTML();
			upgradesToBeAdded.splice(i, 1); // Remove it from the things that need to be added
			i = 0;
		}
	}
}



function updateClickHTML() {
	
	clickCounter.textContent = "Blocks produced: " + clickCount.toLocaleString();//Math.round(clickCount);
	totalBlocks.textContent = "Total blocks produced: " + totalBlocksProduced.toLocaleString();//Math.round(totalBlocksProduced);

	let cps = 0;
	for(let i = 0; i < towers.length; ++i) {
		cps += towers[i].autoCPS * towers[i].owned * towers[i].multiplier;
	}
	clicksPerSecond = cps;
	CPS.textContent = "BPS: " + cps.toLocaleString();
}

function clickBlock() {
	clickCount += clickMultiplier;
	totalBlocksProduced += clickMultiplier;

	updateClickHTML();
}

block.onclick = clickBlock;







addTower("Auto Clicker", 16, 2);
addTower("Jumper", 128, 6);
addTower("Bouncer", 1280, 16);
addTower("Block Factory", 15000, 50);
addTower("Block Plantation", 160000, 400);
addTower("Block Manufacturing Complex", 1000000, 2000);
addTower("Hal's Tower 3", 30000000, 30000);
addTower("Block Mining Corporation", 100000000, 100000);



addTowerUpgrage("Powerful Hand", 100, () => {
	clickMultiplier *= 4;
}, 10, "Produce four times as many blocks per click.");
addTowerUpgrage("Muscular Fingers", 10000, () => {
	clickMultiplier *= 8;
}, 1000, "Produce eight times as many blocks per click.");

addTowerUpgrage("More Powerful Hand", 100000, () => {
	clickMultiplier *= 8;
}, 10000, "Produce 16 times as many blocks per click.");

addTowerUpgrage("Better Auto Clikers", 100, () => {
	towers[0].multiplier *= 2;
}, 10, "Auto Clickers produce twice as many blocks per second.");
addTowerUpgrage("Auto Clikers Can Now Slap", 10000, () => {
	towers[0].multiplier *= 8;
}, 1000, "Auto Clickers produce eight times as many blocks per second.");

addTowerUpgrage("Higher Jumps", 2500, () => {
	towers[1].multiplier *= 2;
}, 600, "Jumper produce twice as many blocks per second.");
addTowerUpgrage("Even Higher Jumps", 250000, () => {
	towers[1].multiplier *= 2;
}, 50000, "Jumper produce twice as many blocks per second.");

addTowerUpgrage("Trampolines", 7000, () => {
	towers[2].multiplier *= 2;
}, 2000, "Bouncers produce twice as many blocks per second.");
addTowerUpgrage("Bouncers Now Do Flips", 70000, () => {
	towers[2].multiplier *= 2;
}, 20000, "Bouncers produce twice as many blocks per second.");

addTowerUpgrage("Coal Powered Factories", 150000, () => {
	towers[3].multiplier *= 2;
}, 50000, "Block Factories produce twice as many blocks per second.");
addTowerUpgrage("Indentured Servitude", 150000, () => {
	towers[3].multiplier *= 4;
}, 50000, "Block Factories produce four times as many blocks per second.");
addTowerUpgrage("Gas Powered Factories", 1500000, () => {
	towers[3].multiplier *= 2;
}, 500000, "Block Factories produce twice as many blocks per second.");

addTowerUpgrage("More efficient plantations", 1000000, () => {
	towers[4].multiplier *= 2;
}, 500000, "Block Plantations produce twice as many blocks per second.");
addTowerUpgrage("Even more efficient plantations", 1000000, () => {
	towers[4].multiplier *= 2;
}, 5000000, "Block Plantations produce twice as many blocks per second.");

addTowerUpgrage("Complexity", 6000000, () => {
	towers[5].multiplier *= 2;
}, 5000000, "Block Manufacturing Complexes produce twice as many blocks per second.");

addTowerUpgrage("Hal's Tower 3 Update", 30000000, () => {
	towers[6].multiplier *= 4;
}, 30000000, "Hal's Tower 3's produce four times as many blocks per second.");

addTowerUpgrage("Better CEO", 1000000000, () => {
	towers[7].multiplier *= 2;
}, 10000000, "Block Mining Corporations produce twice as many blocks per second.");


const msPerUpdate = 15;
window.setInterval(() => {
	updateTowerUpgrades();

	for(let i = 0; i < towers.length; ++i) {
		towers[i].updateAll(msPerUpdate/1000);
	}

	updateClickHTML();
}, msPerUpdate);








function addGoldenBlock() {
	let block = document.createElement('div');
	block.classList.add('golden-block');
	block.id = "goldenBlock";

	block.style.top = (Math.random() * 7000) + 'px';
	block.style.left = (Math.random() * document.body.clientWidth) + 'px';
	
	block.onclick = () => {
		
		setTimeout(addGoldenBlock, Math.random() * 1000 + 100000);
		goldenBlock.remove();

		for(let i = 0; i < 200; ++i)
			clickBlock();
	}

	document.body.appendChild(block);
}

setTimeout(addGoldenBlock,Math.random() * 1000 + 1000);

