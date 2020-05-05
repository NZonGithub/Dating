const express = require("express");
const app = express();
const PORT = 80;
const server = require('http').Server(app);
const ss = require("./socketServer.js")(server);

app.use(express.static("static"));

server.listen(PORT, () => {
    console.log("App listening on http://localhost:"+PORT);
});