// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    
    // Toggle theme
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
}

// ===== PDF UPLOAD & DRAG-DROP (INDEX PAGE) =====
const uploadArea = document.getElementById('uploadArea');
const pdfInput = document.getElementById('pdfInput');
const loadingContainer = document.getElementById('loadingContainer');

if (uploadArea && pdfInput) {
    // Click to upload
    uploadArea.addEventListener('click', () => pdfInput.click());
    
    // File selection
    pdfInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            processPDF(file);
        } else {
            alert('Please upload a valid PDF file');
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        processPDF(file);
    } else {
        alert('Please upload a valid PDF file');
    }
}

async function processPDF(file) {
    uploadArea.style.display = 'none';
    loadingContainer.style.display = 'block';
    
    try {
        // Extract text from PDF using PDF.js
        const text = await extractPDFText(file);
        
        // Generate quiz from extracted text
        const quiz = await generateQuizFromPDF(text);
        
        // Store quiz in localStorage
        localStorage.setItem('currentQuiz', JSON.stringify(quiz));
        
        // Redirect to quiz page
        window.location.href = 'quiz.html';
    } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Error processing PDF. Please try again.');
        uploadArea.style.display = 'block';
        loadingContainer.style.display = 'none';
    }
}

async function extractPDFText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                }
                
                resolve(fullText);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// ===== QUIZ PAGE LOGIC =====
let currentQuestionIndex = 0;
let quizData = [];
let userAnswers = [];
let markedQuestions = [];
let timerInterval;
let timeRemaining = 30 * 60; // 30 minutes in seconds
let startTime;

// Initialize quiz on quiz.html
if (window.location.pathname.includes('quiz.html')) {
    initializeQuiz();
}

function initializeQuiz() {
    // Load quiz from localStorage
    const storedQuiz = localStorage.getItem('currentQuiz');
    if (!storedQuiz) {
        alert('No quiz found. Redirecting to home...');
        window.location.href = 'index.html';
        return;
    }
    
    quizData = JSON.parse(storedQuiz);
    userAnswers = new Array(quizData.length).fill(null);
    markedQuestions = new Array(quizData.length).fill(false);
    startTime = Date.now();
    
    // Initialize UI
    displayQuestion();
    generateQuestionGrid();
    startTimer();
    updateSummary();
}

function displayQuestion() {
    const question = quizData[currentQuestionIndex];
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quizData.length;
    document.getElementById('questionText').textContent = question.question;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `
            <input type="radio" name="option" id="opt${index}" value="${index}" 
                ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
            <label for="opt${index}">${option}</label>
        `;
        optionDiv.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update button visibility
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    if (currentQuestionIndex === quizData.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'flex';
    } else {
        document.getElementById('nextBtn').style.display = 'flex';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    document.querySelectorAll('.option input')[index].checked = true;
    updateSummary();
    updateQuestionGrid();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function markForReview() {
    markedQuestions[currentQuestionIndex] = !markedQuestions[currentQuestionIndex];
    updateSummary();
    updateQuestionGrid();
}

function generateQuestionGrid() {
    const grid = document.getElementById('questionGrid');
    grid.innerHTML = '';
    
    quizData.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.textContent = index + 1;
        btn.addEventListener('click', () => {
            currentQuestionIndex = index;
            displayQuestion();
        });
        grid.appendChild(btn);
    });
    updateQuestionGrid();
}

function updateQuestionGrid() {
    const buttons = document.querySelectorAll('#questionGrid button');
    buttons.forEach((btn, index) => {
        btn.classList.remove('attempted', 'marked');
        if (userAnswers[index] !== null) {
            btn.classList.add('attempted');
        }
        if (markedQuestions[index]) {
            btn.classList.add('marked');
        }
    });
}

function updateSummary() {
    const attempted = userAnswers.filter(a => a !== null).length;
    const skipped = quizData.length - attempted;
    const marked = markedQuestions.filter(m => m).length;
    
    document.getElementById('summaryTotal').textContent = quizData.length;
    document.getElementById('summaryAttempted').textContent = attempted;
    document.getElementById('summarySkipped').textContent = skipped;
    document.getElementById('summaryMarked').textContent = marked;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function submitQuiz() {
    clearInterval(timerInterval);
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const results = {
        answers: userAnswers,
        quiz: quizData,
        timeTaken: timeTaken,
        marked: markedQuestions
    };
    
    localStorage.setItem('quizResults', JSON.stringify(results));
    window.location.href = 'result.html';
}

// ===== RESULT PAGE =====
if (window.location.pathname.includes('result.html')) {
    displayResults();
}

function displayResults() {
    const results = JSON.parse(localStorage.getItem('quizResults'));
    if (!results) {
        alert('No results found. Redirecting to home...');
        window.location.href = 'index.html';
        return;
    }
    
    const { answers, quiz, timeTaken, marked } = results;
    
    // Calculate score
    let correct = 0;
    let wrong = 0;
    
    answers.forEach((answer, index) => {
        if (answer === quiz[index].correctAnswer) {
            correct++;
        } else if (answer !== null) {
            wrong++;
        }
    });
    
    // Display score
    document.getElementById('scoreText').textContent = correct;
    document.getElementById('totalScore').textContent = quiz.length;
    
    // Display stats
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    document.getElementById('timeTaken').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('wrongCount').textContent = wrong;
    document.getElementById('markedCount').textContent = marked.filter(m => m).length;
    
    // Display question review
    const reviewList = document.getElementById('reviewList');
    quiz.forEach((q, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.style.marginBottom = '30px';
        reviewItem.style.padding = '20px';
        reviewItem.style.backgroundColor = 'var(--gray-light)';
        reviewItem.style.borderRadius = '10px';
        
        const isCorrect = answers[index] === q.correctAnswer;
        const statusColor = isCorrect ? '#28a745' : (answers[index] !== null ? '#dc3545' : '#6c757d');
        
        reviewItem.innerHTML = `
            <h3 style="margin-bottom: 15px;">Question ${index + 1}</h3>
            <p style="font-size: 1.1rem; margin-bottom: 15px;">${q.question}</p>
            <p style="color: ${statusColor}; font-weight: 600;">
                Your answer: ${answers[index] !== null ? q.options[answers[index]] : 'Not attempted'}
            </p>
            <p style="color: #28a745; font-weight: 600;">
                Correct answer: ${q.options[q.correctAnswer]}
            </p>
        `;
        reviewList.appendChild(reviewItem);
    });
}

function restartQuiz() {
    localStorage.removeItem('quizResults');
    window.location.href = 'quiz.html';
}

// Set PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
