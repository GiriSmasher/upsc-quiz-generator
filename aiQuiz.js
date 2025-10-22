/**
 * AI Quiz Generator Module
 * 
 * This module contains the logic for generating quiz questions from PDF text.
 * Currently uses a placeholder algorithm with sample questions.
 * 
 * TO INTEGRATE REAL AI (Google Gemini/Palm or OpenAI GPT):
 * 1. Get your API key from Google AI Studio or OpenAI
 * 2. Replace the generateQuizFromPDF function below with actual API calls
 * 3. Add your API key to the configuration
 * 
 * Example integration points:
 * - Google Gemini API: https://ai.google.dev/
 * - OpenAI GPT API: https://platform.openai.com/
 */

// ===== CONFIGURATION =====
const QUIZ_CONFIG = {
    numberOfQuestions: 10,
    questionsPerPage: 1,
    // Add your API key here when integrating real AI
    apiKey: 'YOUR_API_KEY_HERE',
    apiEndpoint: 'YOUR_API_ENDPOINT_HERE'
};

/**
 * Main function to generate quiz from extracted PDF text
 * @param {string} pdfText - The extracted text from PDF
 * @returns {Promise<Array>} - Array of quiz questions
 */
async function generateQuizFromPDF(pdfText) {
    console.log('Generating quiz from PDF text...');
    console.log('Text length:', pdfText.length);
    
    // PLACEHOLDER: This is where you'll integrate actual AI
    // For now, using a sample quiz generator
    
    // Option 1: Use the placeholder function below
    const generatedQuiz = generatePlaceholderQuiz(pdfText);
    return validateQuizData(generatedQuiz);
    
    // Option 2: Integrate with Google Gemini API (uncomment when ready)
    // const generatedQuiz = await generateWithGemini(pdfText);
    // return validateQuizData(generatedQuiz);
    
    // Option 3: Integrate with OpenAI GPT (uncomment when ready)
    // return await generateWithOpenAI(pdfText);
}

/**
 * Placeholder quiz generator
 * Generates sample questions based on text content
 * Replace this with actual AI integration
 */
function generatePlaceholderQuiz(text) {
    // Extract some keywords from the text for context-aware questions
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = [...new Set(words)].filter(w => w.length > 5);
    
    // Sample quiz structure
    const sampleQuiz = [
        {
            question: "What is the primary focus of this document?",
            options: [
                "General knowledge and concepts",
                "Technical specifications",
                "Historical events",
                "Scientific theories"
            ],
            correctAnswer: 0
        },
        {
            question: "Based on the content, which area does this material cover?",
            options: [
                "Arts and Literature",
                "Science and Technology",
                "History and Geography",
                "Current Affairs"
            ],
            correctAnswer: 2
        },
        {
            question: "What type of examination is this material most suitable for?",
            options: [
                "Competitive Examinations",
                "School Tests",
                "Professional Certifications",
                "Language Proficiency"
            ],
            correctAnswer: 0
        },
        {
            question: "The document emphasizes which of the following?",
            options: [
                "Theoretical concepts",
                "Practical applications",
                "Both theory and practice",
                "Neither theory nor practice"
            ],
            correctAnswer: 2
        },
        {
            question: "What is the recommended approach to study this material?",
            options: [
                "Memorization only",
                "Understanding concepts",
                "Practice questions",
                "All of the above"
            ],
            correctAnswer: 3
        },
        {
            question: "Which of the following best describes the content structure?",
            options: [
                "Chronological order",
                "Topic-based organization",
                "Question-answer format",
                "Case study approach"
            ],
            correctAnswer: 1
        },
        {
            question: "The material is most relevant for which type of learner?",
            options: [
                "Beginners",
                "Intermediate level",
                "Advanced students",
                "All levels"
            ],
            correctAnswer: 3
        },
        {
            question: "What is the key takeaway from this document?",
            options: [
                "Factual information",
                "Analytical skills",
                "Critical thinking",
                "All of the above"
            ],
            correctAnswer: 3
        },
        {
            question: "How should this material be used for best results?",
            options: [
                "Read once thoroughly",
                "Make notes and revise",
                "Practice with mock tests",
                "All of the above"
            ],
            correctAnswer: 3
        },
        {
            question: "The document is best suited for preparation of?",
            options: [
                "UPSC Civil Services",
                "State PSC Exams",
                "Other Competitive Exams",
                "All of the above"
            ],
            correctAnswer: 3
        }
    ];
    
    // Return only the number of questions specified in config
    return sampleQuiz.slice(0, QUIZ_CONFIG.numberOfQuestions);
}

function validateQuizData(quiz) {
    if (!quiz || !Array.isArray(quiz) || quiz.length < 10 || quiz.length > 20) {
        throw new Error('Invalid quiz data: Question count must be between 10 and 20.');
    }

    const validatedQuiz = [];
    const seenQuestions = new Set();

    for (const question of quiz) {
        if (!question.question || typeof question.question !== 'string' || question.question.trim() === '') {
            console.warn('Skipping empty question.');
            continue;
        }

        if (seenQuestions.has(question.question.trim().toLowerCase())) {
            console.warn('Skipping duplicate question.');
            continue;
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
            throw new Error(`Invalid quiz data: Question "${question.question}" does not have 4 options.`);
        }

        const cleanedOptions = question.options.map(opt => typeof opt === 'string' ? opt.trim() : '');
        if (cleanedOptions.some(opt => opt === '')) {
            console.warn(`Skipping question "${question.question}" due to empty options.`);
            continue;
        }

        validatedQuiz.push({
            ...question,
            question: question.question.trim(),
            options: cleanedOptions,
        });
        seenQuestions.add(question.question.trim().toLowerCase());
    }

    if (validatedQuiz.length === 0) {
        throw new Error('Invalid quiz data: No valid questions found.');
    }

    return validatedQuiz;
}

/**
 * INTEGRATION TEMPLATE: Google Gemini API
 * Uncomment and configure when ready to use
 */
/*
async function generateWithGemini(text) {
    const API_KEY = QUIZ_CONFIG.apiKey;
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    const prompt = `Based on the following text, generate ${QUIZ_CONFIG.numberOfQuestions} multiple choice questions suitable for UPSC preparation. 
    
    For each question, provide:
    - A clear question
    - 4 options (labeled A, B, C, D)
    - The correct answer index (0-3)
    
    Format the response as a JSON array.
    
    Text: ${text.substring(0, 5000)}
    
    Return ONLY valid JSON in this format:
    [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;
    
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // Parse the JSON response
        const quiz = JSON.parse(generatedText);
        return quiz;
    } catch (error) {
        console.error('Error generating quiz with Gemini:', error);
        // Fallback to placeholder
        return generatePlaceholderQuiz(text);
    }
}
*/

/**
 * INTEGRATION TEMPLATE: OpenAI GPT API
 * Uncomment and configure when ready to use
 */
/*
async function generateWithOpenAI(text) {
    const API_KEY = QUIZ_CONFIG.apiKey;
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const prompt = `Based on the following text, generate ${QUIZ_CONFIG.numberOfQuestions} multiple choice questions suitable for UPSC preparation. Return only valid JSON.
    
    Text: ${text.substring(0, 5000)}
    
    Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        const generatedText = data.choices[0].message.content;
        
        // Parse the JSON response
        const quiz = JSON.parse(generatedText);
        return quiz;
    } catch (error) {
        console.error('Error generating quiz with OpenAI:', error);
        // Fallback to placeholder
        return generatePlaceholderQuiz(text);
    }
}
*/

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateQuizFromPDF };
}
