import "./OverlayUI.css";
import PopUp from "./Popup";

export default function OverlayUI() {
    return (
        <>
            <div className="ui-overlay">
                <div className="header-flex">
                    <div className="title-section">
                        <h1 className="blurry-title">
                            experimenting with shaders
                        </h1>
                        <h2 className="blurry-subtitle">
                            raymarching, lerping cameras, and high school
                            geometry
                        </h2>
                    </div>
                </div>

                <div className="footer-section blurry-footer image-section">
                    <a
                        href="https://github.com/kjwrld"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src="/mrange-shader-rework/kj.png"
                            alt="KJ"
                            className="pill-image"
                        />
                    </a>
                    <a
                        href="https://www.shadertoy.com/view/msVBzm"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src="/mrange-shader-rework/quicktwitch.png"
                            alt="Original Work by @mrange"
                            className="pill-image"
                        />
                    </a>
                </div>
                <div className="decorative-lines">
                    <div className="line"></div>
                    <div className="line"></div>
                    <div className="line"></div>
                </div>
            </div>
            <PopUp />
        </>
    );
}
