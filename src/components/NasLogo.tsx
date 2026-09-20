export function NasLogo({ size = 88 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Neighbourhood Art Studios"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Full-circle path starting from the top, going clockwise */}
        <path
          id="nas-ring-path"
          d="M60,8 A52,52 0 1,1 59.99,8"
          fill="none"
        />
      </defs>

      {/* Outer filled circle */}
      <circle cx="60" cy="60" r="58" fill="white" stroke="black" strokeWidth="2.5" />

      {/* Decorative checkerboard-style dashed ring */}
      <circle
        cx="60" cy="60" r="50"
        fill="none"
        stroke="black"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />

      {/* Inner content circle */}
      <circle cx="60" cy="60" r="38" fill="none" stroke="black" strokeWidth="0.5" />

      {/* Brand text around the ring */}
      <text fill="black" fontSize="7" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="2.2" fontWeight="600">
        <textPath href="#nas-ring-path" startOffset="4%">
          NEIGHBOURHOOD ART STUDIOS
        </textPath>
      </text>

      {/* Centre artwork — stylised "NAS" monogram */}
      <text
        x="60"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="21"
        fontWeight="900"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="black"
        letterSpacing="1"
      >
        NAS
      </text>

      {/* Decorative small subtitle beneath monogram */}
      <text
        x="60"
        y="72"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5.5"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="black"
        letterSpacing="2"
      >
        EST. 2014
      </text>
    </svg>
  )
}
