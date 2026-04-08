import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100vh-120px)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Radial glow behind 404 */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 480,
          height: 480,
          background: "radial-gradient(circle, rgba(71,159,250,0.18) 0%, rgba(71,159,250,0.04) 40%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          filter: "blur(40px)",
        }}
      />

      <ScrollReveal className="relative flex flex-col items-center text-center">
        {/* 404 heading */}
        <h1
          className="select-none text-[120px] font-extrabold leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, #479FFA 0%, #6CB8FF 40%, #fff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-[24px] font-semibold text-white">
          Page not found
        </p>

        {/* Description */}
        <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: "#868F97" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Go home button */}
        <Link
          href="/"
          className="group relative mt-8 inline-flex items-center justify-center rounded-full px-7 py-2.5 text-[14px] font-medium text-white transition-all duration-200 hover:brightness-110"
          style={{
            background: "#479FFA",
            boxShadow: "0 0 20px rgba(71,159,250,0.35), 0 0 60px rgba(71,159,250,0.10)",
          }}
        >
          <span className="relative z-10">Go home</span>
          {/* Glow ring on hover */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              boxShadow: "0 0 0 2px rgba(71,159,250,0.30), 0 0 30px rgba(71,159,250,0.25)",
            }}
          />
        </Link>
      </ScrollReveal>
    </div>
  );
}
