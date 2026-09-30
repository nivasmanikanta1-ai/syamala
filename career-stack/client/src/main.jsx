import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./styles.css";

/* =========================
BACKEND CONNECTION
========================= */

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

/* =========================
AUTH
========================= */

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

```
try {
  const r = await api.post(`/auth/${mode}`, form);

  localStorage.setItem("career_token", r.data.token);

  onLogin(r.data.user);
} catch (e) {
  setError(
    e.response?.data?.message ||
    "Something went wrong. Please try again."
  );
}
```

}

return ( <div className="auth-page"> <div className="auth-card">

```
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
        required
        minLength="6"
      />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <button className="primary">
        {mode === "login" ? "Login" : "Register"}
      </button>

    </form>

    <button
      className="link"
      onClick={() =>
        setMode(
          mode === "login"
            ? "register"
            : "login"
        )
      }
    >
      {mode === "login"
        ? "New here? Create account"
        : "Already have an account? Login"}
    </button>

  </div>
</div>
```

);
}

/* =========================
APP
========================= */

function App() {
const [user, setUser] = useState(null);

const [page, setPage] = useState("dashboard");

const [loading, setLoading] = useState(true);

useEffect(() => {

```
const token =
  localStorage.getItem("career_token");

if (!token) {
  setLoading(false);
  return;
}

api
  .get("/profile")
  .then((r) => {
    setUser(r.data);
  })
  .catch(() => {
    localStorage.removeItem("career_token");
  })
  .finally(() => {
    setLoading(false);
  });
```

}, []);

if (loading) {
return ( <div className="loading">
Loading Career Stack... </div>
);
}

if (!user) {
return <Auth onLogin={setUser} />;
}

function logout() {
localStorage.removeItem("career_token");
setUser(null);
}

return ( <div className="app">

```
  <header className="topbar">

    <div className="brand">
      Career<span>Stack</span>
    </div>

    <nav>

      {[
        "dashboard",
        "jobs",
        "applications",
        "interview",
        "profile"
      ].map((x) => (

        <button
          key={x}
          className={
            page === x
              ? "nav-active"
              : ""
          }
          onClick={() => setPage(x)}
        >
          {x[0].toUpperCase() + x.slice(1)}
        </button>

      ))}

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
```

);
}

/* =========================
DASHBOARD
========================= */

function Dashboard({ setPage }) {

const [data, setData] = useState(null);

const [error, setError] = useState("");

useEffect(() => {

```
api
  .get("/dashboard")
  .then((r) => {
    setData(r.data);
  })
  .catch((e) => {
    setError(
      e.response?.data?.message ||
      "Unable to load dashboard."
    );
  });
```

}, []);

if (error) {
return ( <div className="error">
{error} </div>
);
}

if (!data) {
return ( <div className="loading">
Loading dashboard... </div>
);
}

return ( <section>

```
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
        {data.recommended?.[0]?.match?.score || 0}%
      </strong>

      <span>
        Top job match
      </span>

    </div>

  </div>

  <div className="stats">

    <div>
      <strong>
        {data.recommended?.length || 0}
      </strong>
      <span>
        Recommended jobs
      </span>
    </div>

    <div>
      <strong>
        {data.applications?.reduce(
          (a, x) => a + x.count,
          0
        ) || 0}
      </strong>
      <span>
        Applications
      </span>
    </div>

    <div>
      <strong>
        {data.user?.skills?.length || 0}
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

    {data.recommended?.map((j) => (
      <JobCard
        key={j.id}
        job={j}
      />
    ))}

  </div>

</section>
```

);
}

/* =========================
JOB CARD
========================= */

function JobCard({ job }) {

const [message, setMessage] =
useState("");

async function apply() {

```
try {

  const r = await api.post(
    `/jobs/${job.id}/apply`
  );

  setMessage(r.data.message);

} catch (e) {

  setMessage(
    e.response?.data?.message ||
    "Unable to apply"
  );

}
```

}

return ( <article className="job-card">

```
  <div className="match">
    {job.match?.score || 0}% match
  </div>

  <h3>
    {job.title}
  </h3>

  <b>
    {job.company}
  </b>

  <p>
    {job.location} · {job.work_mode}
  </p>

  <p>
    {job.salary ||
      "Salary not disclosed"}
  </p>

  <div className="chips">

    {job.skills?.map((s) => (
      <span key={s}>
        {s}
      </span>
    ))}

  </div>

  {!job.match?.experienceMatch && (
    <div className="warning">
      Experience mismatch
    </div>
  )}

  <button
    className="primary small"
    disabled={
      !job.match?.experienceMatch
    }
    onClick={apply}
  >
    {job.match?.experienceMatch
      ? "Apply"
      : "Not eligible"}
  </button>

  {message && (
    <small className="success">
      {message}
    </small>
  )}

</article>
```

);
}

/* =========================
JOBS
========================= */

function Jobs() {

const [jobs, setJobs] =
useState([]);

const [search, setSearch] =
useState("");

const [location, setLocation] =
useState("");

const [error, setError] =
useState("");

async function load() {

```
try {

  const r = await api.get(
    "/jobs",
    {
      params: {
        search,
        location
      }
    }
  );

  setJobs(r.data);

} catch (e) {

  setError(
    e.response?.data?.message ||
    "Unable to load jobs."
  );

}
```

}

useEffect(() => {
load();
}, []);

return ( <section>

```
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
      placeholder="Search job title or company"
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
    />

    <input
      placeholder="Location"
      value={location}
      onChange={(e) =>
        setLocation(e.target.value)
      }
    />

    <button
      className="primary"
      onClick={load}
    >
      Search
    </button>

  </div>

  {error && (
    <div className="error">
      {error}
    </div>
  )}

  <div className="job-grid">

    {jobs.map((j) => (
      <JobCard
        key={j.id}
        job={j}
      />
    ))}

  </div>

</section>
```

);
}

/* =========================
APPLICATIONS
========================= */

function Applications() {

const [apps, setApps] =
useState([]);

const [error, setError] =
useState("");

useEffect(() => {

```
api
  .get("/applications")
  .then((r) => {
    setApps(r.data);
  })
  .catch((e) => {
    setError(
      e.response?.data?.message ||
      "Unable to load applications."
    );
  });
```

}, []);

return ( <section>

```
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

        {apps.map((a) => (

          <tr key={a.id}>

            <td>{a.title}</td>

            <td>{a.company}</td>

            <td>{a.location}</td>

            <td>
              <span className="status">
                {a.status}
              </span>
            </td>

            <td>
              {new Date(
                a.applied_at
              ).toLocaleDateString()}
            </td>

          </tr>

        ))}

      </tbody>

    </table>

    {!apps.length && (
      <p className="muted empty">
        No applications yet.
      </p>
    )}

  </div>

</section>
```

);
}

/* =========================
INTERVIEW
========================= */

function Interview() {

const [qs, setQs] =
useState([]);

const [category, setCategory] =
useState("");

const [error, setError] =
useState("");

useEffect(() => {

```
api
  .get("/interview/questions")
  .then((r) => {
    setQs(r.data);
  })
  .catch((e) => {
    setError(
      e.response?.data?.message ||
      "Unable to load interview questions."
    );
  });
```

}, []);

async function filter(c) {

```
setCategory(c);

try {

  const r = await api.get(
    "/interview/questions",
    {
      params: c
        ? { category: c }
        : {}
    }
  );

  setQs(r.data);

} catch (e) {

  setError(
    e.response?.data?.message ||
    "Unable to load questions."
  );

}
```

}

const cats = [
...new Set(
qs.map((q) => q.category)
)
];

return ( <section>

```
  <p className="eyebrow">
    PREPARE BEFORE YOU APPLY
  </p>

  <h1>
    Interview Preparation
  </h1>

  <p className="muted">
    Practice questions based on
    common fresher and junior roles.
  </p>

  {error && (
    <div className="error">
      {error}
    </div>
  )}

  <div className="chips filter-chips">

    <button
      className={
        !category
          ? "selected"
          : ""
      }
      onClick={() => filter("")}
    >
      All
    </button>

    {cats.map((c) => (

      <button
        className={
          category === c
            ? "selected"
            : ""
        }
        key={c}
        onClick={() => filter(c)}
      >
        {c}
      </button>

    ))}

  </div>

  <div className="question-list">

    {qs.map((q, i) => (

      <div
        className="question"
        key={q.id}
      >

        <span>
          {i + 1}
        </span>

        <div>

          <b>
            {q.category}
          </b>

          <p>
            {q.question}
          </p>

        </div>

      </div>

    ))}

  </div>

</section>
```

);
}

/* =========================
PROFILE
========================= */

function Profile({ user, setUser }) {

const [form, setForm] =
useState({
...user,
skills: (user.skills || []).join(", ")
});

const [msg, setMsg] =
useState("");

const [error, setError] =
useState("");

async function save(e) {

```
e.preventDefault();

setMsg("");
setError("");

try {

  const r = await api.put(
    "/profile",
    form
  );

  setUser(r.data);

  setMsg(
    "Profile saved successfully"
  );

} catch (e) {

  setError(
    e.response?.data?.message ||
    "Unable to save profile."
  );

}
```

}

return ( <section>

```
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
          form.experience_years || 0
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
        value={form.education || ""}
        onChange={(e) =>
          setForm({
            ...form,
            education: e.target.value
          })
        }
        placeholder="Diplo
```
