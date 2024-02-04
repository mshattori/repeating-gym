document.addEventListener('DOMContentLoaded', () => {
    const stopRecordButton = document.getElementById('stopRecord');
    const playButton = document.getElementById('play');
    const audioPlayer = document.getElementById('audioPlayer');

    let isRecording = false;
    let recordedChunks = [];
    let mediaRecorder;

    const recordVoice = () => {
        if (isRecording) {
            mediaRecorder.stop();
            isRecording = false;
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = (event) => {
                        recordedChunks.push(event.data);
                    };
                    mediaRecorder.onstop = () => {
                        const recordedBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                        audioPlayer.src = URL.createObjectURL(recordedBlob);
                        recordedChunks = [];
                        document.getElementById('status').textContent = 'Recorded';
                    };
                    mediaRecorder.start();
                    isRecording = true;
                });
        }
    };

    stopRecordButton.addEventListener('click', () => {
        if (!isRecording) {
            document.getElementById('status').textContent = 'Recording';
            recordVoice();
        } else {
            mediaRecorder.stop();
        }
    });

    playButton.addEventListener('click', () => {
        document.getElementById('status').textContent = 'Playing';
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    });

    audioPlayer.addEventListener('ended', () => {
        document.getElementById('status').textContent = 'Done';
    });
});
