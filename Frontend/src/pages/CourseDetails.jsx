import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import { CircleCheck, CirclePlay, X } from "lucide-react";

export default function CourseDetails() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openLessons, setOpenLessons] = useState({});
  const [lectureDetails, setLectureDetails] = useState({});
  const [loadingLectureMap, setLoadingLectureMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const stopRef = useRef({});

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/my-courses/${slug}`);
      setCourse(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
      }
      setError("Failed to load course");
      setShowError(true);
      setFadeOut(false);

      setTimeout(() => {
        setFadeOut(true);

        setTimeout(() => {
          setShowError(false);
        }, 300);
      }, 2000);
    }
  };

  const toggleLesson = (lesson) => {
    setOpenLessons((prev) => ({
      ...prev,
      [lesson.id]: !prev[lesson.id],
    }));
  };

  const toggleLecture = async (lectureId) => {
    if (lectureDetails[lectureId]) return;

    setLoadingLectureMap((prev) => ({
      ...prev,
      [lectureId]: true,
    }));

    try {
      const res = await api.get(`/my-courses/${slug}/lectures/${lectureId}`);

      setLectureDetails((prev) => ({
        ...prev,
        [lectureId]: res.data.data,
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
      }
      setError("Lecture fetch failed:", err);
      setShowError(true);
      setFadeOut(false);

      setTimeout(() => {
        setFadeOut(true);

        setTimeout(() => {
          setShowError(false);
        }, 300);
      }, 2000);
    }

    setLoadingLectureMap((prev) => ({
      ...prev,
      [lectureId]: false,
    }));
  };

  const parseDuration = (duration) => {
    const parts = duration.split(" ")[0].split(":");
    const [h, m, s] = parts.map(Number);

    return h * 3600 + m * 60 + s;
  };

  const completeLecture = async (lectureId) => {
    if (loadingMap[lectureId]) return;

    stopRef.current[lectureId] = false;

    setLoadingMap((prev) => ({
      ...prev,
      [lectureId]: true,
    }));

    try {
      const details = lectureDetails[lectureId];

      if (!details || !details.duration) {
        setError("Lecture details not found");
        setShowError(true);

        setFadeOut(false);

        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setShowError(false);
          }, 300);
        }, 2000);

        setLoadingMap((prev) => ({
          ...prev,
          [lectureId]: false,
        }));
        return;
      }

      const totalSeconds = parseDuration(details.duration);

      let current = Math.floor(totalSeconds * (details.progress / 100));
      const STEP = 60;

      while (current < totalSeconds && !stopRef.current[lectureId]) {
        const res = await api.post(
          `/my-courses/${slug}/lectures/${lectureId}/progress`,
          {
            current_time_seconds: current,
            total_duration_seconds: totalSeconds,
            seconds_just_watched: STEP,
          },
        );

        const percent = res.data?.data?.percent;
        const is_completed = res.data?.data?.is_completed;

        setLectureDetails((prev) => ({
          ...prev,
          [lectureId]: {
            ...prev[lectureId],
            progress: percent,
            is_completed,
          },
        }));

        if (percent === 100 || is_completed) {
          setLoadingMap((prev) => ({
            ...prev,
            [lectureId]: false,
          }));
          fetchCourse();
          break;
        }

        current += STEP;

        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      setError("Progress update failed");
      setShowError(true);
      setFadeOut(false);

      setTimeout(() => {
        setFadeOut(true);

        setTimeout(() => {
          setShowError(false);
        }, 300);
      }, 2000);
    }
  };

  return (
    <div className="app-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`content ${sidebarOpen ? "shrink" : "expand"}`}>
        <section id="course" className="card">
          {!course ? (
            <h2>Loading course...</h2>
          ) : (
            <>
              <h1>{course.title}</h1>

              <p>
                <strong>Total Lessons:</strong> {course.total_lessons}
              </p>
              <p>
                <strong>Total Lectures:</strong> {course.total_lectures}
              </p>
              <div className="progress">
                <div className="progress-bar" style={{ width: "500px" }}>
                  <div
                    className="module-progress-bar"
                    style={{ width: `${parseFloat(course.progress_bar)}%` }}
                  ></div>
                </div>
                <p>{course.progress_bar}%</p>
              </div>

              <h2>Lessons</h2>

              {course.lessons?.map((lesson) => (
                <div key={lesson.id} className="module-list">
                  <div
                    className="module-item"
                    onClick={() => toggleLesson(lesson)}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{lesson.name}</h3>
                      <p style={{ margin: 0 }}>
                        Total Lectures: {lesson.total_lectures}
                      </p>
                    </div>
                  </div>

                  {openLessons[lesson.id] && (
                    <div className="lecture-list">
                      {lesson.lectures?.length > 0 ? (
                        lesson.lectures.map((lec) => {
                          const details = lectureDetails[lec.id];

                          return (
                            <div
                              key={lec.id}
                              className={`lecture-card ${lec.is_completed ? "completed" : "incomplete"}`}
                              onClick={() => toggleLecture(lec.id)}
                            >
                              <p>
                                {lec.is_completed ? (
                                  <CircleCheck />
                                ) : (
                                  <CirclePlay />
                                )}{" "}
                                {lec.title}
                              </p>

                              {!details ? (
                                loadingLectureMap[lec.id] && (
                                  <p>Loading progress...</p>
                                )
                              ) : (
                                <div className="lecture">
                                  <div className="lecture-details">
                                    <div className="progress">
                                      <div
                                        className="progress-bar"
                                        style={{ width: "300px" }}
                                      >
                                        <div
                                          className="lecture-progress-bar"
                                          style={{
                                            width: `${details?.progress}%`,
                                          }}
                                        ></div>
                                      </div>
                                      {details?.progress}%
                                    </div>

                                    <p>
                                      <strong>Duration:</strong>{" "}
                                      {details?.duration || "N/A"}
                                    </p>
                                  </div>

                                  {details.duration && (
                                    <button
                                      className={
                                        loadingMap[lec.id]
                                          ? "stop-btn"
                                          : "complete-btn"
                                      }
                                      onClick={() => {
                                        if (loadingMap[lec.id]) {
                                          stopRef.current[lec.id] = true;
                                          setLoadingMap((prev) => ({
                                            ...prev,
                                            [lec.id]: false,
                                          }));
                                        } else {
                                          completeLecture(lec.id);
                                        }
                                      }}
                                      disabled={
                                        details?.is_completed ||
                                        details?.progress == "100"
                                      }
                                    >
                                      {details?.is_completed ||
                                      details?.progress == "100"
                                        ? "Completed"
                                        : loadingMap[lec.id]
                                          ? "Stop"
                                          : "Complete Lecture"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p>No lectures</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {showError && (
            <div
              className={`error-overlay ${fadeOut ? "fade-out" : "fade-in"}`}
            >
              <div className="error-modal">
                <p>{error}</p>
                <button
                  className="error-btn"
                  onClick={() => {
                    setFadeOut(true);
                    setTimeout(() => setShowError(false), 300);
                  }}
                >
                  <X />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
