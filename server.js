var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

// generate-maze module to generate random mazes
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

io.on("connection", function(socket) {

	// Print an acknowledge to the server's console to confirm a player has connected
	console.log("Player connected: " + socket.id);
	
	// emit maze data to all clients
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

server.listen(8081, function() {
	console.log("Map server has started - connect to 127.0.0.1:8081");
	generateMaze();
	console.log("Initial Maze generated!");
});

