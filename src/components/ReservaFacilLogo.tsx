import React from 'react';

interface ReservaFacilLogoProps {
  className?: string;
}

export const ReservaFacilLogo: React.FC<ReservaFacilLogoProps> = ({
  className = 'w-10 h-10',
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Logo Reserva Fácil"
    >
      <defs>
        <linearGradient id="rfBgGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a4a8f" />
          <stop offset="100%" stopColor="#002244" />
        </linearGradient>
        <linearGradient id="rfGoldGrad" x1="34" y1="26" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Escudo / Base Institucional */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="url(#rfBgGrad)"
        stroke="#60a5fa"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {/* Estrutura de Calendário / Ambiente Arquitetônico */}
      <rect
        x="11"
        y="15"
        width="32"
        height="31"
        rx="5"
        fill="#ffffff"
        fillOpacity="0.1"
        stroke="#e2e8f0"
        strokeWidth="2.4"
      />
      {/* Topo do Calendário */}
      <path
        d="M11 23H43"
        stroke="#93c5fd"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Argolas Superiores */}
      <path
        d="M19 11V17M35 11V17"
        stroke="#f8fafc"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Check de Reserva Confirmada dentro do Calendário */}
      <path
        d="M19.5 34L24.5 39L34.5 29"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Emblema de Chave em Destaque (Canto Inferior Direito) */}
      <circle
        cx="44"
        cy="37"
        r="7.5"
        fill="#002244"
        stroke="url(#rfGoldGrad)"
        strokeWidth="3.2"
      />
      <circle cx="44" cy="37" r="2.2" fill="#fcd34d" />
      <path
        d="M44 44.5V54M44 49.5H49.5M44 53.5H48"
        stroke="url(#rfGoldGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
