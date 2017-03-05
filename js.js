var Lib = {
	allIds: [],
	idN: 1000,

    genId: function() {
        if (this.allIds.length === this.idN - 50) {
            this.idN += 1000;
        }
        while (true) {
            var x = Math.floor(Math.random()*this.idN);
            if (this.allIds.indexOf(x) === -1) {
                return x;
            }
        }
    },

    boxesCollide: function(b1,b2) {
    	var top = false;
    	var bot = false;
    	var right = false;
    	var left = false;
    	var x = !(b1.x2-1 < b2.x || b1.x+1 > b2.x2);
    	var y = !(b1.y2-1 < b2.y || b1.y+1 > b2.y2);
    	if (x && b1.y < b2.y2 && b1.y > b2.y) {
    		top = true;
    	}
    	if (x && b1.y2 > b2.y && b1.y2 < b2.y2) {
    		bot = true;
    	}
    	if (y && b1.x2 > b2.x && b1.x2 < b2.x2) {
    		right = true;
    	}
    	if (y && b1.x < b2.x2 && b1.x > b2.x) {
    		left = true;
    	}
    	return {
    		x: x,
    		y: y,
    		bot: bot,
    		top: top,
    		right: right,
    		left: left,
    	}

    	// console.log(b1.y,b2.y)
    	// var colx = false;
    	// var coly = false;
    	// if (!(b1.x2 < b2.x || b1.x > b2.x2)) {
    	// 	colx = true;
    	// }
    	// if (!(b1.y2 < b2.y || b1.y > b2.y2) && (b1.x2 > b2.x || b1.x < b2.x)) {
    	// 	coly = true;
    	// }
    	// return {
    	// 	x: colx,
    	// 	y: coly,
    	// };
    }
}

var Surface = {
	pieces: {},
	fps: 100,
	gravity: -0.3,
	time: 0,

	setUp: function() {
		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext("2d");
		this.player = new Player();

		this.interval = setInterval(function(){
			Surface.time += 1;
			Surface.calc();
			Surface.redraw();
		}, 1000/Surface.framerate);
	},

	calc: function() {
		this.player.moveCheck();
		for (var id in this.pieces) {
			if (typeof this.pieces[id].calc !== 'undefined') {
				this.pieces[id].calc();
			}
		}
	},

	redraw: function() {
		this.clear();
		for (var id in this.pieces) {
			this.pieces[id].draw();
		}
	},

	registerPiece: function(piece) {
		this.pieces[piece.id] = piece;
	},

	clear: function() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
}

function FixedPiece(props) {
	this.x = props.cx - (props.w/2);
	this.y = props.cy - (props.h/2);
	this.w = props.w;
	this.h = props.h;
	this.fillstyle = props.fillstyle;

	this.id = Lib.genId();
	Surface.registerPiece(this);

	this.draw = function(){
		var ctx = Surface.ctx;
		ctx.beginPath();
		ctx.rect(this.x,this.y,this.w,this.h);
		ctx.fillStyle = this.fillstyle;
		ctx.fill();
	};

	this.getBox = function() {
		return {
			x: this.x,
			y: this.y,
			x2: this.x + this.w,
			y2: this.y + this.h,
		}
	}

	this.draw();
}

function UnfixedPiece(props) {
	FixedPiece.call(this,props);

	this.vecs = [];
	this.lastVec = new Vector(0,0);
	this.upBlock = false;
	this.rightBlock = false;
	this.leftBlock = false;
	this.maxSpeed = 0.99;

	this.getVector = function() {
		var v = this.vecs.slice();
		while (true) {
			if (v.length === 1) {
				if (this.upBlock && v[0].y > 0) {
					v[0].y = 0;
				}
				if (this.rightBlock && v[0].x > 0) {
					v[0].x = 0;
				}
				if (this.leftBlock && v[0].x < 0) {
					v[0].x = 0;
				}
				this.lastVec = v[0];
				return v[0];
			} else {
				var v1 = v.shift();
				var v2 = v[0];
				v[0] = v1.add(v2);
			}
		}
	}

	this.calc = function() {
		this.vecs.push(new Vector(0,Surface.gravity));
		this.collisionCheck();
		var v = this.getVector();
		if (Math.abs(v.x) > this.maxSpeed) {
			v.x = this.maxSpeed * (v.x/Math.abs(v.x));
			console.log(v.x);
		}
		if (Math.abs(v.y) > this.maxSpeed) {
			v.y = this.maxSpeed * (v.y/Math.abs(v.y));
			console.log(v.y);
		}
		this.x += v.x;
		this.y += -1*v.y;
		this.vecs = [];
	}

	this.collisionCheck = function() {
		this.upBlock = false;
		this.rightBlock = false;
		this.leftBlock = false;
		var pieces = Surface.pieces;
		for (var id in pieces) {
			if (Number(id) === this.id) {
				continue;
			}
			var mybox = this.getBox();
			var fbox = pieces[id].getBox();
			var col = Lib.boxesCollide(mybox,fbox);
			if (col.bot){// && !col.top) {
				this.vecs.push(new Vector(0,-1*Surface.gravity))
			}
			if (col.top){// && !col.bot) {
				this.upBlock = true;
			}
			if ((col.right)){// && !col.left) {
				this.rightBlock = true;
			}
			if ((col.left)){ //&& !col.right) {
				this.leftBlock = true;
			}
		}
	}
}

function Player() {
	this.piece = new UnfixedPiece({
		cx: canvas.width/2,
		cy: canvas.height/2,
		w: 30,
		h: 30,
		fixed: false,
		fillstyle: 'lightblue',
	});

	this.speed = 1;

	this.moveCheck = function() {
		if (left) {
			this.piece.vecs.push(new Vector(-1*this.speed,0));
		}
		if (right) {
			this.piece.vecs.push(new Vector(this.speed,0));
		}
		if (up) {
			this.piece.vecs.push(new Vector(0,this.speed));
		}
		if (down) {
			this.piece.vecs.push(new Vector(0,-1*this.speed));
		}
	}
}

function Force(x,y,d) {
	this.x = x;
	this.y = y;
	this.starttime = Surface.time;

	this.getVector = function(){
		var deltaT = Surface.time - this.starttime;
		var x = this.x/(0.5*)
	}
}

function Vector(x,y) {
	this.x = x;
	this.y = y;

	this.add = function(v) {
		return new Vector(this.x+v.x, this.y+v.y);
	}
}

$(document).ready(function(){
	Surface.setUp();
	var canvas = Surface.canvas;
	floor = new FixedPiece({
		cx: canvas.width/2,
		cy: 300,
		w: 500,
		h: 40,
		fixed: true,
		fillstyle: 'black',
	});

	left = false;
	right = false;
	up = false;
	down = false;

	$(document).on('keydown', function(e){
		if (e.keyCode === 37) {
			left = true;
		} else if (e.keyCode === 38) {
			up = true;
		} else if (e.keyCode === 39) {
			right = true;
		} else if (e.keyCode === 40) {
			down = true;
		}
	});

	$(document).on('keyup', function(e){
		if (e.keyCode === 37) {
			left = false;
		} else if (e.keyCode === 38) {
			up = false;
		} else if (e.keyCode === 39) {
			right = false;
		} else if (e.keyCode === 40) {
			down = false;
		}
	});
});