// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("."));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  socket.on("ice", (candidate) => {
    socket.broadcast.emit("ice", candidate);
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
