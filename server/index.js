const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const Chat = require("./models/Chat"); 

const app = express();
const http = require("http");
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/chatapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let users = {}; // Object to keep track of users in rooms

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", ({ room, username }) => {
    socket.join(room);

    if (!users[room]) {
      users[room] = [];
    }
    users[room].push({ id: socket.id, username, typing: false });

    io.to(room).emit("update_user_list", users[room]);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("typing", ({ room, username, typing }) => {
    if (users[room]) {
      users[room] = users[room].map(user => 
        user.id === socket.id ? { ...user, typing } : user
      );
      io.to(room).emit("update_user_list", users[room]);
    }
  });

  socket.on("disconnect", () => {
    for (let room in users) {
      users[room] = users[room].filter(user => user.id !== socket.id);
      io.to(room).emit("update_user_list", users[room]);
    }
    console.log("User Disconnected", socket.id);
  });
});

app.get("/api/chat/:id", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate("participants", "username");
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat data" });
  }
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
