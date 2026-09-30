import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./styles.css";

const api = axios.create({
  baseURL: "https://syamala-u8lg.onrender.com/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("career_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post(`/auth/${mode}`, form);

      localStorage.setItem(
        "career_token",
        response.data.token
      );

      onLogin(response.data.user);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          Career<span>Stack</span>
        </div>

        <h1>
          {mode === "login"
            ? "Welcome back"
            : "Create your career profile"}
        </h1>

        <p className="muted">
          Jobs matched to your experience, skills and goals.
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            minLength="6"
            required
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary"
          >
            {mode === "login"
              ? "Login"
              : "Register"}
          </button>
        </form>

        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(
              mode === "login"
                ? "register"
                : "login"
            );
            setError("");
          }}
        >
          {mode === "login"
            ? "New here? Create account"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("career_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/profile")
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem("career_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading">
        Loading Career Stack...
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  function logout() {
    localStorage.removeItem("career_token");
    setUser(null);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Career<span>Stack</span>
        </div>

        <nav>
          <button
            className={
              page === "dashboard"
                ? "nav-active"
                : ""
            }
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={
              page === "jobs"
                ? "nav-active"
                : ""
            }
            onClick={() => setPage("jobs")}
          >
            Jobs
          </button>

          <button
            className={
              page === "applications"
                ? "nav-active"
                : ""
            }
            onClick={() => setPage("applications")}
          >
            Applications
          </button>

          <button
            className={
              page === "interview"
                ? "nav-active"
                : ""
            }
            onClick={() => setPage("interview")}
          >
            Interview
          </button>

          <button
            className={
              page === "profile"
                ? "nav-active"
                : ""
            }
            onClick={() => setPage("profile")}
          >
            Profile
          </button>

          <button onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="container">
        {page === "dashboard" && (
          <Dashboard setPage={setPage} />
        )}

        {page === "jobs" && <Jobs />}

        {page === "applications" && (
          <Applications />
        )}

        {page === "interview" && (
          <Interview />
        )}

        {page === "profile" && (
          <Profile
            user={user}
            setUser={setUser}
          />
        )}
      </main>
    </div>
  );
}

function Dashboard({ setPage }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        setError(
          error.response?.data?.message ||
          "Unable to load dashboard"
        );
      });
  }, []);

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading">
        Loading dashboard...
      </div>
    );
  }

  const recommendedJobs =
    data.recommended || [];

  const applications =
    data.applications || [];

  const skills =
    data.user?.skills || [];

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">
            YOUR CAREER CONTROL CENTER
          </p>

          <h1>
            Find work that fits <span>you.</span>
          </h1>

          <p>
            Career Stack focuses on
            experience-accurate jobs,
            skill matching and interview
            preparation.
          </p>

          <button
            className="primary"
            onClick={() => setPage("jobs")}
          >
            Explore matched jobs
          </button>
        </div>

        <div className="hero-stat">
          <strong>
            {recommendedJobs[0]?.match?.score || 0}%
          </strong>

          <span>
            Top job match
          </span>
        </div>
      </div>

      <div className="stats">
        <div>
          <strong>
            {recommendedJobs.length}
          </strong>
          <span>
            Recommended jobs
          </span>
        </div>

        <div>
          <strong>
            {applications.reduce(
              (total, item) =>
                total + (item.count || 0),
              0
            )}
          </strong>
          <span>
            Applications
          </span>
        </div>

        <div>
          <strong>
            {skills.length}
          </strong>
          <span>
            Skills
          </span>
        </div>
      </div>

      <h2>
        Recommended for you
      </h2>

      <div className="job-grid">
        {recommendedJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
          />
        ))}
      </div>

      {recommendedJobs.length === 0 && (
        <p className="muted">
          No recommended jobs available yet.
          Complete your profile to improve
          your job matches.
        </p>
      )}
    </section>
  );
}

function JobCard({ job }) {
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);

  async function apply() {
    setMessage("");
    setApplying(true);

    try {
      const response = await api.post(
        `/jobs/${job.id}/apply`
      );

      setMessage(
        response.data?.message ||
        "Application submitted successfully."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Unable to apply for this job."
      );
    } finally {
      setApplying(false);
    }
  }

  const matchScore =
    job.match?.score || 0;

  const experienceMatch =
    job.match?.experienceMatch !== false;

  return (
    <article className="job-card">
      <div className="match">
        {matchScore}% match
      </div>

      <h3>
        {job.title}
      </h3>

      <b>
        {job.company}
      </b>

      <p>
        {job.location || "Location not specified"}
        {" · "}
        {job.work_mode || "Not specified"}
      </p>

      <p>
        {job.salary || "Salary not disclosed"}
      </p>

      <div className="chips">
        {(job.skills || []).map((skill) => (
          <span key={skill}>
            {skill}
          </span>
        ))}
      </div>

      {!experienceMatch && (
        <div className="warning">
          Experience mismatch
        </div>
      )}

      <button
        className="primary small"
        disabled={
          !experienceMatch || applying
        }
        onClick={apply}
      >
        {applying
          ? "Applying..."
          : experienceMatch
            ? "Apply"
            : "Not eligible"}
      </button>

      {message && (
        <small className="success">
          {message}
        </small>
      )}
    </article>
  );
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/jobs",
        {
          params: {
            search,
            location
          }
        }
      );

      setJobs(
        Array.isArray(response.data)
          ? response.data
          : response.data.jobs || []
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to load jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <section>
      <div className="section-head">
        <div>
          <p className="eyebrow">
            SMART MATCHING
          </p>

          <h1>
            Jobs for you
          </h1>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search job title or company"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) =>
            setLocation(e.target.value)
          }
        />

        <button
          className="primary"
          onClick={loadJobs}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="job-grid">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
          />
        ))}
      </div>

      {!loading && jobs.length === 0 && (
        <p className="muted">
          No jobs found.
        </p>
      )}
    </section>
  );
}

function Applications() {
  const [applications, setApplications] =
    useState([]);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    api
      .get("/applications")
      .then((response) => {
        setApplications(
          Array.isArray(response.data)
            ? response.data
            : response.data.applications || []
        );
      })
      .catch((error) => {
        setError(
          error.response?.data?.message ||
          "Unable to load applications."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section>
      <p className="eyebrow">
        TRACK EVERYTHING
      </p>

      <h1>
        My Applications
      </h1>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          Loading applications...
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    {application.title}
                  </td>

                  <td>
                    {application.company}
                  </td>

                  <td>
                    {application.location}
                  </td>

                  <td>
                    <span className="status">
                      {application.status}
                    </span>
                  </td>

                  <td>
                    {application.applied_at
                      ? new Date(
                          application.applied_at
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {applications.length === 0 && (
            <p className="muted empty">
              No applications yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Interview() {
  const [questions, setQuestions] =
    useState([]);

  const [category, setCategory] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function loadQuestions(
    selectedCategory = ""
  ) {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/interview/questions",
        {
          params: selectedCategory
            ? {
                category: selectedCategory
              }
            : {}
        }
      );

      setQuestions(
        Array.isArray(response.data)
          ? response.data
          : response.data.questions || []
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to load interview questions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const categories = [
    ...new Set(
      questions
        .map((question) => question.category)
        .filter(Boolean)
    )
  ];

  function selectCategory(value) {
    setCategory(value);
    loadQuestions(value);
  }

  return (
    <section>
      <p className="eyebrow">
        PREPARE BEFORE YOU APPLY
      </p>

      <h1>
        Interview Preparation
      </h1>

      <p className="muted">
        Practice questions based on common
        fresher and junior roles.
      </p>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="chips filter-chips">
        <button
          className={
            !category ? "selected" : ""
          }
          onClick={() =>
            selectCategory("")
          }
        >
          All
        </button>

        {categories.map((item) => (
          <button
            key={item}
            className={
              category === item
                ? "selected"
                : ""
            }
            onClick={() =>
              selectCategory(item)
            }
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          Loading questions...
        </div>
      ) : (
        <div className="question-list">
          {questions.map(
            (question, index) => (
              <div
                className="question"
                key={question.id}
              >
                <span>
                  {index + 1}
                </span>

                <div>
                  <b>
                    {question.category}
                  </b>

                  <p>
                    {question.question}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {!loading && questions.length === 0 && (
        <p className="muted">
          No interview questions found.
        </p>
      )}
    </section>
  );
}

function Profile({ user, setUser }) {
  const [form, setForm] = useState({
    ...user,
    skills: Array.isArray(user.skills)
      ? user.skills.join(", ")
      : user.skills || ""
  });

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  async function save(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    const payload = {
      ...form,
      skills:
        typeof form.skills === "string"
          ? form.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : form.skills
    };

    try {
      const response = await api.put(
        "/profile",
        payload
      );

      const updatedUser =
        response.data;

      setUser(updatedUser);

      setForm({
        ...updatedUser,
        skills: Array.isArray(
          updatedUser.skills
        )
          ? updatedUser.skills.join(", ")
          : updatedUser.skills || ""
      });

      setMessage(
        "Profile saved successfully."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="eyebrow">
        YOUR CAREER IDENTITY
      </p>

      <h1>
        Profile
      </h1>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form
        className="profile-form"
        onSubmit={save}
      >
        <label>
          Name

          <input
            type="text"
            value={form.name || ""}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
          />
        </label>

        <label>
          Experience (years)

          <input
            type="number"
            min="0"
            step="0.1"
            value={
              form.experience_years ?? 0
            }
            onChange={(e) =>
              setForm({
                ...form,
                experience_years:
                  e.target.value
              })
            }
          />
        </label>

        <label>
          Education

          <input
            type="text"
            value={form.education || ""}
            onChange={(e) =>
              setForm({
                ...form,
                education: e.target.value
              })
            }
            placeholder="Diploma / B.Tech / Degree"
          />
        </label>

        <label>
          Current location

          <input
            type="text"
            value={form.location || ""}
            onChange={(e) =>
              setForm({
                ...form,
                location: e.target.value
              })
            }
          />
        </label>

        <label>
          Preferred job location

          <input
            type="text"
            value={
              form.preferred_location || ""
            }
            onChange={(e) =>
              setForm({
                ...form,
                preferred_location:
                  e.target.value
              })
            }
          />
        </label>

        <label>
          Skills

          <input
            type="text"
            value={form.skills || ""}
            onChange={(e) =>
              setForm({
                ...form,
                skills: e.target.value
              })
            }
            placeholder="HTML, CSS, JavaScript, AWS"
          />
        </label>

        <button
          type="submit"
          className="primary"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save profile"}
        </button>

        {message && (
          <span className="success">
            {message}
          </span>
        )}
      </form>
    </section>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);
