import "./OverlayUI.css";

export default function OverlayUI() {
    return (
        <div className="ui-overlay">
            {/* Flex Header */}
            <div className="header-flex">
                {/* Title Section */}
                <div className="title-section">
                    <h1 className="blurry-title">experimenting with shaders</h1>
                    <h2 className="blurry-subtitle">
                        raymarching, lerping cameras, and high school geometry
                    </h2>
                </div>
            </div>

            {/* Images Section */}
            <div className="footer-section blurry-footer image-section">
                <img
                    src="/mrange-shader-rework/quicktwitch.png"
                    alt="Original Work by @mrange"
                    className="pill-image"
                />
                <img
                    src="/mrange-shader-rework/kj.png"
                    alt="KJ"
                    className="pill-image"
                />
            </div>
        </div>
    );
}
