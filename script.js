/**
 * UPSC Quiz Generator - Main Script
 *
 * This script handles the core functionality of the quiz application, including:
 * - Theme management (dark/light mode)
 * - PDF file handling and text extraction
 * - Quiz generation and state management
 * - Displaying questions and results
 *
 * The script is organized into the following sections:
 * 1. App Initialization: Sets up event listeners based on the current page.
 * 2. Theme Management: Handles toggling between dark and light modes.
 * 3. Index Page Logic: Manages PDF upload and quiz generation.
 * 4. Quiz Page Logic: Controls the quiz flow, timer, and user interactions.
 * 5. Result Page Logic: Displays the final score and a review of the questions.
 * 6. Utility Functions: Provides helper functions used across the script.
 */

(function () {
    // =========================================================================
    // 1. APP INITIALIZATION
    // =========================================================================

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize theme toggle on all pages
        initializeTheme();

        // Page-specific initializations
        if (document.getElementById('uploadArea')) {
            initializeIndexPage();
        } else if (document.body.id === 'quizPage') {
            initializeQuizPage();
        } else if (document.body.id === 'resultPage') {
            initializeResultPage();
        }

        // Set PDF.js worker source
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    });

    // =========================================================================
    // 2. THEME MANAGEMENT
    // =========================================================================

    function initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Apply saved theme on load
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }

        // Add event listener for theme changes
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    // =========================================================================
    // 3. INDEX PAGE LOGIC (PDF Upload)
    // =========================================================================

    function initializeIndexPage() {
        const uploadArea = document.getElementById('uploadArea');
        const pdfInput = document.getElementById('pdfInput');

        if (!uploadArea || !pdfInput) return;

        // Event listeners for file upload
        uploadArea.addEventListener('click', () => pdfInput.click());
        pdfInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragging');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragging'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragging');
            handleFileSelect(e.dataTransfer.files[0]);
        });
    }

    function handleFileSelect(file) {
        if (file && file.type === 'application/pdf') {
            processPDF(file);
        } else {
            alert('Please select a valid PDF file.');
        }
    }

    async function processPDF(file) {
        const uploadArea = document.getElementById('uploadArea');
        const loadingContainer = document.getElementById('loadingContainer');

        // Show loading indicator
        uploadArea.style.display = 'none';
        loadingContainer.style.display = 'block';

        try {
            const text = await extractPDFText(file);
            const quiz = await generateQuizFromPDF(text); // Assumes aiQuiz.js is loaded

            // Store quiz and navigate to quiz page
            localStorage.setItem('currentQuiz', JSON.stringify(quiz));
            window.location.href = 'quiz.html';
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Failed to process PDF. Please try another file.');
            // Reset UI
            uploadArea.style.display = 'flex';
            loadingContainer.style.display = 'none';
        }
    }

    async function extractPDFText(file) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (event) => {
                try {
                    const typedarray = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(' ');
                    }
                    resolve(fullText);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // =========================================================================
    // 4. QUIZ PAGE LOGIC
    // =========================================================================

    // Quiz state variables
    let quizData = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let markedForReview = [];
    let timerInterval;
    let timeRemaining = 1800; // 30 minutes

    function initializeQuizPage() {
        const storedQuiz = localStorage.getItem('currentQuiz');
        if (!storedQuiz) {
            alert('No quiz data found. Please upload a PDF first.');
            window.location.href = 'index.html';
            return;
        }

        quizData = JSON.parse(storedQuiz);
        userAnswers = new Array(quizData.length).fill(null);
        markedForReview = new Array(quizData.length).fill(false);

        // Bind event listeners
        document.getElementById('prevBtn').addEventListener('click', navigateToPreviousQuestion);
        document.getElementById('nextBtn').addEventListener('click', navigateToNextQuestion);
        document.getElementById('markBtn').addEventListener('click', toggleMarkForReview);
        document.getElementById('submitBtn').addEventListener('click', finalizeQuiz);

        // Initial render
        renderQuestion();
        renderQuestionGrid();
        startQuizTimer();
        updateQuizSummary();
    }

    function renderQuestion() {
        const question = quizData[currentQuestionIndex];
        document.getElementById('questionNumber').textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
        document.getElementById('questionText').textContent = question.question;

        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const isChecked = userAnswers[currentQuestionIndex] === index;
            const optionId = `opt${index}`;
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `
                <input type="radio" name="option" id="${optionId}" value="${index}" ${isChecked ? 'checked' : ''}>
                <label for="${optionId}">${option}</label>
            `;
            optionElement.addEventListener('click', () => handleOptionSelection(index));
            optionsContainer.appendChild(optionElement);
        });

        updateNavigationButtons();
    }
    
    function handleOptionSelection(index) {
        userAnswers[currentQuestionIndex] = index;
        document.querySelector(`#opt${index}`).checked = true;
        updateQuizSummary();
        updateQuestionGrid();
    }

    function navigateToPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    }

    function navigateToNextQuestion() {
        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    }

    function toggleMarkForReview() {
        markedForReview[currentQuestionIndex] = !markedForReview[currentQuestionIndex];
        updateQuizSummary();
        updateQuestionGrid();
    }

    function updateNavigationButtons() {
        document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
        document.getElementById('nextBtn').style.display = currentQuestionIndex === quizData.length - 1 ? 'none' : 'flex';
        document.getElementById('submitBtn').style.display = currentQuestionIndex === quizData.length - 1 ? 'flex' : 'none';
    }

    function renderQuestionGrid() {
        const grid = document.getElementById('questionGrid');
        grid.innerHTML = '';
        quizData.forEach((_, index) => {
            const button = document.createElement('button');
            button.textContent = index + 1;
            button.addEventListener('click', () => {
                currentQuestionIndex = index;
                renderQuestion();
            });
            grid.appendChild(button);
        });
        updateQuestionGrid();
    }

    function updateQuestionGrid() {
        const buttons = document.querySelectorAll('#questionGrid button');
        buttons.forEach((btn, index) => {
            btn.className = ''; // Reset classes
            if (userAnswers[index] !== null) btn.classList.add('attempted');
            if (markedForReview[index]) btn.classList.add('marked');
            if (index === currentQuestionIndex) btn.classList.add('current');
        });
    }

    function updateQuizSummary() {
        const attempted = userAnswers.filter(a => a !== null).length;
        const marked = markedForReview.filter(m => m).length;
        document.getElementById('summaryAttempted').textContent = attempted;
        document.getElementById('summaryMarked').textContent = marked;
        document.getElementById('summarySkipped').textContent = quizData.length - attempted;
    }

    function startQuizTimer() {
        const timerDisplay = document.getElementById('timerDisplay');
        timerInterval = setInterval(() => {
            timeRemaining--;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (timeRemaining <= 0) {
                finalizeQuiz();
            }
        }, 1000);
    }

    function finalizeQuiz() {
        clearInterval(timerInterval);
        const results = {
            quizData,
            userAnswers,
            timeTaken: 1800 - timeRemaining
        };
        localStorage.setItem('quizResults', JSON.stringify(results));
        window.location.href = 'result.html';
    }

    // =========================================================================
    // 5. RESULT PAGE LOGIC
    // =========================================================================

    function initializeResultPage() {
        const resultsData = localStorage.getItem('quizResults');
        if (!resultsData) {
            alert('No results to display.');
            window.location.href = 'index.html';
            return;
        }

        const { quizData, userAnswers, timeTaken } = JSON.parse(resultsData);
        displayQuizResults(quizData, userAnswers, timeTaken);

        // Bind event listeners
        document.getElementById('restartBtn').addEventListener('click', () => window.location.href = 'quiz.html');
        document.getElementById('homeBtn').addEventListener('click', () => window.location.href = 'index.html');
    }

    function displayQuizResults(quiz, answers, time) {
        let correctAnswers = 0;
        answers.forEach((ans, i) => {
            if (ans === quiz[i].correctAnswer) correctAnswers++;
        });

        // Update summary stats
        document.getElementById('finalScore').textContent = correctAnswers;
        document.getElementById('totalQuestions').textContent = quiz.length;
        document.getElementById('correctCount').textContent = correctAnswers;
        document.getElementById('wrongCount').textContent = answers.filter(a => a !== null).length - correctAnswers;
        
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        document.getElementById('timeTaken').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Render detailed review
        const reviewContainer = document.getElementById('reviewContainer');
        reviewContainer.innerHTML = '';
        quiz.forEach((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            const status = userAnswer === null ? 'skipped' : (isCorrect ? 'correct' : 'wrong');

            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${status}`;
            reviewItem.innerHTML = `
                <p class="review-question"><strong>Q${index + 1}:</strong> ${q.question}</p>
                <p><strong>Your Answer:</strong> ${userAnswer !== null ? q.options[userAnswer] : 'Not Answered'}</p>
                ${!isCorrect ? `<p><strong>Correct Answer:</strong> ${q.options[q.correctAnswer]}</p>` : ''}
            `;
            reviewContainer.appendChild(reviewItem);
        });
    }

})();
