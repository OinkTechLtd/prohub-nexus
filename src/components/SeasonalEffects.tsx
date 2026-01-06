import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
  delay: number;
}

interface Leaf {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
  delay: number;
  color: string;
}

const SeasonalEffects = () => {
  const [season, setSeason] = useState<"winter" | "spring" | "summer" | "autumn" | null>(null);
  const [particles, setParticles] = useState<Snowflake[] | Leaf[]>([]);

  useEffect(() => {
    const month = new Date().getMonth(); // 0-11

    // December (11) - March (2) = Winter
    if (month >= 11 || month <= 2) {
      setSeason("winter");
    }
    // April (3) - May (4) = Spring
    else if (month >= 3 && month <= 4) {
      setSeason("spring");
    }
    // June (5) - August (8) = Summer
    else if (month >= 5 && month <= 7) {
      setSeason("summer");
    }
    // September (8) - November (10) = Autumn
    else if (month >= 8 && month <= 10) {
      setSeason("autumn");
    }
  }, []);

  useEffect(() => {
    if (season === "winter") {
      // Create snowflakes
      const snowflakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 5 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.7,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 5,
      }));
      setParticles(snowflakes);
    } else if (season === "autumn") {
      // Create falling leaves
      const colors = ["#D2691E", "#CD853F", "#A0522D", "#8B4513", "#FF8C00", "#DAA520"];
      const leaves: Leaf[] = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 8 + Math.random() * 12,
        opacity: 0.6 + Math.random() * 0.4,
        size: 15 + Math.random() * 20,
        delay: Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(leaves);
    } else if (season === "spring") {
      // Create flower petals
      const colors = ["#FFB7C5", "#FFC0CB", "#FFE4E1", "#FFDAB9", "#E6E6FA"];
      const petals: Leaf[] = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 6 + Math.random() * 8,
        opacity: 0.5 + Math.random() * 0.5,
        size: 8 + Math.random() * 12,
        delay: Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(petals);
    }
  }, [season]);

  if (!season) return null;

  // Winter - Snowflakes
  if (season === "winter") {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {(particles as Snowflake[]).map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-snowfall"
            style={{
              left: `${flake.left}%`,
              animationDuration: `${flake.animationDuration}s`,
              animationDelay: `${flake.delay}s`,
              opacity: flake.opacity,
            }}
          >
            <div
              className="rounded-full bg-white shadow-lg"
              style={{
                width: flake.size,
                height: flake.size,
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
              }}
            />
          </div>
        ))}
        <style>{`
          @keyframes snowfall {
            0% {
              transform: translateY(-20px) rotate(0deg);
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
            }
          }
          .animate-snowfall {
            animation: snowfall linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // Autumn - Falling leaves
  if (season === "autumn") {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {(particles as Leaf[]).map((leaf) => (
          <div
            key={leaf.id}
            className="absolute animate-leaf-fall"
            style={{
              left: `${leaf.left}%`,
              animationDuration: `${leaf.animationDuration}s`,
              animationDelay: `${leaf.delay}s`,
              opacity: leaf.opacity,
            }}
          >
            <svg
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 24 24"
              fill={leaf.color}
            >
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.3 0 2.5-.3 3.7-.7C11 18 8 14 8 10c0-1.8.5-3.5 1.3-5C10.8 3.8 12.3 3 14 3c1.4 0 2.7.5 3.7 1.3C16.2 2.8 14.2 2 12 2z" />
            </svg>
          </div>
        ))}
        <style>{`
          @keyframes leaf-fall {
            0% {
              transform: translateY(-30px) rotate(0deg) translateX(0);
            }
            25% {
              transform: translateY(25vh) rotate(90deg) translateX(30px);
            }
            50% {
              transform: translateY(50vh) rotate(180deg) translateX(-20px);
            }
            75% {
              transform: translateY(75vh) rotate(270deg) translateX(40px);
            }
            100% {
              transform: translateY(100vh) rotate(360deg) translateX(0);
            }
          }
          .animate-leaf-fall {
            animation: leaf-fall ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Spring - Flower petals
  if (season === "spring") {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {(particles as Leaf[]).map((petal) => (
          <div
            key={petal.id}
            className="absolute animate-petal-fall"
            style={{
              left: `${petal.left}%`,
              animationDuration: `${petal.animationDuration}s`,
              animationDelay: `${petal.delay}s`,
              opacity: petal.opacity,
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: petal.size,
                height: petal.size * 0.6,
                backgroundColor: petal.color,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              }}
            />
          </div>
        ))}
        <style>{`
          @keyframes petal-fall {
            0% {
              transform: translateY(-20px) rotate(0deg) translateX(0);
            }
            33% {
              transform: translateY(33vh) rotate(120deg) translateX(20px);
            }
            66% {
              transform: translateY(66vh) rotate(240deg) translateX(-15px);
            }
            100% {
              transform: translateY(100vh) rotate(360deg) translateX(10px);
            }
          }
          .animate-petal-fall {
            animation: petal-fall ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Summer - Subtle sun rays / sparkles (less intrusive)
  if (season === "summer") {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <div 
          className="absolute top-0 right-0 w-96 h-96 opacity-10"
          style={{
            background: "radial-gradient(circle at 70% 20%, rgba(255, 215, 0, 0.3), transparent 70%)",
          }}
        />
      </div>
    );
  }

  return null;
};

export default SeasonalEffects;