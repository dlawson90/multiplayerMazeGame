var cellsWide;
var cellsHigh;

var maze = [];

var mazeStart = {};
var mazeEnd = {};

var cellWidth;
var cellHeight;

var socket = io.connect();

socket.on("maze data", function(data) {
	cellsWide = data.mazeSize.rows;
	cellsHigh = data.mazeSize.cols;
	maze = data.mazeCells;
	mazeStart = data.mazeStart;
	mazeEnd = data.mazeEnd;

	// initialise player object
	player = mazeStart;
	player.id = socket.id;

});

// stores all players received from the server
var allPlayers = [];
// player object for each client
var player = {};
// used to store winning player - id and time
var winningPlayer = {};
// used to store player that moved - id and direction
var movedPlayer = {};

// player one image object
var p1Image = new Image;
// other players images object
var pOImage = new Image;
// counter for images animations
var counter = 0;

// used to track how long a player takes to complete a maze
var timeStart = new Date();

$(document).ready(function() {
	startAnimating(120);

	// Controls
	//////////////////////////////////////////////////////

	// keyboard
	moveKeyboard();
	// mouse
	moveMouse("#right");
	moveMouse("#up");
	moveMouse("#down");
	moveMouse("#left");
	// touch
	moveTouch("swiperight");
	moveTouch("swipeup");
	moveTouch("swipedown");
	moveTouch("swipeleft");

});

/*
 * The startAnimating function kicks off our animation (see Games on the Web I - HTML5 Graphics and Animations).
 */
function startAnimating(fps) {
	fpsInterval = 1000/fps;
	then = Date.now();
	animate();
}

/*
 * The animate function is called repeatedly using requestAnimationFrame (see Games on the Web I - HTML5 Graphics and Animations).
 */
function animate() {
	requestAnimationFrame(animate);
	
	var now = Date.now();
	var elapsed = now - then;
		
	if (elapsed > fpsInterval) {
		
		then = now - (elapsed % fpsInterval);
		
		// Acquire both a canvas (using jQuery) and its associated context
		var canvas = $("canvas").get(0);
		var context = canvas.getContext("2d");
			
		// Calculate the width and height of each cell in our maze
		cellWidth = canvas.width/cellsWide;
		cellHeight = canvas.height/cellsHigh;
		
		// Clear the drawing area each animation cycle
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		// Change the current colour to gold, to draw the 'goal' state
		context.fillStyle = "gold";
		// The goal is calculated by multiplying the cell location (mazeEnd.x, mazeEnd.y)
		// by the cellWidth and cellHeight respectively
		// Refer to: Games on the Web I - HTML5 Graphics and Animations, Lab Exercise 2
		context.fillRect(mazeEnd.x * cellWidth,
						 mazeEnd.y * cellHeight,
						 cellWidth, cellHeight);
	
		// Change the current colour to black, and the line width to 2
		context.fillStyle = "black";
		context.lineWidth = 2;
			
		// Loop through the 2D array, in both rows and columns...
		for (i = 0; i < maze.length; i++) {
		
			for (j = 0; j < maze[i].length; j++) {
			
				// ... and for every cell in the maze, check where it has walls
				// For every wall we find, draw that wall in an appropriate place
				
				if (maze[i][j].top) {
					context.beginPath();
					context.moveTo(maze[i][j].x*cellWidth, maze[i][j].y*cellHeight);
					context.lineTo((maze[i][j].x+1)*cellWidth,maze[i][j].y*cellHeight);
					context.stroke();
					context.closePath();
				}
				
				if (maze[i][j].right) {
					context.beginPath();
					context.moveTo((maze[i][j].x+1)*cellWidth,maze[i][j].y*cellHeight);
					context.lineTo((maze[i][j].x+1)*cellWidth,(maze[i][j].y+1)*cellHeight);
					context.stroke();
					context.closePath();
				}
				
				if (maze[i][j].bottom) {
					context.beginPath();
					context.moveTo((maze[i][j].x+1)*cellWidth,(maze[i][j].y+1)*cellHeight);
					context.lineTo(maze[i][j].x*cellWidth,(maze[i][j].y+1)*cellHeight);
					context.stroke();
					context.closePath();
				}
				
				if (maze[i][j].left) {
					context.beginPath();
					context.moveTo(maze[i][j].x*cellWidth,(maze[i][j].y+1)*cellHeight);
					context.lineTo(maze[i][j].x*cellWidth, maze[i][j].y*cellHeight);
					context.stroke();
					context.closePath();
				}			
			}
		}
		
		// Load Players
		//////////////////////////////////////////////////////

		// increment counter used for drawing animated players
		counter++;
		// reset counter
		if(counter == 100){ counter = 0; }

		// draw an image for all other players
		for(var i = 0; i < allPlayers.length; i++){
			if(allPlayers[i].id !== socket.id){
				animatePlayerOther();
				context.drawImage(pOImage, allPlayers[i].x*cellWidth+5, allPlayers[i].y*cellHeight+5);
			} 
		}

		// draw a different image for the player (you)
		animatePlayer();		
		context.drawImage(p1Image, player.x*cellWidth+5, player.y*cellHeight+5);

		// Edge Detection
		//////////////////////////////////////////////////////

		// Left of screen
		if(player.x < 0){
			player.x = 0;
		}

		// Right of screen
		if(player.x > cellsWide - 1){
			player.x = cellsWide - 1;
		}

		// Top of screen
		if(player.y < 0){
			player.y = 0;
		}

		// Bottom of screen
		if(player.y > cellsHigh - 1){
			player.y = cellsHigh - 1;
		}

	}
}

// Event Handlers
//////////////////////////////////////////////////////

// on receiving a new player, update the allPlayers array
socket.on("new player", function(data){
	allPlayers = data;
});

// on receiving an updated location, update the allPlayers array with new player location
socket.on("update location", function(data){
	for(var i = 0; i < allPlayers.length; i++){
		if(allPlayers[i].id == data.id){
			allPlayers[i] = data;
		}
	}
});

// on receiving a disconnect, update the allPlayers array
socket.on("disconnected", function(data){
	for(var i = 0; i < allPlayers.length; i++){
		if(allPlayers[i].id == data){
			allPlayers.splice(i, 1);
		}
	}
});

// update the allPlayers array and the player object to the new values
socket.on("reset players", function(data){
	allPlayers = data;
	player.x = 0;
	player.y = 0;
});


// Message Log
//////////////////////////////////////////////////////

// new player message
socket.on("new player", function(data){
	for(var i = 0; i < data.length; i++){
		if(data[i].id == socket.id){
			$("#messages").append("<p class='connected'>You have connected!</p>");
		} else {
			$("#messages").append("<p class='connected'>Player " + data[i].id + " has connected!</p>" );
		}
	}
});

// player disconnected message
socket.on("disconnected", function(data){	
		$("#messages").append("<p class='disconnected'>Player " + data + " has disconnected!</p>" );
});

// winning player message
socket.on("winning player", function(data){
	if(data.id == socket.id){
		$("#messages").append("<p class='won'>You have won in " + data.time + " seconds!</p>" );
	} else {
		$("#messages").append("<p class='won'>Player " + data.id + " has won in " + data.time + " seconds!</p>" );
	}
	// reset timer for a new game
	timeStart = new Date();
});

// keyboard controls
function moveKeyboard(){

	$("body").keydown(function(event){
		 
		// Keyboard Controls
		//////////////////////////////////////////////////////
		
		// check which key is pressed
		var key = event.which;

		movedPlayer.id = socket.id;
		
		// Move left - LEFT ARROW or A
		if(key === 37 || key === 65 && !hasWon()){
			
			event.preventDefault();
			if(!maze[player.y][player.x].left){
				player.x--;
				movedPlayer.direction = "left";
				socket.emit("update location", movedPlayer);
				hasWon();
			}
		}
		
		// Move up - UP ARROW or W
		if(key === 38 || key === 87 && !hasWon()){
			//hasWon();
			event.preventDefault();
			if(!maze[player.y][player.x].top){
				player.y--;
				movedPlayer.direction = "up";
				socket.emit("update location", movedPlayer);
				hasWon();
			}
		}
		
		// Move right - RIGHT ARROW or D
		if(key === 39 || key === 68 && !hasWon()){
			//hasWon();
			event.preventDefault();
			if(!maze[player.y][player.x].right){
				player.x++;
				movedPlayer.direction = "right";
				socket.emit("update location", movedPlayer);
				hasWon();
			}

		}
		
		// Move down - DOWN ARROW or S
		if(key === 40 || key === 83 && !hasWon()){
			//hasWon();
			event.preventDefault();
			if(!maze[player.y][player.x].bottom){
				player.y++;
				movedPlayer.direction = "down";
				socket.emit("update location", movedPlayer);
				hasWon();
			}
		}
	});
}

// mouse controls
function moveMouse(dir){
		
	$(dir).mousedown(function(){

		// set moved player to socket id
		movedPlayer.id = socket.id;

		if(dir == "#right" && !maze[player.y][player.x].right){
			player.x++;
			movedPlayer.direction = "right";
			socket.emit("update location", movedPlayer);
			hasWon();
		} else if (dir == "#left" && !maze[player.y][player.x].left){
			player.x--;
			movedPlayer.direction = "left";
			socket.emit("update location", movedPlayer);
			hasWon();
		}
		else if (dir == "#up" && !maze[player.y][player.x].top){
			player.y--;
			movedPlayer.direction = "up";
			socket.emit("update location", movedPlayer);
			hasWon();
		}
		else if (dir == "#down" && !maze[player.y][player.x].bottom){
			player.y++;
			movedPlayer.direction = "down";
			socket.emit("update location", movedPlayer);
			hasWon();
		}
	});

}

// touch controls
function moveTouch(dir){

	// hammer.js settings
	var game = $("body").get(0);
	var options = {
		dragLockToAxis: true,
		dragBlockHorizontal: true
	};
	var hammertime = new Hammer(game, options);
	hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

	hammertime.on(dir, function() {
		
		// set moved player to socket id
		movedPlayer.id = socket.id;

		if(dir == "swiperight" && !maze[player.y][player.x].right){
			player.x++;
			movedPlayer.direction = "right";
			socket.emit("update location", movedPlayer);
			hasWon();
		} else if (dir == "swipeleft" && !maze[player.y][player.x].left){
			player.x --;
			movedPlayer.direction = "left";
			socket.emit("update location", movedPlayer);
			hasWon();
		}
		else if (dir == "swipeup" && !maze[player.y][player.x].top){
			player.y--;
			movedPlayer.direction = "up";
			socket.emit("update location", movedPlayer);
			hasWon();
		}
		else if (dir == "swipedown" && !maze[player.y][player.x].bottom){
			player.y++;
			movedPlayer.direction = "down";
			socket.emit("update location", movedPlayer);
			hasWon();
		}
	});
}

// animate images for other players
function animatePlayerOther(){
	
	var frame = counter % 40;
	
	if (frame < 5){
		pOImage.src = "images/PO-0.png";
	}
	else if (frame < 10){
		pOImage.src = "images/PO-1.png";
	}
	else if (frame < 15){
		pOImage.src = "images/PO-2.png";
	}
	else if (frame < 20){
		pOImage.src = "images/PO-3.png";
	}
	else if (frame < 25){
		pOImage.src = "images/PO-4.png";
	}
	else if (frame < 30){
		pOImage.src = "images/PO-5.png";
	}
	else if (frame < 35){
		pOImage.src = "images/PO-6.png";
	}
	else {
		pOImage.src = "images/PO-7.png";
	}
}

// animate images for player
function animatePlayer(){
	
	var frame = counter % 50;
	
	if (frame < 5){
		p1Image.src = "images/P1-0.png";
	}
	else if (frame < 10){
		p1Image.src = "images/P1-1.png";
	}
	else if (frame < 15){
		p1Image.src = "images/P1-2.png";
	}
	else if (frame < 20){
		p1Image.src = "images/P1-3.png";
	}
	else if (frame < 25){
		p1Image.src = "images/P1-4.png";
	}
	else if (frame < 30){
		p1Image.src = "images/P1-5.png";
	}
	else if (frame < 35){
		p1Image.src = "images/P1-6.png";
	}
	else if (frame < 40){
		p1Image.src = "images/P1-7.png";
	}
	else if (frame < 45){
		p1Image.src = "images/P1-8.png";
	}
	else {
		p1Image.src = "images/P1-9.png";
	}
}

// check if the player has won
function hasWon(){
	if(player.x >= mazeEnd.x && player.y >= mazeEnd.y){
		
		// calculate how long player has taken to reach the end	
		var timeComplete = (new Date() - timeStart) / 1000;
		// round result to 1 decimal place
		var seconds = timeComplete.toFixed(1);

		// update winningPlayer object with winning player's id and win time
		winningPlayer.id = player.id;
		winningPlayer.time = seconds;
		
		// emit message to server
		socket.emit("player won", winningPlayer);
	}
}