const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7071 });

const clients = new Map();

wss.on('connection', (ws) => {
    const id = uuidv4();
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    const metadata = { id, color };

    clients.set(ws, metadata);
    console.log("connected: " + id);

    const message = {
        type: "connected",
        clientId: id,
        sender: id,
        text: "Welcome to the chat!",
        color: color,
    };
    const outbound = JSON.stringify(message);
    ws.send(outbound);

    ws.on('message', (messageAsString) => {
        console.log("message received: " + messageAsString);
        const message = JSON.parse(messageAsString);
        const metadata = clients.get(ws);

        message.sender = metadata.id;
        message.color = metadata.color;
        const outbound = JSON.stringify(message);

        [...clients.keys()].forEach((client) => {
            client.send(outbound);
        });
    });

    ws.on("close", () => {
        clients.delete(ws);
    });

});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
console.log("wss up");
