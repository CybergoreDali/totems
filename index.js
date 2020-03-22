var app = require("express")();
const express = require("express");
const path = require("path");

var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 8000;

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static("public"));
let connectCounter = 0
let totemList = {};

io.on("connection", function(socket) {

  socket.on("chat message", function(msg) {
    io.emit("chat message", msg);
    io.send();
  });

  socket.on("position update", function(positions) {
    io.emit("position update", positions);
  });

  socket.on("get totem", id => {
    connectCounter++
    console.log("clientCount", connectCounter);
    
    if (connectCounter % 2 === 1) {
      totemList[id] = "bird";
    } else {
      totemList[id] = "monkey";
    }
    io.emit("recieve totemList", totemList);
  });
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});
