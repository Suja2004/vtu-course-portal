import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import { PanelRightOpen, PanelRightClose, Eye, NotepadText } from "lucide-react";

export default function Home() {
    const [profile, setProfile] = useState(null);
    const [enrollments, setEnrollments] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const el = document.querySelector(location.hash);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [location]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, enrollmentsRes] = await Promise.all([
                api.get("/profile"),
                api.get("/enrollments"),
            ]);

            setProfile(profileRes.data.data);
            setEnrollments(enrollmentsRes.data.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load data");
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <main className={`content ${sidebarOpen ? "shrink" : "expand"}`}>
                <h1>VTU Student Course Portal</h1>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <section id="profile" className="card profile-card">
                    {!profile ? (
                        <h2>Loading profile...</h2>
                    ) : (
                        <div className="profile-container">

                            <div className="profile-left">
                                <img
                                    src={profile?.avatar_url || "/default-avatar.png"}
                                    alt="Profile"
                                    className="profile-avatar"
                                />
                            </div>

                            <div className="profile-right">
                                <h3>{profile?.user?.name}</h3>
                                <p><strong>College:</strong> {profile?.college?.name}</p>

                                <div className="profile-grid">
                                    <p><strong>USN:</strong> {profile?.usn}</p>
                                    <p className="email">{profile?.user?.email}</p>
                                    <p><strong>Branch:</strong> {profile?.branch?.name}</p>
                                    <p><strong>CGPA:</strong> {profile?.cgpa}</p>
                                </div>
                            </div>

                        </div>
                    )}
                </section>

                <section id="enrollments" className="card enrollments-section">
                    {!enrollments ? (
                        <h2>Loading enrollments...</h2>
                    ) : (
                        <>
                            <h3>Enrollments</h3>

                            <div className="enrollments-list">
                                {Array.isArray(enrollments) && enrollments.length > 0 ? (
                                    enrollments.map((item, i) => {

                                        if (item.type === "course") {
                                            return (
                                                <div key={item.id || i} className="enrollment-card">

                                                    <div className="enrollment-header">
                                                        <h4>{item?.details?.title}</h4>

                                                        <div className="course-buttons">
                                                            <button
                                                                className="view-btn"
                                                                onClick={() =>
                                                                    navigate(`/course/${item?.details?.slug}`)
                                                                }
                                                            >
                                                                <Eye />
                                                            </button>

                                                            <button
                                                                className="quiz-btn"
                                                                onClick={() =>
                                                                    navigate(`/course/${item?.details?.slug}/quiz`)
                                                                }
                                                            >
                                                                <NotepadText />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="enrollment-info">
                                                        <p><strong>Type:</strong> {item.type}</p>
                                                        <p><strong>Enrolled:</strong> {item.enrollment_date}</p>
                                                        <p>
                                                            <strong>Expires:</strong>{" "}
                                                            {new Date(item.expiry_date).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div className="progress">
                                                        <div className="progress-bar">
                                                            <div
                                                                className="course-progress"
                                                                style={{ width: `${item.progress_percent}%` }}
                                                            />
                                                        </div>
                                                        <span>{item.progress_percent}%</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (item.type === "programme") {
                                            return (
                                                <div key={item.id || i} className="program-card">

                                                    <div className="program-header">
                                                        <h3>{item.details.title}</h3>
                                                        <p className="program-meta">
                                                            <p><strong>Type:</strong> {item.type}</p>
                                                            {item.details.child_courses.length} Courses
                                                        </p>

                                                    </div>

                                                    <div className="program-courses">
                                                        {item.details.child_courses.map((course) => (
                                                            <div key={course.id} className="child-course-card">

                                                                <p>{course.title}</p>

                                                                <button
                                                                    className="view-btn small"
                                                                    onClick={() =>
                                                                        navigate(`/course/${course.slug}`)
                                                                    }
                                                                >
                                                                    <Eye />
                                                                </button>

                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })
                                ) : (
                                    <p>No enrollments found</p>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}