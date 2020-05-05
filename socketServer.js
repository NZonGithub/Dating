const HANDLERS = [
    function disconnect(reason) {
        delete this.server.pool[this.id];
        if (this.server.waiting == this) {
            this.server.waiting = undefined;
        }

        for (let connection of Object.values(this.rtc.connections)) {
            // let index = connection.rtc.connections.indexOf(this);
            connection.emit("remoteDisconnect", this.id);
            this.server.rtcTryConnect(connection);
            delete connection.rtc.connections[this.id];
            console.log(`Connection disbanded between ${this.id} and ${connection.id}`);
        }
    },
];

class SocketServer {
    constructor(httpServer) {
        this.io = require("socket.io")(httpServer);
        this.pool = {};
    
        this.io.on("connection", socket => {
            for (let fn of HANDLERS)
                socket.on(fn.name, fn.bind(socket));
            
            this.connection(socket);
        });
    }

    connection(socket) {
        console.log(this);
        this.pool[socket.id] = socket;
    
        socket.server = this;
        socket.rtc = {connections:{}};
        socket.profile = {};
    
        this.rtcTryConnect(socket);
    }

    rtcTryConnect(socket) {
        if (this.waiting == undefined) {
            this.waiting = socket;
        } else {
            this.rtcConnect(socket, this.waiting);
            this.waiting = undefined;
        }
    }

    rtcConnect(c1, c2) {
        this.waiting = undefined;
        c1.rtc.connections[c2.id] = c2;
        c2.rtc.connections[c1.id] = c1;
        
        c1.emit("rtcCreateOffer", c2.id, offer => {
            c2.emit("rtcAccept", c1.id, offer, answer => {
                c1.emit("rtcAccept", c2.id, answer);
                console.log(`Connection established between ${c1.id} and ${c2.id}`);
            });
        });
    }
}

module.exports = httpServer =>(new SocketServer(httpServer));