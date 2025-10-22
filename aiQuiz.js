/* ---
    UPSC Quiz Generator
    aiQuiz.js
    --- */

/**
 * @file This file contains the placeholder for the AI quiz generation logic.
 * In a production environment, this would be replaced with a call to a
 * backend service that uses a language model like Google's Gemini or PaLM
 * to generate a quiz from the extracted PDF text.
 */

/**
 * Placeholder function to generate a quiz from PDF text.
 * This function returns a static set of 10 multiple-choice questions in JSON format.
 * It mimics the expected output from an AI service.
 *
 * @param {string} text - The text extracted from the user's PDF file.
 * @returns {Array<Object>} An array of question objects.
 */
function generateQuizFromPDF(text) {
    // --- Placeholder for Google AI API (Gemini/PaLM) Integration ---
    // In a real application, you would make an API call here.
    // Example:
    // const response = await fetch('YOUR_BACKEND_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ pdfText: text })
    // });
    // const quizData = await response.json();
    // return quizData;
    // --- End of Placeholder ---

    console.log("Generating quiz from text (using placeholder data):", text.substring(0, 100) + "...");

    // Returning a mock quiz for demonstration purposes.
    return [
        {
            question: "What is the capital of India?",
            options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
            answer: "New Delhi"
        },
        {
            question: "Who was the first Prime Minister of India?",
            options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel", "Dr. B. R. Ambedkar"],
            answer: "Jawaharlal Nehru"
        },
        {
            question: "Which river is known as the 'Ganga of the South'?",
            options: ["Krishna", "Godavari", "Cauvery", "Mahanadi"],
            answer: "Godavari"
        },
        {
            question: "The Indian Parliament consists of:",
            options: ["Lok Sabha only", "Rajya Sabha only", "Lok Sabha and Rajya Sabha", "President, Lok Sabha, and Rajya Sabha"],
            answer: "President, Lok Sabha, and Rajya Sabha"
        },
        {
            question: "When did India gain independence from British rule?",
            options: ["1945", "1947", "1950", "1952"],
            answer: "1947"
        },
        {
            question: "Who is known as the 'Father of the Indian Constitution'?",
            options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel", "Dr. B. R. Ambedkar"],
            answer: "Dr. B. R. Ambedkar"
        },
        {
            question: "What is the national animal of India?",
            options: ["Lion", "Tiger", "Elephant", "Leopard"],
            answer: "Tiger"
        },
        {
            question: "The 'Dandi March' led by Mahatma Gandhi was associated with:",
            options: ["Khilafat Movement", "Non-Cooperation Movement", "Civil Disobedience Movement", "Quit India Movement"],
            answer: "Civil Disobedience Movement"
        },
        {
            question: "Which of the following is a classical dance form of Kerala?",
            options: ["Bharatanatyam", "Kathakali", "Kuchipudi", "Odissi"],
            answer: "Kathakali"
        },
        {
            question: "The highest civilian award in India is:",
            options: ["Padma Vibhushan", "Bharat Ratna", "Padma Bhushan", "Param Vir Chakra"],
            answer: "Bharat Ratna"
        }
    ];
}
