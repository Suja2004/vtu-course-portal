import { useNavigate } from "react-router-dom";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };


    return (
        <div className={`sidebar-panel ${sidebarOpen ? "open" : "closed"}`}>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Dashboard</h2>
                    <button onClick={() => setSidebarOpen(prev => !prev)}>
                        <PanelRightOpen />
                    </button>
                </div>

                <nav>
                    <button onClick={() => navigate("/home#profile")}>
                        Profile
                    </button>

                    <button onClick={() => navigate("/home#enrollments")}>
                        Enrollments
                    </button>

                    <button
                        onClick={() => {
                            handleLogout();
                        }}
                    >
                        Log Out
                    </button>
                </nav>
            </aside>

            {!sidebarOpen && (
                <div
                    className="panel-button"
                    onClick={() => setSidebarOpen(true)}
                >
                    <PanelRightClose />
                </div>
            )}
        </div>
    );
}