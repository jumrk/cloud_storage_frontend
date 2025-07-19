import { motion, useScroll, useTransform } from "framer-motion";
import Lottie from "lottie-react";
import { useRef } from "react";

export default function ScrollParallaxLottie({ animationData }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="h-[400px] flex items-center justify-center">
      <motion.div
        style={{ scale, y, opacity }}
        className="w-full flex justify-center"
      >
        <Lottie
          animationData={animationData}
          loop={true}
          className="w-full max-w-xl drop-shadow-2xl"
        />
      </motion.div>
    </section>
  );
}
