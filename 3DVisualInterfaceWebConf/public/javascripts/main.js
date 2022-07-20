// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
    video: true,
    audio: false,
};

const config = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};

function showEmotion(emotionJSON) {
    emotion = JSON.parse(emotionJSON);

    var neutral = document.getElementById('neutral');
    neutral.innerHTML = "neutral:&#009;" + emotion.neutral;

    var happy = document.getElementById('happy');
    happy.innerHTML = "happy:\t" + emotion.happy;

    var sad = document.getElementById('sad');
    sad.innerHTML = "sad:\t" + emotion.sad;

    var angry = document.getElementById('angry');
    angry.innerHTML = "angry:\t" + emotion.angry;

    var fearful = document.getElementById('fearful');
    fearful.innerHTML = "fearful:\t" + emotion.fearful;

    var disgusted = document.getElementById('disgusted');
    disgusted.innerHTML = "disgusted:\t" + emotion.disgusted;

    var surprised = document.getElementById('surprised');
    surprised.innerHTML = "surprised:\t" + emotion.surprised;
}

async function detectEmotion() {
    console.log("detect emotion");
    let localVideo = await document.getElementById('localVideo');
    let detectedEmotion = await faceapi.detectSingleFace(localVideo,
        new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()

    if (detectedEmotion) {
        sendEmotion(detectedEmotion.expressions);
    }
}

// Video element where stream will be placed
let localStream;

// Handles success by adding the MediaStream to the video element.
async function gotLocalMediaStream(mediaStream) {
    let localVideo = await document.getElementById('localVideo');
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

function addEmotionList() {
    var ul = document.getElementById('emotion_list');

    var neutral = document.createElement('li');
    neutral.id = 'neutral';
    ul.appendChild(neutral);

    var happy = document.createElement('li');
    happy.id = 'happy';
    ul.appendChild(happy);

    var sad = document.createElement('li');
    sad.id = 'sad';
    ul.appendChild(sad);

    var angry = document.createElement('li');
    angry.id = 'angry';
    ul.appendChild(angry);

    var fearful = document.createElement('li');
    fearful.id = 'fearful';
    ul.appendChild(fearful);

    var disgusted = document.createElement('li');
    disgusted.id = 'disgusted';
    ul.appendChild(disgusted);

    var surprised = document.createElement('li');
    surprised.id = 'surprised';
    ul.appendChild(surprised);
}

window.onload = function start() {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/weights"),
        faceapi.nets.faceExpressionNet.loadFromUri("/weights"),
    ]).then(navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream)).catch(handleLocalMediaStreamError);

}

function joinWebConf() {

    addEmotionList();

    socket.emit('create or join', room);
    
    setInterval(detectEmotion, 1000);

}


function onVideo() {
    //var element = document.getElementById('localVideo');
    //if (element.srcObject != NULL) {

    //} else {
    //    element.srcObject = NULL;
    //}
}

/****************************************************************************
* Signaling server
****************************************************************************/

window.room = prompt("Enter room name:");
let isGuest;

// Connect to the signaling server
var socket = io();

socket.on('ipaddr', function (ipaddr) {
    console.log('Server IP address is: ' + ipaddr);
    // updateRoomURL(ipaddr);
});

socket.on('created', function (room, clientId) {
    console.log('Created room', room, '- my client ID is', clientId);
    isGuest = false;
});

socket.on('joined', function (room, clientId, num) {
    console.log('This peer has joined room', room,'with client ID', clientId, 'and', num, 'people');
    isGuest = true;
    for (let i = 0; i < num - 1; i++) {
        createPeerConnection(isGuest);
    }
});

socket.on('full', function (room) {
    alert('Room ' + room + ' is full. We will create a new room for you.');
    window.location.hash = '';
    window.location.reload();
});

socket.on('ready', function () {
    console.log('Socket is ready');
    createPeerConnection(isGuest);
});

socket.on('log', function (array) {
    console.log.apply(console, array);
});

socket.on('message', function (message) {
    console.log('Client received message:', message);
    signalingMessageCallback(message);
});

if (location.hostname.match(/localhost|127\.0\.0/)) {
    socket.emit('ipaddr');
}

// Leaving rooms and disconnecting from peers.
socket.on('disconnect', function (reason) {
    console.log(`Disconnected: ${reason}.`);
});

socket.on('bye', function (room) {
    console.log(`Peer leaving room ${room}.`);
    // If peer did not create the room, re-enter to be creator.
    if (!isGuest) {
        window.location.reload();
    }
});

window.addEventListener('unload', function () {
    console.log(`Unloading window. Notifying peers in ${room}.`);
    socket.emit('bye', room);
});

/**
* Send message to signaling server
*/
function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', room, message);
}

/****************************************************************************
* WebRTC peer connection and data channel
****************************************************************************/

var peerConns = new Array();
var peerConnIdx = -1;
var dataChannel

function signalingMessageCallback(message) {
    if (message.type === 'offer') {
        console.log('Got offer. Sending answer to peer.');
        peerConns[peerConnIdx].setRemoteDescription(new RTCSessionDescription(message), function () { },
            logError);
        peerConns[peerConnIdx].createAnswer(onLocalSessionCreated, logError);

    } else if (message.type === 'answer') {
        console.log('Got answer.');
        peerConns[peerConnIdx].setRemoteDescription(new RTCSessionDescription(message), function () { },
            logError);

    } else if (message.type === 'candidate') {
        peerConns[peerConnIdx].addIceCandidate(new RTCIceCandidate({
            candidate: message.candidate,
            sdpMLineIndex: message.label,
            sdpMid: message.id
        }));

    }
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event) {
    let remoteVideo;
    let video_id;
    for (let i = 0; i <= peerConnIdx; i++) {
        video_id = 'remote' + String(i);
        remoteVideo = document.getElementById(video_id);
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.stream;
        }
    }
}

function createPeerConnection(isGuest) {
    console.log('Creating Peer connection as initiator?', isGuest, 'config:',
        config);

    let peerConn = new RTCPeerConnection(config);
    peerConns.push(peerConn);
    peerConnIdx++;

    let video_container = document.getElementById('video_container');
    let video_elm = document.createElement('video');
    let video_id = 'remote' + String(peerConnIdx);
    video_elm.setAttribute('id', video_id);
    video_elm.autoplay = true;
    video_elm.playsInline = true;
    video_container.appendChild(video_elm);

    
    // send any ice candidates to the other peer
    peerConn.onicecandidate = function (event) {
        console.log('icecandidate event:', event);
        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    };

    peerConn.addStream(localStream);
    peerConn.addEventListener('addstream', gotRemoteMediaStream);

    if (isGuest) {
        console.log('Creating Data Channel');
        dataChannel = peerConn.createDataChannel('emotion');
        onDataChannelCreated(dataChannel);

        console.log('Creating an offer');
        peerConn.createOffer().then(function (offer) {
            return peerConn.setLocalDescription(offer);
        })
            .then(() => {
                console.log('sending local desc:', peerConn.localDescription);
                sendMessage(peerConn.localDescription);
            })
            .catch(logError);

    } else {
        peerConn.ondatachannel = function (event) {
            console.log('ondatachannel:', event.channel);
            dataChannel = event.channel;
            onDataChannelCreated(dataChannel);
        };
    }
}

function onLocalSessionCreated(desc) {
    console.log('local session created:', desc);
    peerConns[peerConnIdx].setLocalDescription(desc).then(function () {
        console.log('sending local desc:', peerConns[peerConnIdx].localDescription);
        sendMessage(peerConns[peerConnIdx].localDescription);
    }).catch(logError);
}

function onDataChannelCreated(channel) {
    console.log('onDataChannelCreated:', channel);

    channel.onopen = function () {
        console.log('CHANNEL opened!!!');
    };

    channel.onclose = function () {
        console.log('Channel closed.');
    }

    channel.onmessage = (adapter.browserDetails.browser === 'firefox') ?
        receiveDataFirefoxFactory() : receiveDataChromeFactory();
}

function receiveDataChromeFactory() {
    
    return function onmessage(event) {
        //console.log(event.data);
        showEmotion(event.data);
    };
}

function receiveDataFirefoxFactory() {
    
    return function onmessage(event) {
        //console.log(event.data);
        showEmotion(event.data);
    }
}


/****************************************************************************
* Aux functions, mostly UI-related
****************************************************************************/

function sendEmotion(emotion) {
    
    if (!dataChannel) {
        logError('Connection has not been initiated. ' +
            'Get two peers in the same room first');
        return;
    } else if (dataChannel.readyState === 'closed') {
        logError('Connection was lost. Peer closed the connection.');
        return;
    }

    dataChannel.send(JSON.stringify(emotion));

}

function randomToken() {
    return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function logError(err) {
    if (!err) return;
    if (typeof err === 'string') {
        console.warn(err);
    } else {
        console.warn(err.toString(), err);
    }
}