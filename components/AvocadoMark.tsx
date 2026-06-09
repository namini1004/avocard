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

export function AvocardCardLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="80"
      height="50"
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="76" height="44" rx="12" fill="#263719" />
      <path
        d="M11 39C24 31 37 35 50 27C60 21 67 14 77 10V47H12C10 45 9 42 11 39Z"
        fill="#405C1D"
        opacity="0.78"
      />
      <rect x="13" y="13" width="19" height="15" rx="4" fill="#F5D77D" />
      <path d="M20 14V28M27 14V28M14 21H32" stroke="#A67924" strokeWidth="1.1" opacity="0.72" />
      <g transform="translate(43 11)">
        <ellipse cx="15" cy="14" rx="17" ry="14" fill="#FFF9E8" />
        <circle cx="15" cy="14" r="10.5" fill="#6F982B" />
        <circle cx="15" cy="14" r="8" fill="#D5A443" />
        <circle cx="12.3" cy="12" r="1.35" fill="#162016" />
        <circle cx="17.7" cy="12" r="1.35" fill="#162016" />
        <path d="M12.2 16C14 18.4 16.3 18.4 18 16" stroke="#162016" strokeWidth="1.35" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function AvocadoMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="176"
      height="204"
      viewBox="0 0 176 204"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="88" cy="191" rx="46" ry="8" fill="#263719" opacity="0.14" />
      <path d="M85 29C83 17 78 10 69 5" stroke="#3D321E" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M86 21C99 2 121 1 139 8C132 31 111 42 88 33C87 29 86 25 86 21Z"
        fill="#557821"
      />
      <path d="M99 27C108 18 118 12 130 9" stroke="#CFE49B" strokeWidth="3" strokeLinecap="round" opacity="0.72" />
      <rect x="32" y="25" width="112" height="152" rx="31" fill="#DCEB9B" />
      <path d="M144 44C151 51 155 62 155 78V146C155 161 146 174 132 178V47L144 44Z" fill="#405C1D" />
      <path
        d="M33 141C57 128 80 136 101 124C118 114 129 98 144 94V177H62C46 177 33 164 33 148V141Z"
        fill="#8DB63C"
        opacity="0.82"
      />
      <rect x="48" y="48" width="28" height="22" rx="6" fill="#F5D77D" />
      <path d="M57 49V70M67 49V70M49 59H76" stroke="#A67924" strokeWidth="1.3" opacity="0.72" />
      <circle cx="88" cy="103" r="38" fill="#405C1D" />
      <circle cx="88" cy="103" r="31" fill="#D5A443" />
      <circle cx="77.5" cy="99" r="5.4" fill="#162016" />
      <circle cx="98.5" cy="99" r="5.4" fill="#162016" />
      <circle cx="79" cy="97" r="1.8" fill="white" opacity="0.9" />
      <circle cx="100" cy="97" r="1.8" fill="white" opacity="0.9" />
      <path d="M78 111C83 119 93 119 98 111" stroke="#162016" strokeWidth="4" strokeLinecap="round" />
      <circle cx="67" cy="110" r="5.5" fill="#FFD65A" opacity="0.86" />
      <circle cx="109" cy="110" r="5.5" fill="#FFD65A" opacity="0.86" />
      <path d="M65 89C68 85 72 84 76 86" stroke="#162016" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 86C104 84 108 85 111 89" stroke="#162016" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 106C17 116 14 132 23 142" stroke="#405C1D" strokeWidth="13" strokeLinecap="round" />
      <path d="M146 104C160 114 163 130 153 141" stroke="#405C1D" strokeWidth="13" strokeLinecap="round" />
      <path d="M70 176V190" stroke="#405C1D" strokeWidth="13" strokeLinecap="round" />
      <path d="M106 176V190" stroke="#405C1D" strokeWidth="13" strokeLinecap="round" />
    </svg>
  );
}
