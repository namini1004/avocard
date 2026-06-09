export function AvocadoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  };

  return (
    <div
      className={`${sizes[size]} relative grid shrink-0 place-items-center rounded-full bg-avocado-200 shadow-soft`}
      aria-hidden="true"
    >
      <div className="absolute inset-[14%] rounded-[55%_45%_55%_45%] bg-avocado-500 rotate-[-18deg]" />
      <div className="absolute inset-[27%] rounded-full bg-cream" />
      <div className="absolute bottom-[24%] h-[32%] w-[32%] rounded-full bg-seed shadow-inner" />
    </div>
  );
}
