const CONFIG = {
    iceServers: [
        {urls: "stun:stun.l.google.com:19302"},
        // {urls: "stun:stun1.l.google.com:19302"},
        // {urls: "stun:stun2.l.google.com:19302"},
        // {urls: "stun:stun3.l.google.com:19302"},
        // {urls: "stun:stun4.l.google.com:19302"},
    ],

}
const socket = io(location.href);

let rtc = {
    connections: {},
}

const RTC_HANDLERS = {
    "icecandidate": function(id, candidate) {
        console.log(candidate);
        socket.emit("rtcCandidate", id, candidate);
    },
    "connectionstatechange": function(id, state) {
        console.log(state);
        if (this.connectionState === "connected") {
            console.log("Now connected to "+id);
        }
    }
}

const IO_HANDLERS = {
    "rtcCreateOffer": async (id, ack) => {
        let connection = new RTCPeerConnection(CONFIG);
        let ofr = await connection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
        });
        await connection.setLocalDescription(ofr);
        rtc.connections[id] = connection;

        for (let handler in RTC_HANDLERS)
            connection.addEventListener(handler, RTC_HANDLERS[handler].bind(connection, id));

        ack(ofr);
    },
    "rtcAccept": async (id, desc, ack) => {
        if (desc.type == "offer") rtc.connections[id] = new RTCPeerConnection(CONFIG);

        console.log("Accept: ", id, desc);
        rtc.connections[id].setRemoteDescription(desc);

        if (desc.type == "offer") {
            let answer = await rtc.connections[id].createAnswer();
            rtc.connections[id].setLocalDescription(answer);
            ack(answer);
        }
    },
    "remoteDisconnect": async id => {
        console.log(`Remote disconnected: ${id}`);
        delete rtc.connections[id];
    }
}

for (evt in IO_HANDLERS) socket.on(evt, IO_HANDLERS[evt]);