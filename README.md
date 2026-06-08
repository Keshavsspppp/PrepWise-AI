# PrepWise AI — Intelligent Study Assistant Platform

> An AI-powered full-stack study platform that helps students prepare smarter using RAG-based note analysis, personalized quizzes, forgetting curve revision scheduling, learning DNA profiling, exam readiness scoring, and AI mock viva examinations.

---

## ✨ Features at a Glance

| Module | Description |
|--------|-------------|
| 📚 **Notes Manager** | Upload PDF study notes, auto-index into ChromaDB via RAG |
| 🤖 **AI Study Assistant** | Ask questions from your notes — Gemini answers grounded in your content |
| 🎯 **AI Quiz Generator** | Auto-generate MCQ / Short Answer / Mixed quizzes from uploaded notes |
| 🧬 **Learning DNA** | Behavioral profiling — consistency, retention, study discipline scores |
| 🔁 **Smart Revision Engine** | Ebbinghaus Forgetting Curve — predicts knowledge decay & schedules revisions |
| 🎓 **Exam Readiness** | Multi-factor weighted score predicting exam preparedness |
| 🎤 **AI Mock Viva** | RAG-powered oral examination with real-time Gemini answer evaluation |

---

## 🛠️ Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** — Async Python web framework
- **[MongoDB](https://www.mongodb.com/)** + **[Motor](https://motor.readthedocs.io/)** — Async NoSQL database
- **[ChromaDB](https://www.trychroma.com/)** — Persistent vector store for RAG
- **[Sentence Transformers](https://www.sbert.net/)** — `all-MiniLM-L6-v2` embeddings
- **[Google Gemini 2.5 Flash](https://ai.google.dev/)** — LLM for answers, quiz, evaluation, recommendations
- **[PyPDF](https://pypdf.readthedocs.io/)** — PDF text extraction
- **[LangChain](https://www.langchain.com/)** — Text chunking pipeline
- **JWT** — Authentication via `PyJWT`
- **Pydantic v2** — Request/response validation

### Frontend
- **[React 18](https://react.dev/)** + **[Vite](https://vitejs.dev/)** — Modern SPA framework
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first dark theme styling
- **[React Router v6](https://reactrouter.com/)** — Hash-based client-side routing
- **[Axios](https://axios-http.com/)** — HTTP client with JWT interceptor
- **[Lucide React](https://lucide.dev/)** — Icon library
- **Custom SVG Charts** — Zero-dependency retention, readiness, DNA charts

---

## 📁 Project Structure

```
aihelper/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic settings (env vars)
│   │   │   ├── rag.py             # ChromaDB + Gemini RAG pipeline
│   │   │   └── security.py        # JWT helpers
│   │   ├── db/
│   │   │   └── mongodb.py         # Motor async MongoDB connection
│   │   ├── models/
│   │   │   └── user.py            # Pydantic user schemas
│   │   └── routes/
│   │       ├── auth.py            # Register / Login / Profile
│   │       ├── notes.py           # Upload notes, RAG indexing
│   │       ├── ai.py              # RAG Q&A chat endpoint
│   │       ├── quiz.py            # Quiz generation & results
│   │       ├── learning_dna.py    # Learning DNA engine
│   │       ├── revision.py        # Ebbinghaus forgetting curve engine
│   │       ├── readiness.py       # Exam readiness calculator
│   │       └── viva.py            # AI Mock Viva assistant
│   ├── .env                       # Environment variables (not committed)
│   ├── .gitignore
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js           # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx / Register.jsx
    │   │   ├── UploadNotes.jsx / NotesList.jsx
    │   │   ├── AskAI.jsx
    │   │   ├── QuizGenerator.jsx / QuizAttempt.jsx / QuizResult.jsx / QuizHistory.jsx
    │   │   ├── LearningDNA.jsx
    │   │   ├── RevisionDashboard.jsx / RevisionHistory.jsx
    │   │   ├── ExamReadiness.jsx
    │   │   └── MockViva.jsx / VivaSession.jsx / VivaResults.jsx / VivaHistory.jsx
    │   └── components/            # 35 reusable UI components
    ├── .gitignore
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally on port `27017`
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/prepwise-ai.git
cd prepwise-ai
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb://localhost:27017/studygenie
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CHROMA_PERSIST_DIR=chroma_db
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The API will be available at **`http://localhost:8000`**  
Interactive docs: **`http://localhost:8000/docs`**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **`http://localhost:5173`**

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/studygenie` |
| `JWT_SECRET` | Secret key for JWT signing | *(required)* |
| `GEMINI_API_KEY` | Google Gemini API key | *(required)* |
| `CHROMA_PERSIST_DIR` | ChromaDB storage directory | `chroma_db` |

---

## 📡 API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET`  | `/auth/profile` | Get current user profile |

### Notes & RAG
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/notes/upload` | Upload PDF note (auto-indexed in ChromaDB) |
| `GET`  | `/notes/` | List all user notes |
| `DELETE` | `/notes/{id}` | Delete note and purge vectors |
| `POST` | `/ai/chat` | Ask questions from uploaded notes (RAG) |

### Quiz System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/quiz/generate` | Generate quiz from notes |
| `POST` | `/quiz/submit` | Submit quiz answers |
| `GET`  | `/quiz/history` | Past quiz sessions |
| `GET`  | `/quiz/results/{id}` | Detailed quiz result |

### Learning DNA
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/learning-dna` | Get learning profile |
| `GET`  | `/learning-dna/analytics` | Activity analytics |
| `POST` | `/learning-dna/recalculate` | Force recalculate DNA |

### Smart Revision (Forgetting Curve)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/revision/retention` | Retention scores for all topics |
| `GET`  | `/revision/recommendations` | Prioritized revision list |
| `GET`  | `/revision/upcoming` | Today / Tomorrow / This Week schedule |
| `GET`  | `/revision/history` | Revision completion log |
| `POST` | `/revision/complete` | Mark topic revision done |
| `POST` | `/revision/recalculate` | Refresh scores + Gemini AI tips |

### Exam Readiness
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/readiness/overall` | Full readiness profile |
| `GET`  | `/readiness/subjects` | Subject-wise scores |
| `GET`  | `/readiness/topics` | Topic-wise scores |
| `POST` | `/readiness/recalculate` | Recalculate + Gemini recommendations |

### AI Mock Viva
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/viva/start` | Start session, get first question |
| `POST` | `/viva/answer` | Submit answer, get evaluation + next question |
| `POST` | `/viva/complete` | End session, generate report |
| `GET`  | `/viva/results/{id}` | Full session results |
| `GET`  | `/viva/history` | Past viva sessions |

---

## 🧠 Core Algorithms

### RAG Pipeline
1. Upload PDF → extract text with PyPDF
2. Chunk text (size: 1000, overlap: 200)
3. Embed with `sentence-transformers/all-MiniLM-L6-v2`
4. Store in **ChromaDB** with user/note metadata
5. Query: embed question → cosine similarity search → top-5 chunks → Gemini answers strictly from context

### Ebbinghaus Forgetting Curve
```
R = 100 × e^(−t / S)
```
- `R` = retention percentage
- `t` = days elapsed since last study/revision  
- `S` = stability (increases with each revision and quiz score)
- Stability table: `[1, 3, 7, 14, 21, 30]` days × score modifier `[0.6–1.6]`

### Exam Readiness Score
```
Score = 0.30 × Quiz Performance
      + 0.20 × Retention Score
      + 0.15 × Study Consistency
      + 0.15 × Revision Completion
      + 0.10 × Subject Coverage
      + 0.10 × Learning DNA Score
```

---

## 🗄️ MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `users` | User accounts |
| `notes` | Uploaded note metadata |
| `quizzes` | Generated quiz documents |
| `quiz_results` | Student quiz submissions |
| `user_activities` | Study activity log |
| `learning_dna` | Learning DNA profiles |
| `topic_retention` | Ebbinghaus retention scores per topic |
| `revision_history` | Completed revision log |
| `revision_ai_recommendations` | Gemini revision tips |
| `exam_readiness` | Readiness score cache |
| `viva_sessions` | Mock viva session state |
| `viva_results` | Viva evaluation results |

---

## 📦 Requirements

### Backend (`requirements.txt`)

```
fastapi
uvicorn[standard]
motor
pydantic[email]
pydantic-settings
pyjwt
passlib[bcrypt]
python-multipart
pypdf
chromadb
sentence-transformers
google-generativeai
python-dotenv
```

### Frontend

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x"
  }
}
```

---

## 🖥️ Pages & Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Overview stats and quick actions |
| `/notes/upload` | Upload Notes | PDF upload with subject tagging |
| `/notes/list` | Notes Manager | View, manage, delete uploaded notes |
| `/ai/ask` | AI Study Assistant | RAG-powered chat from your notes |
| `/quiz/generator` | Quiz Generator | Configure and generate quizzes |
| `/quiz/attempt/:id` | Quiz Attempt | Live quiz interface |
| `/quiz/result` | Quiz Results | Score analysis and feedback |
| `/quiz/history` | Quiz History | All past quiz sessions |
| `/dna` | Learning DNA | Behavioral learning profile |
| `/revision` | Smart Revision | Forgetting curve dashboard |
| `/revision/history` | Revision History | Completed revision log |
| `/readiness` | Exam Readiness | Multi-factor readiness score |
| `/viva` | Mock Viva Setup | Configure and start viva |
| `/viva/session` | Viva Session | Live Q&A with AI evaluation |
| `/viva/results` | Viva Results | Score, grade, and feedback report |
| `/viva/history` | Viva History | All past viva sessions |

---

## 🔒 Security

- All routes (except `/auth/register` and `/auth/login`) are **JWT-protected**
- Passwords are **bcrypt-hashed** before storage
- CORS is configured for `localhost:5173` (update for production)
- ChromaDB queries are scoped by `user_id` to prevent data leakage between users

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

Built with ❤️ using FastAPI + React + Google Gemini AI
