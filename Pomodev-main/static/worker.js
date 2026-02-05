// worker.js
// Timer logic running in a background thread

let timerInterval = null;
let isRunning = false;

self.onmessage = function (e) {
    const { action } = e.data;

    if (action === 'START') {
        if (!isRunning) {
            isRunning = true;
            // Clear any existing interval just in case
            if (timerInterval) clearInterval(timerInterval);

            // Run timer every 250ms like in the main script
            timerInterval = setInterval(() => {
                self.postMessage({ action: 'TICK' });
            }, 250);
        }
    } else if (action === 'PAUSE') {
        isRunning = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else if (action === 'STOP') {
        isRunning = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
};
