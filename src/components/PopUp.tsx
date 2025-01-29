// PopUp.tsx
import { useEffect, useState } from "react";
import "./PopUp.css";

interface PopUpProps {
    title: string;
    message: string;
    showAfter?: number;
}

export default function PopUp({
    title,
    message,
    showAfter = 2000, // Default to 2 seconds
}: PopUpProps) {
    const [visible, setVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // if (!localStorage.getItem("popupClosed")) {
        if (!visible) {
            const timer = setTimeout(() => setVisible(true), showAfter);
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
                    <h1>{title}</h1>
                    <button
                        className="close-button"
                        onClick={handleClose}
                        aria-label="Close Popup"
                    >
                        &times;
                    </button>
                </div>
                <p>
                    {message.split("\n").map((line, index) => (
                        <span key={index}>
                            {line}
                            <br />
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
