import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import { CircleCheck, CirclePlay } from "lucide-react"

export default function CourseDetails() {
    const { slug } = useParams();
    const [course, setCourse] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openLessons, setOpenLessons] = useState({});
    const [lectureDetails, setLectureDetails] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const [error, setError] = useState("");
    const [showError, setShowError] = useState(false);

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
            console.error(err);
            setError("Failed to load course");
            setShowError(true);
        }
    };

    const fetchLecture = async (lessonId, lectureId) => {
        if (lectureDetails[lectureId]) return;

        try {
            const res = await api.get(
                `/my-courses/${slug}/lectures/${lectureId}`
            );

            setLectureDetails(prev => ({
                ...prev,
                [lectureId]: res.data.data
            }));

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }
            console.error("Lecture fetch failed:", err);
        }
    };

    const toggleLesson = (lesson) => {
        const isOpening = !openLessons[lesson.id];

        setOpenLessons(prev => ({
            ...prev,
            [lesson.id]: isOpening
        }));

        if (isOpening && lesson.lectures?.length > 0) {
            lesson.lectures.forEach(lec => {
                fetchLecture(lesson.id, lec.id);
            });
        }
    };

    const parseDuration = (duration) => {
        const parts = duration.split(" ")[0].split(":");
        const [h, m, s] = parts.map(Number);

        return h * 3600 + m * 60 + s;
    };

    const completeLecture = async (lectureId) => {
        if (loadingMap[lectureId]) return;

        stopRef.current[lectureId] = false;

        setLoadingMap(prev => ({
            ...prev,
            [lectureId]: true
        }));

        try {
            const details = lectureDetails[lectureId];

            if (!details || !details.duration) {
                alert("Lecture details not found");
                setLoadingMap(prev => ({
                    ...prev,
                    [lectureId]: false
                }));
                return;
            }

            const totalSeconds = parseDuration(details.duration);

            let current = 0;
            const STEP = 60;

            while (current < totalSeconds && !stopRef.current[lectureId]) {
                const res = await api.post(
                    `/my-courses/${slug}/lectures/${lectureId}/progress`,
                    {
                        current_time_seconds: current,
                        total_duration_seconds: totalSeconds,
                        seconds_just_watched: STEP,
                    }
                );

                const percent = res.data?.data?.percent;

                setLectureDetails(prev => ({
                    ...prev,
                    [lectureId]: {
                        ...prev[lectureId],
                        progress: percent,
                    }
                }));

                if (percent === 100) {
                    setLoadingMap(prev => ({
                        ...prev,
                        [lectureId]: false
                    }));
                    break;
                }

                current += STEP;

                await new Promise(r => setTimeout(r, 1000));
            }

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }

            console.error("Progress update failed", err);
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <main className={`content ${sidebarOpen ? "shrink" : "expand"}`}>
                <section id="course" className="card">

                    {!course ? (
                        <h2>Loading course...</h2>
                    ) : (
                        <>
                            <h1>{course.title}</h1>

                            <p><strong>Total Lessons:</strong> {course.total_lessons}</p>
                            <p><strong>Total Lectures:</strong> {course.total_lectures}</p>
                            <div className="progress">
                                <div className="progress-bar" style={{ width: "500px" }}>
                                    <div className="module-progress-bar" style={{ width: `${parseFloat(course.progress_bar)}%` }}></div>
                                </div>
                                <p>
                                    {course.progress_bar}%
                                </p>
                            </div>


                            <h2>Lessons</h2>

                            {course.lessons?.map((lesson) => (
                                <div key={lesson.id} className="module-list">

                                    <div
                                        onClick={() => toggleLesson(lesson)}
                                        className="module-item"
                                    >
                                        <div>
                                            <h3 style={{ margin: 0 }}>{lesson.name}</h3>
                                            <p style={{ margin: 0 }}>
                                                Total Lectures: {lesson.total_lectures}
                                            </p>
                                        </div>
                                    </div>

                                    {openLessons[lesson.id] && (
                                        <div style={{ marginTop: "10px", paddingLeft: "10px" }}>
                                            {lesson.lectures?.length > 0 ? (
                                                lesson.lectures.map((lec) => {
                                                    const details = lectureDetails[lec.id];

                                                    return (
                                                        <div key={lec.id} className={`card ${lec.is_completed ? "completed" : "incomplete"}`}>
                                                            <p>
                                                                {lec.is_completed ? <CircleCheck /> : <CirclePlay />} {lec.title}
                                                            </p>

                                                            {!details ? (
                                                                <p>Loading progress...</p>
                                                            ) : (
                                                                <>
                                                                    <div className="progress">
                                                                        <div className="progress-bar" style={{ width: "300px" }}>
                                                                            <div className="lecture-progress-bar" style={{ width: `${details.progress}%` }}></div>
                                                                        </div>
                                                                        {details.progress}%
                                                                    </div>

                                                                    <p>
                                                                        <strong>Duration:</strong> {details.duration}
                                                                    </p>
                                                                </>
                                                            )
                                                            }

                                                            <button
                                                                className={loadingMap[lec.id] ? "stop-btn" : "complete-btn"}
                                                                onClick={() => {
                                                                    if (loadingMap[lec.id]) {
                                                                        stopRef.current[lec.id] = true;
                                                                        setLoadingMap(prev => ({
                                                                            ...prev,
                                                                            [lec.id]: false
                                                                        }));
                                                                    } else {
                                                                        completeLecture(lec.id);
                                                                    }
                                                                }}
                                                                disabled={details?.is_completed || details?.progress == "100"}
                                                            >
                                                                {details?.is_completed || details?.progress == "100"
                                                                    ? "Completed"
                                                                    : loadingMap[lec.id]
                                                                        ? "Stop"
                                                                        : "Complete Lecture"}
                                                            </button>
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
                        <div className="error-overlay">
                            <div className="error-modal">
                                <p>{error}</p>
                                <button onClick={() => setShowError(false)}>Close</button>
                            </div>
                        </div>
                    )}
                </section>
            </main >
        </div >
    );
}