// DOM elements
// using jQuery, so I can use chaining later
const $btnAction = $("#action-button");

// global state
let user = null;
let currentActionState = null;




function createUser() {

}

function checkAnswer() {

}

function loadNextQuestion() {

}

function updateActionButton() {
    
}


// Action button clicked
function handleAction() {
    // do the appropriate action depending on current state
    switch (currentActionState) {
        case "newUser":
            createUser();
            loadNextQuestion();
            currentActionState = "answerQuestion";
            $btnAction.text("Check Answer");
            break;

        case "answerQuestion":
            checkAnswer();
            currentActionState = "nextQuestion";
            $btnAction.text("Next Question");
            break;

        case "nextQuestion":
            loadNextQuestion();
            currentActionState = "answerQuestion";
            $btnAction.text("Check Answer");
            break;
    }
    updateActionButton();
}


function setupEventListeners() {
    $btnAction.on("click", handleAction);
    
}


function startApp() {
    // read user information 
    // set initial action state
    currentActionState = "newUser";
    setupEventListeners();
}


// Start the application
startApp();