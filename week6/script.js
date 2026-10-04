// DOM elements
// using jQuery for the action button
const $btnAction = $("#action-button");
const inputUserName = document.getElementById("user-name");

const newUser = document.getElementById("new-user");
const knownUser = document.getElementById("known-user");
const settingsArea = document.getElementById("settings-area");
const unitSelector = document.getElementById("unit-selector");
const modeSelector = document.getElementById("mode-selector");
const exerciseArea = document.getElementById("exercise-area");
const multipleChoice = document.getElementById("multiple-choice");
const fillBlank = document.getElementById("fill-blank");
const feedbackArea = document.getElementById("feedback-area");

const selUnit = document.getElementById("unit");
const $rbsMode = $('input[name="mode"]');
const instruction = document.getElementById("instruction");
const sourceText = document.getElementById("source-text");
const fbAnswer = document.getElementById("fb-answer");

// webservices

// get a new card
async function getCard(unit) {
    let card = null;
    
    try {
        const response = await fetch(`https://api.wanderco.net/api/card/${unit}`);
        // using the template literals with ``, similar to f strings in Python to make the code better readable
        card = await response.json();
    } catch {
            card = {
            id : 1,
            german : "Gibt es im Klassenzimmer Stühle?",
            turkish : "Sınıfta sandalyeler var mı?",
            turkish_blank :  "Sınıfta {{sandalyeler}} var mı?"
        }
    }

    return card;
}

// get 3 real turkish sentences other than the current card from the same unit
async function getWrongSentences(unit, excludeCardId) {
    let sentences = null;

    try {
        const response = await fetch(`https://api.wanderco.net/api/wrong-sentences/${unit}/${excludeCardId}`);
        sentences = await response.json();
    } catch {
        sentences = [
            "Wrong answer 1",
            "Wrong answer 2",
            "Wrong answer 3"
        ]
    }

    return sentences;
}

// my own tts implementation using Edge TTS
async function getTTS(turkishText) {
    // I'm using a POST request as the text may be long, and then the URL becomes awkward. 
    const response = await fetch(
        "https://api.wanderco.net/api/tts",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: turkishText
            })
        }
    );

    // create a mp3 in the browser memory with the audio
    const audioBlob = await response.blob();
    return audioBlob;
}



// global state
let user = null;
let currentAction = null;
let currentCard = null; 

// user persistance
// save, load & delete user information in the browser's local storage 
function saveUser() {
    localStorage.setItem("user", JSON.stringify(user));
}

function loadUser() {
    user = JSON.parse(localStorage.getItem("user"));
}

// function deleteUser() {
//     localStorage.removeItem("user");
// }

function userExists() {
    return localStorage.getItem("user") !== null;
}


function setGreeting() {
    document.getElementById("msg-returning-user").innerText = "Welcome to the vocabulary trainer, " + user.name + "!";
}

// show Form to add name for new user
function inviteUser() {
    inputUserName.focus();
}

// save a new user and initialise user
function createUser() {
    userName = inputUserName.value.trim();
    user = {
        name: userName,
        unit: 1,
        mode: "multiple-choice"
    };
  
    saveUser();
}

async function displayMultipleChoiceQuestion() {

    multipleChoice.style.display = "";
    fillBlank.style.display = "none";

    instruction.innerText = "Choose the correct translation for the following sentence:";
    sourceText.innerText = currentCard.german;
    let currentWrongAnswers = await getWrongSentences(user.unit, currentCard.id);
    
    answers = [currentCard.turkish];
    // add the loaded answers individually rather than the array as a single value with ...
    answers.push(...currentWrongAnswers);
    
    // shuffel answers:
    // each answer is swapped with a random other answer earlier in the array (or keep position)
    // start from the last array element/answer
    for (let i = answers.length - 1; i > 0; i--) {
        // determine the new position e.g. for position 3 (answer 4)
        // a random number between 0 and 3
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    // handle answer options with jQuery as they are being programmatically added and removed
   
    // first clear old
    $("#mc-answers").empty();

    // programmatically add answer options to the fieldset
    // use the foreach method and the arrow function instead of writing a separate function body
    answers.forEach((answer) => {
        $("#mc-answers").append(`
            <label class="form-check d-flex align-items-center gap-2">
                <input
                    class="form-check-input mt-0"
                    type="radio"
                    name="mc-answer"
                    value="${answer}"
                >
                <span class="form-check-label">${answer}</span>
            </label>
        `);
    });

    $('#mc-answers input[name="mc-answer"]').prop("disabled", false);

    // Add event handlers to the new elements to drive submit button enablement
    $("#mc-answers").on(
        "change",
        'input[name="mc-answer"]',
        updateActionButton
    );

}

function displayFillBlankQuestion() {

    multipleChoice.style.display = "none";
    fillBlank.style.display = "";

    instruction.innerText = "Fill in the missing word:";
    sourceText.innerText = currentCard.german;

    // display turkish sentence
    document.getElementById("fb-before").innerHTML = currentCard.turkish_blank.split("{{")[0];
    document.getElementById("fb-after").innerHTML = currentCard.turkish_blank.split("}}")[1];

    fbAnswer.value = "";
    fbAnswer.disabled = false;
    fbAnswer.focus();

}

// load a new question / card
async function loadQuestion() {
    // hide feedback (blank it, keep space)
    // so buttons stay in same place for better UX
    feedbackArea.style.visibility = "hidden";
  
    currentCard = await getCard(user.unit);
    if (user.mode === "multiple-choice") {
        await displayMultipleChoiceQuestion();
    } else {
        displayFillBlankQuestion();
    }
}


// evaluate the answer
function checkAnswer() {
    feedbackArea.style.visibility = "visible";

    let correctAnswer = null;
    let answer = null;
    if (user.mode === "multiple-choice") {
        $('#mc-answers input[name="mc-answer"]').prop("disabled", true);
        answer = $('input[name="mc-answer"]:checked').val();
        correctAnswer = currentCard.turkish;
    } else {
        fbAnswer.disabled = true;
        answer = fbAnswer.value.trim();
        correctAnswer = currentCard.turkish_blank.split("{{")[1].split("}}")[0];
    }

    const correct = answer === correctAnswer;

    if (correct) {
        $('#feedback-message').html('<i class="bi bi-check-circle text-success me-2"></i>Correct!');
    } else {
        $('#feedback-message').html(`<i class="bi bi-x-circle text-danger me-2"></i>Incorrect. The correct answer is: <br /><span class="fw-semibold learning-content">${correctAnswer}</span>`);
    }
    
}


function updateSectionVisibility() {
    if (currentAction === "createUser") {
        newUser.style.display = "";
        knownUser.style.display = "none";
        settingsArea.style.display = "none";
        exerciseArea.style.display = "none";
        feedbackArea.style.display = "none";
    } else {
        newUser.style.display = "none";
        knownUser.style.display = "";
        settingsArea.style.display = "";
        exerciseArea.style.display = "";
        feedbackArea.style.display = "";
    }
}


// decide whether Action Button is enabled (clickable)
// set approprate button text
function updateActionButton() {

    switch (currentAction) {
        case "createUser":
            $btnAction
                .text("Create User")
                .prop("disabled", inputUserName.value.trim() === "");
            break;

        case "answerQuestion":

            if (user.mode === "multiple-choice") {
                // disable if nothing is selected
                const disabled = $('input[name="mc-answer"]:checked').val() === undefined;
                $btnAction
                    .text("Check Answer")
                    .prop("disabled", disabled);
            } else {
                $btnAction
                    .text("Check Answer")
                    .prop("disabled", $("#fb-answer").val().trim() === '');
            }
            break;

        case "nextQuestion":
            $btnAction.text("Next Question");
            break;
    }

}


// Action button clicked
async function handleAction() {
    // do the appropriate action depending on current state
    switch (currentAction) {
        case "createUser":
            createUser();
            setGreeting();
            initialiseSettings();
            currentAction = "answerQuestion";
            updateSectionVisibility();
            await loadQuestion();
            break;

        case "answerQuestion":
            currentAction = "nextQuestion";
            checkAnswer();
            break;

        case "nextQuestion":
            currentAction = "answerQuestion";
            await loadQuestion();
            break;
    }
    updateActionButton();
}

function monitorUserNameInput() {
    updateActionButton();
}

async function handleSettingsChange(event) {
    if (event.target.name === "mode") {
        user.mode = event.target.value;
    } else { 
        user.unit = event.target.value;
    }

    saveUser();

    // reconcile state by moving to a new question
    currentAction = "nextQuestion";
    await handleAction();

}

function initialiseSettings() {
    selUnit.value = user.unit;
    $rbsMode
        .filter(`[value="${user.mode}"]`)
        .prop("checked", true);

}

async function listenToSentence() {
    try {
        // retrieve the mp3 via web service
        const audioBlob = await getTTS(currentCard.turkish);
        // get the (temporary) URL to that audio
        const audioUrl = URL.createObjectURL(audioBlob);

        // create the "player"
        const audio = new Audio(audioUrl);
        await audio.play();

        // delete the temporary URL when playback has finished to release the browser memory
        audio.addEventListener("ended", () => {
            URL.revokeObjectURL(audioUrl);
        });
    } catch {
        alert("Reader not available.");
    }
} 

function setupEventListeners() {
    $btnAction.on("click", handleAction);
    inputUserName.addEventListener("input", monitorUserNameInput);
    selUnit.addEventListener("change", handleSettingsChange)
    $rbsMode.on("change", handleSettingsChange);
    fbAnswer.addEventListener("input", updateActionButton);
    document.getElementById("fb-listen").addEventListener("click", listenToSentence);
    
}


async function startApp() {
    if (userExists()) {
        loadUser();
        setGreeting();
        initialiseSettings();
        await loadQuestion();
        currentAction = "answerQuestion";
        
    } else {
        inviteUser();
        currentAction = "createUser";
    }

    updateSectionVisibility();
    updateActionButton();
    setupEventListeners();
}


// Start the application
startApp();