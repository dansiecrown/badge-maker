// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyCRbqik2k8OVeK7XlGP3WeSSQJmDoWnTyg",
  authDomain: "msrepresented-83711.firebaseapp.com",
  projectId: "msrepresented-83711",
  storageBucket: "msrepresented-83711.appspot.com",
  messagingSenderId: "880536238428",
  appId: "1:880536238428:web:f332d63724fbff92f5e999",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const surveyListElem = document.getElementById("survey-list");
const welcomeElem = document.getElementById("welcome-screen");
const questionElem = document.getElementById("quiz-screen");
const resultElem = document.getElementById("result-screen");
const emailInputElem = document.getElementById("user-email");
const submitEmailBtn = document.getElementById("submit-email-btn");
const startQuizBtn = document.getElementById("start-quiz-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const prevQuestionBtn = document.getElementById("prev-question-btn");
const submitQuizBtn = document.getElementById("submit-quiz-btn");
const progressBarElem = document.getElementById("progress-bar");
const surveyPage = document.getElementById("survey-list-page");

const endQuiz = document.getElementById("end-quiz");
const errorScreen = document.getElementById("error-screen");
const con = document.getElementById("continue");
const errorTitle = document.getElementById("error-title");

const allSurv = document.getElementById("all");
const edu = document.getElementById("edu");
const ent = document.getElementById("ent");

endQuiz.addEventListener("click", () => {
  errorShow("Quit now? You will have to start again next time...");
});

function errorShow(message) {
  errorTitle.innerText = message;
  errorScreen.style.display = "flex";
  errorScreen.classList.remove("slide-out"); // Remove the slide-out class if applied
  errorScreen.classList.add("slide-in");
}

con.addEventListener("click", () => {
  errorScreen.classList.remove("slide-in"); // Remove the slide-in class if applied
  errorScreen.classList.add("slide-out"); // Add the slide-out animation

  // Set display to none after the animation completes
  errorScreen.addEventListener("animationend", function handleAnimationEnd() {
    errorScreen.style.display = "none"; // Hide the element
    errorScreen.removeEventListener("animationend", handleAnimationEnd); // Remove the event listener to avoid triggering multiple times
  });
});

// State
let selectedSurvey = null;
let questionsList = [];
let currentQuestionIndex = 0;
let userResponses = [];
let email = "";
let filter = "all";


// Filter
allSurv.addEventListener("click", ()=>{
  filter = "all"
  loadSurveys()
})

ent.addEventListener("click", ()=>{
  filter = "entertainment"
  loadSurveys()
})

edu.addEventListener("click", ()=>{
  filter = "educative"
  loadSurveys()
})
// Load all surveys
async function loadSurveys() {
  const surveysSnapshot = await getDocs(collection(db, "surveys"));
  surveyListElem.innerHTML = ""; // Clear any existing surveys
  let survey;

  surveysSnapshot.forEach((doc) => {
    const surv = doc.data();

    if (surv.status == "published") {
      if (surv.category == filter) {
        survey = surv;

        const survCon = document.createElement("div");

        survCon.innerHTML = `
       <img src="${surv.featuredImageUrl}" alt="featured image">
       <div>
       <h5> ${surv.title} </h5>
       <button><img id="play" src="./Vector.svg">Play</button>
       </div>
       `;
        survCon.addEventListener("mouseenter", () => {
          survCon.classList.add("hovered");
        });

        survCon.addEventListener("mouseleave", () => {
          survCon.classList.remove("hovered");
        });

        survCon.addEventListener("click", () =>
          selectSurvey({ ...surv, id: doc.id })
        );
        surveyListElem.appendChild(survCon);
      }else if(filter == "all"){
        survey = surv;

        const survCon = document.createElement("div");

        survCon.innerHTML = `
       <img src="${surv.featuredImageUrl}" alt="featured image">
       <div>
       <h5> ${surv.title} </h5>
       <button><img id="play" src="./Vector.svg">Play</button>
       </div>
       `;
        survCon.addEventListener("mouseenter", () => {
          survCon.classList.add("hovered");
        });

        survCon.addEventListener("mouseleave", () => {
          survCon.classList.remove("hovered");
        });

        survCon.addEventListener("click", () =>
          selectSurvey({ ...surv, id: doc.id })
        );
        surveyListElem.appendChild(survCon);
      }
    }
  });
}

// Select a survey
function selectSurvey(survey) {
  selectedSurvey = survey;
  document.getElementById("quiz-container").classList.add("game-started");
  welcomeElem.style.display = "flex";
  questionElem.style.display = "none";
  resultElem.style.display = "none";
  surveyListElem.style.display = "none";
  surveyPage.style.display = "none";
  document.getElementById("survey-title").innerText = selectedSurvey.title;
  document.getElementById("survey-image").src = survey.featuredImageUrl;
}

// Start quiz for selected survey
startQuizBtn.addEventListener("click", async () => {
  currentQuestionIndex = 0;
  userResponses = [];
  await loadQuestionsForSurvey(selectedSurvey.title); // Use survey id for filtering
  if (questionsList.length > 0) {
    welcomeElem.classList.add("move-out");
    showQuestion();
    updateProgressBar();
  } else {
    alert("No questions available for this survey.");
  }
});

// Load questions for the selected survey
async function loadQuestionsForSurvey(surveyTitle) {
  const questionsSnapshot = await getDocs(collection(db, "questions"));

  questionsList = [];

  questionsSnapshot.forEach((doc) => {
    if (doc.data().surveyId === surveyTitle) {
      questionsList.push(doc.data());
    }
  });
}

const selectedOpt = [];

// Display the current question and attach event listeners
function showQuestion() {
  if (currentQuestionIndex >= questionsList.length) {
    showEmailInput();
    return;
  }

  const currentQuestion = questionsList[currentQuestionIndex];

  // Set the question text
  questionElem.querySelector("#quiz-question").innerText = currentQuestion.text;
  const quizImage = document.getElementById("quiz-image");
  //  quizImage.src = currentQuestion.imageUrl
  // Get the button elements by their IDs
  const aBtn = document.getElementById("a-btn");
  const bBtn = document.getElementById("b-btn");
  const cBtn = document.getElementById("c-btn");
  const dBtn = document.getElementById("d-btn");
  const eBtn = document.getElementById("e-btn");

  // Get the options elements by their IDs
  const optionA = document.getElementById("optiona");
  const optionB = document.getElementById("optionb");
  const optionC = document.getElementById("optionc");
  const optionD = document.getElementById("optiond");
  const optionE = document.getElementById("optione");

  // Function to handle button display and event assignment
  function configureButton(option, buttonElem, optionValue, optionLetter) {
    if (optionValue && optionValue.trim() !== "") {
      buttonElem.style.display = "flex"; // Show the button
      option.innerText = optionValue; // Set the option text
      buttonElem.onclick = () => {
        if (selectedOpt.length) {
          console.log(selectedOpt);
          selectedOpt[0].classList.remove("selected");
          selectedOpt.pop();

          selectedOpt.push(buttonElem);
          selectedOpt[0].classList.add("selected");
        } else {
          selectedOpt.push(buttonElem);
          selectedOpt[0].classList.add("selected");
        }
        answerQuestion(optionLetter, optionValue, buttonElem);
      }; // Assign event

      buttonElem.addEventListener("mouseenter", () => {
        buttonElem.classList.add("hov");
      });
      buttonElem.addEventListener("mouseleave", () => {
        buttonElem.classList.remove("hov");
      });
    } else {
      buttonElem.style.display = "none"; // Hide the button if option is undefined or empty
    }
  }

  // Configure buttons for available options
  configureButton(optionA, aBtn, currentQuestion.optionA, "A");
  configureButton(optionB, bBtn, currentQuestion.optionB, "B");
  configureButton(optionC, cBtn, currentQuestion.optionC, "C");
  configureButton(optionD, dBtn, currentQuestion.optionD, "D");
  configureButton(optionE, eBtn, currentQuestion.optionE, "E");

  // Update buttons visibility for navigation
  if (currentQuestionIndex <= 0) {
    prevQuestionBtn.ariaDisabled = true;
    prevQuestionBtn.classList.add("disabled");
  } else {
    prevQuestionBtn.classList.remove("disabled");
  }

  prevQuestionBtn.style.display =
    currentQuestionIndex > 0 ? "inline-block" : "inline-block";
  nextQuestionBtn.style.display =
    currentQuestionIndex < questionsList.length - 1 ? "inline-block" : "none";
  submitQuizBtn.style.display =
    currentQuestionIndex === questionsList.length - 1 ? "inline-block" : "none";

  // Show the quiz screen and hide the welcome screen
  welcomeElem.style.display = "none";
  questionElem.style.display = "block";
  resultElem.style.display = "none";

  updateProgressBar();
}

// Update the progress bar
function updateProgressBar() {
  const progressPercentage =
    ((currentQuestionIndex + 1) / questionsList.length) * 100;
  progressBarElem.style.width = `${progressPercentage}%`;
}

// Store user's selected option in userResponses array
function answerQuestion(optionLetter, optionValue, buttonElem) {
  userResponses[currentQuestionIndex] = {
    optionLetter, // 'A', 'B', 'C', etc.
    optionValue, // Actual value of the selected option (e.g., 'Option Text')
  };
}

// Navigate to the next question
nextQuestionBtn.addEventListener("click", () => {
  if (!userResponses[currentQuestionIndex]) {
    errorShow("Please select an option");
    return;
  }
  if (currentQuestionIndex < questionsList.length - 1) {
    currentQuestionIndex++;
    selectedOpt[0].classList.remove("selected");
    selectedOpt.pop();
    showQuestion();
  }
});

// Navigate to the previous question
prevQuestionBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion();
  }
});

// Submit the quiz
submitQuizBtn.addEventListener("click", () => {
  if (!userResponses[currentQuestionIndex]) {
    alert("please select an option");
    return;
  }

  showResults();
});

// Submit email and show results
submitEmailBtn.addEventListener("click", () => {
  email = emailInputElem.value;
  if (!email) {
    alert("Please enter your email");
    return;
  }
  showResults();
});

// Show results based on responses
function showResults() {
  document.getElementById("quiz-screen").style.display = "none";

  const result = calculateResult();
  resultElem.innerHTML = `

       <img src="${result.gradingImage}" alt="Result Image" width="200">
       <h5>You are</h5>
       <h2> ${result.gradingCriteria}</h2>
       <div class="result-footer">
       <p>${result.description}</p>
       <div class="footer-links">
       <a href="${result.link}" target="_blank">Learn more </a>
       <a class="button" > Play more </a>
       </div>
       </div>
     `;
  document.getElementById("results-screen-contain").style.display = "flex";
  resultElem.style.display = "flex";
}

// Calculate the result based on user responses
function calculateResult() {
  const count = {};

  // Count occurrences of each selected option letter
  userResponses.forEach((response) => {
    const optionLetter = response.optionLetter;
    count[optionLetter] = (count[optionLetter] || 0) + 1;
  });

  // Determine the most frequent option
  let mostFrequentOption = null;
  let maxCount = 0;
  for (const option in count) {
    if (count[option] > maxCount) {
      maxCount = count[option];
      mostFrequentOption = option;
    }
  }

  console.log(selectedSurvey);

  // Dynamically retrieve grading based on the most frequent answer
  const gradingCriteriaKeys = [
    "gradingCriteria1",
    "gradingCriteria2",
    "gradingCriteria3",
    "gradingCriteria4",
    "gradingCriteria5",
  ];
  const gradingImageKeys = [
    "gradingImage1",
    "gradingImage2",
    "gradingImage3",
    "gradingImage4",
    "gradingImage5",
  ];
  const gradingDesckeys = ["d1", "d2", "d3", "d4", "d5"];
  const gradingLinkKeys = ["l1", "l2", "l3", "l4", "l5"];

  const optionIndex = mostFrequentOption.charCodeAt(0) - 65; // 'A' => 0, 'B' => 1, 'C' => 2, etc.

  // If grading criteria and images exist for this index
  if (selectedSurvey[gradingCriteriaKeys[optionIndex]]) {
    return {
      gradingCriteria: selectedSurvey[gradingCriteriaKeys[optionIndex]],
      gradingImage: selectedSurvey[gradingImageKeys[optionIndex]],
      description: selectedSurvey[gradingDesckeys[optionIndex]],
      link: selectedSurvey[gradingLinkKeys[optionIndex]],
    };
  } else {
    // Default fallback if grading criteria do not exist
    return {
      gradingCriteria: "No Criteria Available",
      gradingImage: "https://via.placeholder.com/150", // Default image URL
      description: `You selected mostly option ${mostFrequentOption}, but no specific grading exists for this survey.`,
    };
  }
}

//  const startAfreshBtn = document.getElementById("retry")

//  startAfreshBtn.addEventListener('click', ()=>{
//    document.getElementById('results-screen-contain').style.display = "none"
//    resultElem.style.display = 'none';
//    showQuestion()
//  }
//  )

// Load all surveys when the page loads
loadSurveys();
