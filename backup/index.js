import Map from "./server/MapUtil.js";
import Server from "./server/Server.js";
import * as protocol from "./server/protocol.js";
import Game from "./server/Game.js";
import Player from "./server/entities/Player.js";
import { WebSocketServer } from "ws";

const server = new Server(3001);
const webSocketServer = server.createWebSocketServer(WebSocketServer);

server.publicize("./client");

server.listen(function onListen(data) {
    console.log(`Server started at ${data.time} on port ${data.port}`);
});

const connections = new Map();

function shortDate() {
    let date = new Date();
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

let socketID = 0;
webSocketServer.on("connection", function connect(socket, request) {
    socket.log = function (...args) {
        console.log(`[${socket.ip}](${shortDate()})`, ...args);
    }

    socket.ip = request.connection.remoteAddress;
    socket.log("Connection opened");

    if (connections.has(socket.ip)) {
        socket.log("Connection rejected due to duplicate IP");
        socket.close();
        return;
    }

    socket.id = socketID++;
    socket.binaryType = "arraybuffer";
    socket.player = undefined;

    socket.onclose = function close() {
        socket.log("Connection closed");
        connections.delete(socket.ip);
    }

    socket.onerror = function error(err) {
        socket.log("Error:", err);
        socket.close();
    }

    socket.talk = function talk(data) {
        if (socket.readyState !== socket.OPEN) {
            return;
        }

        let writer = new protocol.Writer(true);
        writer.setUint8(data.type);

        switch (data.type) {
            case 0: // Ping
                writer.setFloat64(data.time);
                break;
        }

        socket.send(writer.build().buffer);
    }

    socket.onmessage = function ({ data }) {
        let reader = new protocol.Reader(new DataView(data), 0, true);
        let type = reader.getUint8();

        switch (type) {
            case 0: // Ping
                socket.talk({
                    type: 0,
                    time: Date.now() - reader.getFloat64()
                });
                break;
        }
    }
});




// GAME
let game = new Game({
    width: 250,
    height: 250
});