// WELCOME SCREEN ELEMENTS
const startScrn = document.getElementById("start-screen");
const categorySelct = document.getElementById("category");
const difficultySelct = document.getElementById("difficulty");
const startBtn = document.getElementById("start-btn");
const loadingMessage = document.getElementById("loading-message");
const startBestScore = document.getElementById("start-best-score");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");

// QUIZ SCREEN ELEMENTS
const quizScrn = document.getElementById("quiz-screen");
const questionCount = document.getElementById("question-counter");
const progressBar = document.getElementById("progress-bar");
const questionTimer = document.getElementById("timer");
const qstnText = document.getElementById("question-text");
const answerOpt = document.getElementById("answer-options");
const nextBtn = document.getElementById("next-btn");
const runningScore = document.getElementById("running-score");

// RESULT SCREEN ELEMENTS
const resultScrn = document.getElementById("result-screen");
const finalScore = document.getElementById("final-score");
const percentage = document.getElementById("percentage");
const performMsg= document.getElementById("performance-message");
const playAgainBtn = document.getElementById("play-again-btn");
const bestScore = document.getElementById("best-score");

// QUIZ STATE VARIABLES
let quiz = null;
let timerInterval = null;
let timeLeft = 15;

// FUNCTION TO SHUFFLE ANSWER OPTIONS
function shuffleAnswers(array) {
    for (let i = array.length - 1; i > 0; i--) {

        const randomIndex = Math.floor(Math.random() * (i + 1));

        const temporary = array[i];

        array[i] = array[randomIndex];

        array[randomIndex] = temporary;
    }

    return array;
}
// QUESTION CLASS CREATION
class Question {
    constructor(question, correctAnswer, incorrectAnswers) {
        this.question = question;
        this.correctAnswer = correctAnswer;
        // Combine correct and incorrect answers
        this.answers = [correctAnswer, ...incorrectAnswers]

        // Shuffle all answer options
        shuffleAnswers(this.answers);
    }
}

// QUIZ CLASS AND METHODS CREATION
class Quiz {
    constructor(questions) {
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answered = false;
    }

    // METHOD TO GET CURRENT QUESTION
    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
}
    // METHOD TO CHECK FOR CORRECT ANSWER
    checkAnswer(answer) {
        if (this.answered) {
            return false;
    }

    this.answered = true;

    const currentQuestion = this.getCurrentQuestion();

    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
        this.score++;
    }

    return isCorrect;
}
    // METHOD TO CHECK IF ALL QUESTIONS HAVE BEEN ATTEMPTED
    isFinished() {
        return this.currentQuestionIndex >= this.questions.length;
}
    // NEXT QUESTION POINTER METHOD
    nextQuestion() {
        if (this.isFinished()) {
            return;
    }

    this.currentQuestionIndex++;
    this.answered = false;
}
}

// USING 'ASYNC' AND 'AWAIT' TO FETCH QUESTION FROM API
async function fetchQuestions(category, difficulty) {
    try {
        
        // 1. Prepare the API parameters
        const params = new URLSearchParams({
            amount: 10,
            category: category,
            difficulty: difficulty,
            type: "multiple",
            encode: "url3986"
        });

        // 2. Build the API URL
        const apiURL = `https://opentdb.com/api.php?${params}`;

        // 3. Send the request
        const response = await fetch(apiURL);

        // 4. Check the HTTP response
        if (!response.ok) {
            throw new Error("Server connection failed.");
        }
        // 5. Convert the response to a JavaScript object
        const data = await response.json();

        // 6. Check the API response code
        if (data.response_code !== 0) {
            if (data.response_code === 1) {
                throw new Error("No questions found for this selection.");
            } else if (data.response_code === 2) {
                throw new Error("Invalid category or difficulty.");
            } else if (data.response_code === 5) {
                throw new Error("Too many requests. Please wait 5 seconds.");
            } else {
                throw new Error("Unable to retrieve questions.");
            }
        }


        // 7. Return the questions
        return data.results.map(item => {
    const questionText = decodeURIComponent(item.question);

    const correctAnswer = decodeURIComponent(item.correct_answer);

    const incorrectAnswers = item.incorrect_answers.map(answer => {
        return decodeURIComponent(answer);
    });

    return new Question(
        questionText,
        correctAnswer,
        incorrectAnswers
    );
});

    } catch (error) {
        console.error("Fetch error:", error.message);
        throw error;
    }
}
// LOGIC FOR SELECTING QUIZ AND LOADING THE QUIZ SCREEN
async function startQuiz() {
    const selectedCategory = categorySelct.value;
    const selectedDifficulty = difficultySelct.value;

    if (!selectedCategory) {
        alert("Please select a category.");
        return;
    }

    startBtn.disabled = true;
    startBtn.textContent = "Loading questions...";

    loadingMessage.classList.remove("hidden");
    errorMessage.classList.add("hidden");
    retryBtn.classList.add("hidden");

    try {
        const fetchedQuestions = await fetchQuestions(
            selectedCategory,
            selectedDifficulty
        );

        quiz = new Quiz(fetchedQuestions);

        runningScore.textContent = "Score: 0";

        startScrn.classList.add("hidden");
        quizScrn.classList.remove("hidden");

        displayQuestion();

    } catch (error) {
        console.error("Quiz loading error:", error);

        errorMessage.textContent =
            "Sorry, we couldn't load the questions. " + error.message;

        errorMessage.classList.remove("hidden");
        retryBtn.classList.remove("hidden");

    } finally {
        startBtn.disabled = false;
        startBtn.textContent = "Start Quiz";

        loadingMessage.classList.add("hidden");
    }
}

// HANDLING THE TIMER
function startTimer() {
    // to ensure our timer start afresh for every question
    clearInterval(timerInterval);
    
    timeLeft = 15;

    questionTimer.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;

        questionTimer.textContent = timeLeft;

        if (timeLeft === 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

// FUNCTION TO HANDLE TIMEOUT AFTER 15 SECONDS ELAPSE
function handleTimeout() {
    const currentQuestion = quiz.getCurrentQuestion();
    const answerButtons = answerOpt.querySelectorAll("button");

    answerButtons.forEach(button => {
        button.disabled = true;

        if (button.textContent === currentQuestion.correctAnswer) {
            button.classList.add("correct");
        }
    });

    quiz.answered = true;

    nextBtn.disabled = false;
    nextBtn.style.display = "block";
}

// LOGIC FOR DISPLAYING EACH QUESTION, HANDLING THE PROGRESS BAR, NEXT BTN FOR EACH ANSWER.....
function displayQuestion() {

    // Get the current question
    const currentQuestion = quiz.getCurrentQuestion();

    // Display question number
    questionCount.textContent =
        `Question ${quiz.currentQuestionIndex + 1} of ${quiz.questions.length}`;

    // progress bar
    const progress = ((quiz.currentQuestionIndex + 1) / quiz.questions.length) * 100;

    progressBar.style.width = `${progress}%`;

    // Display the question text
    qstnText.textContent = currentQuestion.question;

    // Remove answer buttons from the previous question
    answerOpt.innerHTML = "";

    // Create a button for each answer
    currentQuestion.answers.forEach(answer => {

        const button = document.createElement("button");

        button.textContent = answer;
        button.classList.add("answer-btn");
        button.type = "button";

        button.addEventListener("click", () => {
            selectAnswer(answer, button);
});

        answerOpt.appendChild(button);
    });

    // Hide the Next button until an answer is selected
    nextBtn.disabled = true;
    nextBtn.style.display = "none";

startTimer();
}

//  CORRECT ANSWER LOGIC
function selectAnswer(selectedAnswer, button) {
    clearInterval(timerInterval);
    const currentQuestion = quiz.getCurrentQuestion();
    const answerButtons = answerOpt.querySelectorAll("button");

    answerButtons.forEach(btn => {
        btn.disabled = true;
    });

    const isCorrect = quiz.checkAnswer(selectedAnswer);

    runningScore.textContent = `Score: ${quiz.score}`;

    if (isCorrect) {
        button.classList.add("correct");
    } else {
        button.classList.add("incorrect");

        answerButtons.forEach(btn => {
            if (btn.textContent === currentQuestion.correctAnswer) {
                btn.classList.add("correct");
            }
        });
    }

    nextBtn.disabled = false;
    nextBtn.style.display = "block";
}

// Next question button
function goToNextQuestion() {
    clearInterval(timerInterval);
    quiz.nextQuestion();


    if (quiz.isFinished()) {
        showResults();
    } else {
        displayQuestion();
    }
}

nextBtn.addEventListener("click", goToNextQuestion);

// FUNCTION AND LOGIC FOR RESULT WINDOW/SECTION
function showResults() {

    // Calculate the player's percentage
    const resultPercentage = (quiz.score / quiz.questions.length) * 100;

    // Hide the quiz screen
    quizScrn.classList.add("hidden");

    // Display the results screen
    resultScrn.classList.remove("hidden");

    // Display the final score
    finalScore.textContent = `${quiz.score}/${quiz.questions.length}`;

    // Display the percentage
    percentage.textContent = `${resultPercentage}%`;

    // Display a performance message
    if (resultPercentage >= 80) {
        performMsg.textContent = "Excellent work!";

    } else if (resultPercentage >= 50) {
        performMsg.textContent = "Good effort!";

    } else {
        performMsg.textContent = "Keep practising!";
    }
    updateBestScore();
}

// HANDLING AND STORING BEST SCORE IN LOCALSTORAGE
function updateBestScore() {
    const savedBestScore = Number(localStorage.getItem("bestScore")) || 0;

    if (quiz.score > savedBestScore) {
        localStorage.setItem("bestScore", quiz.score);
    }

    const currentBestScore = Number(localStorage.getItem("bestScore")) || 0;

    bestScore.textContent = `${currentBestScore}/${quiz.questions.length}`;
    displayStartBestScore();
}

function displayStartBestScore() {
    const savedBestScore = Number(localStorage.getItem("bestScore")) || 0;

    startBestScore.textContent = `Best Score: ${savedBestScore}/10`;
}

startBtn.addEventListener("click", startQuiz);

retryBtn.addEventListener("click", startQuiz);

playAgainBtn.addEventListener("click", () => {
    clearInterval(timerInterval);

    quiz = null;

    resultScrn.classList.add("hidden");
    startScrn.classList.remove("hidden");

    questionTimer.textContent = 15;
    progressBar.style.width = "0%";
});

// LOADING CATEGORY DROPDOWN FROM API
async function loadCategories() {
    try {
        // 1. Request categories from the API
        const response = await fetch(
            "https://opentdb.com/api_category.php"
        );

        // 2. Check whether the request was successful
        if (!response.ok) {
            throw new Error("Unable to load categories.");
        }

        // 3. Convert the response into a JavaScript object
        const data = await response.json();
        
        // 4. Clear the temporary loading message
        categorySelct.innerHTML =
            '<option value="">Select a category</option>';

        // 5. Loop through the categories
        data.trivia_categories.forEach(category => {

            // Create a new option element
            const option = document.createElement("option");

            // Give the option its category ID
            option.value = category.id;

            // Set the visible category name
            option.textContent = category.name;

            // Add the option to the dropdown
            categorySelct.appendChild(option);
        });

    } catch (error) {
        console.error("Category loading error:", error);

        categorySelct.innerHTML =
            '<option value="">Failed to load categories</option>';
    }
}


loadCategories();
displayStartBestScore();
