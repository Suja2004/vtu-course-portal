import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";

export default function QuizDetails() {
    const { slug } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [quiz, setQuiz] = useState(null)
    const [showModal, setShowModal] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [loadingResult, setLoadingResult] = useState(false);
    const [error, setError] = useState("");
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [slug]);

    const fetchQuiz = async () => {
        try {
            const res = await api.get(`/my-courses/${slug}/exams`);
            setQuiz(res.data.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/";
                return;
            }
            console.error(err);
            setError("Failed to load quiz");
            setShowError(true);
        }
    };

    const fetchResult = async (url) => {
        try {
            setLoadingResult(true);
            const res = await api.get(`/exam-result?url=${encodeURIComponent(url)}`);

            setResultData(res.data.data);
            setShowModal(true);
        } catch (err) {
            console.error(err);
            setResultData({ error: "Failed to load result" });
        } finally {
            setLoadingResult(false);
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <main className={`content ${sidebarOpen ? "shrink" : "expand"}`}>
                <section id="quiz" className="card">
                    {!quiz ? (
                        <h2>Loading quiz...</h2>
                    ) : (
                        <>
                            <h2>Exams</h2>

                            {quiz?.exams?.length === 0 ? (
                                <p>No exams found</p>
                            ) : (
                                <div className="exam-list">
                                    {quiz?.exams?.map((exam) => (
                                        <div key={exam.id} className="exam-card">
                                            <h3>{exam.name}</h3>
                                            <p>Duration: {exam.duration}</p>
                                            <p className={`status-${exam.status}`}>
                                                Status: {exam.status === "NOT_STARTED" ? "Not Started" : exam.status}
                                            </p>
                                            {exam.attempts.length > 0 ? (
                                                <div className="attempts">
                                                    <p>Score: {exam.attempts[0].score}</p>
                                                    <p>
                                                        Result: {exam.attempts[0].is_passed ? "Pass" : "Fail"}
                                                    </p>

                                                    {exam.attempts[0].result_url && (
                                                        <button
                                                            className="result-btn"
                                                            onClick={() => fetchResult(exam.attempts[0].result_url)}
                                                        >
                                                            {loadingResult ? "Loading" : "View Result"}
                                                        </button>
                                                    )}

                                                </div>

                                            ) : (
                                                <div className="not-attempted">
                                                    <p>Not attempted yet</p>
                                                </div>

                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="overall-stats">
                                <h3>Overall Stats</h3>
                                <p>Average Score: {quiz?.overall_stats?.average_score}%</p>
                                <p className={`status-${quiz?.overall_stats?.status}`}>Status: {quiz?.overall_stats?.status}</p>
                            </div>
                        </>
                    )}
                </section>
            </main>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                        <button className="close-btn" onClick={() => setShowModal(false)}>
                            ✕
                        </button>

                        {loadingResult ? (
                            <p>Loading result...</p>
                        ) : resultData?.error ? (
                            <p>{resultData.error}</p>
                        ) : (
                            <div className="result-content">
                                {/* SUMMARY */}
                                <div className="result-summary">
                                    <h3>{resultData.attempt_info.exam_name}</h3>

                                    <div className="stats">
                                        <div>
                                            <span>Score</span>
                                            <strong>{resultData.attempt_info.percentage}</strong>
                                        </div>
                                        <div>
                                            <span>Correct</span>
                                            <strong>
                                                {resultData.attempt_info.total_correct}/
                                                {resultData.attempt_info.total_questions}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Status</span>
                                            <strong
                                                className={
                                                    resultData.attempt_info.is_passed
                                                        ? "pass"
                                                        : "fail"
                                                }
                                            >
                                                {resultData.attempt_info.is_passed ? "Pass" : "Fail"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* QUESTIONS */}
                                <div className="review-list">
                                    {resultData.review.map((q, index) => (
                                        <div
                                            key={index}
                                            className={`review-card ${q.is_correct ? "correct" : "wrong"
                                                }`}
                                        >
                                            <p className="question">
                                                {index + 1}. {q.question}
                                            </p>

                                            <p>
                                                <strong>Your Answer:</strong> {q.user_answer}
                                            </p>

                                            {!q.is_correct && (
                                                <p>
                                                    <strong>Correct Answer:</strong> {q.correct_answer}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
