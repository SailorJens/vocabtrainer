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

// check screen width (media)
// (using 992px as it matches the bootstrap lg breakpoint)
const desktopMediaQuery = window.matchMedia("(min-width: 992px)");

// webservices

// get a new card
async function getCard(unit) {
    let card = null;
    
    try {
        const response = await fetch(`https://api.wanderco.net/api/card/${unit}`);
        // using the template literals with ``, similar to f strings in Python to make the code better readable
        card = await response.json();
    } catch {
            // when API not available, return a mock card
            card = {
            id : 1,
            german : "Gibt es im Klassenzimmer Stühle?",
            turkish : "Sınıfta sandalyeler var mı?",
            turkish_blank :  "Sınıfta {{sandalyeler}} var mı?",
                image_keywords : "Turkey cheese"
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
        // when API not available, return mock answers
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

    if (!response.ok) {
        throw new Error(`TTS request failed: HTTP ${response.status}`);
    }

    // create a mp3 in the browser memory with the audio
    const audioBlob = await response.blob();
    return audioBlob;
}

// get a background image for large screens
// using the wikiMedia API
// cf. https://www.mediawiki.org/wiki/API%3ATutorial/en
async function getBackgroundImage(imageKeywords) {
    const params = new URLSearchParams({
        action: "query", // this is a query request (not updating etc.)
        generator: "search", // this is a search query
        gsrsearch: imageKeywords, // this is a search query with these keywords
        gsrnamespace: "6",  // I'm searching on media files (file pages) (need to prefix with g because it is a generator, 
                            // i.e. the results get enriched with more information (imageinfo))
        gsrlimit: "10", // give me the 10 highest ranked ones
        prop: "imageinfo", // include image informaton data
                           // https://www.mediawiki.org/wiki/API%3AImageinfo/en 
        iiprop: "url|mime",  // include urls from the imageinfo
        iiurlwidth: "1600",  // include image width from the imaginfo
        format: "json",  // return answer in json
        origin: "*" // allows browser CORS request
    });

    const url =
        `https://commons.wikimedia.org/w/api.php?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
        // don't bother with throwing an error as we will simply not display a backgroundif it fails. 
        return null;
    }

    const data = await response.json();

    // create an array of pages with their values as dictionaries
    // data.query.pages is possible as that's the JSON/object that comes back from wikimedia 
    const pages = Object.values(data.query.pages);

    // as there could technically be other media, I filter out the non-image ones
    const imagePages = pages.filter(page =>
        page.imageinfo?.[0]?.mime?.startsWith("image/")
    );

    // in case ther aren't any images
    if (imagePages.length === 0) {
        return null;
    }

    // randomly select a page (= an image)
    const randomPage = imagePages[
        Math.floor(Math.random() * imagePages.length)
    ];

    // return the thumbnail URL to avoid huge files
    return randomPage.imageinfo[0].thumburl;
    

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

    // ensure the multiple choice area is visible, and fill in the blank is not
    multipleChoice.style.display = "";
    fillBlank.style.display = "none";

    instruction.innerText = "Choose the correct translation for the following sentence:";
    sourceText.innerText = currentCard.german;

    // pull three genuine Turkish sentences which do not belong to the current card as wrong answers 
    let currentWrongAnswers = await getWrongSentences(user.unit, currentCard.id);
    
    // add the correct answer to the array of answers
    answers = [currentCard.turkish];
    // add the loaded wrong answers individually rather than the array as a single value with "..."
    answers.push(...currentWrongAnswers);
    
    // shuffel answers:
    // each answer is swapped with a random other answer earlier in the array (or keep position)
    // start from the last array element/answer
    // the last answer has nothing to swap with, hence i > 0, not i >= 0)
    for (let i = 3; i > 0; i--) {
        // get a random decimal number between 0 <= x < (!) i+1
        // then get the floor as integer, so 0 <= j <= (!) i
        // so the answer can stay where it is, or swap with a lower index answer
        const j = Math.floor(Math.random() * (i + 1));
        // contrary to Python, for swapping in JS I need to use arrays []:
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    // handle answer options with jQuery as they are being programmatically added and removed
   
    // first clear old
    $("#mc-answers").empty();

    // programmatically add answer options to the fieldset
    // use the foreach method and the arrow function instead of writing a separate function body
    // I put the answer directly into the value also, so it's later easier to retrieve the selected one.
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

    // enable the control, as it is deisabled after submitting an answer
    $('#mc-answers input[name="mc-answer"]').prop("disabled", false);

    // Add event handlers to the new elements to drive submit button enablement
    // i.e. the button is only enabled when something is selected (some form of validation)
    $("#mc-answers").on(
        "change",
        'input[name="mc-answer"]',
        updateActionButton
    );

}

function displayFillBlankQuestion() {

    // show fill in the blank, hide multiple choice
    multipleChoice.style.display = "none";
    fillBlank.style.display = "";

    instruction.innerText = "Fill in the missing word:";
    sourceText.innerText = currentCard.german;

    // display turkish sentence, but only the parts left and right of the {{answer}} which is in double curly brackets
    // e.g. "Sınıfta {{sandalyeler}} var mı?"
    document.getElementById("fb-before").innerHTML = currentCard.turkish_blank.split("{{")[0];
    document.getElementById("fb-after").innerHTML = currentCard.turkish_blank.split("}}")[1];

    // empty the input field
    fbAnswer.value = "";
    // enable the input field (it is disabled when submitting)
    fbAnswer.disabled = false;
    // set the cursor in the input field for better UX
    fbAnswer.focus();

}

async function updateBackgroundImage() {
    try {
        // get an image url based on the card's keywords
        url = await getBackgroundImage(currentCard.image_keywords);
        // if there are no results, simply don't display anything
        if (url === null) {
            return;
        }
    } catch {
        // any issues, simply ignore and don't load a background
        return;
    }
     
    // set the url as body background image, and add the used keywords to the legend, then display credits
    document.body.style.backgroundImage = `url("${url}")`;
    document.getElementById("image-search-term").textContent =  `Search: "${currentCard.image_keywords}"`;
    document.getElementById("image-info").classList.add("visible");
    
}


// load a new question / card
async function loadQuestion() {
    // hide feedback (blank it, keep space)
    // so buttons stay in same place for better UX
    feedbackArea.style.visibility = "hidden";
  
    currentCard = await getCard(user.unit);

    // on a big screen, display a background image
    if (desktopMediaQuery.matches) {
        // I am not using await here so that the question display isn't held up
        // the loading can happen in the background as it is not vital for the functionality of the app.
        updateBackgroundImage();
    }

    if (user.mode === "multiple-choice") {
        // I do need await here because another web request is sent in multiple choice. 
        await displayMultipleChoiceQuestion();
    } else {
        displayFillBlankQuestion();
    }
}


// evaluate the answer
function checkAnswer() {
    // show the feedback area, that is otherwise hidden.
    feedbackArea.style.visibility = "visible";

    let correctAnswer = null;
    let answer = null;

    if (user.mode === "multiple-choice") {
        //lock the answer, i.e. disable the control
        $('#mc-answers input[name="mc-answer"]').prop("disabled", true);
        // retrieve the selected answer
        answer = $('input[name="mc-answer"]:checked').val();
        // retrieve the correct answer from the card
        correctAnswer = currentCard.turkish;
    } else {
        //lock the answer, i.e. disable the control
        fbAnswer.disabled = true;
        // retrieve the typed answer 
        answer = fbAnswer.value.trim();
        // retrieve the correct answer from the card by extracting the part in {{answer}}
        correctAnswer = currentCard.turkish_blank.split("{{")[1].split("}}")[0];
    }

    const correct = answer === correctAnswer;

    // use both colour and shape to indicate correct or incorrect for better accessibility 
    if (correct) {
        $('#feedback-message').html('<i class="bi bi-check-circle text-success me-2"></i>Correct!');
    } else {
        $('#feedback-message').html(`<i class="bi bi-x-circle text-danger me-2"></i>Incorrect. The correct answer is: <br /><span class="fw-semibold learning-content">${correctAnswer}</span>`);
    }

    // keyboard testing showed that focus needed to move to the action button after feedback,
    // allowing users to continue with Enter without navigating through the controls again
    $btnAction.focus();
    
}

// based on "currentAction" state, display the correct sections
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
// state driven approach 
// depending on the "currentAction" and other settings of the app, the button changes appearance.
// the goal is to make it very transparent under which conditions the button has which appearance
// it also separates button UI logic from business logic
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
// state driven approach
// depending on what the "currentAction" is, different things happen when the actio nbutton is clicked. 
async function handleAction(event) {

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

// use the same function to handle both settings changes
// using the event.target to decide what control was changed
// this helps consolidate the code 
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
    const listenButton = document.getElementById("fb-listen");
    listenButton.disabled = true;
    listenButton.innerHTML = '<i class="bi bi-hourglass-split fs-5"></i> Loading ...';
    try {
        // retrieve the mp3 via web service
        const audioBlob = await getTTS(currentCard.turkish);
        // get the (temporary) URL to that audio
        // cf. https://medium.com/@bryanjenningz/how-to-record-and-play-audio-in-javascript-faa1b2b3e49b
        const audioUrl = URL.createObjectURL(audioBlob);

        // create the "player"
        const audio = new Audio(audioUrl);
        await audio.play();

        // delete the temporary URL when playback has finished to release the browser memory
        audio.addEventListener("ended", () => {
            URL.revokeObjectURL(audioUrl);
        });
        listenButton.disabled = false;
        listenButton.innerHTML = '<i class="bi bi-volume-up fs-5"></i> Listen';

    } catch (error) {
        console.error("Audio playback failed:", error);
        listenButton.innerHTML = '<i class="bi bi-volume-mute fs-5"></i> Audio not available.';
        // show error for 2 second, then back to normal so user can try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        listenButton.innerHTML = '<i class="bi bi-volume-up fs-5"></i> Listen';
        listenButton.disabled = false;
    }

} 

function addClickEventOnEnterKeyPressed(event) {
    // when Return is pressed (actually, "down")
    if (event.key === 'Enter') {
        event.preventDefault();
        // emit a click event on the button
        $btnAction.click();
    }
}

function setupEventListeners() {
    // Keyboard testing revealed that Enter triggered native form submission and reloaded the page. 
    // Prevent this so Enter can be handled by the application's own keyboard handler
    $("#fill-blank form").on("submit", function(event) {
        event.preventDefault();
    });
    // set the radio button in multiple choice in focus when changed, so we can hook up the Enter key
    $(document).on('change', 'input[name="mc-answer"]', function(event) {
        event.target.focus();
    });
    // Ensure the action button works with Enter/Return for better UX and accessibility
    // as keyobard testing revealed that it didn't work automatically. 
    $(document).on(
        'keydown', 
        'input[name="mc-answer"], #fb-answer',
        addClickEventOnEnterKeyPressed);
    // link the button click event to the handler
    $btnAction.on("click", handleAction);
    // when the user name field is edited, update the action button (enable when there is text in the field, i.e. some form of validation)
    inputUserName.addEventListener("input", updateActionButton);
    // handle changing the unit
    selUnit.addEventListener("change", handleSettingsChange);
    // handle changing the exercise mode
    $rbsMode.on("change", handleSettingsChange);
    // when the fill in blank field is edited, update the action button (enable when there is text in the field, i.e. some form of validation)
    fbAnswer.addEventListener("input", updateActionButton);
    // NOTE: mc answer handlers are not here, because they are programmatically added
    // handle then listen button
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