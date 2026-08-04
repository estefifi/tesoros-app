/* eslint-disable */
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

// FRASES ACCIÓN PARA LA NARRATIVA DINÁMICA DE "AHORA!"
const CATEGORY_ACTIONS: Record<string, string> = {
  SONREÍR: 'sacar una sonrisa',
  RESPIRAR: 'parar a respirar',
  EXPLORAR: 'explorar y despertar la curiosidad',
  EVOLUCIONAR: 'conectar con su fuerza interior',
  COMPARTIR: 'sentir conexión y generosidad',
  'CAJA DE HERRAMIENTAS': 'buscar herramientas de apoyo',
};

const CATEGORIES = [
  { key: 'SONREÍR', label: 'SONREÍR', sub: 'Humor y ligereza', color: '#FAD02C', tilt: '-rotate-1' },
  { key: 'RESPIRAR', label: 'RESPIRAR', sub: 'Calma y pausa', color: '#87CEEB', tilt: 'rotate-0' },
  { key: 'EXPLORAR', label: 'EXPLORAR', sub: 'Curiosidad y asombro', color: '#81C784', tilt: 'rotate-1' },
  { key: 'EVOLUCIONAR', label: 'EVOLUCIONAR', sub: 'Fuerza interior', color: '#E1BEE7', tilt: 'rotate-1' },
  { key: 'COMPARTIR', label: 'COMPARTIR', sub: 'Conexión y generosidad', color: '#FF9A8B', tilt: 'rotate-0' },
  { key: 'CAJA DE HERRAMIENTAS', label: 'CAJA DE HERRAMIENTAS', sub: 'No lo tengo claro', color: '#B8B8B8', tilt: '-rotate-1' },
];

const cards: Card[] = (rawCards as Card[]).filter(
  (c) =>
    c['Categoría'] &&
    (c['Anverso (Gancho Científico)'] || c['Reverso (Instrucción de Activación)'] || c['Modelo (Intención)'])
);

interface DiaryEntry {
  id: string;
  date: string;
  card: Card;
  feeling?: string;
  note?: string;
}

const cleanText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/""/g, '"')
    .replace(/^["“]+|["”]+$/g, '')
    .trim();
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const ZERO_STATS = {
  SONREÍR: 0,
  RESPIRAR: 0,
  EXPLORAR: 0,
  EVOLUCIONAR: 0,
  COMPARTIR: 0,
  'CAJA DE HERRAMIENTAS': 0,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'draw' | 'diary' | 'thermometer' | 'mission'>('draw');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userFeeling, setUserFeeling] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);

  // COMENTARIOS / FEEDBACK
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  // RACHA Y CALENDARIO
  const [streak, setStreak] = useState<number>(0);
  const [lastActiveDate, setLastActiveDate] = useState<string>('');
  const [activityMap, setActivityMap] = useState<Record<string, string>>({});
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);

  // ANIMACIONES
  const [isFlying, setIsFlying] = useState(false);
  const [isDiarySparkling, setIsDiarySparkling] = useState(false);
  const [flyingCard, setFlyingCard] = useState<Card | null>(null);

  // TIRADAS DIARIAS Y CARTAS DE HOY
  const [todayFlips, setTodayFlips] = useState<number>(0);
  const [todayCards, setTodayCards] = useState<Card[]>([]);
  const [showTodayModal, setShowTodayModal] = useState<boolean>(false);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [modalIsFlipped, setModalIsFlipped] = useState<boolean>(false);

  // MODALES
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showCategoryChoiceModal, setShowCategoryChoiceModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // ESTADÍSTICAS DINÁMICAS (AHORA!)
  const [dailyStats, setDailyStats] = useState<Record<string, number>>(ZERO_STATS);

  useEffect(() => {
    const today = getTodayKey();

    const savedStreak = parseInt(localStorage.getItem('tesoros_streak') || '0', 10);
    const savedLastDate = localStorage.getItem('tesoros_last_active_date') || '';
    setStreak(savedStreak);
    setLastActiveDate(savedLastDate);

    const savedActivityMap = localStorage.getItem('tesoros_activity_map');
    if (savedActivityMap) {
      try { setActivityMap(JSON.parse(savedActivityMap)); } catch (e) {}
    }

    const flipsKey = `tesoros_flips_${today}`;
    const savedFlips = localStorage.getItem(flipsKey);
    if (savedFlips) setTodayFlips(parseInt(savedFlips, 10) || 0);

    const todayCardsKey = `tesoros_today_cards_${today}`;
    const savedTodayCards = localStorage.getItem(todayCardsKey);
    if (savedTodayCards) {
      try { setTodayCards(JSON.parse(savedTodayCards)); } catch (e) {}
    }

    const savedDiary = localStorage.getItem('tesoros_diario');
    if (savedDiary) {
      try { setDiary(JSON.parse(savedDiary)); } catch (e) {}
    }

    const statsKey = `tesoros_stats_${today}`;
    const savedStats = localStorage.getItem(statsKey);
    if (savedStats) {
      try { setDailyStats(JSON.parse(savedStats)); } catch (e) {}
    } else {
      setDailyStats(ZERO_STATS);
      localStorage.setItem(statsKey, JSON.stringify(ZERO_STATS));
    }
  }, []);

  const registerDailyActivity = (categoryKey: string) => {
    const today = getTodayKey();
    const yesterday = getYesterdayKey();

    let newActivityMap = { ...activityMap };
    
    if (!newActivityMap[today]) {
      newActivityMap[today] = categoryKey;
      setActivityMap(newActivityMap);
      localStorage.setItem('tesoros_activity_map', JSON.stringify(newActivityMap));
    }

    let newStreak = streak;
    if (lastActiveDate === today) {
      if (newStreak === 0) newStreak = 1;
    } else if (lastActiveDate === yesterday) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }

    setStreak(newStreak);
    setLastActiveDate(today);
    localStorage.setItem('tesoros_streak', newStreak.toString());
    localStorage.setItem('tesoros_last_active_date', today);
  };

  const handleGoHome = () => {
    setCurrentCard(null);
    setActiveTab('draw');
    setIsFlipped(false);
    setIsCardSaved(false);
    setUserNote('');
  };

  const isCardInDiary = (card: Card) => {
    return diary.some(
      (entry) =>
        (entry.card['Anverso (Gancho Científico)'] && entry.card['Anverso (Gancho Científico)'] === card['Anverso (Gancho Científico)']) ||
        entry.card['Modelo (Intención)'] === card['Modelo (Intención)']
    );
  };

  const triggerSaveFlightAndSparkle = (cardToAnimate: Card) => {
    setFlyingCard(cardToAnimate);
    setIsFlying(true);

    setTimeout(() => {
      setIsFlying(false);
      setIsDiarySparkling(true);

      setTimeout(() => {
        setIsDiarySparkling(false);
      }, 700);
    }, 600);
  };

  const handleSelectCategory = (categoryKey: string) => {
    const today = getTodayKey();
    const flipsKey = `tesoros_flips_${today}`;
    const currentFlipsCount = parseInt(localStorage.getItem(flipsKey) || '0', 10);

    if (currentFlipsCount >= 3) {
      setShowLimitModal(true);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      let deck = cards;

      if (categoryKey !== 'RANDOM') {
        deck = cards.filter((c) => c['Categoría']?.toUpperCase() === categoryKey);
        if (deck.length === 0) deck = cards;
      }

      const randomIndex = Math.floor(Math.random() * deck.length);
      if (deck[randomIndex]) {
        const selected = deck[randomIndex];
        setCurrentCard(selected);
        setIsFlipped(false);
        setUserFeeling(null);
        setUserNote('');
        setShowCheckIn(false);
        setIsCardSaved(isCardInDiary(selected));

        const catName = selected['Categoría']?.toUpperCase() || 'SONREÍR';
        registerDailyActivity(catName);

        const newFlips = currentFlipsCount + 1;
        setTodayFlips(newFlips);
        localStorage.setItem(flipsKey, newFlips.toString());

        const updatedTodayCards = [...todayCards, selected];
        setTodayCards(updatedTodayCards);
        localStorage.setItem(`tesoros_today_cards_${today}`, JSON.stringify(updatedTodayCards));

        setDailyStats((prev) => {
          const updated = {
            ...prev,
            [catName]: (prev[catName] || 0) + 1,
          };
          localStorage.setItem(`tesoros_stats_${today}`, JSON.stringify(updated));
          return updated;
        });
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleAnotherDiamondClick = () => {
    const today = getTodayKey();
    const currentFlipsCount = parseInt(localStorage.getItem(`tesoros_flips_${today}`) || '0', 10);

    if (currentFlipsCount >= 3) {
      setShowLimitModal(true);
    } else {
      setShowCategoryChoiceModal(true);
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate(50); } catch (e) {}
    }
  };

  const handleOpenFromDiary = (entry: DiaryEntry) => {
    setCurrentCard(entry.card);
    setIsFlipped(true);
    setIsCardSaved(true);
    setActiveTab('draw');
    setUserFeeling(entry.feeling || null);
    setUserNote(entry.note || '');
  };

  const saveCardToDiary = (cardToSave: Card, feelingText?: string, noteText?: string) => {
    const currentNote = noteText !== undefined ? noteText : userNote;
    const existingIndex = diary.findIndex(
      (e) =>
        (e.card['Anverso (Gancho Científico)'] && e.card['Anverso (Gancho Científico)'] === cardToSave['Anverso (Gancho Científico)']) ||
        e.card['Modelo (Intención)'] === cardToSave['Modelo (Intención)']
    );

    let updated: DiaryEntry[];

    if (existingIndex >= 0) {
      updated = [...diary];
      updated[existingIndex] = {
        ...updated[existingIndex],
        feeling: feelingText || updated[existingIndex].feeling,
        note: currentNote !== undefined ? currentNote : updated[existingIndex].note,
      };
    } else {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        card: cardToSave,
        feeling: feelingText,
        note: currentNote,
      };
      updated = [newEntry, ...diary];
    }

    setDiary(updated);
    localStorage.setItem('tesoros_diario', JSON.stringify(updated));

    if (currentCard && ((currentCard['Anverso (Gancho Científico)'] && currentCard['Anverso (Gancho Científico)'] === cardToSave['Anverso (Gancho Científico)']) || currentCard['Modelo (Intención)'] === cardToSave['Modelo (Intención)'])) {
      setIsCardSaved(true);
    }

    triggerSaveFlightAndSparkle(cardToSave);
  };

  const handleSaveToDiary = () => {
    if (!currentCard) return;
    saveCardToDiary(currentCard, userFeeling || undefined, userNote);
  };

  const handleSaveFeeling = (feeling: string) => {
    setUserFeeling(feeling);
    setShowCheckIn(false);

    if (currentCard) {
      saveCardToDiary(currentCard, feeling, userNote);
    }
  };

  const handleShare = (card?: Card) => {
    const targetCard = card || currentCard;
    if (navigator.share && targetCard) {
      const hookText = cleanText(targetCard['Anverso (Gancho Científico)'] || targetCard['Modelo (Intención)']);
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
    const total = Object.values(dailyStats).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(dailyStats).sort((a, b) => b[1] - a[1]);

    if (total === 0) {
      return {
        label: 'RESPIRAR',
        percentage: 0,
        color: '#87CEEB',
        sorted,
        total: 0,
      };
    }

    const topKey = sorted[0] ? sorted[0][0] : 'RESPIRAR';
    const topCount = dailyStats[topKey] || 0;
    const percentage = Math.round((topCount / total) * 100);

    const catObj = CATEGORIES.find((c) => c.key === topKey);
    return {
      label: catObj ? catObj.label : 'RESPIRAR',
      percentage,
      color: catObj ? catObj.color : '#87CEEB',
      sorted,
      total,
    };
  };

  const mostNeeded = getMostNeededStats();

  const getCardColor = (catName?: string) => {
    if (!catName) return '#FAD02C';
    const key = catName.toUpperCase();
    return CATEGORY_COLORS[key] || '#FAD02C';
  };

  const openTodayCarousel = () => {
    if (todayCards.length === 0) {
      if (todayFlips >= 3) {
        setShowLimitModal(true);
      } else {
        alert('Aún no has descubierto diamantes hoy. ¡Elige una categoría para empezar!');
      }
      return;
    }
    setCarouselIndex(0);
    setModalIsFlipped(false);
    setShowTodayModal(true);
  };

  const renderCalendarGrid = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const gridCells = [];

    for (let i = 0; i < startOffset; i++) {
      gridCells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const categoryFound = activityMap[dayKey];
      const hasActivity = Boolean(categoryFound);
      const categoryColor = hasActivity
        ? CATEGORY_COLORS[categoryFound?.toUpperCase()] || '#FAD02C'
        : 'transparent';

      gridCells.push(
        <div key={dayKey} className="flex items-center justify-center h-8 w-8 relative">
          {hasActivity ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] shadow-sm cursor-pointer border border-black/10 hover:scale-110 transition-transform"
              style={{ backgroundColor: categoryColor }}
              title={`Sensación del día: ${categoryFound}`}
              onClick={() => {
                setShowStreakModal(false);
                setCurrentCard(null);
                setActiveTab('diary');
              }}
            >
              💎
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#E3DDD5]/30 flex items-center justify-center text-[11px] font-mono text-[#8A827A]">
              {day}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-serif font-bold text-[#1C1817] capitalize">
            📅 {monthName}
          </h4>
          <span className="text-[9px] font-mono text-[#997343] font-semibold uppercase">
            Mapa de Tesoros
          </span>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#8A827A] font-mono">
          <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {gridCells}
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.22); opacity: 1; filter: drop-shadow(0 0 18px rgba(200, 138, 52, 0.75)); }
        }
        .animate-pulse-glow { animation: pulseGlow 1.4s infinite ease-in-out; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }

        @keyframes flyToHeaderDiary {
          0% {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          }
          50% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0.45) rotate(-12deg);
          }
          100% {
            top: 24px;
            left: calc(100% - 75px);
            transform: translate(-50%, -50%) scale(0.08) rotate(18deg);
            opacity: 0;
            box-shadow: 0 0 0px rgba(0,0,0,0);
          }
        }
        .animate-fly-card {
          animation: flyToHeaderDiary 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* OVERLAY: CARTA VOLADORA */}
      {isFlying && flyingCard && (
        <div
          className="fixed z-50 pointer-events-none rounded-3xl p-4 flex flex-col items-center justify-center text-center animate-fly-card border-2 border-white/60"
          style={{
            width: '200px',
            height: '280px',
            backgroundColor: getCardColor(flyingCard['Categoría']),
            color: '#1C1817',
          }}
        >
          <div className="text-4xl mb-2">💎</div>
          <p className="text-xs font-serif italic font-bold leading-tight line-clamp-3">
            &ldquo;{cleanText(flyingCard['Anverso (Gancho Científico)'] || flyingCard['Modelo (Intención)'])}&rdquo;
          </p>
        </div>
      )}

      {/* PANTALLA DE CARGA */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#FAF8F5]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fadeIn">
          <div className="text-6xl animate-pulse-glow mb-3">💎</div>
          <p className="text-xs font-serif italic text-[#997343] font-semibold tracking-wider">
            Revelando tu diamante...
          </p>
        </div>
      )}

      {/* MODAL COMENTARIOS / FEEDBACK */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-4xl">💌</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ TU OPINIÓN ES UN TESORO ✦
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1C1817] mt-1">
                Déjanos tu comentario
              </h3>
            </div>

            {feedbackSent ? (
              <div className="space-y-3 py-2 w-full">
                <p className="text-xs text-[#997343] font-serif italic font-semibold">
                  ¡Muchas gracias! Tu comentario ha sido recibido con cariño. ❤️‍🩹
                </p>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackSent(false);
                    setFeedbackText('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Cuéntanos cómo te ayudó esta carta o comparte tus sugerencias..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-2xl bg-white border border-[#E3DDD5] text-[#1C1817] placeholder-[#B5AEA7] focus:outline-none focus:border-[#997343] resize-none"
                />
                <div className="w-full space-y-2">
                  <button
                    onClick={() => {
                      if (!feedbackText.trim()) return;
                      setFeedbackSent(true);
                    }}
                    disabled={!feedbackText.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#997343] text-white text-xs font-semibold hover:bg-[#836237] disabled:opacity-50 transition-all shadow-sm"
                  >
                    Enviar Comentario
                  </button>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="w-full py-1 text-xs text-[#8A827A] hover:text-[#1C1817]"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL RACHA Y CALENDARIO */}
      {showStreakModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-5 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center bg-amber-100 rounded-full w-16 h-16 border border-amber-200 shadow-inner">
              <span className="text-4xl animate-bounce">🔥</span>
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ TU CONSTANCIA ✦
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#1C1817] mt-0.5">
                Racha de {streak} {streak === 1 ? 'día' : 'días'}
              </h3>
            </div>

            {renderCalendarGrid()}

            <button
              onClick={() => setShowStreakModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all shadow-sm"
            >
              ¡Continuar!
            </button>
          </div>
        </div>
      )}

      {/* MODAL: LÍMITE DIARIO */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-5xl">🌙</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ LÍMITE DIARIO ALCANZADO ✦
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1C1817] mt-1">
                ¡Nos vemos mañana!
              </h3>
            </div>
            <p className="text-xs text-[#8A827A] leading-relaxed">
              Has revelado tus <strong>3 diamantes de hoy</strong> (3/3). Tómate el día para reflexionar e integrar estos mensajes. Mañana podrás descubrir nuevos tesoros.
            </p>

            <div className="w-full space-y-2 pt-2">
              {todayCards.length > 0 && (
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    openTodayCarousel();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#997343] text-white text-xs font-semibold hover:bg-[#836237] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>👁️</span> Ver mis cartas de hoy ({todayCards.length})
                </button>
              )}

              <button
                onClick={() => {
                  setShowLimitModal(false);
                  setCurrentCard(null);
                  setActiveTab('diary');
                }}
                className="w-full py-2.5 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-xs font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
              >
                <span>💰</span> Ir a mis Tesoros
              </button>

              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-1.5 text-[#8A827A] text-xs hover:text-[#1C1817]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELECCIÓN DE CATEGORÍA (SIGUIENTE TIRADA) */}
      {showCategoryChoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-4xl">💎</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ SIGUIENTE TIRADA ✦
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1C1817] mt-1">
                ¿Qué necesitas explorar ahora?
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setShowCategoryChoiceModal(false);
                    handleSelectCategory(cat.key);
                  }}
                  className="p-2.5 rounded-xl text-xs font-bold text-[#1C1817] text-center border border-black/5 hover:brightness-105 transition-all shadow-sm uppercase"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCategoryChoiceModal(false);
                  handleSelectCategory('RANDOM');
                }}
                className="col-span-2 p-2.5 rounded-xl text-xs font-bold text-[#1C1817] bg-white border border-[#997343]/40 hover:bg-[#FAF8F5] transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>🎲</span> DIAMANTE sorpresa
              </button>
            </div>

            <button
              onClick={() => setShowCategoryChoiceModal(false)}
              className="text-xs text-[#8A827A] hover:text-[#1C1817] pt-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-IN ("¿TE AYUDÓ?") */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-4xl">❤️‍🩹</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ REFLEXIÓN DEL MOMENTO ✦
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1C1817] mt-1">
                ¿Qué tanto te ayudó este diamante?
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {[
                { label: 'Igual 🙃', desc: 'No me causó impacto por ahora' },
                { label: 'Bien 😊', desc: 'Me dio una buena perspectiva' },
                { label: 'Me encantó ❤️', desc: 'Llegó justo en el momento exacto' },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSaveFeeling(option.label)}
                  className="p-3.5 rounded-2xl bg-white border border-[#E3DDD5] text-[#332E2B] hover:border-[#997343] hover:bg-amber-50/50 transition-all text-left shadow-xs flex items-center justify-between group active:scale-98"
                >
                  <span className="text-xs font-bold text-[#1C1817] group-hover:text-[#997343] transition-colors">
                    {option.label}
                  </span>
                  <span className="text-[10px] text-[#8A827A] font-light">
                    {option.desc}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCheckIn(false)}
              className="text-xs text-[#8A827A] hover:text-[#1C1817] pt-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CARRUSEL CARTAS DE HOY */}
      {showTodayModal && todayCards.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-5 border border-[#E3DDD5] shadow-2xl flex flex-col items-center relative space-y-4">
            <button
              onClick={() => setShowTodayModal(false)}
              className="absolute top-3 right-4 text-[#8A827A] hover:text-[#1C1817] text-lg font-bold p-1"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ TIRADAS DE HOY ✦
              </span>
              <h3 className="text-lg font-serif font-semibold text-[#1C1817]">
                Tus diamantes del día ({carouselIndex + 1}/{todayCards.length})
              </h3>
            </div>

            {/* CARTA CARRUSEL */}
            {todayCards[carouselIndex] && (
              <div
                className="w-full aspect-[63/88] max-h-[360px] cursor-pointer my-1 group"
                style={{ perspective: '1000px' }}
                onClick={() => setModalIsFlipped(!modalIsFlipped)}
              >
                <div
                  className="w-full h-full relative transition-transform duration-700 rounded-2xl shadow-md border border-black/5"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: modalIsFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* ANVERSO CARRUSEL */}
                  <div
                    className="absolute inset-0 rounded-2xl p-4 flex flex-col justify-between items-center text-center overflow-hidden border-2 border-white/20"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      backgroundColor: getCardColor(todayCards[carouselIndex]['Categoría']),
                      color: '#1C1817',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {todayCards[carouselIndex]['Categoría']}
                    </span>
                    <div className="my-auto flex flex-col items-center">
                      <div className="text-4xl mb-2">💎</div>
                      <p className="text-base font-serif italic font-semibold leading-snug">
                        {cleanText(
                          todayCards[carouselIndex]['Anverso (Gancho Científico)'] ||
                          todayCards[carouselIndex]['Modelo (Intención)']
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#1C1817]/70">🔄 Toca para girar</span>
                  </div>

                  {/* REVERSO CARRUSEL */}
                  <div
                    className="absolute inset-0 rounded-2xl p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-white border-2 border-[#FAF8F5]"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      color: '#1C1817',
                    }}
                  >
                    <span className="text-[10px] uppercase font-semibold text-[#997343]">
                      {todayCards[carouselIndex]['Categoría']}
                    </span>
                    <div className="my-auto flex flex-col items-center">
                      <div className="text-2xl mb-1">{todayCards[carouselIndex]['Icono'] || '💎'}</div>
                      <p className="text-sm text-[#2C2523]">
                        {cleanText(
                          todayCards[carouselIndex]['Reverso (Instrucción de Activación)'] ||
                          todayCards[carouselIndex]['Anverso (Gancho Científico)']
                        )}
                      </p>
                    </div>
                    <span className="text-[8px] text-[#B5AEA7] uppercase">Tesoros del Autodescubrimiento</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLES CARRUSEL */}
            <div className="flex justify-between items-center w-full px-2">
              <button
                disabled={carouselIndex === 0}
                onClick={() => {
                  setCarouselIndex((prev) => Math.max(0, prev - 1));
                  setModalIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  carouselIndex === 0
                    ? 'opacity-30 cursor-not-allowed bg-gray-200'
                    : 'bg-white border border-[#E3DDD5] text-[#332E2B] hover:bg-gray-100'
                }`}
              >
                ← Anterior
              </button>

              <div className="flex gap-1">
                {todayCards.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === carouselIndex ? 'bg-[#997343] w-4' : 'bg-[#E3DDD5]'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={carouselIndex === todayCards.length - 1}
                onClick={() => {
                  setCarouselIndex((prev) => Math.min(todayCards.length - 1, prev + 1));
                  setModalIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  carouselIndex === todayCards.length - 1
                    ? 'opacity-30 cursor-not-allowed bg-gray-200'
                    : 'bg-white border border-[#E3DDD5] text-[#332E2B] hover:bg-gray-100'
                }`}
              >
                Siguiente →
              </button>
            </div>

            <div className="w-full pt-1">
              {isCardInDiary(todayCards[carouselIndex]) ? (
                <div className="w-full py-2 bg-[#997343]/15 text-[#997343] rounded-xl text-center text-xs font-semibold">
                  ✨ Esta carta ya está guardada en tus tesoros
                </div>
              ) : (
                <button
                  onClick={() => saveCardToDiary(todayCards[carouselIndex])}
                  className="w-full py-2 bg-[#1C1817] text-white rounded-xl text-xs font-medium hover:bg-[#332E2B] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>💎</span>
                  <span>Guardar esta carta en mis tesoros</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE PRINCIPAL */}
      <main className="min-h-screen bg-[#FAF8F5] text-[#332E2B] flex flex-col items-center justify-between pb-20 p-4 max-w-md mx-auto antialiased">
        
        {/* ENCABEZADO */}
        <header className="w-full flex justify-between items-center mb-3 pt-1 px-1 border-b border-[#E3DDD5]/40 pb-3">
          <button 
            onClick={handleGoHome}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#1C1817] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              💎
            </div>
            <div>
              <h1 className="font-serif font-bold text-xs tracking-wide text-[#1C1817]">TESOROS</h1>
              <p className="text-[9px] font-mono text-[#997343] tracking-widest uppercase">Autodescubrimiento</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={openTodayCarousel}
              className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[#997343] text-xs font-bold flex items-center gap-1 hover:bg-amber-100 transition-colors shadow-2xs"
              title="Ver cartas de hoy"
            >
              <span>💎</span>
              <span>{todayFlips}/3</span>
            </button>

            <button
              onClick={() => setShowStreakModal(true)}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E3DDD5] text-[#1C1817] text-xs font-bold flex items-center gap-1 hover:border-[#997343] transition-all shadow-2xs"
            >
              <span className="text-amber-500">🔥</span>
              <span>{streak}</span>
            </button>

            <button
              onClick={() => {
                setCurrentCard(null);
                setActiveTab('mission');
              }}
              className={`text-[#8A827A] hover:underline text-xs ${
                activeTab === 'mission' ? 'font-bold underline text-[#332E2B]' : ''
              }`}
            >
              🇻🇪 Misión
            </button>
          </div>
        </header>

        {/* PESTAÑA PRINCIPAL: HOY (TIRADA) */}
        {activeTab === 'draw' && (
          <>
            {!currentCard ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 my-auto">
                <div className="text-center space-y-1">
                  <div className="text-xs font-mono tracking-widest text-[#997343] uppercase">
                    ✦ 💎 ✦
                  </div>
                  <h1 className="text-2xl font-serif text-[#1C1817] font-semibold tracking-tight text-center">
                    ¿Qué necesitas hoy para estar mejor?
                  </h1>
                  <p className="text-xs text-[#8A827A] font-light max-w-[280px] mx-auto text-center leading-relaxed">
                    Elige la categoría que más resuene contigo.
                  </p>
                </div>

                {/* BOTONES DE CATEGORÍAS */}
                <div className="grid grid-cols-3 gap-2.5 w-full items-center py-2">
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
                        <span className="text-xs font-bold text-[#1C1817] leading-tight text-center uppercase tracking-wider">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-normal text-[#1C1817]/80 text-center leading-tight">
                          {cat.sub}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono opacity-40">✦</span>
                    </button>
                  ))}

                  <div className="col-span-3 py-1 flex justify-center">
                    <button
                      onClick={() => handleSelectCategory('RANDOM')}
                      className="w-full bg-white border-2 border-[#997343]/30 rounded-3xl p-3.5 flex flex-col items-center justify-center text-center shadow-md hover:shadow-[0_0_25px_rgba(200,138,52,0.35)] hover:border-[#997343] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 group relative overflow-hidden"
                    >
                      <div className="text-4xl transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 mb-1 drop-shadow-sm">
                        💎
                      </div>
                      <span className="text-xs font-serif italic font-bold text-[#1C1817] uppercase tracking-wider">
                        DIAMANTE sorpresa
                      </span>
                      <span className="text-[10px] text-[#8A827A] font-light mt-0.5 max-w-[240px]">
                        un tesoro aleatorio que te dirá justo lo que necesitas hoy
                      </span>
                    </button>
                  </div>

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
                        <span className="text-xs font-bold text-[#1C1817] leading-tight text-center uppercase tracking-wider">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-normal text-[#1C1817]/80 text-center leading-tight">
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
                <div className="w-full flex justify-between items-center mb-1">
                  <button
                    onClick={handleGoHome}
                    className="text-xs text-[#8A827A] hover:text-[#332E2B] font-light flex items-center gap-1 transition-colors"
                  >
                    ← elegir otro diamante
                  </button>

                  {isCardSaved && (
                    <span className="text-[10px] font-serif italic text-[#997343] font-semibold bg-[#997343]/10 px-2.5 py-0.5 rounded-full">
                      ✨ Guardado en tus tesoros
                    </span>
                  )}
                </div>

                {/* CARTA 3D FLIP */}
                <div
                  className="w-full aspect-[63/88] max-h-[460px] cursor-pointer my-1 group"
                  style={{ perspective: '1000px' }}
                  onClick={handleFlipCard}
                >
                  <div
                    className="w-full h-full relative transition-transform duration-700 rounded-[28px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.9)] border border-black/5"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* ANVERSO */}
                    <div
                      className="absolute inset-0 rounded-[28px] p-6 flex flex-col justify-between items-center text-center overflow-hidden border-4 border-white/20"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        backgroundColor: getCardColor(currentCard['Categoría']),
                        color: '#1C1817',
                      }}
                    >
                      <div className="pt-2 flex flex-col items-center gap-1">
                        <h2 className="text-xl font-bold tracking-widest text-[#1C1817] uppercase text-center">
                          {currentCard['Categoría']}
                        </h2>
                        {currentCard['Modelo (Intención)'] && (
                          <span className="text-[10px] font-mono uppercase bg-white/40 px-2 py-0.5 rounded-full border border-black/5 font-semibold">
                            ✦ {cleanText(currentCard['Modelo (Intención)'])}
                          </span>
                        )}
                      </div>

                      <div className="my-auto flex flex-col items-center justify-center space-y-3 px-1 w-full">
                        <div className="text-[64px] leading-none opacity-75 drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300">
                          💎
                        </div>
                        <p className="text-xl font-serif italic text-[#1C1817] text-center font-semibold leading-snug px-1">
                          &ldquo;{cleanText(
                            currentCard['Anverso (Gancho Científico)'] ||
                              currentCard['Modelo (Intención)']
                          )}&rdquo;
                        </p>
                      </div>

                      <div className="pb-1 text-xs text-[#1C1817]/80 font-light flex items-center justify-center gap-1.5 animate-bounce">
                        <span className="text-xs">🔄</span> toca para girar la carta
                      </div>
                    </div>

                    {/* REVERSO */}
                    <div
                      className="absolute inset-0 rounded-[28px] p-6 flex flex-col justify-between items-center text-center overflow-hidden bg-white border-4 border-[#FAF8F5]"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        color: '#1C1817',
                      }}
                    >
                      <div className="pt-2 w-full">
                        <h2 className="text-[10px] font-semibold text-[#997343]/80 text-center uppercase tracking-widest">
                          {currentCard['Categoría']}
                        </h2>
                      </div>

                      <div className="my-auto w-full flex flex-col items-center justify-center space-y-3 px-1">
                        <div className="text-4xl">{currentCard['Icono'] || '💎'}</div>
                        {currentCard['Modelo (Intención)'] && (
                          <p className="text-sm font-serif font-bold italic tracking-wide uppercase text-[#D9A24A] text-center">
                            {cleanText(currentCard['Modelo (Intención)'])}
                          </p>
                        )}
                        <p className="text-base text-[#2C2523] font-normal leading-relaxed text-center px-1">
                          {cleanText(
                            currentCard['Reverso (Instrucción de Activación)'] ||
                              currentCard['Anverso (Gancho Científico)']
                          )}
                        </p>
                      </div>

                      <div className="pb-1 text-[9px] text-[#B5AEA7] tracking-widest uppercase">
                        Tesoros del Autodescubrimiento
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN AL GIRAR LA CARTA */}
                {isFlipped ? (
                  <div className="w-full space-y-2.5 my-2 animate-fadeIn">
                    <button
                      onClick={handleAnotherDiamondClick}
                      className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-serif italic font-medium flex items-center justify-center gap-1.5 hover:bg-[#332E2B] shadow-sm transition-all"
                    >
                      <span>✨</span>
                      <span>Sacar otro diamante</span>
                    </button>

                    {/* CUADRO DE TEXTO PARA PRACTICAR LA ACTIVIDAD */}
                    <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-3 shadow-xs space-y-1.5">
                      <div className="flex justify-between items-center px-0.5">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#997343] flex items-center gap-1">
                          <span>✍️</span> Práctica / Mi Reflexión:
                        </label>
                        {userNote.trim().length > 0 && (
                          <span className="text-[9px] text-[#8A827A] font-mono">
                            {userNote.length} caracteres
                          </span>
                        )}
                      </div>
                      <textarea
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        placeholder="Escribe aquí el resultado de tu ejercicio o tus pensamientos al hacer la actividad..."
                        rows={2}
                        className="w-full text-xs p-2 rounded-xl bg-[#FAF8F5] border border-[#E3DDD5] text-[#1C1817] placeholder-[#B5AEA7] focus:outline-none focus:border-[#997343] resize-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      <button
                        onClick={handleSaveToDiary}
                        className={`py-2 rounded-xl border text-[10px] font-medium flex items-center justify-center gap-1 transition-all ${
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
                        className="py-2 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>❤️‍🩹</span>
                        <span>¿Te ayudó?</span>
                      </button>

                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="py-2 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>💬</span>
                        <span>Comentar</span>
                      </button>

                      <button
                        onClick={() => handleShare()}
                        className="py-2 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>📤</span>
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 my-2" />
                )}

                {/* FOOTER */}
                <div className="w-full flex flex-col items-center gap-1 text-center px-1">
                  <p className="text-[10px] text-[#8A827A] font-light leading-relaxed max-w-[320px] mx-auto text-center">
                    Tesoros del Autodescubrimiento nació después de los terremotos en Venezuela como parte de las donaciones que están pasando desapercibidas, tales como el apoyo emocional ❤️‍🩹. Cada caja física llega primero a quien más la necesita.
                  </p>
                  <a
                    href="https://gofundme.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-serif italic text-[#997343] underline pt-0.5 hover:text-[#1C1817]"
                  >
                    apoyar en GoFundMe →
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* PESTAÑA: TESOROS (DIARIO) */}
        {activeTab === 'diary' && (
          <div className="w-full flex-1 overflow-y-auto space-y-3.5 my-2 pr-1 max-h-[75vh] animate-fadeIn">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h2 className="text-xl font-serif italic text-[#1C1817] font-semibold">
                  Tus Tesoros Guardados 💰
                </h2>
                <p className="text-[11px] text-[#8A827A]">
                  Tus joyas guardadas, notas de práctica y cómo te hicieron sentir
                </p>
              </div>
              <button
                onClick={handleGoHome}
                className="text-xs text-[#8A827A] hover:text-[#1C1817] font-semibold bg-white border border-[#E3DDD5] px-3 py-1.5 rounded-xl shadow-2xs"
              >
                ← Volver
              </button>
            </div>

            {diary.length === 0 ? (
              <div className="text-center py-20 text-[#8A827A] text-xs font-light space-y-2">
                <p className="text-3xl">💰</p>
                <p className="font-serif italic text-sm text-[#332E2B]">
                  Aún no has guardado tesoros en tu colección.
                </p>
                <p>
                  Gira una carta y presiona <strong>&quot;Guardar&quot;</strong> para conservarla aquí.
                </p>
              </div>
            ) : (
              diary.map((entry) => {
                const gancho = cleanText(
                  entry.card['Anverso (Gancho Científico)'] || entry.card['Modelo (Intención)']
                );
                const instruccion = cleanText(entry.card['Reverso (Instrucción de Activación)']);
                const modelo = cleanText(entry.card['Modelo (Intención)']);
                const catName = entry.card['Categoría']?.toUpperCase() || 'SONREÍR';

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleOpenFromDiary(entry)}
                    className="w-full rounded-[24px] p-4 shadow-sm border border-black/5 space-y-3 text-left relative overflow-hidden transition-all hover:scale-[1.01] active:scale-95 cursor-pointer group"
                    style={{
                      backgroundColor: getCardColor(entry.card['Categoría']),
                    }}
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-[#1C1817] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 bg-white/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-black/10">
                        <span>{entry.card['Icono'] || '💎'}</span>
                        <span>{catName}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {entry.note && (
                          <span className="text-[10px] font-bold text-[#997343] bg-white/70 px-2 py-0.5 rounded-full border border-black/5">
                            📝 Nota
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold text-[#1C1817]/80 bg-white/40 px-2 py-0.5 rounded-md">
                          {entry.date ? entry.date.toUpperCase() : 'HOY'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 py-0.5">
                      {modelo && (
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1817]/70">
                          ✦ INTENCIÓN: {modelo}
                        </p>
                      )}
                      <p className="text-base font-serif italic font-bold text-[#1C1817] leading-snug">
                        &ldquo;{gancho}&rdquo;
                      </p>
                      {instruccion && instruccion !== gancho && (
                        <p className="text-xs text-[#1C1817]/90 leading-relaxed bg-white/40 p-2.5 rounded-xl border border-black/5">
                          <strong className="font-semibold text-[#1C1817]">Acción:</strong> {instruccion}
                        </p>
                      )}
                      
                      {/* MOSTRAR LA NOTA DE LA PRÁCTICA EN EL DIARIO */}
                      {entry.note && (
                        <div className="bg-white/60 p-2.5 rounded-xl border border-black/5 text-xs text-[#1C1817] space-y-0.5">
                          <span className="text-[10px] font-mono font-bold text-[#997343] uppercase flex items-center gap-1">
                            ✍️ Tu Práctica:
                          </span>
                          <p className="italic font-serif leading-relaxed text-[#2C2523]">
                            &ldquo;{entry.note}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-white/60 px-2.5 py-1 rounded-full border border-black/10">
                        <span className="text-xs">❤️‍🩹</span>
                        <span className="text-[11px] font-bold text-[#1C1817]">
                          {entry.feeling ? `Efecto: ${entry.feeling}` : 'Carta guardada'}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#1C1817]/70 group-hover:underline">
                        Abrir carta 🔄
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PESTAÑA: AHORA! (SINCRONÍA EN TIEMPO REAL) */}
        {activeTab === 'thermometer' && (
          <div className="w-full flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[75vh] animate-fadeIn">
            <div className="flex justify-between items-start mb-1">
              <div className="space-y-1.5 pr-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-serif italic text-[#1C1817] font-bold">
                    AQUÍ Y AHORA...
                  </h2>
                  <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    EN VIVO
                  </span>
                </div>
                <p className="text-xs font-serif italic text-[#1C1817] font-semibold leading-tight">
                  En este preciso segundo, miles de personas están haciendo una pausa contigo.
                </p>
                <p className="text-[11px] text-[#8A827A] leading-relaxed italic">
                  &ldquo;¿Pensaste que eras la única persona necesitando{' '}
                  <strong className="font-bold text-[#1C1817] not-italic">
                    {CATEGORY_ACTIONS[mostNeeded.label] || 'hacer una pausa'}
                  </strong>{' '}
                  ahora mismo? Mira a tu alrededor...&rdquo;
                </p>
              </div>
              <button
                onClick={handleGoHome}
                className="text-xs text-[#8A827A] hover:text-[#1C1817] font-semibold bg-white border border-[#E3DDD5] px-3 py-1.5 rounded-xl shadow-2xs shrink-0"
              >
                ← Volver
              </button>
            </div>

            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#EAE5DF]"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      strokeWidth="3.8"
                      strokeDasharray={`${mostNeeded.percentage}, 100`}
                      strokeLinecap="round"
                      stroke={mostNeeded.color}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-[#1C1817]">
                    {mostNeeded.total > 0 ? `${mostNeeded.percentage}%` : '0%'}
                  </span>
                </div>
                <div className="text-left space-y-1">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#997343]">
                    ✦ LO QUE OCURRE EN ESTE SEGUNDO
                  </p>
                  {mostNeeded.total > 0 ? (
                    <p className="text-sm font-serif italic text-[#2C2523] leading-snug">
                      En este instante, la necesidad que más resuena es{' '}
                      <strong className="font-bold text-[#1C1817] uppercase">
                        {mostNeeded.label}
                      </strong>.
                    </p>
                  ) : (
                    <p className="text-sm font-serif italic text-[#2C2523] leading-snug">
                      Aún no hay tiradas registradas hoy. ¡Sé la primera persona en marcar el ritmo!
                    </p>
                  )}
                  <p className="text-[11px] text-[#8A827A] leading-tight">
                    No estás en solitario: hay personas en distintas esquinas del mundo soltando el aire al mismo tiempo que tú.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#E3DDD5]/60">
                <p className="text-[10px] font-mono text-[#8A827A] uppercase tracking-wider font-semibold">
                  ¿Qué estamos buscando en este preciso instante?
                </p>
                {mostNeeded.sorted.map(([catKey, count]) => {
                  const catObj = CATEGORIES.find((c) => c.key === catKey);
                  const pct = mostNeeded.total > 0 ? Math.round((count / mostNeeded.total) * 100) : 0;
                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#1C1817] font-semibold">{catKey}</span>
                        <span className="text-[#8A827A]">{pct}% ({count})</span>
                      </div>
                      <div className="w-full bg-[#EAE5DF] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: catObj ? catObj.color : '#997343',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#997343]/10 border border-[#997343]/20 rounded-3xl p-4.5 space-y-2 text-center">
              <div className="flex items-center gap-1.5 text-[#997343]">
                <span className="text-xs">🧠</span>
                <span className="text-[13px] font-mono font-bold uppercase tracking-wider">
                  La ciencia de sentirnos AHORA
                </span>
              </div>
              <p className="text-xs text-[#2C2523] leading-relaxed text-left font-light"> 
                Tu sistema nervioso está diseñado para autorregularse mediante la co-regulación. Cuando vengas aquí y ahora, descubrirás que tu cansancio o tu ansiedad son el reflejo de muchos otros. Tu cerebro percibirá en tiempo real que no estás solo/a en la necesidad de parar y la sensación de amenaza disminuirá. En este segundo, el cortisol baja y recuperas el tesoro más grande: tu propia calma.
              </p>
            </div>
            
            <div className="bg-[#F6EFDF] border border-[#D8C7A3] rounded-3xl p-5 space-y-3 text-left shadow-xs relative overflow-hidden">
              <div className="text-center pb-1 border-b border-[#D8C7A3]/50">
                <span className="text-xs font-serif italic font-bold text-[#7A5B2B] uppercase tracking-widest">
                  ✦ A ti ✦
                </span>
              </div>
              
              <p className="text-xs font-serif italic text-[#382C1E] leading-relaxed">
                Cada carta, cada respiración y cada pequeño ejercicio está inspirado en herramientas respaldadas por la psicología y la ciencia del bienestar, pero su verdadero propósito no es cambiar quién eres.
              </p>
              
              <p className="text-xs font-serif italic text-[#382C1E] leading-relaxed">
                Es ayudarte a recordar el valor que ya habita en ti.
              </p>
              
              <p className="text-xs font-serif italic text-[#382C1E] leading-relaxed">
                Y, cuando miras el reflejo de toda una comunidad, quizá descubras algo importante:
              </p>
              
              <p className="text-xs font-serif italic font-bold text-[#7A5B2B] text-center pt-1 leading-relaxed">
                &ldquo;No eres la única persona intentando volver a encontrarse.&rdquo;
              </p>
            </div>

            <div className="bg-white/80 border border-[#E3DDD5] rounded-2xl p-3.5 flex items-center justify-between text-left shadow-2xs">
              <div className="space-y-0.5 pr-2">
                <p className="text-[10px] font-bold text-[#1C1817] uppercase tracking-wider flex items-center gap-1">
                  <span>🌍</span> AHORA! en el planeta
                </p>
                <p className="text-[11px] text-[#8A827A] leading-tight">
                  El respiro no tiene fronteras. Próximamente podrás ver desde qué países y ciudades se están sumando a esta misma pausa contigo.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-amber-100 text-[#997343] font-bold px-2.5 py-1 rounded-full shrink-0">
                Pronto
              </span>
            </div>
          </div>
        )}

        {/* PESTAÑA: MISIÓN VENEZUELA */}
        {activeTab === 'mission' && (
          <div className="w-full flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[72vh] animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-serif italic text-[#1C1817]">
                Nuestra Misión 🇻🇪
              </h2>
              <button
                onClick={handleGoHome}
                className="text-xs text-[#8A827A] hover:text-[#1C1817]"
              >
                ← Volver
              </button>
            </div>

            <div className="bg-white border border-[#E3DDD5] rounded-3xl p-5 shadow-sm space-y-4 text-xs text-[#332E2B] leading-relaxed">
              <div className="text-center space-y-1">
                <div className="text-3xl">💎 ❤️‍🩹</div>
                <h3 className="text-base font-serif italic font-bold text-[#1C1817]">
                  Tesoros del Autodescubrimiento
                </h3>
              </div>

              <p>
                Este proyecto nació después de los terremotos e imprevistos en Venezuela como una respuesta concreta a una necesidad que suele pasar desapercibida: el <strong>apoyo emocional y la salud mental</strong> en momentos de crisis.
              </p>

              <div className="bg-[#997343]/10 rounded-2xl p-4 border border-[#997343]/20 space-y-2">
                <p className="font-serif italic font-semibold text-[#997343]">
                  &ldquo;Cada caja física llega primero a quien más la necesita.&rdquo;
                </p>
                <p className="text-[11px] text-[#2C2523]">
                  Por cada kit o carta digital interactiva, financiamos el envío de cajas físicas de autodescubrimiento a comunidades vulnerables y centros de apoyo en Venezuela.
                </p>
              </div>

              <div className="text-center pt-2">
                <a
                  href="https://gofundme.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-3 px-6 rounded-2xl bg-[#997343] text-white font-serif italic font-semibold hover:bg-[#836237] shadow-md transition-all text-xs"
                >
                  Apoyar en GoFundMe →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN INFERIOR (TAB BAR) */}
        <nav className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-full max-w-[340px] bg-white/90 backdrop-blur-md border border-[#E3DDD5] rounded-full shadow-lg p-1.5 flex items-center justify-around z-40">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 text-xs font-serif font-semibold rounded-full transition-all text-center ${
              activeTab === 'draw'
                ? 'bg-[#1C1817] text-white shadow-sm'
                : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            ☀️ Hoy
          </button>

          <span className="text-[#E3DDD5] text-xs">|</span>

          <button
            onClick={() => {
              setCurrentCard(null);
              setActiveTab('diary');
            }}
            className={`flex-1 py-2 text-xs font-serif font-semibold rounded-full transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'diary'
                ? 'bg-[#1C1817] text-white shadow-sm'
                : 'text-[#8A827A] hover:text-[#1C1817]'
            } ${isDiarySparkling ? 'animate-pulse text-[#D9A24A]' : ''}`}
          >
            <span>💎 Tesoros</span>
            {diary.length > 0 && (
              <span className="text-[10px] opacity-75">({diary.length})</span>
            )}
          </button>

          <span className="text-[#E3DDD5] text-xs">|</span>

          <button
            onClick={() => {
              setCurrentCard(null);
              setActiveTab('thermometer');
            }}
            className={`flex-1 py-2 text-xs font-serif font-semibold rounded-full transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'thermometer'
                ? 'bg-[#1C1817] text-white shadow-sm'
                : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            <span className="" />
            <span>🌎AHORA!</span>
          </button>
        </nav>
      </main>
    </>
  );
}