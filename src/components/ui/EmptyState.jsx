import Lottie from "lottie-react";
import emptyAnimation from "@/../public/animation/Empty.json";

export default function EmptyState({
  message = "Không có dữ liệu",
  height = 220,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div style={{ width: height, height }}>
        <Lottie animationData={emptyAnimation} loop={true} />
      </div>
      <div className="mt-4 text-gray-500 text-base font-medium text-center">
        {message}
      </div>
    </div>
  );
}
