import express from "express";
import axios from "axios";
import cors from "cors";
import session from "express-session";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["https://vtu-course-portal.vercel.app", "http://localhost:5173"],
    credentials: true,
  }),
);

app.use(
  session({
    secret: "vtu-secret",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: false },
    cookie: {
      secure: true,
      sameSite: "none",
    },
  }),
);

const vtuApi = axios.create({
  baseURL: "https://online.vtu.ac.in/api/v1",
  validateStatus: () => true,
});

app.get("/", (req, res) => {
  res.send("VTU API Proxy is running");
});

app.post("/login", async (req, res) => {
  try {
    const response = await vtuApi.post("/auth/login", req.body, {
      withCredentials: true,
    });

    req.session.cookies = response.headers["set-cookie"];
    console.log("SET-COOKIE FROM VTU:", response.headers["set-cookie"]);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/profile", async (req, res) => {
  try {
    const response = await vtuApi.get("/student/profile", {
      headers: {
        Cookie: req.session.cookies,
      },
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Profile fetch failed" });
  }
});

app.get("/enrollments", async (req, res) => {
  try {
    const response = await vtuApi.get("/student/my-enrollments", {
      headers: {
        Cookie: req.session.cookies,
      },
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Applications fetch failed" });
  }
});

app.get("/my-courses/:slug", async (req, res) => {
  try {
    const response = await vtuApi.get(
      `/student/my-courses/${req.params.slug}`,
      {
        headers: {
          Cookie: req.session.cookies,
        },
      },
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Applications fetch failed" });
  }
});

app.get("/my-courses/:slug/lectures/:id", async (req, res) => {
  try {
    const { slug, id } = req.params;

    const response = await vtuApi.get(
      `/student/my-courses/${slug}/lectures/${id}`,
      {
        headers: {
          Cookie: req.session.cookies,
        },
      },
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Applications fetch failed" });
  }
});

app.post("/my-courses/:slug/lectures/:id/progress", async (req, res) => {
  try {
    const { slug, id } = req.params;

    const response = await vtuApi.post(
      `/student/my-courses/${slug}/lectures/${id}/progress`,
      req.body,
      {
        headers: {
          Cookie: req.session.cookies,
        },
      },
    );

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Progress update failed" });
  }
});

app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});
