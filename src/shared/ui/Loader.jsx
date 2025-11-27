import Image from "next/image";
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
      <Image
        src="/images/Logo_1.png"
        alt="Loading..."
        width={120}
        height={40}
        priority={true}
        style={{
          ...sizeStyles,
          animation: "flip 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          display: "block",
        }}
      />
      <style>{`
        @keyframes flip {
          0% { transform: rotateY(0deg); }
          25% { transform: rotateY(90deg); }
          50% { transform: rotateY(180deg); }
          75% { transform: rotateY(270deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
