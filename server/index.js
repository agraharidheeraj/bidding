const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const bids = [];

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.on("createBid", (data) => {
    const newBid = { ...data, id: Date.now().toString(), bids: [] };
    bids.push(newBid);
    io.emit("receive_bids", bids);
  });

  socket.on("placeBid", (data) => {
    const bid = bids.find((b) => b.id === data.bidId);
    if (bid) {
      bid.bids.push({ user: data.user, name: data.name, amount: data.amount });
      io.emit("receive_bids", bids);

      // Send bid amount to the user who created the bid
      io.to(bid.user).emit("bidPlaced", {
        bidId: bid.id,
        amount: data.amount,
        sender: data.name,
      });
    }
  });

  socket.on("confirmBid", (data) => {
    const bid = bids.find((b) => b.id === data.bidId);
    if (bid && !bid.confirmed && bid.user === data.user) {
      bid.confirmed = true;
      io.emit("receive_bids", bids);
    }
  });
});

const port = 3001;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
