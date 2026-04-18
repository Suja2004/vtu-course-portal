import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import { PanelRightOpen, PanelRightClose, Eye } from "lucide-react";

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

                            {/* Avatar */}
                            <div className="profile-left">
                                <img
                                    src={profile?.avatar_url || "/default-avatar.png"}
                                    alt="Profile"
                                    className="profile-avatar"
                                />
                            </div>

                            {/* Details */}
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
                                    enrollments.map((course, i) => (
                                        <div key={course.id || i} className="enrollment-card">

                                            <div className="enrollment-header">
                                                <h4>{course?.details?.title}</h4>
                                                <button
                                                    className="view-btn"
                                                    onClick={() =>
                                                        navigate(`/course/${course?.details?.slug}`)
                                                    }
                                                >
                                                    <Eye />
                                                </button>
                                            </div>

                                            <div className="enrollment-info">
                                                <p>
                                                    <strong>Enrolled:</strong>{" "}
                                                    {course?.enrollment_date}
                                                </p>

                                                <p>
                                                    <strong>Expires:</strong>{" "}
                                                    {new Date(course?.expiry_date).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="progress">
                                                <div className="progress-bar">
                                                    <div
                                                        className="course-progress"
                                                        style={{ width: `${course?.progress_percent}%` }}
                                                    />
                                                </div>
                                                <span>{course?.progress_percent}%</span>
                                            </div>

                                        </div>
                                    ))
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