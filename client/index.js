
let socket = new WebSocket("ws://localhost:8000/ws/1");

socket.onopen = function(e) {
    console.log("[open] Connection established");
};

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        console.log('[close] Connection died');
    }
};

socket.onerror = function(error) {
    console.log(`[error] ${error.message}`);
};

socket.onmessage = function(event) {
    let response = event.data;
    if (response == "type:audio") {
        // Wait for the next message to receive the binary audio data
        // socket.onmessage = function(event) {
        //     let audioData = event.data;
        //     let blob = new Blob([audioData], {type: 'audio/mp3'});
        //     let url = URL.createObjectURL(blob);
        //     document.getElementById('player').src = url;
        //     document.getElementById('player').play();
        // }
        console.log("audio received")
    } else { // Assume the message is text
        if (response == "\n") {
            document.getElementById('inputMessage').value == ""
        } else {
            document.getElementById('responseText').textContent += response;
        }
    }
};

function sendMessage() {
    let message = document.getElementById('inputMessage').value;
    socket.send(message);
}
