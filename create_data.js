var mysql = require("mysql");

// Initial Connection
var connectionNoDB = mysql.createConnection({
    host: "sql2.freemysqlhosting.net",
    port: 3306,
    user: "",
    password: ""
});

// connect to database
connectionNoDB.connect(function(error){
	if(error){
		console.log(error);
		console.log("Server failed connecting to the MySQL database!");
	}
});

// create database query
var createDatabase = "CREATE DATABASE IF NOT EXISTS sql2243217";

// create database
connectionNoDB.query(createDatabase, function(error) {
    
    if(error){ 
        console.log(error); 
    } else {
        console.log("Database created!");
    }
});

// close connection
connectionNoDB.end();

// New connection using newly created database
var connection = mysql.createConnection({
    host: "sql2.freemysqlhosting.net",
    port: 3306,
    user: "",
    password: "",
    database: ""
});

connection.connect(function(error){
	if(error){
		console.log(error);
		console.log("Server failed connecting to the MySQL database!");
	}
});

var dropTable = "DROP TABLE IF EXISTS records";
var createTable = "CREATE TABLE records (id INT(5) AUTO_INCREMENT, player VARCHAR(25), finishTime DECIMAL(10,1), PRIMARY KEY(id))";

// drop the old table, if it exists
connection.query(dropTable, function(error) {
    
    if(error){ 
        console.log(error); 
    } else {
        console.log("Table dropped!");
    }

});

// create a new table using createTable
connection.query(createTable, function(error) {
    
    if(error){ 
        console.log(error); 
    } else {
        console.log("Table created!");
    }

});

// end connection
connection.end();