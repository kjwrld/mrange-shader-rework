// PopUp.tsx
import { useEffect, useState } from "react";
import "./PopUp.css";

export default function PopUp() {
    const [visible, setVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // if (!localStorage.getItem("popupClosed")) {
        if (!visible) {
            const timer = setTimeout(() => setVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    function handleClose() {
        setIsClosing(true);
        setTimeout(() => {
            setVisible(false);
            // localStorage.setItem("popupClosed", "true");
        }, 500);
    }

    if (!visible) return null;

    return (
        <div className={`popup-overlay ${isClosing ? "slide-out" : ""}`}>
            <div className="popup-content">
                <div className="popup-header">
                    <h1>NOTIFICATION</h1>
                    <button className="close-button" onClick={handleClose}>
                        &times;
                    </button>
                </div>
                <p>
                    this project was an exercise to
                    <br />
                    - practice raymarching
                    <br />
                    - design ux for 3D scenes
                    <br />
                    original shader art by{" "}
                    <a
                        href="https://x.com/range_marten"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @range_marten
                    </a>
                </p>
            </div>
        </div>
    );
}
