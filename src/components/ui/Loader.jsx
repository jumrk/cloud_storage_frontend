import React from "react";

const Loader = ({ size = "default", position = "fixed", hideText = false }) => {
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { width: 16, height: 16 };
      case "medium":
        return { width: 24, height: 24 };
      case "large":
        return { width: 32, height: 32 };
      default:
        return { width: 80, height: 80 };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "inline":
        return {
          position: "relative",
          width: "auto",
          height: "auto",
          background: "transparent",
        };
      default:
        return {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: "black",
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();

  return (
    <div
      style={{
        ...positionStyles,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/images/Logo_1.png"
        alt="Loading..."
        style={{
          ...sizeStyles,
          animation: "spin 1.2s linear infinite",
          display: "block",
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
