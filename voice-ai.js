document.addEventListener('DOMContentLoaded', () => {

    /* =========================
       SPEECH RECOGNITION
    ========================= */

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;
    }

    /* =========================
       ELEMENTS
    ========================= */

    const chat = document.getElementById("chat");
    const chatWidget = document.getElementById("chat-widget");
    const btn = document.getElementById("voiceBtn");
    const closeBtn = document.getElementById("close-chat-btn");

    if (!btn || !chat) {
        console.error("Missing required elements");
        return;
    }

    /* =========================
       BUTTON UI
    ========================= */

    btn.innerHTML = `
        <img src="assets/images/grok-video-51f047fb-90ae-435d-94a5-96b3ebbfd7bb-(1).gif"
             style="width:100%;height:100%;object-fit:cover;">
        <span class="btn-text">Talk to me<br>I am DogBot</span>
    `;

    /* =========================
       AUDIO FILES
    ========================= */

    const greetingAudio = new Audio("assets/audio/dog-bot.wav");
    const answerAudio = new Audio("assets/audio/dog-answer.wav");

    greetingAudio.preload = "auto";
    answerAudio.preload = "auto";

    function playAudio(audio, callback) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error(err));
        audio.onended = () => {
            if (callback) callback();
        };
    }

    function stopAudio() {
        greetingAudio.pause();
        greetingAudio.currentTime = 0;
        greetingAudio.onended = null;
        answerAudio.pause();
        answerAudio.currentTime = 0;
        answerAudio.onended = null;
    }

    /* =========================
       STATE
    ========================= */

    let isChatOpen = false;
    let isListening = false;
    let hasGreeted = false;

    /* =========================
       UI HELPERS
    ========================= */

    function addMessage(sender, text) {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chat.appendChild(p);
        chat.scrollTop = chat.scrollHeight;
    }

    function toggleChat(show) {
        isChatOpen = show;
        if (chatWidget) {
            chatWidget.style.display = show ? "flex" : "none";
        }

        const btnText = btn.querySelector('.btn-text');
        if (btnText) {
            btnText.style.opacity = show ? "0" : "";
            btnText.style.visibility = show ? "hidden" : "";
        }

        if (!show) {
            btn.classList.remove("is-listening-active");
        }
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            toggleChat(false);
            if (recognition) recognition.stop();
            isListening = false;
            stopAudio();
        };
    }

    /* =========================
       LISTEN
    ========================= */

    function startListening() {
        if (!recognition) return;

        // Restart recognition if already active to ensure fresh capture
        if (isListening) {
            try { recognition.stop(); } catch (e) { }
        }

        isListening = true;
        btn.classList.add("is-listening-active");

        try {
            recognition.start();
            console.log("DogBot is now listening carefully...");
        } catch (e) {
            console.error("Speech recognition error:", e);
            isListening = false;
            btn.classList.remove("is-listening-active");
        }
    }

    /* =========================
       CLICK FLOW
    ========================= */
    let firstTime = true;
    btn.onclick = () => {
        if (!isChatOpen) {
            toggleChat(true);
        }

        stopAudio();

        if (!hasGreeted) {
            hasGreeted = true;
            if (firstTime) {
                addMessage(
                    "Berry",
                    "Woof, woof! Hello, I’m DogBot, and I'm listening to you very carefully. Please tell me how I can help you today."
                );
                firstTime = false;
            }
            playAudio(greetingAudio, startListening);
        } else {
            // If already greeted, just trigger listening immediately
            startListening();
        }
    };

    /* =========================
       AFTER USER FINISHES SPEAKING
    ========================= */

    if (recognition) {
        recognition.onresult = (event) => {
            isListening = false;
            btn.classList.remove("is-listening-active");

            const userText = event.results[0][0].transcript;
            addMessage("You", userText);

            addMessage(
                "Berry",
                "Thanks for your question! I’m still a little pup 🐾 and can’t answer myself, but you can contact my trainers to get answers to all your questions. Call <br>Voskan at <a href='tel:+18183573797'><strong>818-357-3797</strong></a> or <br>Simon at <a href='tel:+18188028803'><strong>818-802-8803</strong></a>."
            );

            playAudio(answerAudio);
        };

        recognition.onend = () => {
            isListening = false;
            btn.classList.remove("is-listening-active");
        };

        recognition.onerror = (event) => {
            console.error("Recognition Error:", event.error);
            isListening = false;
            btn.classList.remove("is-listening-active");
        };
    }
});