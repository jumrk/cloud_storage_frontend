import ScrollReveal from "@/shared/ui/ScrollReveal";

export default function FeatureSlider({ features }) {
  return (
    <div className="grid w-full grid-cols-1 items-stretch gap-4 md:grid-cols-2">
      {features.map((item, idx) => (
        <ScrollReveal key={idx}>
          <div className="group relative flex h-full w-full flex-1 flex-col items-center rounded-xl border border-accent-100 bg-surface-50 p-4 shadow transition-transform duration-200 hover:-translate-y-1 hover:border-accent-500">
            <div className="absolute -top-4 left-1/2 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-accent-200 bg-accent-50 text-lg font-bold text-accent-700 shadow md:flex select-none">
              {idx + 1}
            </div>
            <div className="text-primary mt-4 mb-1 text-center text-base font-bold md:mt-6 md:text-lg">
              {item.title}
            </div>
            <div className="text-text-muted max-w-md text-center text-sm md:text-base">
              {item.desc}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
