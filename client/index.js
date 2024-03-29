let clientId = null;

const ws = await connectToServer();

console.log("test");


async function handleMessage(event) {
    let data = JSON.parse(event.data);
    if (data.type === "connected") {
        clientId = data.clientId;
        console.log("connected to server with id " + clientId);
    }
    if (data.type === "offer") {
        console.log("offer received");
        await rtc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await rtc.createAnswer();
        await rtc.setLocalDescription(answer);
        const outbound = {
            type: "answer",
            answer: rtc.localDescription
        };
        ws.send(JSON.stringify(outbound));
        console.log("answer sent");
    }
    if (data.type === "answer") {
        console.log("answer received");
        await rtc.setRemoteDescription(data.answer);
    }
    if (data.type === "new-ice-candidate") {
        console.log("new ice candidate received");
        await rtc.addIceCandidate(data.candidate);
    }
};

const configuration = {
    'iceServers': [
        {
            'urls': 'stun:stun.l.google.com:19302'
        }
    ]
};

console.log("creating RTCPeerConnection...");

const rtc = new RTCPeerConnection(configuration);

rtc.onicecandidate = (event) => {
    if (event.candidate) {
        console.log("sending ice candidate");
        const outbound = {
            type: "new-ice-candidate",
            candidate: event.candidate
        };
        ws.send(JSON.stringify(outbound));
    }
};

rtc.ontrack = ({streams}) => {
    console.log("track received");
    document.getElementById("audio").srcObject = streams[0];
    document.getElementById("video").srcObject = streams[0];
};

rtc.onconnectionstatechange = (event) => {
    console.log("connection state changed");
    if (rtc.connectionState === "connected") {
        console.log("webrtc connected!!!");
    };
};

rtc.onnegotiationneeded = async () => {
    console.log("negotiation needed");
    await rtc.setLocalDescription(await rtc.createOffer());
    const outbound = {
        type: "offer",
        offer: rtc.localDescription
    };
    ws.send(JSON.stringify(outbound));
};


document.getElementById("call").addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    document.getElementById("video").srcObject = stream[0];
    document.getElementById("audio").srcObject = stream[0];
    for (const track of stream.getTracks()) {
        rtc.addTrack(track, stream);
    }
});


async function connectToServer() {
    const ws = new WebSocket('ws://localhost:7071/ws');
    ws.onopen = (event) => {
        console.log("connected");
        console.log(event);
    };
    ws.onmessage = handleMessage;
    console.log("connecting");
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if(ws.readyState === 1) {
                clearInterval(timer)
                resolve(ws);
            }
        }, 10);
    });
}