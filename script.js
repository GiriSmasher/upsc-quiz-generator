/* ---
    UPSC Quiz Generator
    script.js
    --- */

/**
 * @file This script handles the main logic for the UPSC Quiz Generator application,
 * including theme toggling, PDF processing, quiz state management, and navigation.
 */

// --- Event Listener for DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // --- PDF.js Worker Configuration ---
    // This is required for PDF.js to work correctly in most browsers.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    // --- Theme Toggle Functionality ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Function to apply the saved theme on load
    const applySavedTheme = () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
    };

    // Event listener for theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }

    applySavedTheme(); // Apply theme on initial load

    // --- Page-specific Logic ---
    // Check which page is currently active and run the relevant code
    if (document.getElementById('upload-area')) {
        handleIndexPage();
    } else if (document.querySelector('.quiz-container')) {
        handleQuizPage();
    } else if (document.querySelector('.result-container')) {
        handleResultPage();
    }
});


// -----------------------------------------------------------------------------
// --- INDEX PAGE LOGIC ---
// -----------------------------------------------------------------------------

function handleIndexPage() {
    const uploadArea = document.getElementById('upload-area');
    const pdfUpload = document.getElementById('pdf-upload');
    const uploadButton = document.getElementById('upload-button');

    // --- Drag and Drop Functionality ---
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            pdfUpload.files = files;
            extractTextFromPDF(files[0]);
        }
    });

    // --- Click to Upload Functionality ---
    uploadArea.addEventListener('click', () => {
        pdfUpload.click();
    });

    pdfUpload.addEventListener('change', () => {
        if (pdfUpload.files.length > 0) {
            extractTextFromPDF(pdfUpload.files[0]);
        }
    });
    
    uploadButton.addEventListener('click', () => {
        if (pdfUpload.files.length > 0) {
            extractTextFromPDF(pdfUpload.files[0]);
        } else {
            alert('Please select a PDF file first.');
        }
    });

    /**
     * Extracts text from the uploaded PDF file using PDF.js.
     * @param {File} file - The PDF file object.
     */
    async function extractTextFromPDF(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const pdfData = new Uint8Array(e.target.result);
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            let textContent = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map(s => s.str).join(' ');
            }

            // Generate quiz and store it in localStorage
            const quiz = generateQuizFromPDF(textContent);
            localStorage.setItem('quizData', JSON.stringify(quiz));

            // Initialize quiz state
            const quizState = {
                currentQuestion: 0,
                answers: Array(quiz.length).fill(null),
                marked: Array(quiz.length).fill(false),
                startTime: new Date().getTime()
            };
            localStorage.setItem('quizState', JSON.stringify(quizState));

            // Redirect to the quiz page
            window.location.href = 'quiz.html';
        };
        reader.readAsArrayBuffer(file);
    }
}


// -----------------------------------------------------------------------------
// --- QUIZ PAGE LOGIC ---
// -----------------------------------------------------------------------------

function handleQuizPage() {
    const quizData = JSON.parse(localStorage.getItem('quizData'));
    let quizState = JSON.parse(localStorage.getItem('quizState'));

    if (!quizData || !quizState) {
        window.location.href = 'index.html'; // Redirect if no quiz data
        return;
    }

    const questionContainer = document.getElementById('question-container');
    const timerElement = document.getElementById('timer');
    const totalQuestionsElement = document.getElementById('total-questions');
    const attemptedQuestionsElement = document.getElementById('attempted-questions');
    const skippedQuestionsElement = document.getElementById('skipped-questions');
    const markedQuestionsElement = document.getElementById('marked-questions');
    
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const markReviewButton = document.getElementById('mark-review-button');
    const submitTestButton = document.getElementById('submit-test-button');

    let timerInterval;

    /**
     * Renders the current question and options.
     */
    function renderQuestion() {
        const currentQuestionData = quizData[quizState.currentQuestion];
        questionContainer.innerHTML = `
            <h2>Q${quizState.currentQuestion + 1}: ${currentQuestionData.question}</h2>
            <div class="options-container">
                ${currentQuestionData.options.map((option, index) => `
                    <label class="option ${quizState.answers[quizState.currentQuestion] === index ? 'selected' : ''}">
                        <input type="radio" name="option" value="${index}" ${quizState.answers[quizState.currentQuestion] === index ? 'checked' : ''}>
                        ${option}
                    </label>
                `).join('')}
            </div>
        `;

        // Add event listeners to new options
        document.querySelectorAll('.option input').forEach(input => {
            input.addEventListener('change', (e) => {
                quizState.answers[quizState.currentQuestion] = parseInt(e.target.value, 10);
                updateSummary();
                renderQuestion(); // Re-render to show selection
            });
        });

        updateNavigationButtons();
    }

    /**
     * Updates the enabled/disabled state of navigation buttons.
     */
    function updateNavigationButtons() {
        prevButton.disabled = quizState.currentQuestion === 0;
        nextButton.disabled = quizState.currentQuestion === quizData.length - 1;
        markReviewButton.textContent = quizState.marked[quizState.currentQuestion] ? 'Unmark' : 'Mark for Review';
    }

    /**
     * Updates the quiz summary box.
     */
    function updateSummary() {
        const attempted = quizState.answers.filter(a => a !== null).length;
        const marked = quizState.marked.filter(m => m).length;

        totalQuestionsElement.textContent = quizData.length;
        attemptedQuestionsElement.textContent = attempted;
        skippedQuestionsElement.textContent = quizData.length - attempted;
        markedQuestionsElement.textContent = marked;

        // Save state to localStorage
        localStorage.setItem('quizState', JSON.stringify(quizState));
    }

    /**
     * Starts the 30-minute countdown timer.
     */
    function startTimer() {
        const quizDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
        const endTime = quizState.startTime + quizDuration;

        timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                clearInterval(timerInterval);
                timerElement.textContent = "00:00";
                submitQuiz();
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    // --- Event Listeners for Quiz Navigation ---
    nextButton.addEventListener('click', () => {
        if (quizState.currentQuestion < quizData.length - 1) {
            quizState.currentQuestion++;
            renderQuestion();
        }
    });

    prevButton.addEventListener('click', () => {
        if (quizState.currentQuestion > 0) {
            quizState.currentQuestion--;
            renderQuestion();
        }
    });
    
    markReviewButton.addEventListener('click', () => {
        quizState.marked[quizState.currentQuestion] = !quizState.marked[quizState.currentQuestion];
        updateSummary();
        renderQuestion();
    });

    submitTestButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to submit the test?')) {
            submitQuiz();
        }
    });

    /**
     * Submits the quiz and redirects to the result page.
     */
    function submitQuiz() {
        clearInterval(timerInterval);
        quizState.endTime = new Date().getTime();
        localStorage.setItem('quizState', JSON.stringify(quizState));
        window.location.href = 'result.html';
    }

    // --- Initial Setup for Quiz Page ---
    renderQuestion();
    updateSummary();
    startTimer();
}


// -----------------------------------------------------------------------------
// --- RESULT PAGE LOGIC ---
// -----------------------------------------------------------------------------

function handleResultPage() {
    const quizData = JSON.parse(localStorage.getItem('quizData'));
    const quizState = JSON.parse(localStorage.getItem('quizState'));

    if (!quizData || !quizState) {
        window.location.href = 'index.html'; // Redirect if no data
        return;
    }

    const finalScoreElement = document.getElementById('final-score');
    const timeTakenElement = document.getElementById('time-taken');
    const answersContainer = document.getElementById('answers-container');
    const restartQuizButton = document.getElementById('restart-quiz-button');
    const goHomeButton = document.getElementById('go-home-button');
    
    /**
     * Calculates and displays the final results.
     */
    function displayResults() {
        let score = 0;
        quizData.forEach((question, index) => {
            if (quizState.answers[index] !== null && question.options[quizState.answers[index]] === question.answer) {
                score++;
            }
        });

        // Calculate time taken
        const timeDiff = quizState.endTime - quizState.startTime;
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        finalScoreElement.textContent = `${score} / ${quizData.length}`;
        timeTakenElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Display detailed answers
        answersContainer.innerHTML = quizData.map((question, index) => {
            const userAnswerIndex = quizState.answers[index];
            const userAnswer = userAnswerIndex !== null ? question.options[userAnswerIndex] : "Not Answered";
            const isCorrect = userAnswer === question.answer;
            const resultClass = isCorrect ? 'correct' : (userAnswer === "Not Answered" ? '' : 'wrong');

            return `
                <div class="answer ${resultClass}">
                    <p><strong>Q${index + 1}: ${question.question}</strong></p>
                    <p>Your Answer: ${userAnswer}</p>
                    ${!isCorrect ? `<p>Correct Answer: ${question.answer}</p>` : ''}
                </div>
            `;
        }).join('');
    }
    
    // --- Event Listeners for Result Page ---
    restartQuizButton.addEventListener('click', () => {
        // Keep the same quiz data but reset state
        const newState = {
            currentQuestion: 0,
            answers: Array(quizData.length).fill(null),
            marked: Array(quizData.length).fill(false),
            startTime: new Date().getTime()
        };
        localStorage.setItem('quizState', JSON.stringify(newState));
        window.location.href = 'quiz.html';
    });
    
    goHomeButton.addEventListener('click', () => {
        localStorage.removeItem('quizData');
        localStorage.removeItem('quizState');
        window.location.href = 'index.html';
    });

    // --- Initial Setup for Result Page ---
    displayResults();
}
