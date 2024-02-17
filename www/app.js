// Ref.
// - https://developer.mozilla.org/ja/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
// - https://github.com/mdn/dom-examples/tree/main/media/web-dictaphone
let isPlaying = false;
let isRecording = false;
let playlist = [];
let currentTrackIndex = 0;
let audioPlayer = document.getElementById('audioPlayer');
let playButton = document.getElementById('play');
let recordButton = document.getElementById('record');
let backButton = document.getElementById('back');
let nextButton = document.getElementById('next');
let mediaRecorder;
let recordedChunks = [];
let recordedBlob;
let recordedAudio;

document.addEventListener('DOMContentLoaded', () => {
    filename = new URL(document.location).searchParams.get('file');
    document.getElementById('title').textContent = filename.replace(/-/g, ' ').split('.')[0];
    fetch(filename)
        .then(response => response.json())
        .then(data => {
            playlist = data;
            audioPlayer.src = playlist[currentTrackIndex];
            initializeState();
        })
        .catch(error => console.error('Error loading playlist:', error));

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
        });
});

function initializeState() {
    document.getElementById('track').textContent = playlist[currentTrackIndex]
    isPlaying = false;
    isRecording = false;
    audioPlayer.src = '';
    audioPlayer.pause();
    if (playButton.classList.contains('stop')) {
        playButton.classList.remove('stop');
        playButton.classList.add('play');
    }
    playButton.disabled = false;
    if (recordButton.classList.contains('stop')) {
        recordButton.classList.remove('stop');
        recordButton.classList.add('record');
    }
    recordButton.disabled = false;
    if (recordedAudio) {
        recordedAudio.pause();
        recordedAudio.remove();
    }
}

playButton.addEventListener('click', function() {
    this.classList.toggle('play');
    this.classList.toggle('stop');
    if (!isPlaying) {
        isPlaying = true;
        recordButton.disabled = true;
        playAudio();
    } else {
        isPlaying = false;
        recordButton.disabled = false;
        audioPlayer.pause();
    }
});
 
recordButton.addEventListener('click', function() {
    this.classList.toggle('record');
    this.classList.toggle('stop');
    if (!isRecording) {
        isRecording = true;
        playButton.disabled = true;
        recordVoice();
    } else {
        isRecording = false;
        playButton.enabled = true;
        mediaRecorder.stop();
    }
});

backButton.addEventListener('click', function() {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
    }
    initializeState();
    playButton.click();
});

nextButton.addEventListener('click', function() {
    if (currentTrackIndex < playlist.length - 1) {
        currentTrackIndex++;
    }
    initializeState();
    playButton.click();
});

function playAudio() {
    audioPlayer.src = playlist[currentTrackIndex];
    audioPlayer.currentTime = 0;
    audioPlayer.play();
}

audioPlayer.addEventListener('ended', function () {
    console.log('Play audio ended')
    playButton.click();
});

function createRecordedAudio() {
    try {
        // state = STATE.PLAY_RECORD;
        // It's needed to create a new audio element everytime to play the blob in iOS.
        recordedAudio = document.createElement("audio");
        document.getElementsByTagName('body')[0].appendChild(recordedAudio);
        recordedAudio.controls = true;
        recordedAudio.src = URL.createObjectURL(recordedBlob);
        recordedAudio.addEventListener('play', function () {
            console.log('Play recording')
            playButton.disabled = true;
            recordButton.disabled = true;
        });
        recordedAudio.addEventListener('pause', function () {
            console.log('Pause recording')
            playButton.disabled = false;
            recordButton.disabled = false;
        });
        recordedAudio.addEventListener('ended', function () {
            console.log('Play recording ended')
            playButton.disabled = false;
            recordButton.disabled = false;
        });
        recordedAudio.play();
    } catch (e) {
        console.error('Error playing recording:', e.message);
    }
}

function recordVoice() {
    console.log('Start recording')
    if (recordedAudio) {
        recordedAudio.remove();
    }
    mediaRecorder.ondataavailable = (event) => {
        recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        console.log('Stopped recording')
        console.log('MediaRecorder.state', mediaRecorder.state);
        console.log('MediaRecorder.mimeType', mediaRecorder.mimeType);
        recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
        recordedChunks = [];
        createRecordedAudio();
    };
    mediaRecorder.start();
    console.log("Recorder started");
    console.log('MediaRecorder.state', mediaRecorder.state);
}