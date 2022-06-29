// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
    video: true,
    audio: true,
};


function showEmotion(emotion) {
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
    let localVideo = await document.getElementById('localVideo');
    let detectedEmotion = await faceapi.detectSingleFace(localVideo,
        new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()

    if (detectedEmotion)
        showEmotion(detectedEmotion.expressions);
}

// Video element where stream will be placed.

// Handles success by adding the MediaStream to the video element.
async function gotLocalMediaStream(mediaStream) {
    let localVideo = await document.getElementById('localVideo');
    localVideo.srcObject = mediaStream;
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

function getLocalMedia() {

    Promise.all([
        faceapi.nets.tinyFaceDetector.load("/weights"),
        faceapi.nets.faceExpressionNet.load("/weights"),
    ]).then(navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream)).catch(handleLocalMediaStreamError);

    addEmotionList();


    setInterval(detectEmotion, 1000);
    //detectEmotion();

}
