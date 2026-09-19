


const greetingReturning = document.getElementById("greeting-returning");
const greetingFirst = document.getElementById("greeting-first");
const unitSection = document.getElementById("unit-section");
const modeSection = document.getElementById("mode-section");
const multipleChoiceSection = document.getElementById("multiple-choice-section");
const fillBlankSection = document.getElementById("fill-blank-section");

// the user name field
const nameInput = document.querySelector("#user-name");

// hide the greeting with the name when first visiting (as well as other sections)
// set display none so that it doesn't add whitespace as it would do with visibility: hidden


// check if username is stored in localStorage
if (localStorage.getItem("userName")) {
    startReturningUser();
} else {
    startNewUser();
}

function startReturningUser() {
    greetingFirst.style.display = "none";
    greetingReturning.innerHTML = "Welcome to the vocabulary trainer, " + localStorage.getItem("userName") + "!"
}

function startNewUser() {
    greetingReturning.style.display = "none";
    unitSection.style.display = "none";
    modeSection.style.display = "none";
    multipleChoiceSection.style.display = "none";
    fillBlankSection.style.display = "none";
}


// add a validator on the user name filed
nameInput.addEventListener("input", () => {
    if (nameInput.value.trim() === "") {
        nameInput.setCustomValidity("Please fill in this field.");
    } else {
        nameInput.setCustomValidity("");
    }
});

// save the name to the browser storage (localStorage)
document.querySelector("#user-name-form").addEventListener("submit", event => {
    // Prevent a page reload as is the default with submit buttons
    event.preventDefault();

    // get the user name field value. Note that nameInput is a global variable, hence I can't / don't need to declare it in the function
    const name = nameInput.value.trim();
    localStorage.setItem("userName", name);

    document.getElementById("greeting-first").style.display = "none";
    document.getElementById("msg-returning-user").innerHTML = "Welcome to the vocabulary trainer, " + name + "!"
    document.getElementById("greeting-returning").style.display = "";

    // save/use the name (later ####)
});