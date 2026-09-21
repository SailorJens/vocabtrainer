
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


function startReturningUser() {
    console.log("Returning User");
    showModeSelection()
    setUserName();
    setCurrentUnit();


}


// // save the name to the browser storage (localStorage)
// document.querySelector("#user-name-form").addEventListener("submit", event => {
//     // Prevent a page reload as is the default with submit buttons
//     event.preventDefault();

//     // get the user name field value. Note that nameInput is a global variable, hence I can't / don't need to declare it in the function
//     const name = nameInput.value.trim();
//     localStorage.setItem("userName", name);

//     document.getElementById("greeting-first").style.display = "none";
//     document.getElementById("msg-returning-user").innerHTML = "Welcome to the vocabulary trainer, " + name + "!"
//     document.getElementById("greeting-returning").style.display = "";

//     // save/use the name (later ####)
// });