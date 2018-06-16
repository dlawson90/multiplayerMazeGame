// See Real-Time Servers II: File Servers for understanding 
// how we set up and use express
var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

// We will use the generate-maze module to generate random mazes
// Details at: https://www.npmjs.com/package/generate-maze
var mazeGenerator = require("generate-maze");

// MySQL Parameters
var mysql = require("mysql");
var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "",
	database: "maze"
});

// connect to database - log any errors(if any)
connection.connect(function(error){
	if(error){
		console.log(error);
		console.log("Server failed connecting to the MySQL database!");
	} else {
		console.log("Connected to database successfully!");
	}
});

// We are going to serve our static pages from the public directory
// See Real-Time Servers II: File Servers for understanding
// how we set up and use express
app.use(express.static("public"));

var maze;
var mazeStart;
var mazeEnd;
var rows = 10;
var cols = 10;

// stores all players received from the server
var allPlayers = [];

function getMazeData() {
	var mazeData = {
		mazeSize: {
			rows: rows,
			cols: cols
		},
		mazeCells: maze,
		mazeStart: mazeStart,
		mazeEnd: mazeEnd
	};
	return mazeData;
}

/*
 * This is our event handler for a connection.
 * That is to say, any code written here executes when a client makes a connection to the server
 * (i.e. when the page is loaded)
 * 
 * See Real-Time Servers III: socket.io and Messaging for help understanding how
 * we set up and use socket.io
 */
io.on("connection", function(socket) {

	// Print an acknowledge to the server's console to confirm a player has connected
	console.log("Player connected: " + socket.id);
	
	/*
	 * Here we send all information about a maze to the client that has just connected
	 * For full details about the data being sent, check the getMazeData method
	 * This message triggers the socket.on("maze data"... event handler in the client
	 */
	socket.emit("maze data", getMazeData());

	// define new player object for each connection
	var player = {
		id: socket.id,
		x: 0,
		y: 0
	};

	// push the object into the allPlayers array
	allPlayers.push(player);

	// emit the allPlayers array to all connected sockets
	io.emit("new player", allPlayers);

	socket.on("update location", function(data){
		// update the array for the specific socket that was received
		for(var i = 0; i < allPlayers.length; i++){
			if(data.id == allPlayers[i].id){
				// move player in direction received from the client
				if(data.direction == "left"){
					allPlayers[i].x -= 1;
				} else if (data.direction == "right"){
					allPlayers[i].x += 1;
				} else if(data.direction == "up"){
					allPlayers[i].y -= 1;
				} else if (data.direction == "down"){
					allPlayers[i].y += 1;
				} else {
					console.log("Invalid move!");
				}

				// send updated new player info to all sockets
				io.emit("update location", allPlayers[i]);
			}
		}
	});

	socket.on("disconnect", function() {

		console.log("Player disconnected: " + socket.id);

		// remove the specific socket from the array and emit that id to all sockets
		for(var i = 0; i < allPlayers.length; i++){
			if(socket.id == allPlayers[i].id){
				io.emit("disconnected", allPlayers[i].id);
				allPlayers.splice(i, 1);
			}
		}
		
	});

	socket.on("player won", function(data){
		// reset all player locations
		for(var i = 0; i < allPlayers.length; i++){
			allPlayers[i].x = 0;
			allPlayers[i].y = 0;
		}

		// query to insert data into database - the player's id and the time taken to complete the maze
		var sql = "INSERT INTO records (player, finishTime) VALUES ('" + data.id + "', " + data.time + ")";

		// execute the query above
		connection.query(sql, function(error) {
    
			if(error){ 
				console.log(error); 
			} else {
				console.log("Record added to database!");
			}
		
		});

		// send the winningPlayer object back to all clients
		io.emit("winning player", data);

		// send the updated array to all players - x and y have been reset to 0 (the start)
		io.emit("reset players", allPlayers);

		// generate a new maze layout
		generateMaze();
		// send this new maze to all clients
		io.emit("maze data", getMazeData());

	});
});

/*
 * The generateMaze function uses the generate-maze module to create a random maze,
 * which is stored in the 'maze' variable as a 2D array.
 * Additionally, a start point is created (this is always at the top-left corner)
 * and an end point is created (this is always the bottom-right corner).
 */
function generateMaze() {
	maze = mazeGenerator(rows, cols);
	mazeStart = { 
		x: 0, 
		y: 0 
	};
	mazeEnd = { 
		x: rows-1, 
		y: cols-1 
	};
}

/*
 * Start the server, listening on port 8081.
 * Once the server has started, output confirmation to the server's console.
 * After initial startup, generate a maze, ready for the first time a client connects.
 *
 */
server.listen(8081, function() {
	console.log("Map server has started - connect to 127.0.0.1:8081");
	generateMaze();
	console.log("Initial Maze generated!");
});

