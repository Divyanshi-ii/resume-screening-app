# Resume Screening Web App

A web application that compares a resume PDF with a job description and calculates a match score using text extraction and keyword similarity.

## Features

- Upload a resume in PDF format.
- Extract text from the resume.
- Compare resume content with the job description.
- Display a match score, matched keywords, and missing keywords.
- Built with a Flask backend and a Vite + React frontend.

## Technologies Used

- Python
- Flask
- PyMuPDF
- scikit-learn
- React
- Vite
- TypeScript
- Tailwind CSS

## Project Structure

- `app.py` — Flask backend.
- `templates/` — Flask HTML templates.
- `static/` — CSS files and static assets.
- `frontend/` — React/Vite frontend.
- `requirements.txt` — Python dependencies.
- `frontend/package.json` — Frontend dependencies.

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Divyanshi-ii/resume-screening-app.git
cd resume-screening-app
```

### 2. Create and activate a virtual environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```powershell
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

### 5. Build the frontend

```powershell
cd frontend
npm run build
cd ..
```

### 6. Start the Flask app

```powershell
python app.py
```

Open the application at:

```text
http://127.0.0.1:5000
```

## Project Purpose

This project was created as an internship assignment to demonstrate PDF processing, resume-job matching, frontend and backend integration, and basic text similarity scoring.

## Future Improvements

- Add better keyword extraction.
- Improve scoring accuracy.
- Support DOCX resume upload.
- Add user authentication.
- Store analysis history.
