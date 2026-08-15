from flask import Flask, render_template, request, send_from_directory
import pymupdf
import os
import re
from werkzeug.utils import secure_filename
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "uploads")

STOP_WORDS = {
    "a","an","the","and","or","of","to","in","on","for","with","is","are","was","were",
    "be","by","as","at","from","it","this","that","these","those","should","would","could",
    "can","will","may","must","do","does","did","done","your","you","we","our","they","their",
    "job","role","candidate","intern","junior","senior","based","support","tasks","projects",
    "focusing","focussing","skills","skill","code","vs","looking","who","responsibilities",
    "required","needed","want","seeking","assist","assisting","working","build","building",
    "using","use","used","help","helping","learn","learns","interested","looking","seeking",
    "responsibility","responsibilities","description","requirements","requirement","experience"
}

def extract_text_from_pdf(file_path):
    text = ""
    pdf = pymupdf.open(file_path)
    for page in pdf:
        text += page.get_text()
    return text

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    words = text.split()
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]

def extract_keywords(text, top_n=20):
    words = clean_text(text)
    seen = []
    for w in words:
        if w not in seen:
            seen.append(w)
    return seen[:top_n]

def extract_phrases(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    common_phrases = [
        "machine learning", "deep learning", "full stack", "front end", "frontend",
        "back end", "backend", "data science", "web development", "app development",
        "mobile app", "mobile development", "ethical hacking", "penetration testing",
        "cyber security", "cybersecurity", "generative ai", "artificial intelligence",
        "design system", "product design", "ui ux", "user experience", "user interface",
        "project management", "software development", "cloud computing", "api development"
    ]

    found = []
    for phrase in common_phrases:
        if phrase in text:
            found.append(phrase)
    return found

def get_match_score(resume_text, jd_text):
    resume_clean = clean_text(resume_text)
    jd_clean = clean_text(jd_text)

    resume_joined = " ".join(resume_clean)
    jd_joined = " ".join(jd_clean)

    if not resume_joined.strip() or not jd_joined.strip():
        return 0, [], []

    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    vectors = vectorizer.fit_transform([resume_joined, jd_joined])
    similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
    tfidf_score = round(similarity * 100, 2)

    jd_keywords = extract_keywords(jd_text, top_n=20)
    jd_phrases = extract_phrases(jd_text)

    resume_words = set(resume_clean)
    jd_words = set(jd_keywords)

    matched_words = list(resume_words & jd_words)
    missing_words = list(jd_words - resume_words)

    resume_phrase_text = " ".join(resume_clean)
    jd_phrase_matches = [p for p in jd_phrases if p in resume_phrase_text and p in jd_text.lower()]

    keyword_score = 0
    if jd_words:
        keyword_score += (len(matched_words) / len(jd_words)) * 70
    if jd_phrases:
        keyword_score += (len(jd_phrase_matches) / len(jd_phrases)) * 30

    final_score = round((tfidf_score * 0.6) + (keyword_score * 0.4), 2)
    final_score = min(final_score, 100)

    combined_matched = list(dict.fromkeys(matched_words + jd_phrase_matches))
    combined_missing = list(dict.fromkeys(missing_words))

    return final_score, combined_matched[:20], combined_missing[:20]

@app.route("/")
def home():
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return app.send_static_file("index.html")
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    if "resume" not in request.files:
        return "No file part found"

    resume_file = request.files["resume"]
    job_desc = request.form.get("job_desc", "")

    if resume_file.filename == "":
        return "Please upload a resume file"

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    filename = secure_filename(resume_file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    resume_file.save(file_path)

    resume_text = extract_text_from_pdf(file_path)
    score, matched, missing = get_match_score(resume_text, job_desc)

    return render_template(
        "result.html",
        score=score,
        matched=matched,
        missing=missing
    )

@app.route("/<path:path>")
def serve_frontend(path):
    file_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(file_path) and not os.path.isdir(file_path):
        return app.send_static_file(path)
    return app.send_static_file("index.html")

if __name__ == "__main__":
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    app.run(debug=True)