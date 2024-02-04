// Ref.
// - https://developer.mozilla.org/ja/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
// - https://github.com/mdn/dom-examples/tree/main/media/web-dictaphone
const STATE = {
    BEFORE_PLAY_AUDIO: 0,
    PLAY_AUDIO:        1,
    BEFORE_RECORD:     2,
    RECORD:            3,
    AFTER_RECORD:      4,
    PLAY_RECORD:       5,
}
let state = STATE.BEFORE_PLAY_AUDIO;
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
    state = STATE.BEFORE_PLAY_AUDIO;
    audioPlayer.src = '';
    audioPlayer.pause();
    if (playButton.classList.contains('stop')) {
        playButton.classList.remove('stop');
        playButton.classList.add('play');
    }
    if (recordButton.classList.contains('stop')) {
        recordButton.classList.remove('stop');
        recordButton.classList.add('play');
    }
    recordButton.disabled = true; // disable record button at first
}

playButton.addEventListener('click', function() {
    this.classList.toggle('play');
    this.classList.toggle('stop');
    // this.style.backgroundImage = this.classList.contains('stop') ? "url('icons/icon-stop.png')" : "url('icons/icon-play.png')";
    if (state === STATE.BEFORE_PLAY_AUDIO || state === STATE.BEFORE_RECORD) {
        recordButton.disabled = true;
        playAudio();
    } else if (state === STATE.PLAY_AUDIO) {
        audioPlayer.pause();
        state = STATE.BEFORE_RECORD;
        recordButton.disabled = false; // enable record button after playing
    } else if (state === STATE.AFTER_RECORD) {
        recordButton.disabled = true;
        playRecord();
    } else if (state === STATE.PLAY_RECORD) {
        state = STATE.AFTER_RECORD;
        recordButton.disabled = false;
    }
});
 
recordButton.addEventListener('click', function() {
    this.classList.toggle('record');
    this.classList.toggle('stop');
    // this.style.backgroundImage = this.classList.contains('stop') ? "url('icons/icon-stop.png')" : "url('icons/icon-record.png')";
    if (state === STATE.BEFORE_RECORD || state === STATE.AFTER_RECORD) {
        playButton.disabled = true;
        recordVoice();
    } else if (state === STATE.RECORD) {
        playButton.disabled = false;
        mediaRecorder.stop();
    }
});

backButton.addEventListener('click', function() {
    // Go back to the previous audio if it's before recording.
    // If it's after recording, just repeat the current audio.
    if (state < STATE.RECORD) {
        if (currentTrackIndex > 0) {
            currentTrackIndex--;
        }
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
    state = STATE.PLAY_AUDIO;
    audioPlayer.src = playlist[currentTrackIndex];
    audioPlayer.currentTime = 0;
    audioPlayer.play();
}

audioPlayer.addEventListener('ended', function () {
    console.log('Play audio ended')
    playButton.click();
});

function playRecord() {
    console.log('Play recording')
    try {
        state = STATE.PLAY_RECORD;
        // It's needed to create a new audio element everytime to play the blob in iOS.
        audio = document.createElement("audio");
        audio.src = URL.createObjectURL(recordedBlob);
        audio.addEventListener('ended', function () {
            console.log('Play record ended')
            audio.remove(); // remove the audio element
            playButton.click(); // update the state and the button
        });
        audio.play();
    } catch (e) {
        console.error('Error playing recording:', e.message);
    }
}

function recordVoice() {
    console.log('Start recording')
    state = STATE.RECORD;
    mediaRecorder.ondataavailable = (event) => {
        recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        console.log('Stopped recording')
        console.log('MediaRecorder.state', mediaRecorder.state);
        console.log('MediaRecorder.mimeType', mediaRecorder.mimeType);
        recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
        recordedChunks = [];
        state = STATE.AFTER_RECORD;
        playButton.click();
    };
    mediaRecorder.start();
    console.log("Recorder started");
    console.log('MediaRecorder.state', mediaRecorder.state);
}