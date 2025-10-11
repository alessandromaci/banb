"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "READY TO ELEVATE YOUR EXPERIENCE WITH MONEY?",
    subtitle: "Welcome to Banb",
    background: "lightspeed",
  },
  {
    title: "SEND MONEY INSTANTLY",
    subtitle: "Transfer funds to anyone, anywhere",
    background: "particles",
  },
  {
    title: "INVEST IN YOUR FUTURE",
    subtitle: "Trade stocks, crypto, and commodities",
    background: "waves",
  },
  {
    title: "SECURE & PROTECTED",
    subtitle: "Bank-grade security for your peace of mind",
    background: "grid",
  },
];

export function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Animated Backgrounds */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className={`animated-bg ${slide.background}`} />
          </div>
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        {/* Header */}
        <div className="flex items-center gap-2 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <span className="font-bold text-white">B</span>
          </div>
          <span className="text-sm text-white/80">
            {slides[currentSlide].subtitle}
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md space-y-8">
            <h1 className="text-4xl font-bold leading-tight text-white text-balance">
              {slides[currentSlide].title}
            </h1>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentSlide === index
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/30"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-4">
              <button
                onClick={prevSlide}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="space-y-3 pb-8">
          <Link href="/signup" className="block">
            <Button
              size="lg"
              className="w-full rounded-full bg-white text-black hover:bg-white/90 h-14 text-base font-semibold"
            >
              Sign up
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button
              size="lg"
              variant="ghost"
              className="w-full rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 h-14 text-base font-semibold"
            >
              Log in
            </Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .animated-bg {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }

        .lightspeed {
          background: radial-gradient(
            ellipse at center,
            #1a1a2e 0%,
            #000000 100%
          );
          animation: lightspeed 20s linear infinite;
        }

        .lightspeed::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(59, 130, 246, 0.1) 2px,
              rgba(59, 130, 246, 0.1) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(34, 197, 94, 0.1) 2px,
              rgba(34, 197, 94, 0.1) 4px
            );
          transform: translate(-50%, -50%) perspective(500px) rotateX(60deg);
          animation: zoom 3s ease-in-out infinite;
        }

        .particles {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: particles 15s ease-in-out infinite;
        }

        .particles::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(
              circle at 20% 50%,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 80%,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 40% 20%,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%
            );
          animation: float 8s ease-in-out infinite;
        }

        .waves {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .waves::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            60deg,
            transparent,
            transparent 50px,
            rgba(255, 255, 255, 0.05) 50px,
            rgba(255, 255, 255, 0.05) 100px
          );
          animation: wave 10s linear infinite;
        }

        .grid {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .grid::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes zoom {
          0%,
          100% {
            transform: translate(-50%, -50%) perspective(500px) rotateX(60deg)
              scale(1);
          }
          50% {
            transform: translate(-50%, -50%) perspective(500px) rotateX(60deg)
              scale(1.5);
          }
        }

        @keyframes lightspeed {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes particles {
          0%,
          100% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(30deg) brightness(1.2);
          }
        }

        @keyframes wave {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>
    </div>
  );
}
