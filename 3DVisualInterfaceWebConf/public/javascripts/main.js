// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
    video: true,
    audio: true,
};

// Video element where stream will be placed.

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
    let localVideo = document.getElementById('localVideo');
    localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

function getLocalMedia() {
    // Initializes media stream.
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
}
