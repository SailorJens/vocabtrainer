
// I'll declare all elements globally as it is a small page

//sections
const secGreetingReturning = document.getElementById("greeting-returning-section");
const secGreetingFirst = document.getElementById("greeting-first-section");
const secUnit = document.getElementById("unit-section");
const secMode = document.getElementById("mode-section");
const secMultipleChoice = document.getElementById("multiple-choice-section");
const secFillBlank = document.getElementById("fill-blank-section");

// user name  text field
const inpName = document.getElementById("user-name");
const formName = document.getElementById("user-name-form");

// greeting for known users
const pGreeting = document.getElementById("msg-returning-user");

// unit selector
const selUnit = document.getElementById("unit-selector");

// mode selector
// here i need a query, because there are multiple input controls that are tied together loosely
// so this would be an array of two elements, hence i will need to loop through them
const rbsMode = document.querySelectorAll('input[name="mode"]');

const formFB = document.getElementById("f-answer-form");
const pFBGerman = document.getElementById("fb_german");
const spanFBBefore = document.getElementById("fb_before");
const spanFBAfter = document.getElementById("fb_after");
const inpFBAnswer = document.getElementById("fb_answer");

const formMC = document.getElementById("m-answer-form");

// the user's data
let user = null;

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

// on start: check if user information is available.
// if yes, use it, else enquire name.
if (localStorage.getItem("user")) {
    loadUser();
    startReturningUser()
} else {
    startNewUser();
}



function showNameEntry() {
    secGreetingReturning.style.display = "none";
    secUnit.style.display = "none";
    secMode.style.display = "none";
    secMultipleChoice.style.display = "none";
    secFillBlank.style.display = "none";
}

function validateName() {
    if (inpName.value.trim() === "") {
        inpName.setCustomValidity("Please fill in this field.");
    } else {
        inpName.setCustomValidity("");
    }
}

function createNewUser() {
    // retrieve the name
    const name = inpName.value.trim();
    // initialise the user 
    user = {
        name: name,
        unit: 1,
        cards: []
    };
    // save user
    saveUser();

    // change to layout for known users
    startReturningUser();
}


function startNewUser() {
    // hide all sections other than the name entry section
    showNameEntry();
    // set a validator on the name field (to avoid blank names)
    inpName.addEventListener("input", validateName);
    // when a name is submitted, initialise the user
    // this catches the button submit event
    formName.addEventListener("submit", createNewUser);
    // put cursor in the box for better UX
    inpName.focus();
}

function showModeSelection() {
    secGreetingFirst.style.display = "none";
    secGreetingReturning.style.display = ""
    secMultipleChoice.style.display = "none";
    secFillBlank.style.display = "none";
}

function setUserName() {
    pGreeting.innerHTML = "Welcome to the vocabulary trainer, " + user.name + "!"
}

function setCurrentUnit() {
    selUnit.value = user.unit;
}

function unitChanged() {
    user.unit = selUnit.value;
    saveUser();
}

function modeChanged(event) {
    const mode = event.target.value;

    if (mode === "fill-in-the-blank") {
        startFillBlank();
    } else {
        startMultipleChoice()
    }
}

function startReturningUser() {
    
    showModeSelection()
    setUserName();
    setCurrentUnit();

    // set up event listeners 
    selUnit.addEventListener("change", unitChanged)
    rbsMode.forEach(button => {
        button.addEventListener("change", modeChanged)
    });
    formFB.addEventListener("submit", fbAnswerSubmitted);

   


}

function startFillBlank() {
    console.log("startFillBlank")

    // show correct form
    secMultipleChoice.style.display = "none";
    secFillBlank.style.display = "";

    // load sentence
    card = {
        id : 1,
        german : "Gibt es im Klassenzimmer Stühle?",
        turkish : "Sınıfta sandalyeler var mı?",
        turkish_blank :  "Sınıfta {{sandalyeler}} var mı?"
    }
    // display sentence
    pFBGerman.innerHTML = card.german;
    spanFBBefore.innerHTML = card.turkish_blank.split("{{")[0];
    spanFBAfter.innerHTML = card.turkish_blank.split("}}")[1];
    // set cursor in answer field
    inpFBAnswer.focus();

}

function fbAnswerSubmitted() {

}


function startMultipleChoice() {
    console.log("startMultipleChoice")
    secMultipleChoice.style.display = "";
    secFillBlank.style.display = "none";

    // load sentence
    // display sentence
}
