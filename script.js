// PDF file upload handler
const pdfInput = document.getElementById("pdfUpload");
const fileNamePreview = document.getElementById("fileNamePreview");
const explainBtn = document.getElementById("explainBtn");
const outputSection = document.getElementById("outputSection");
const outputBox = document.getElementById("outputBox");
let uploadedPdfText = ""; // Variable to hold the extracted text from PDF

// File selection handler
pdfInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) {
    fileNamePreview.classList.add("hidden");
    return;
  }

  if (file.type !== "application/pdf") {
    alert("Please upload a valid PDF file.");
    pdfInput.value = "";
    fileNamePreview.classList.add("hidden");
    return;
  }

  fileNamePreview.textContent = `✅ Selected: ${file.name}`;
  fileNamePreview.classList.remove("hidden");

  // Extract PDF text using pdf.js
  extractTextFromPdf(file).then((text) => {
    uploadedPdfText = text;
    console.log("Extracted PDF Text:", uploadedPdfText); // You can inspect the extracted text
  }).catch((error) => {
    alert("Error extracting text from PDF: " + error.message);
  });
});

// PDF extraction using pdf.js
async function extractTextFromPdf(file) {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async () => {
      const pdfData = new Uint8Array(fileReader.result);

      try {
        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        let textContent = "";

        // Iterate through all the pages and extract text
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();

          // Concatenate text content from each page
          content.items.forEach((item) => {
            textContent += item.str + " ";
          });
        }

        resolve(textContent); // Return the extracted text
      } catch (error) {
        reject(error); // Reject in case of error
      }
    };

    fileReader.onerror = (error) => reject(error);

    // Read the file as a binary string
    fileReader.readAsArrayBuffer(file);
  });
}

// AI Explanation handler using the provided API key
explainBtn.addEventListener("click", async () => {
  if (!uploadedPdfText) {
    alert("Please upload a PDF medical report first.");
    return;
  }

  outputSection.classList.remove("hidden");
  outputBox.textContent = "⏳ Processing your report...";

  try {
    const explanation = await getAPIExplanation(uploadedPdfText);
    outputBox.textContent = explanation;
  } catch (error) {
    outputBox.textContent = "⚠️ Something went wrong. Check the console for details.";
    console.error("API Error:", error);
  }
});

// Function to get explanation using the provided API key
async function getAPIExplanation(text) {
  const apiKey = "AIzaSyCApMBQlVnsXqXWp7bkat9RomvvMx-v7pI"; // Your actual API key
  const apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"; // API endpoint

  const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: text }] // Sending the extracted PDF text to the API
      }]
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error from API:", errorData);
    if (response.status === 401) {
      throw new Error("API error: Unauthorized. Please check your API key and permissions.");
    }
    throw new Error("API error: " + (errorData.message || "Unknown error occurred."));
  }

  const data = await response.json();
  console.log("API Response:", data); // Log the entire response for debugging

  // Check if the response contains the expected structure