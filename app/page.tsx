'use client';

import React, { useState, useEffect } from 'react';
import rawCards from './cards.json';

interface Card {
  '#'?: number | string;
  'Color HEX'?: string;
  Categoría?: string;
  Icono?: string;
  'Modelo (Intención)'?: string;
  'Anverso (Gancho Científico)'?: string;
  'Reverso (Instrucción de Activación)'?: string;
}

// COLORES OFICIALES
const CATEGORY_COLORS: Record<string, string> = {
  SONREÍR: '#FAD02C',
  EXPLORAR: '#81C784',
  RESPIRAR: '#87CEEB',
  EVOLUCIONAR: '#E1BEE7',
  COMPARTIR: '#FF9A8B',
  'CAJA DE HERRAMIENTAS': '#B8B8B8',
};

const CATEGORIES = [
  {
    key: 'SONREÍR',
    label: 'SONREÍR',
    sub: 'Humor y ligereza',
    color: '#FAD02C',
    tilt: '-rotate-1',
  },
  {
    key: 'RESPIRAR',
    label: 'RESPIRAR',
    sub: 'Calma y pausa',
    color: '#87CEEB',
    tilt: 'rotate-0',
  },
  {
    key: 'EXPLORAR',
    label: 'EXPLORAR',
    sub: 'Curiosidad y asombro',
    color: '#81C784',
    tilt: 'rotate-1',
  },
  {
    key: 'EVOLUCIONAR',
    label: 'EVOLUCIONAR',
    sub: 'Fuerza interior',
    color: '#E1BEE7',
    tilt: 'rotate-1',
  },
  {
    key: 'COMPARTIR',
    label: 'COMPARTIR',
    sub: 'Conexión y generosidad',
    color: '#FF9A8B',
    tilt: 'rotate-0',
  },
  {
    key: 'CAJA DE HERRAMIENTAS',
    label: 'CAJA DE HERRAMIENTAS',
    sub: 'No lo tengo claro',
    color: '#B8B8B8',
    tilt: '-rotate-1',
  },
];

const cards: Card[] = (rawCards as Card[]).filter(
  (c) =>
    c['Categoría'] &&
    (c['Anverso (Gancho Científico)'] ||
      c['Reverso (Instrucción de Activación)'])
);

interface DiaryEntry {
  id: string;
  date: string;
  card: Card;
  feeling?: string;
}

// FUNCIÓN AUXILIAR PARA LIMPIAR COMILLAS REPETIDAS O EXTERNAS
const cleanText = (text?: string): string => {
  if (!text) return '';
  return text.trim().replace(/^["“]+|["”]+$/g, '');
};

// OBTENER CLAVE DE FECHA ACTUAL (YYYY-MM-DD)
const getTodayKey = () => new Date().toISOString().split('T')[0];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'draw' | 'diary' | 'mission'>(
    'draw'
  );
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userFeeling, setUserFeeling] = useState<string | null>(null);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);

  // ESTADO PARA ANIMACIÓN DE CARGA AL SACAR CARTA
  const [isLoading, setIsLoading] = useState(false);

  // ESTADÍSTICAS DINÁMICAS BASADAS EN LAS SELECCIONES DE HOY
  const [dailyStats, setDailyStats] = useState<Record<string, number>>({
    SONREÍR: 45,
    RESPIRAR: 30,
    EXPLORAR: 15,
    EVOLUCIONAR: 10,
    COMPARTIR: 8,
    'CAJA DE HERRAMIENTAS': 5,
  });

  // CARGAR DIARIO Y ESTADÍSTICAS DEL DÍA AL INICIAR
  useEffect(() => {
    const savedDiary = localStorage.getItem('tesoros_diario');
    if (savedDiary) {
      try {
        setDiary(JSON.parse(savedDiary));
      } catch (e) {
        console.error(e);
      }
    }

    const today = getTodayKey();
    const statsKey = `tesoros_stats_${today}`;
    const savedStats = localStorage.getItem(statsKey);
    if (savedStats) {
      try {
        setDailyStats(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialStats = {
        SONREÍR: 45,
        RESPIRAR: 30,
        EXPLORAR: 15,
        EVOLUCIONAR: 10,
        COMPARTIR: 8,
        'CAJA DE HERRAMIENTAS': 5,
      };
      setDailyStats(initialStats);
      localStorage.setItem(statsKey, JSON.stringify(initialStats));
    }
  }, []);

  const handleGoHome = () => {
    setCurrentCard(null);
    setActiveTab('draw');
    setIsFlipped(false);
    setIsCardSaved(false);
  };

  const handleSelectCategory = (categoryKey: string) => {
    setIsLoading(true);

    // Animación extendida a 1.2 segundos para apreciar el diamante cargando
    setTimeout(() => {
      let deck = cards;
      let actualCat = categoryKey;

      if (categoryKey !== 'RANDOM') {
        deck = cards.filter(
          (c) => c['Categoría']?.toUpperCase() === categoryKey
        );
        if (deck.length === 0) deck = cards;
      }

      const randomIndex = Math.floor(Math.random() * deck.length);
      if (deck[randomIndex]) {
        const selected = deck[randomIndex];
        setCurrentCard(selected);
        setIsFlipped(false);
        setUserFeeling(null);
        setShowCheckIn(false);
        setIsCardSaved(false);

        const catName = selected['Categoría']?.toUpperCase() || actualCat;

        // ACTUALIZAR Y GUARDAR ESTADÍSTICAS DEL DÍA
        setDailyStats((prev) => {
          const updated = {
            ...prev,
            [catName]: (prev[catName] || 0) + 1,
          };
          const today = getTodayKey();
          localStorage.setItem(
            `tesoros_stats_${today}`,
            JSON.stringify(updated)
          );
          return updated;
        });
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);

    if (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      navigator.vibrate
    ) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // Silencioso si no lo soporta
      }
    }
  };

  const handleOpenFromDiary = (entry: DiaryEntry) => {
    setCurrentCard(entry.card);
    setIsFlipped(true);
    setIsCardSaved(true);
    setActiveTab('draw');
    setUserFeeling(entry.feeling || null);
  };

  const handleSaveToDiary = () => {
    if (!currentCard || isCardSaved) return;

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      }),
      card: currentCard,
      feeling: userFeeling || undefined,
    };

    const updated = [newEntry, ...diary];
    setDiary(updated);
    localStorage.setItem('tesoros_diario', JSON.stringify(updated));
    setIsCardSaved(true);
  };

  const handleSaveFeeling = (feeling: string) => {
    setUserFeeling(feeling);
    setShowCheckIn(false);

    if (isCardSaved && currentCard) {
      const updated = diary.map((entry) => {
        if (
          entry.card['Anverso (Gancho Científico)'] ===
          currentCard['Anverso (Gancho Científico)']
        ) {
          return { ...entry, feeling };
        }
        return entry;
      });
      setDiary(updated);
      localStorage.setItem('tesoros_diario', JSON.stringify(updated));
    }
  };

  const handleShare = () => {
    if (navigator.share && currentCard) {
      const hookText = cleanText(currentCard['Anverso (Gancho Científico)']);
      navigator
        .share({
          title: 'Tesoros del Autodescubrimiento',
          text: `Descubrí este diamante hoy: "${hookText}"`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  const getMostNeededStats = () => {
    const sorted = Object.entries(dailyStats).sort((a, b) => b[1] - a[1]);
    const topKey = sorted[0] ? sorted[0][0] : 'SONREÍR';
    const total = Object.values(dailyStats).reduce((a, b) => a + b, 0);
    const topCount = dailyStats[topKey] || 0;
    const percentage = total > 0 ? Math.round((topCount / total) * 100) : 42;

    const catObj = CATEGORIES.find((c) => c.key === topKey);
    return {
      label: catObj ? catObj.label : 'SONREÍR',
      percentage,
      color: catObj ? catObj.color : '#FAD02C',
    };
  };

  const mostNeeded = getMostNeededStats();

  const getCardColor = (catName?: string) => {
    if (!catName) return '#FAD02C';
    const key = catName.toUpperCase();
    return CATEGORY_COLORS[key] || '#FAD02C';
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&display=swap');
        
        .font-open-sans {
          font-family: 'Open Sans', sans-serif;
        }
        .font-playfair {
          font-family: 'Playfair Display', serif;
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.22);
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(200, 138, 52, 0.75));
          }
        }

        .animate-pulse-glow {
          animation: pulseGlow 1.4s infinite ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out forwards;
        }
      `}</style>

      {/* COMPONENTE DE CARGA / ANIMACIÓN DEL DIAMANTE */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#FAF8F5]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fadeIn">
          <div className="text-6xl animate-pulse-glow mb-3">💎</div>
          <p className="text-xs font-playfair italic text-[#997343] font-semibold tracking-wider">
            Revelando tu diamante...
          </p>
        </div>
      )}

      <main className="min-h-screen bg-[#FAF8F5] text-[#332E2B] flex flex-col items-center justify-between p-4 max-w-md mx-auto font-open-sans antialiased">
        {/* CABECERA CON LOGO */}
        <header className="w-full flex justify-between items-center mb-3 pt-1 px-1">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left group"
            title="Volver al inicio"
          >
            <span className="text-sm transform group-hover:scale-125 transition-transform">
              💎
            </span>
            <span className="text-xs font-playfair italic text-[#332E2B] font-semibold underline underline-offset-2 decoration-[#997343]/40">
              Tesoros del Autodescubrimiento
            </span>
          </button>

          <div className="flex gap-3 text-xs font-playfair italic">
            <button
              onClick={() => {
                setCurrentCard(null);
                setActiveTab('diary');
              }}
              className={`text-[#997343] hover:underline ${
                activeTab === 'diary' ? 'font-bold underline' : ''
              }`}
            >
              📖 Mi Diario ({diary.length})
            </button>
            <button
              onClick={() => {
                setCurrentCard(null);
                setActiveTab('mission');
              }}
              className={`text-[#8A827A] hover:underline ${
                activeTab === 'mission'
                  ? 'font-bold underline text-[#332E2B]'
                  : ''
              }`}
            >
              🇻🇪 Misión
            </button>
          </div>
        </header>

        {/* PESTAÑA PRINCIPAL */}
        {activeTab === 'draw' && (
          <>
            {!currentCard ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center space-y-3 my-1">
                {/* PREGUNTA PRINCIPAL */}
                <div className="text-center space-y-1">
                  <div className="text-xs font-mono tracking-widest text-[#997343] uppercase">
                    ✦ 💎 ✦
                  </div>
                  <h1 className="text-2xl font-playfair text-[#1C1817] font-semibold tracking-tight text-center">
                    ¿Qué necesitas hoy para estar mejor?
                  </h1>
                  <p className="text-xs text-[#8A827A] font-light max-w-[280px] mx-auto text-center leading-relaxed font-open-sans">
                    Elige la categoría que más resuene contigo.
                  </p>
                </div>

                {/* GRÁFICO TERMÓMETRO (BASADO EN LAS SELECCIONES DE HOY) */}
                <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-3 shadow-sm flex items-center gap-3">
                  <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                    <svg
                      className="w-11 h-11 transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-[#EAE5DF]"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        strokeWidth="4"
                        strokeDasharray={`${mostNeeded.percentage}, 100`}
                        strokeLinecap="round"
                        stroke={mostNeeded.color}
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-[#1C1817] font-open-sans">
                      {mostNeeded.percentage}%
                    </span>
                  </div>
                  <div className="text-left space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#997343] font-open-sans">
                      LO QUE MÁS RESUENA HOY
                    </p>
                    <p className="text-xs font-playfair italic text-[#2C2523] leading-tight">
                      La comunidad necesita principalmente{' '}
                      <strong className="font-semibold text-[#1C1817]">
                        {mostNeeded.label}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                {/* RUEDA DE CARTAS EN CÍRCULO */}
                <div className="grid grid-cols-3 gap-2.5 w-full items-center py-1">
                  {/* FILA 1: ARRIBA (3 CARTAS) */}
                  {CATEGORIES.slice(0, 3).map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleSelectCategory(cat.key)}
                      className={`aspect-[63/88] rounded-2xl p-2.5 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-[0_0_22px_rgba(255,255,255,0.95)] hover:brightness-110 hover:-translate-y-1 transition-all duration-300 active:scale-95 border border-black/5 relative overflow-hidden group ${cat.tilt}`}
                      style={{ backgroundColor: cat.color }}
                    >
                      <span className="text-[10px] font-mono opacity-60 group-hover:scale-125 transition-transform">
                        💎
                      </span>

                      <div className="flex flex-col items-center justify-center space-y-0.5 px-0.5 my-auto">
                        <span className="text-xs font-open-sans font-bold text-[#1C1817] leading-tight text-center uppercase tracking-wider">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-open-sans font-normal text-[#1C1817]/80 text-center leading-tight">
                          {cat.sub}
                        </span>
                      </div>

                      <span className="text-[8px] font-mono opacity-40">✦</span>
                    </button>
                  ))}

                  {/* FILA 2: CENTRO - DIAMANTE SORPRESA */}
                  <div className="col-span-3 py-1 flex justify-center">
                    <button
                      onClick={() => handleSelectCategory('RANDOM')}
                      className="w-full bg-white border-2 border-[#997343]/30 rounded-3xl p-3.5 flex flex-col items-center justify-center text-center shadow-md hover:shadow-[0_0_25px_rgba(200,138,52,0.35)] hover:border-[#997343] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 group relative overflow-hidden"
                    >
                      <div className="text-4xl transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 mb-1 drop-shadow-sm">
                        💎
                      </div>
                      <span className="text-xs font-playfair italic font-bold text-[#1C1817] uppercase tracking-wider">
                        DIAMANTE sorpresa
                      </span>
                      <span className="text-[10px] text-[#8A827A] font-light mt-0.5 max-w-[240px] font-open-sans">
                        un tesoro aleatorio que te dirá justo lo que necesitas
                        hoy
                      </span>
                    </button>
                  </div>

                  {/* FILA 3: ABAJO (3 CARTAS) */}
                  {CATEGORIES.slice(3, 6).map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleSelectCategory(cat.key)}
                      className={`aspect-[63/88] rounded-2xl p-2.5 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-[0_0_22px_rgba(255,255,255,0.95)] hover:brightness-110 hover:-translate-y-1 transition-all duration-300 active:scale-95 border border-black/5 relative overflow-hidden group ${cat.tilt}`}
                      style={{ backgroundColor: cat.color }}
                    >
                      <span className="text-[10px] font-mono opacity-60 group-hover:scale-125 transition-transform">
                        💎
                      </span>

                      <div className="flex flex-col items-center justify-center space-y-0.5 px-0.5 my-auto">
                        <span className="text-xs font-open-sans font-bold text-[#1C1817] leading-tight text-center uppercase tracking-wider">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-open-sans font-normal text-[#1C1817]/80 text-center leading-tight">
                          {cat.sub}
                        </span>
                      </div>

                      <span className="text-[8px] font-mono opacity-40">✦</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* VISTA DE CARTA SELECCIONADA */
              <div className="w-full flex-1 flex flex-col items-center justify-between my-1 animate-fadeIn">
                {/* BOTÓN VOLVER ARRIBA DE LA CARTA */}
                <div className="w-full flex justify-between items-center mb-1">
                  <button
                    onClick={handleGoHome}
                    className="text-xs text-[#8A827A] hover:text-[#332E2B] font-light flex items-center gap-1 transition-colors font-open-sans"
                  >
                    ← elegir otro diamante
                  </button>

                  {isCardSaved && (
                    <span className="text-[10px] font-playfair italic text-[#997343] font-semibold bg-[#997343]/10 px-2.5 py-0.5 rounded-full">
                      ✨ Guardado en tu diario
                    </span>
                  )}
                </div>

                {/* CONTENEDOR CARTA 3D FLIP */}
                <div
                  className="w-full aspect-[63/88] max-h-[460px] cursor-pointer my-1 group"
                  style={{ perspective: '1000px' }}
                  onClick={handleFlipCard}
                >
                  <div
                    className="w-full h-full relative transition-transform duration-700 rounded-[28px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.9)] border border-black/5"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped
                        ? 'rotateY(180deg)'
                        : 'rotateY(0deg)',
                    }}
                  >
                    {/* ANVERSO (FRENTE) */}
                    <div
                      className="absolute inset-0 rounded-[28px] p-6 flex flex-col justify-between items-center text-center overflow-hidden border-4 border-white/20"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        backgroundColor: getCardColor(currentCard['Categoría']),
                        color: '#1C1817',
                      }}
                    >
                      {/* 1. CATEGORÍA */}
                      <div className="pt-2">
                        <h2 className="text-xl font-open-sans font-bold tracking-widest text-[#1C1817] uppercase text-center">
                          {currentCard['Categoría']}
                        </h2>
                      </div>

                      {/* 2. DIAMANTE CON TRANSPARENCIA + HOOK +10% MÁS GRANDE Y CENTRADO EN EL MEDIO */}
                      <div className="my-auto flex flex-col items-center justify-center space-y-3 px-1 w-full">
                        <div className="text-[72px] leading-none opacity-75 drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300">
                          💎
                        </div>

                        <p className="text-2xl font-playfair italic text-[#1C1817] text-center font-semibold leading-snug px-1">
                          {cleanText(
                            currentCard['Anverso (Gancho Científico)'] ||
                              currentCard['Modelo (Intención)']
                          )}
                        </p>
                      </div>

                      {/* 3. TOCA PARA GIRAR */}
                      <div className="pb-1 text-xs text-[#1C1817]/80 font-light flex items-center justify-center gap-1.5 animate-bounce font-open-sans">
                        <span className="text-xs">🔄</span> toca para girar la
                        carta
                      </div>
                    </div>

                    {/* REVERSO (ATRÁS) */}
                    <div
                      className="absolute inset-0 rounded-[28px] p-6 flex flex-col justify-between items-center text-center overflow-hidden bg-white border-4 border-[#FAF8F5]"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        color: '#1C1817',
                      }}
                    >
                      {/* CATEGORÍA MÁS PEQUEÑA ARRIBA */}
                      <div className="pt-2 w-full">
                        <h2 className="text-[10px] font-open-sans font-semibold text-[#997343]/80 text-center uppercase tracking-widest">
                          {currentCard['Categoría']}
                        </h2>
                      </div>

                      {/* BLOQUE CENTRAL: EMOJI, MODELO DESTACADO MÁS GRANDE Y MENSAJE SIEMPRE CENTRADO */}
                      <div className="my-auto w-full flex flex-col items-center justify-center space-y-3 px-1">
                        <div className="text-4xl">
                          {currentCard['Icono'] || '💎'}
                        </div>

                        {currentCard['Modelo (Intención)'] && (
                          <p className="text-base font-playfair font-bold italic tracking-wide uppercase text-[#D9A24A] text-center">
                            {cleanText(currentCard['Modelo (Intención)'])}
                          </p>
                        )}

                        <p className="text-base text-[#2C2523] font-open-sans font-normal leading-relaxed text-center px-1">
                          {cleanText(
                            currentCard[
                              'Reverso (Instrucción de Activación)'
                            ] || currentCard['Anverso (Gancho Científico)']
                          )}
                        </p>
                      </div>

                      {/* PIE DE CARTA REVERSO */}
                      <div className="pb-1 text-[9px] text-[#B5AEA7] tracking-widest font-open-sans uppercase">
                        Tesoros del Autodescubrimiento
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                {isFlipped ? (
                  <div className="w-full space-y-2 my-2 animate-fadeIn">
                    <button
                      onClick={() => handleSelectCategory('RANDOM')}
                      className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-playfair italic font-medium flex items-center justify-center gap-1.5 hover:bg-[#332E2B] shadow-sm transition-all"
                    >
                      <span>✨</span>
                      <span>Sacar otro diamante</span>
                    </button>

                    <div className="grid grid-cols-3 gap-2 w-full">
                      <button
                        onClick={handleSaveToDiary}
                        disabled={isCardSaved}
                        className={`py-2 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                          isCardSaved
                            ? 'bg-[#997343]/15 border-[#997343] text-[#997343] font-bold'
                            : 'bg-white border-[#E3DDD5] text-[#332E2B] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span>💎</span>
                        <span>{isCardSaved ? 'Guardado' : 'Guardar'}</span>
                      </button>

                      <button
                        onClick={() => setShowCheckIn(true)}
                        className="py-2 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[11px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>💬</span>
                        <span>¿Te ayudó?</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="py-2 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[11px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>📤</span>
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 my-2" />
                )}

                {/* PIE DE PÁGINA GOFUNDME */}
                <div className="w-full flex flex-col items-center gap-1 text-center px-1">
                  <p className="text-[10px] text-[#8A827A] font-light leading-relaxed max-w-[320px] mx-auto text-center font-open-sans">
                    Tesoros del Autodescubrimiento nació después de los
                    terremotos en Venezuela como parte de las donaciones que
                    están pasando desapercibidas, tales como el apoyo emocional
                    ❤️‍🩹. Cada caja física llega primero a quien más la necesita.
                  </p>
                  <a
                    href="https://gofundme.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-playfair italic text-[#997343] underline pt-0.5 hover:text-[#1C1817]"
                  >
                    apoyar en GoFundMe →
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* PESTAÑA: MI DIARIO */}
        {activeTab === 'diary' && (
          <div className="w-full flex-1 overflow-y-auto space-y-3 my-2 pr-1 max-h-[72vh] animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-playfair italic text-[#1C1817]">
                Tu Diario de Reflexión 💎
              </h2>
              <button
                onClick={handleGoHome}
                className="text-xs text-[#8A827A] hover:text-[#1C1817] font-open-sans"
              >
                ← Volver
              </button>
            </div>
            {diary.length === 0 ? (
              <div className="text-center py-20 text-[#8A827A] text-xs font-light space-y-2 font-open-sans">
                <p className="text-3xl">📖</p>
                <p className="font-playfair italic text-sm text-[#332E2B]">
                  Aún no has guardado tesoros en tu diario.
                </p>
                <p>
                  Gira una carta y presiona <strong>"Guardar"</strong> para
                  conservarla aquí.
                </p>
              </div>
            ) : (
              diary.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleOpenFromDiary(entry)}
                  className="w-full rounded-2xl p-4 shadow-sm border border-black/5 space-y-2 text-left relative overflow-hidden transition-transform hover:scale-[1.02] active:scale-95 group"
                  style={{
                    backgroundColor: getCardColor(entry.card['Categoría']),
                  }}
                >
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#1C1817]/70 uppercase tracking-wider font-open-sans">
                    <span>💎 {entry.card['Categoría']}</span>
                    <span>{entry.date}</span>
                  </div>
                  <p className="text-xs font-playfair italic font-bold text-[#1C1817] text-center">
                    "
                    {cleanText(
                      entry.card['Anverso (Gancho Científico)'] ||
                        entry.card['Modelo (Intención)']
                    )}
                    "
                  </p>
                  <p className="text-[11px] text-[#1C1817]/90 font-open-sans font-normal leading-relaxed text-center">
                    {cleanText(
                      entry.card['Reverso (Instrucción de Activación)']
                    )}
                  </p>

                  <div className="text-[10px] font-open-sans text-[#1C1817]/80 pt-1.5 border-t border-black/10 flex items-center justify-between">
                    <span>
                      {entry.feeling
                        ? `Sentimiento: ${entry.feeling}`
                        : 'Toca para abrir este diamante'}
                    </span>
                    <span className="font-bold group-hover:translate-x-1 transition-transform">
                      ver carta →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* PESTAÑA: MISIÓN */}
        {activeTab === 'mission' && (
          <div className="w-full flex-1 overflow-y-auto space-y-4 my-2 text-center px-1 animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-playfair italic text-[#1C1817]">
                Nuestra Misión 🇻🇪
              </h2>
              <button
                onClick={handleGoHome}
                className="text-xs text-[#8A827A] hover:text-[#1C1817] font-open-sans"
              >
                ← Volver
              </button>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EAE5DF] text-left space-y-3.5 text-xs leading-relaxed text-[#524B45] font-open-sans">
              <p className="text-sm font-playfair italic text-[#1C1817] font-semibold text-center">
                "El apoyo emocional también salva vidas."
              </p>
              <p>
                Tesoros del Autodescubrimiento nació después de los terremotos
                en Venezuela como parte de las donaciones que están pasando
                desapercibidas, tales como el apoyo emocional ❤️‍🩹.
              </p>
              <p>
                Cada caja física llega primero a quien más la necesita y esta
                versión digital ayuda a medir el impacto de la herramienta y a
                que llegue a más personas.
              </p>
              <p className="font-medium text-[#1C1817]">
                Con cada donación estarás cubriendo costes de envío y yo me
                encargo de hacerles llegar su caja física directamente a sus
                manos.
              </p>
              <div className="pt-3 text-center">
                <a
                  href="https://gofundme.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-6 py-3 bg-[#997343] text-white rounded-full font-playfair italic text-xs shadow-md hover:bg-[#856338] transition-all"
                >
                  Apoyar en GoFundMe →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* POP-UP "¿CÓMO TE SIENTES AHORA?" */}
        {showCheckIn && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl border border-[#EAE5DF] relative">
              <button
                onClick={() => setShowCheckIn(false)}
                className="absolute top-4 right-4 text-[#8A827A] hover:text-[#1C1817] text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#FAF8F5] transition-colors"
                title="Cerrar"
              >
                ✕
              </button>

              <h3 className="text-base font-playfair italic text-[#1C1817] pr-4">
                ¿Cómo te sientes ahora?
              </h3>

              <div className="flex flex-col gap-2 pt-1">
                {[
                  { label: '😔 Sin cambios', val: 'Sin cambios' },
                  { label: '🙂 Un poco mejor', val: 'Un poco mejor' },
                  { label: '❤️ Mucho mejor', val: 'Mucho mejor' },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => handleSaveFeeling(item.label)}
                    className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F2EEE9] rounded-xl text-xs font-light text-[#332E2B] transition-colors border border-black/5 font-open-sans"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA */}
        <footer className="w-full text-center py-2 border-t border-[#EAE5DF] mt-auto font-open-sans">
          <p className="text-[11px] text-[#8A827A] font-light">
            ¿Quieres la experiencia táctil en tus manos?
          </p>
          <button className="text-xs font-playfair italic text-[#1C1817] underline underline-offset-2">
            Consigue el mazo físico completo (130 diamantes)
          </button>
        </footer>
      </main>
    </>
  );
}
