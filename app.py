from flask import Flask, render_template, request, send_from_directory, jsonify
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
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB upload limit

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

# Skills the screener knows about: display name -> ways it may be written in text
SKILLS = {
    "Python": ["python"], "Java": ["java"], "C++": ["c++"], "JavaScript": ["javascript", "js"],
    "TypeScript": ["typescript"], "SQL": ["sql"], "HTML": ["html", "html5"], "CSS": ["css", "css3"],
    "React": ["react", "reactjs", "react js"], "Node.js": ["node js", "nodejs"],
    "Flask": ["flask"], "Django": ["django"], "FastAPI": ["fastapi", "fast api"],
    "REST APIs": ["rest api", "rest apis", "restful api", "restful apis"], "JSON": ["json"],
    "PostgreSQL": ["postgresql", "postgres"], "MySQL": ["mysql"], "SQLite": ["sqlite"],
    "MongoDB": ["mongodb", "mongo db"], "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning"], "Data Science": ["data science"],
    "NLP": ["nlp", "natural language processing"], "Pandas": ["pandas"], "NumPy": ["numpy"],
    "Scikit-learn": ["scikit learn", "sklearn"], "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch"], "Matplotlib": ["matplotlib"], "Tableau": ["tableau"],
    "Power BI": ["power bi", "powerbi"], "Excel": ["excel"],
    "Git": ["git"], "GitHub": ["github"], "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"], "Linux": ["linux"], "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"], "GCP": ["gcp", "google cloud"], "Cloud": ["cloud"],
    "Data Structures": ["data structures"], "Algorithms": ["algorithms", "algorithm"],
    "Agile": ["agile", "scrum"], "CI/CD": ["ci cd", "cicd"], "Testing": ["testing", "pytest", "unit tests"],
    "Bootstrap": ["bootstrap"], "Tailwind CSS": ["tailwind", "tailwind css"], "Figma": ["figma"],
    "Problem Solving": ["problem solving"], "Communication": ["communication"],
    "Teamwork": ["teamwork", "team work"],
}


def normalize(text):
    text = re.sub(r"[^a-z0-9+#\s]", " ", text.lower())
    return " " + re.sub(r"\s+", " ", text).strip() + " "


def find_skills(text):
    norm = normalize(text)
    found = []
    for name, variants in SKILLS.items():
        if any(f" {v} " in norm for v in variants):
            found.append(name)
    return found


def get_match_score(resume_text, jd_text):
    resume_clean = clean_text(resume_text)
    jd_clean = clean_text(jd_text)

    resume_joined = " ".join(resume_clean)
    jd_joined = " ".join(jd_clean)

    if not resume_joined.strip() or not jd_joined.strip():
        return 0, [], []

    # Part 1: TF-IDF cosine similarity between the whole resume and the whole job description
    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    vectors = vectorizer.fit_transform([resume_joined, jd_joined])
    similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
    tfidf_score = round(similarity * 100, 2)

    # Part 2: skill coverage - which skills named in the job description appear in the resume
    jd_skills = find_skills(jd_text)
    resume_skills = set(find_skills(resume_text))

    if len(jd_skills) >= 3:
        matched = [s for s in jd_skills if s in resume_skills]
        missing = [s for s in jd_skills if s not in resume_skills]
        skill_score = len(matched) / len(jd_skills) * 100
        final_score = round(skill_score * 0.7 + tfidf_score * 0.3, 2)
        return min(final_score, 100), matched[:20], missing[:20]

    # Fallback for short job descriptions that name few known skills: plain keyword overlap
    jd_keywords = extract_keywords(jd_text, top_n=20)
    resume_words = set(resume_clean)
    jd_words = set(jd_keywords)
    matched_words = [w for w in jd_keywords if w in resume_words]
    missing_words = [w for w in jd_keywords if w not in resume_words]
    keyword_score = (len(matched_words) / len(jd_words) * 100) if jd_words else 0
    final_score = round(tfidf_score * 0.5 + keyword_score * 0.5, 2)
    return min(final_score, 100), matched_words[:20], missing_words[:20]


@app.route("/")
def home():
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return app.send_static_file("index.html")
    return render_template("index.html")

def build_feedback(score, matched, missing):
    suggestions = []
    for word in missing[:3]:
        suggestions.append(
            f'The job description mentions "{word}" but your resume does not. '
            f"Add it to your skills or projects if you have used it."
        )
    if score < 50:
        suggestions.append("Rewrite your summary so it uses the same wording as the job description.")
    suggestions.append("Add numbers to your project results, for example the size of data or users served.")
    suggestions.append("Link your GitHub or portfolio so recruiters can see your work.")

    strengths = [f'Your resume already covers "{w}", which the job asks for.' for w in matched[:3]]
    if not strengths:
        strengths = ["No direct keyword matches found yet. Try adding the job's key terms."]

    if missing:
        gap = f"{missing[0]} related skills"
    else:
        gap = "None identified"
    return suggestions, strengths, gap


@app.route("/analyze", methods=["POST"])
def analyze():
    job_desc = request.form.get("job_desc", "")
    resume_text = request.form.get("resume_text", "")
    resume_file = request.files.get("resume")

    if resume_file and resume_file.filename:
        if not resume_file.filename.lower().endswith(".pdf"):
            return jsonify(error="Please upload a PDF file."), 400
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        filename = secure_filename(resume_file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        resume_file.save(file_path)
        try:
            resume_text = extract_text_from_pdf(file_path)
        except Exception:
            return jsonify(error="Could not read this PDF. Try another file."), 400

    if not resume_text.strip():
        return jsonify(error="No readable text found in the resume. Upload a text-based PDF or paste the text."), 400
    if not job_desc.strip():
        return jsonify(error="Please paste the job description."), 400

    score, matched, missing = get_match_score(resume_text, job_desc)
    suggestions, strengths, gap = build_feedback(score, matched, missing)

    return jsonify(
        score=round(score),
        matched=matched,
        missing=missing[:6],
        suggestions=suggestions,
        strengths=strengths,
        experience_gap=gap,
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