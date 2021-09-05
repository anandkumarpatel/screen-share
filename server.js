const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001;

const app = express();

const state = {
  isPlaying: false,
  currentTime: 0
}
async function main() {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    return next()
  })

  app.get('/movie/:fpart', (req, res) => {
    console.log("move", `./movie/${req.params.fpart}`)
    res.sendFile(`./movie/${req.params.fpart}`, { root: __dirname });
  });

  app.use(express.static('build'))

  const server = http.createServer(app);

  const io = socketIo(server, {
    cors: {
      "origin": "*",
      "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      "preflightContinue": false,
      "optionsSuccessStatus": 204
    }
  });

  io.on("connection", (socket) => {
    console.log(socket.id, "New client connected");

    console.log("sending init", state)
    socket.emit("init", state)

    socket.join("all")

    socket.on("clicked", (event) => {
      console.log("emitting", event)
      io.to("all").emit("clicked", event)
    })

    socket.on("disconnect", () => {
      console.log(socket.id, "Client disconnected")
    });
  });

  server.listen(port, () => console.log(`Listening on port http://localhost:${port}`));
}

main().catch(console.error)



