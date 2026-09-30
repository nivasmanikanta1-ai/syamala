import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();
const { Pool } = pg;
const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploads = path.resolve("uploads");
if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
app.use("/uploads", express.static(uploads));

const upload = multer({
  dest: uploads,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(30) DEFAULT 'candidate',
      experience_years NUMERIC(4,1) DEFAULT 0,
      education TEXT,
      location VARCHAR(120),
      preferred_location VARCHAR(120),
      skills TEXT[] DEFAULT '{}',
      resume_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      company VARCHAR(180) NOT NULL,
      description TEXT,
      location VARCHAR(120),
      work_mode VARCHAR(40) DEFAULT 'On-site',
      min_experience NUMERIC(4,1) DEFAULT 0,
      max_experience NUMERIC(4,1),
      salary VARCHAR(100),
      skills TEXT[] DEFAULT '{}',
      deadline DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      status VARCHAR(40) DEFAULT 'Applied',
      applied_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id SERIAL PRIMARY KEY,
      category VARCHAR(60) NOT NULL,
      question TEXT NOT NULL
    );
  `);

  const count = await pool.query("SELECT COUNT(*) FROM jobs");
  if (Number(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO jobs
      (title, company, description, location, work_mode, min_experience, max_experience, salary, skills, deadline)
      VALUES
      ('Junior Web Developer', 'CareerTech Solutions', 'Build responsive web interfaces and work with frontend technologies.', 'Visakhapatnam', 'Hybrid', 0, 1, '₹2.5–4 LPA', ARRAY['HTML','CSS','JavaScript','React'], CURRENT_DATE + 20),
      ('Cloud Support Trainee', 'CloudNova', 'Support cloud infrastructure and basic AWS services.', 'Kakinada', 'On-site', 0, 1, '₹2.4–3.5 LPA', ARRAY['AWS','Linux','Git'], CURRENT_DATE + 15),
      ('DevOps Trainee', 'StackWorks', 'Learn and support CI/CD and container deployment workflows.', 'Visakhapatnam', 'On-site', 0, 1, '₹3–4 LPA', ARRAY['Docker','Jenkins','Linux','Git'], CURRENT_DATE + 25),
      ('Frontend Developer', 'PixelForge', 'Develop production UI components with React.', 'Hyderabad', 'Hybrid', 1, 3, '₹5–8 LPA', ARRAY['HTML','CSS','JavaScript','React'], CURRENT_DATE + 10);
    `);
  }

  const qcount = await pool.query("SELECT COUNT(*) FROM interview_questions");
  if (Number(qcount.rows[0].count) === 0) {
    const questions = [
      ["HTML", "What is semantic HTML and why is it useful?"],
      ["CSS", "What is the difference between Flexbox and Grid?"],
      ["JavaScript", "What is the DOM?"],
      ["React", "What is a React component?"],
      ["AWS", "What is Amazon EC2?"],
      ["Docker", "What is a Docker container?"],
      ["DevOps", "What is CI/CD?"],
      ["HR", "Tell me about yourself as a fresher."],
      ["HR", "Why should we hire you?"],
      ["Aptitude", "How do you approach solving a problem you have never seen before?"]
    ];
    for (const [category, question] of questions) {
      await pool.query(
        "INSERT INTO interview_questions(category, question) VALUES($1,$2)",
        [category, question]
      );
    }
  }
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Login required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) return skills.map(s => String(s).trim()).filter(Boolean);
  return String(skills || "").split(",").map(s => s.trim()).filter(Boolean);
}

function jobMatch(job, user) {
  const userSkills = new Set(normalizeSkills(user.skills).map(s => s.toLowerCase()));
  const jobSkills = normalizeSkills(job.skills);
  const matched = jobSkills.filter(s => userSkills.has(s.toLowerCase()));
  const skillScore = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 60) : 0;

  const exp = Number(user.experience_years || 0);
  const min = Number(job.min_experience || 0);
  const max = job.max_experience == null ? Infinity : Number(job.max_experience);
  const experienceMatch = exp >= min && exp <= max;
  const experienceScore = experienceMatch ? 25 : 0;

  const locationMatch = !user.preferred_location ||
    !job.location ||
    job.location.toLowerCase() === user.preferred_location.toLowerCase() ||
    job.work_mode?.toLowerCase() === "remote";
  const locationScore = locationMatch ? 15 : 0;

  return {
    score: Math.min(100, skillScore + experienceScore + locationScore),
    matchedSkills: matched,
    experienceMatch,
    locationMatch
  };
}

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Career Stack" }));

app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role",
      [name.trim(), email.toLowerCase().trim(), hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "Email already registered" });
    throw e;
  }
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [String(email || "").toLowerCase().trim()]);
  if (!result.rows[0] || !(await bcrypt.compare(password || "", result.rows[0].password_hash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const user = result.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  delete user.password_hash;
  res.json({ token, user });
}));

app.get("/api/profile", auth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT id,name,email,role,experience_years,education,location,preferred_location,skills,resume_url FROM users WHERE id=$1",
    [req.user.id]
  );
  res.json(result.rows[0]);
}));

app.put("/api/profile", auth, asyncHandler(async (req, res) => {
  const { name, experience_years, education, location, preferred_location, skills } = req.body;
  const result = await pool.query(`
    UPDATE users SET name=$1, experience_years=$2, education=$3, location=$4,
    preferred_location=$5, skills=$6 WHERE id=$7
    RETURNING id,name,email,role,experience_years,education,location,preferred_location,skills,resume_url
  `, [name, Number(experience_years || 0), education || "", location || "", preferred_location || "", normalizeSkills(skills), req.user.id]);
  res.json(result.rows[0]);
}));

app.post("/api/profile/resume", auth, upload.single("resume"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Resume file is required" });
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (![".pdf", ".doc", ".docx"].includes(ext)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "Only PDF, DOC and DOCX files are allowed" });
  }
  const newPath = `${req.file.path}${ext}`;
  fs.renameSync(req.file.path, newPath);
  const url = `/uploads/${path.basename(newPath)}`;
  await pool.query("UPDATE users SET resume_url=$1 WHERE id=$2", [url, req.user.id]);
  res.json({ resume_url: url });
}));

app.get("/api/jobs", auth, asyncHandler(async (req, res) => {
  const userResult = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
  const user = userResult.rows[0];
  const { search, location, mode } = req.query;
  let query = "SELECT * FROM jobs WHERE 1=1";
  const params = [];
  if (search) { params.push(`%${search}%`); query += ` AND (title ILIKE $${params.length} OR company ILIKE $${params.length})`; }
  if (location) { params.push(`%${location}%`); query += ` AND location ILIKE $${params.length}`; }
  if (mode) { params.push(mode); query += ` AND work_mode=$${params.length}`; }
  query += " ORDER BY created_at DESC";
  const result = await pool.query(query, params);
  const jobs = result.rows.map(job => ({ ...job, match: jobMatch(job, user) }));
  jobs.sort((a,b) => b.match.score - a.match.score);
  res.json(jobs);
}));

app.get("/api/jobs/:id", auth, asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: "Job not found" });
  const user = (await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])).rows[0];
  res.json({ ...result.rows[0], match: jobMatch(result.rows[0], user) });
}));

app.post("/api/jobs/:id/apply", auth, asyncHandler(async (req, res) => {
  try {
    await pool.query("INSERT INTO applications(user_id,job_id) VALUES($1,$2)", [req.user.id, req.params.id]);
    res.status(201).json({ message: "Application submitted" });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "Already applied to this job" });
    throw e;
  }
}));

app.get("/api/applications", auth, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT a.id,a.status,a.applied_at,j.id AS job_id,j.title,j.company,j.location,j.work_mode
    FROM applications a JOIN jobs j ON j.id=a.job_id
    WHERE a.user_id=$1 ORDER BY a.applied_at DESC
  `, [req.user.id]);
  res.json(result.rows);
}));

app.get("/api/interview/questions", auth, asyncHandler(async (req, res) => {
  const { category } = req.query;
  if (category) {
    const result = await pool.query("SELECT * FROM interview_questions WHERE category=$1 ORDER BY id", [category]);
    return res.json(result.rows);
  }
  const result = await pool.query("SELECT * FROM interview_questions ORDER BY category,id");
  res.json(result.rows);
}));

app.get("/api/dashboard", auth, asyncHandler(async (req, res) => {
  const user = (await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])).rows[0];
  const applications = await pool.query("SELECT status, COUNT(*)::int count FROM applications WHERE user_id=$1 GROUP BY status", [req.user.id]);
  const jobs = await pool.query("SELECT * FROM jobs ORDER BY created_at DESC");
  const recommended = jobs.rows.map(j => ({...j, match: jobMatch(j,user)})).sort((a,b)=>b.match.score-a.match.score).slice(0,5);
  res.json({
    user: { name: user.name, experience_years: user.experience_years, skills: user.skills },
    applications: applications.rows,
    recommended
  });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", detail: process.env.NODE_ENV === "development" ? err.message : undefined });
});

initDb().then(() => {
  app.listen(port, () => console.log(`Career Stack server running on ${port}`));
}).catch(err => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});
