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

// webservices

// get a new card
async function getCard(unit) {
    // using the $() notation with ``, similar to f strings in Python to make the code better readable
    const response = await fetch(`https://api.wanderco.net/api/card/${unit}`);
    const card = await response.json();

    return card;
}

// get 3 real turkish sentences other than the current card from the same unit
async function getWrongSentences(unit, excludeCardId) {
    const response = await fetch(`https://api.wanderco.net/api/wrong-sentences/${unit}/${excludeCardId}`);
    const sentences = await response.json();

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
let currentActionState = null;
let currentCard = null; 

// user persistance
// save, load & delete user information in the browser's local storage 
function saveUser() {
    localStorage.setItem("user", JSON.stringify(user));
}

function loadUser() {
    user = JSON.parse(localStorage.getItem("user"));
}

function deleteUser() {
    localStorage.removeItem("user");
}

function userExists() {
    return localStorage.getItem("user") !== null;
}


function setGreeting() {
    document.getElementById("msg-returning-user").innerText = "Welcome to the vocabulary trainer, " + user.name + "!";
}

// show Form to add name
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

function displayMultipleChoiceQuestion() {
    


}

function displayFillBlankQuestion() {

}

// load a new question / card
function loadQuestion() {
    // hide feedback (blank it, keep space)
    // ###
    //currentCard = getCard(user.unit);
    if (user.mode === "multiple-choice") {
        displayMultipleChoiceQuestion();
    } else {
        displayFillBlankQuestion();
    }
}


// evaluate the answer
function checkAnswer() {

}


function updateSectionVisibility() {
    if (currentActionState === "createUser") {
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

    switch (currentActionState) {
        case "createUser":
            $btnAction
                .text("Create User")
                .prop("disabled", inputUserName.value.trim() === "");
            break;

        case "answerQuestion":
            $btnAction.text("Check Answer");
            break;

        case "nextQuestion":
            $btnAction.text("Next Question");
            break;
    }

   
}


//Event Listeners


// Action button clicked
function handleAction() {
    // do the appropriate action depending on current state
    switch (currentActionState) {
        case "createUser":
            createUser();
            setGreeting();
            initialiseSettings();
            currentActionState = "answerQuestion";
            updateSectionVisibility();
            loadQuestion();
            break;

        case "answerQuestion":
            currentActionState = "nextQuestion";
            checkAnswer();
            break;

        case "nextQuestion":
            currentActionState = "answerQuestion";
            loadQuestion();
            break;
    }
    updateActionButton();
}

function validateName() {
    if (inputUserName.value.trim() === "") {
        inputUserName.setCustomValidity("Please fill in this field.");
    } else {
        inputUserName.setCustomValidity("");
    }
    updateActionButton();
}

function handleSettingsChange(event) {
    
    if (event.target.name === "mode")
    {
        user.mode = event.target.value;
        if (event.target.value === "multiple-choice") {
            multipleChoice.style.display = "";
            fillBlank.style.display = "none";
            displayMultipleChoiceQuestion();

        } else {
            multipleChoice.style.display = "none";
            fillBlank.style.display = "";
            displayFillBlankQuestion();
        }
    } else { // unit
        user.unit = event.target.value;
        loadQuestion();
    }

    saveUser();

}

function initialiseSettings() {
    selUnit.value = user.unit;
    $rbsMode
        .filter(`[value="${user.mode}"]`)
        .prop("checked", true);
}


function setupEventListeners() {
    $btnAction.on("click", handleAction);
    inputUserName.addEventListener("input", validateName);
    selUnit.addEventListener("change", handleSettingsChange)
    $rbsMode.on("change", handleSettingsChange);
    
}


function startApp() {
    if (userExists()) {
        loadUser();
        setGreeting();
        initialiseSettings();
        loadQuestion();
        currentActionState = "answerQuestion";
        
    } else {
        inviteUser();
        currentActionState = "createUser";
    }

    updateSectionVisibility();
    updateActionButton();
    setupEventListeners();
}


// Start the application
startApp();