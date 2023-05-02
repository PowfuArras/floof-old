import { port, roomWidth, roomHeight, VIEW_CONSTANT } from "./setup/config.js";
import Map from "./libraries/map.js";
import { Server } from "./net/server.js";
import { Reader, Writer } from "./net/protocol.js";
import { AntHole, Desert, Game, Garden } from "./setup/game.js";
import { ENTITY_TYPES, Ladybug, Player } from "./live/entities.js";
import { WebSocketServer } from "ws";

function shortDate() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

const server = new Server(process.env.PORT ?? port);
const webSocketServer = server.createWebSocketServer(WebSocketServer);
const connections = new Map();
server.publicize("./client");
server.listen(data => console.log(`Server active on port ${data.port} at ${data.time}`));

let socketID = 0;
webSocketServer.on("connection", (socket, request) => {
    socket.log = (...args) => console.log(`[${socket.ip}](${shortDate()})`, ...args);
    socket.ip = request.connection.remoteAddress;
    socket.log("Connection opened");
    if (connections.has(socket.ip)) {
        socket.log("Connection terminated due to already being connected");
        socket.close();
    } else {
        socket.id = socketID++;
        socket.binaryType = "arraybuffer";
        socket.player = undefined;
        socket.onclose = () => {
            socket.log("Connection closed");
            connections.delete(socket.ip);

            if (socket.player) {
                socket.player.destroy();
                socket.player = undefined;
            }
        }
        socket.onerror = error => {
            socket.log(`A nonfatal error has occoured: ${error}`);
            socket.close();
        }

        socket.changeGame = function changeGame(game, loc = game.randomBox(-100, -100, 100, 100)) {
            socket.talk({
                type: 3,
                width: game.width,
                height: game.height,
                mapType: game.mapType
            });

            socket.talk({
                type: 2,
                walls: game.harcodedPaths
            });

            socket.game = game;

            if (socket.player) {
                socket.player.destroy();
            }

            socket.player = new Player(game, socket, loc);
        }

        socket.talk = function talk(data) {
            if (socket.readyState !== socket.OPEN) return;

            const writer = new Writer(true);
            writer.setUint8(data.type);
            switch (data.type) {
                case 0: // Ping
                    writer.setFloat64(data.time);
                    break;
                case 1: // Game Update
                    writer.setUint32(data.playerID);
                    writer.setUint32(data.entities.size);
                    data.entities.forEach(entity => {
                        writer.setUint32(entity.id);
                        writer.setUint8(entity.type);
                        writer.setFloat32(entity.x);
                        writer.setFloat32(entity.y);
                        writer.setFloat32(entity.size);

                        switch (entity.type) {
                            case ENTITY_TYPES.PLAYER:
                                // flags (attack, defense, hit, antenne, poison, etc.)
                                writer.setFloat32(entity.rotation);
                                writer.setUint8(Math.round(entity.health.percent * 255));
                                break;
                            case ENTITY_TYPES.MOB:
                                // index, rotation, flags (hit, etc.)
                                writer.setUint8(entity.index);
                                writer.setFloat32(entity.rotation);
                                writer.setUint8(Math.round(entity.health.percent * 255));
                                writer.setUint8(entity.rarity);
                                break;
                            case ENTITY_TYPES.PETAL:
                                writer.setUint8(entity.index);
                                writer.setUint8(entity.rarity);
                                break;
                            case ENTITY_TYPES.PROJECTILE:
                                // index, rotation, flags (hit, etc.)
                                break;
                            case ENTITY_TYPES.DROP:
                                // index, rotation
                                break;
                            case ENTITY_TYPES.WALL:
                                writer.setFloat32(entity.width);
                                writer.setFloat32(entity.height);
                                break;
                        }
                    });

                    if (data.playerID !== -1) {
                        writer.setFloat32(VIEW_CONSTANT * 2);
                        writer.setUint8(data.player.petalSlots.length);
                        data.player.petalSlots.forEach(slot => {
                            let [alive, ratio] = slot.getPrint();

                            writer.setUint8(slot._index);
                            writer.setUint8(slot.rarity);
                            writer.setUint8(alive);
                            writer.setFloat32(ratio);
                        });
                    }
                    break;
                case 2: // Send harcoded walls
                    writer.setStringUTF8(JSON.stringify(data.walls));
                    break;
                case 3: // Change game
                    writer.setFloat32(data.width);
                    writer.setFloat32(data.height);
                    writer.setUint8(data.mapType);
                    break;
            }

            socket.send(writer.build().buffer);
        }

        socket.onmessage = function ({ data }) {
            const reader = new Reader(new DataView(data), 0, true);
            const type = reader.getUint8();
            switch (type) {
                case 0: // Ping
                    socket.talk({ type: 0, time: Date.now() - reader.getFloat64() });
                    break;
                case 1: // Spawn
                    socket.changeGame(desert);
                    break;
                case 2: // Movement
                    let flags = reader.getUint8();
                    if (socket.player) {
                        const angle = reader.getFloat32();
                        socket.player.attack = flags & 16;
                        socket.player.defend = flags & 32;
                        if (flags & 64) { // Movement is based on angle of mouse
                            const intensity = reader.getFloat32(); // 0 - 1, 0 being no movement, 1 being max movement
                            socket.player.acceleration.x = Math.cos(angle) * intensity;
                            socket.player.acceleration.y = Math.sin(angle) * intensity;
                        } else { // Movement is based on WASD
                            let up = (flags & 1) === 1,
                                down = (flags & 2) === 2,
                                left = (flags & 4) === 4,
                                right = (flags & 8) === 8;

                            let x = right - left,
                                y = down - up;

                            if (x === 0 && y === 0) {
                                socket.player.acceleration.x = 0;
                                socket.player.acceleration.y = 0;
                            } else {
                                let atan = Math.atan2(y, x);
                                socket.player.acceleration.x = Math.cos(atan);
                                socket.player.acceleration.y = Math.sin(atan);
                            }
                        }
                        socket.player.rotation = angle;
                    }
                    break;
                default:
                    socket.log(`Recieved an unknown data type of "${type}"`);
                    socket.close();
            }
        }
    }
});

const game = new Garden({
    width: roomWidth,
    height: roomHeight
});

const antHole = new AntHole({
    width: roomWidth / 2,
    height: roomHeight / 2
});

const desert = new Desert({
    width: roomWidth / 2,
    height: roomHeight / 2
});