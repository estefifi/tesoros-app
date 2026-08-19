/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { createClient, type User } from '@supabase/supabase-js';
import rawCards from './cards.json';
import { treasureProgressMessages, getPhaseInfo } from './treasureprogress';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
type AnalyticsConsent = 'pending' | 'accepted' | 'rejected';

const ANALYTICS_CONSENT_KEY = 'tesoros_analytics_consent';

interface Card {
  '#'?: number | string;
  'Color HEX'?: string;
  Categoría?: string;
  Icono?: string;
  'Modelo (Intención)'?: string;
  'Anverso (Gancho Científico)'?: string;
  'Reverso (Instrucción de Activación)'?: string;
}

interface PolishedDiamondRecord {
  id: string;
  cycleNumber: number;
  dateCompleted: string;
  name: string;
  notes?: string;
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

// TESTIMONIOS DEMO PARA EL MURO DE "TU VOZ"
const INITIAL_COMMUNITY_VOICES = [
  {
    id: 'v1',
    author: 'Elena G.',
    location: 'Caracas, VE',
    text: 'Esta herramienta me dio una pausa que no sabía que necesitaba en medio del caos diario. Gracias por este refugio.',
    feeling: '❤️ Mucho',
    category: 'RESPIRAR',
    date: 'Ayer'
  },
  {
    id: 'v2',
    author: 'Carlos M.',
    location: 'Madrid, ES',
    text: 'Me encantó la carta de hoy de Evolucionar. Me ayudó a encarar una reunión difícil con mayor serenidad.',
    feeling: '❤️ Mucho',
    category: 'EVOLUCIONAR',
    date: 'Hace 2 días'
  },
  {
    id: 'v3',
    author: 'Sofía R.',
    location: 'Bogotá, CO',
    text: 'Saber que cada kit apoya la salud emocional en Venezuela le da un propósito hermoso a esta práctica.',
    feeling: '🙂 Un poco',
    category: 'COMPARTIR',
    date: 'Hace 3 días'
  }
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

interface DailyFlipRow {
  id: string;
  user_id: string;
  flip_count: number | null;
  last_flip_date: string | null;
  saved_cards: string[] | null;
  created_at?: string | null;
}

const cleanText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/""/g, '"')
    .replace(/^["“]+|["”]+$/g, '')
    .trim();
};

const getAnalyticsCardId = (card?: Card | null): string => {
  if (!card) return '';

  const id = card['#'];

  if (id !== undefined && id !== null && String(id).trim() !== '') {
    return String(id);
  }

  return '';
};

const isSameCard = (c1: Card | null, c2: Card | null): boolean => {
  if (!c1 || !c2) return false;
  if (c1['#'] !== undefined && c1['#'] !== null && c1['#'] !== '' && c1['#'] === c2['#']) {
    return true;
  }
  const g1 = cleanText(c1['Anverso (Gancho Científico)'] || c1['Modelo (Intención)']);
  const g2 = cleanText(c2['Anverso (Gancho Científico)'] || c2['Modelo (Intención)']);
  const r1 = cleanText(c1['Reverso (Instrucción de Activación)']);
  const r2 = cleanText(c2['Reverso (Instrucción de Activación)']);
  return g1 === g2 && r1 === r2;
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

const getCalendarDays = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startingDayIndex = firstDay.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  const totalDays = lastDay.getDate();
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(now);

  return { year, month, startingDayIndex, totalDays, monthName };
};

const trackAnalyticsEvent = (eventName: string, params: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
  console.log(`[Analytics Event]: ${eventName}`, params);
};

const saveToSupabase = async (tableName: string, payload: Record<string, any>) => {
  if (!supabase) {
    console.warn('Supabase no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn(`No hay sesión activa. No se guardó ${tableName}.`);
    return;
  }

  const payloadWithUser = { ...payload, user_id: user.id };
  const { error } = await supabase.from(tableName).insert(payloadWithUser);

  if (error) {
    console.error(`[Supabase Insert -> ${tableName}]`, error);
  }
};


// SINCRONIZA EL CONTADOR DIARIO CON SUPABASE.
// daily_flips está diseñado como una fila por usuario y día: flip_count + saved_cards.
const syncDailyFlipsToSupabase = async (today: string, selectedCard: Card, flipCount: number) => {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cardKey = String(
      selectedCard['#'] ??
      cleanText(selectedCard['Anverso (Gancho Científico)'] || selectedCard['Modelo (Intención)'])
    );

    const { data: existingRows, error: readError } = await supabase
      .from('daily_flips')
      .select('id, user_id, flip_count, last_flip_date, saved_cards, created_at')
      .eq('user_id', user.id)
      .eq('last_flip_date', today)
      .order('created_at', { ascending: false })
      .limit(1);

    if (readError) {
      console.error('[Supabase Read -> daily_flips]', readError);
      return;
    }

    const existing = (existingRows?.[0] as DailyFlipRow | undefined) ?? null;
    const previousCards = Array.isArray(existing?.saved_cards) ? existing.saved_cards : [];
    const savedCards = [...previousCards, cardKey];

    if (existing) {
      const { error: updateError } = await supabase
        .from('daily_flips')
        .update({
          flip_count: flipCount,
          last_flip_date: today,
          saved_cards: savedCards,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[Supabase Update -> daily_flips]', updateError);
      }
      return;
    }

    const { error: insertError } = await supabase
      .from('daily_flips')
      .insert({
        user_id: user.id,
        flip_count: flipCount,
        last_flip_date: today,
        saved_cards: savedCards,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Supabase Insert -> daily_flips]', insertError);
    }
  } catch (error) {
    console.error('[Supabase Sync -> daily_flips]', error);
  }
};

// CONVIERTE LOS saved_cards DE daily_flips EN ESTADÍSTICAS POR CATEGORÍA.
const getCategoryFromStoredCard = (storedCard: string): string | null => {
  const normalized = String(storedCard).trim();
  if (!normalized) return null;

  try {
    const parsed = JSON.parse(normalized);
    if (parsed?.category && CATEGORY_COLORS[String(parsed.category).toUpperCase()]) {
      return String(parsed.category).toUpperCase();
    }
    if (parsed?.cardId !== undefined) {
      const byId = cards.find((card) => String(card['#']) === String(parsed.cardId));
      if (byId?.['Categoría']) return String(byId['Categoría']).toUpperCase();
    }
  } catch (_) {}

  const directCategory = normalized.toUpperCase();
  if (CATEGORY_COLORS[directCategory]) return directCategory;

  const byId = cards.find((card) => String(card['#']) === normalized);
  if (byId?.['Categoría']) return String(byId['Categoría']).toUpperCase();

  const byHook = cards.find((card) =>
    cleanText(card['Anverso (Gancho Científico)'] || card['Modelo (Intención)']) === normalized
  );
  if (byHook?.['Categoría']) return String(byHook['Categoría']).toUpperCase();

  return null;
};
const GoogleAnalyticsTag = ({ enabled }: { enabled: boolean }) => {
  if (!GA_MEASUREMENT_ID || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
};
const AnalyticsConsentBanner = ({
  onConsent,
}: {
  onConsent: (choice: 'accepted' | 'rejected') => void;
}) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 animate-fadeIn">
      <div className="mx-auto w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-[#E3DDD5] rounded-3xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">💎</div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-serif font-bold text-[#1C1817]">
              Antes de empezar
            </h3>

            <p className="text-[11px] sm:text-xs text-[#6F6862] leading-relaxed mt-1.5">
              Usamos herramientas de análisis para entender, de forma
              agregada, cómo se utiliza Tesoros y poder mejorar la experiencia.
              No necesitamos estos datos para que puedas utilizar la app.
            </p>

            <p className="text-[10px] text-[#8A827A] leading-relaxed mt-2">
              Puedes aceptar o rechazar este análisis. Tu elección se guardará
              en este dispositivo y puedes cambiarla más adelante.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
              <button
                type="button"
                onClick={() => onConsent('rejected')}
                className="flex-1 py-2.5 rounded-xl bg-white border border-[#D8D0C8] text-[#332E2B] text-xs font-semibold hover:bg-[#FAF8F5] hover:border-[#997343] transition-all"
              >
                Rechazar análisis
              </button>

              <button
                type="button"
                onClick={() => onConsent('accepted')}
                className="flex-1 py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all shadow-sm"
              >
                Aceptar análisis
              </button>
            </div>

            <p className="text-[9px] text-[#B5AEA7] text-center mt-3">
              Más información sobre privacidad y cookies próximamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] =
  useState<AnalyticsConsent>('pending');
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'draw' | 'journey' | 'diary' | 'thermometer' | 'voice'>('draw');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userFeeling, setUserFeeling] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);

  const [cycleDay, setCycleDay] = useState<number>(1);
  const [completedCycles, setCompletedCycles] = useState<PolishedDiamondRecord[]>([]);
  const [showDay31Modal, setShowDay31Modal] = useState<boolean>(false);
  const [selectedGridDay, setSelectedGridDay] = useState<number | null>(null);

  const [showEnergyModal, setShowEnergyModal] = useState<boolean>(false);
  const [initialEnergy, setInitialEnergy] = useState<number | null>(null);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const [cardUtilityRating, setCardUtilityRating] = useState<'mucho' | 'un_poco' | 'no_mucho' | null>(null);
  const [cardUtilityReason, setCardUtilityReason] = useState<string>('');
  const [showReasonInput, setShowReasonInput] = useState<boolean>(false);

  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [roadmapWish, setRoadmapWish] = useState<string>('');
  const [roadmapSubmitted, setRoadmapSubmitted] = useState<boolean>(false);

  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showMissionModal, setShowMissionModal] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [feedbackSource, setFeedbackSource] = useState<'card' | 'voice'>('voice');

  const [showAutoModal, setShowAutoModal] = useState<boolean>(false);
  const [hasShownAutoModal, setHasShownAutoModal] = useState<boolean>(false);
  const [isPracticaHighlighted, setIsPracticaHighlighted] = useState<boolean>(false);

  const practicaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [streak, setStreak] = useState<number>(0);
  const [lastActiveDate, setLastActiveDate] = useState<string>('');
  const [activityMap, setActivityMap] = useState<Record<string, string>>({});
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);

  const [isFlying, setIsFlying] = useState(false);
  const [isDiarySparkling, setIsDiarySparkling] = useState(false);
  const [flyingCard, setFlyingCard] = useState<Card | null>(null);

  const [todayFlips, setTodayFlips] = useState<number>(0);
  const [todayCards, setTodayCards] = useState<Card[]>([]);
  const [showTodayModal, setShowTodayModal] = useState<boolean>(false);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [modalIsFlipped, setModalIsFlipped] = useState<boolean>(false);

  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showCategoryChoiceModal, setShowCategoryChoiceModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const [dailyStats, setDailyStats] = useState<Record<string, number>>(ZERO_STATS);

  // ESTADOS ESPECÍFICOS DE LA PESTAÑA "TU VOZ"
  const [voiceInput, setVoiceInput] = useState<string>('');
  const [voiceSubmitted, setVoiceSubmitted] = useState<boolean>(false);
  const [communityVoices, setCommunityVoices] = useState(INITIAL_COMMUNITY_VOICES);

  // AUTENTICACIÓN: Google/Supabase. La app no muestra el contenido hasta tener sesión.
  useEffect(() => {
    const savedConsent = localStorage.getItem(ANALYTICS_CONSENT_KEY);
  
    if (
      savedConsent === 'accepted' ||
      savedConsent === 'rejected'
    ) {
      setAnalyticsConsent(savedConsent);
    }
  }, []);

  const handleAnalyticsConsent = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
    setAnalyticsConsent(choice);
  };

  useEffect(() => {
    if (!supabase) {
      setAuthError('Falta configurar Supabase en las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('Error recuperando la sesión de Supabase:', error);
        setAuthError('No pudimos recuperar tu sesión. Inténtalo de nuevo.');
      } else {
        setUser(data.session?.user ?? null);
      }

      setAuthLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carga los datos locales solo después de identificar a la persona.
  useEffect(() => {
    if (!user) return;

    const today = getTodayKey();

    const savedStreak = parseInt(localStorage.getItem('tesoros_streak') || '0', 10);
    const savedLastDate = localStorage.getItem('tesoros_last_active_date') || '';
    setStreak(savedStreak);
    setLastActiveDate(savedLastDate);

    const savedCycleDay = parseInt(localStorage.getItem('tesoros_cycle_day') || '1', 10);
    setCycleDay(savedCycleDay);

    const savedCompletedCycles = localStorage.getItem('tesoros_completed_cycles');
    if (savedCompletedCycles) {
      try { setCompletedCycles(JSON.parse(savedCompletedCycles)); } catch (e) {}
    }

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

    const energyKey = `tesoros_energy_${today}`;
    const savedEnergy = localStorage.getItem(energyKey);
    if (savedEnergy) {
      setInitialEnergy(parseInt(savedEnergy, 10));
    }
  }, [user]);

    // TU VOZ: cargar las voces reales de la comunidad desde Supabase
    useEffect(() => {
      if (!user || !supabase) return;
  
      let cancelled = false;
  
      const loadCommunityVoices = async () => {
        try {
          const { data, error } = await supabase
            .from('user_voices')
            .select('id, message, created_at')
            .order('created_at', { ascending: false })
            .limit(30);
  
          if (cancelled) return;
  
          if (error) {
            console.error('[Supabase Read -> user_voices]', error);
            return;
          }
  
          const realVoices = (data || []).map((voice) => ({
            id: voice.id,
            author: 'Alguien de la comunidad',
            location: 'Comunidad',
            text: voice.message,
            feeling: '💌 Compartido',
            category: 'TU VOZ',
            date: new Date(voice.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            }),
          }));
  
          setCommunityVoices([
            ...realVoices,
            ...INITIAL_COMMUNITY_VOICES,
          ]);
        } catch (error) {
          if (!cancelled) {
            console.error('[Supabase Load -> user_voices]', error);
          }
        }
      };
  
      loadCommunityVoices();
  
      return () => {
        cancelled = true;
      };
    }, [user]);

  // AHORA: la distribución se obtiene de daily_flips en Supabase.
  // Si la lectura comunitaria no está permitida por RLS, mantenemos la experiencia local sin romper la app.
  useEffect(() => {
    if (!user || !supabase) return;

    let cancelled = false;

    const loadDailyCommunityStats = async () => {
        try {
        const today = getTodayKey();
        const { data, error } = await supabase
          .from('daily_flips')
          .select('saved_cards, flip_count, last_flip_date')
          .eq('last_flip_date', today);

        if (cancelled) return;

        if (error) {
          console.error('[Supabase Read -> daily_flips / AHORA]', error);
          return;
        }

        const aggregated: Record<string, number> = { ...ZERO_STATS };

        (data || []).forEach((row: { saved_cards?: string[] | null; flip_count?: number | null }) => {
          const storedCards = Array.isArray(row.saved_cards) ? row.saved_cards : [];
          storedCards.forEach((storedCard) => {
            const category = getCategoryFromStoredCard(storedCard);
            if (category && aggregated[category] !== undefined) {
              aggregated[category] += 1;
            }
          });
        });

        // Datos antiguos pueden tener flip_count pero no saved_cards.
        // En ese caso no inventamos una distribución; conservamos la estadística local si existe.
        const hasSupabaseCards = Object.values(aggregated).some((value) => value > 0);
        if (hasSupabaseCards) {
          setDailyStats(aggregated);
        }

      } catch (error) {
        if (!cancelled) {
          console.error('[Supabase Load -> AHORA]', error);
        }
      } finally {
      }
    };

    loadDailyCommunityStats();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setAuthError('Supabase no está configurado todavía.');
      return;
    }

    setAuthError('');
    setAuthActionLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error iniciando sesión con Google:', error);
      setAuthError(error.message || 'No pudimos iniciar sesión con Google.');
      setAuthActionLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!supabase) {
      setAuthError('Supabase no está configurado todavía.');
      return;
    }

    setAuthError('');
    setAuthActionLoading(true);

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('Error entrando sin registro:', error);
      setAuthError(error.message || 'No pudimos crear tu espacio de prueba.');
      setAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setAuthActionLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error cerrando sesión:', error);
      setAuthError('No pudimos cerrar la sesión. Inténtalo de nuevo.');
    }
    setAuthActionLoading(false);
  };

  useEffect(() => {
    if (!isFlipped) {
      setHasShownAutoModal(false);
      setShowAutoModal(false);
      setCardUtilityRating(null);
      setCardUtilityReason('');
      setShowReasonInput(false);
    }
  }, [isFlipped]);

  // MODAL AUTOMÁTICO: aparece a los 9s o antes si la persona hace clic/toca
  // una zona libre de la pantalla después de girar la carta.
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const showAutoModalNow = () => {
      if (isFlipped && currentCard && !hasShownAutoModal) {
        setShowAutoModal(true);
        setHasShownAutoModal(true);
      }
    };

    if (isFlipped && currentCard && !hasShownAutoModal && activeTab === 'draw') {
      timer = setTimeout(showAutoModalNow, 12000);

      const handleEarlyInteraction = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;

        if (target?.closest('button, a, input, textarea, select')) return;

        showAutoModalNow();
      };

      document.addEventListener('click', handleEarlyInteraction);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleEarlyInteraction);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFlipped, currentCard, hasShownAutoModal, activeTab]);

  const getPrimaryButtonType = (card: Card | null): 'PRACTICA' | 'CONTINUAR' => {
    if (!card) return 'CONTINUAR';
    const model = (card['Modelo (Intención)'] || '').toUpperCase();
    const cat = (card['Categoría'] || '').toUpperCase();
    const rev = (card['Reverso (Instrucción de Activación)'] || '').toUpperCase();
    
    if (
      model.includes('PRACTICA') || model.includes('PRÁCTICA') || model.includes('EJERCICIO') || model.includes('ACCIÓN') || model.includes('ACCION') ||
      cat.includes('EXPLORAR') || cat.includes('RESPIRAR') ||
      rev.includes('ESCRIBE') || rev.includes('HAZ') || rev.includes('PRÁCTICA') || rev.includes('PRACTICA')
    ) {
      return 'PRACTICA';
    }
    return 'CONTINUAR';
  };

  const handleDoPracticaNow = () => {
    trackAnalyticsEvent('practice_started', {
      category: currentCard?.['Categoría'] || '',
      card_id: getAnalyticsCardId(currentCard),
    });
    setShowAutoModal(false);
    setHasShownAutoModal(true);
    setTimeout(() => {
      practicaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsPracticaHighlighted(true);
      textareaRef.current?.focus();
      setTimeout(() => setIsPracticaHighlighted(false), 2500);
    }, 100);
  };

  const registerDailyActivity = (categoryKey: string) => {
    const today = getTodayKey();
    const yesterday = getYesterdayKey();

    let newActivityMap = { ...activityMap };
    
    if (!newActivityMap[today]) {
      newActivityMap[today] = categoryKey;
      setActivityMap(newActivityMap);
      localStorage.setItem('tesoros_activity_map', JSON.stringify(newActivityMap));

      const lastCycleUpdate = localStorage.getItem('tesoros_last_cycle_update');
      if (lastCycleUpdate !== today) {
        if (cycleDay < 31) {
          const nextDay = cycleDay + 1;
          setCycleDay(nextDay);
          localStorage.setItem('tesoros_cycle_day', nextDay.toString());
          if (nextDay === 31) {
            trackAnalyticsEvent('journey_completed', {
              cycle_day: 31,
              cycle_number: completedCycles.length + 1,
            });
          
            setShowDay31Modal(true);
          }
        } else if (cycleDay === 31) {
          setShowDay31Modal(true);
        }
        localStorage.setItem('tesoros_last_cycle_update', today);
      }
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

  const handleRestartCycle = () => {
    trackAnalyticsEvent('journey_restarted', {
      cycle_number: completedCycles.length + 1,
    });
  
    const newCompletedRecord: PolishedDiamondRecord = {
      id: Date.now().toString(),
      cycleNumber: completedCycles.length + 1,
      dateCompleted: new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      name: `Diamante Pulido #${completedCycles.length + 1}`,
      notes: '31 días de autodescubrimiento completados con éxito.',
    };
 
    const updated = [newCompletedRecord, ...completedCycles];
    setCompletedCycles(updated);
    localStorage.setItem('tesoros_completed_cycles', JSON.stringify(updated));

    setCycleDay(1);
    localStorage.setItem('tesoros_cycle_day', '1');
    setShowDay31Modal(false);
  };

  const handleGoHome = () => {
    setCurrentCard(null);
    setActiveTab('draw');
    setIsFlipped(false);
    setIsCardSaved(false);
    setUserNote('');
    setShowAutoModal(false);
    setHasShownAutoModal(false);
  };

  const isCardInDiary = (card: Card) => {
    return diary.some((entry) => isSameCard(entry.card, card));
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

    if (initialEnergy === null) {
      setPendingCategory(categoryKey);
      setShowEnergyModal(true);
      return;
    }

    executeCardDraw(categoryKey);
  };

  const executeCardDraw = (categoryKey: string) => {
    const today = getTodayKey();
    const flipsKey = `tesoros_flips_${today}`;
    const currentFlipsCount = parseInt(localStorage.getItem(flipsKey) || '0', 10);

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
        setShowAutoModal(false);
        setHasShownAutoModal(false);
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

        trackAnalyticsEvent('card_drawn', {
          category: catName,
          card_id: getAnalyticsCardId(selected),
          flip_number: newFlips,
        });

        // Persistimos el giro en daily_flips sin bloquear la experiencia de la carta.
        void syncDailyFlipsToSupabase(today, selected, newFlips);
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleSelectEnergy = (level: number) => {
    const today = getTodayKey();
    setInitialEnergy(level);
    localStorage.setItem(`tesoros_energy_${today}`, level.toString());
    setShowEnergyModal(false);

    trackAnalyticsEvent('initial_energy_submitted', { energy_level: level });
    saveToSupabase('user_energy_checkins', {
      energy_level: level,
      created_at: new Date().toISOString(),
    });

    if (pendingCategory) {
      executeCardDraw(pendingCategory);
      setPendingCategory(null);
    }
  };

  const handleCardUtilitySelect = (  rating: 'mucho' | 'un_poco' | 'no_mucho'  ) =>  {
    if (!currentCard) return;
  
    setCardUtilityRating(rating);
    setShowReasonInput(true);
  
    const cardId = String(
      currentCard['#'] ??
      cleanText(
        currentCard['Anverso (Gancho Científico)'] ||
        currentCard['Modelo (Intención)']
      )
    );
  
    const category = String(
      currentCard['Categoría'] || ''
    ).toUpperCase();
  
    // "Mucho" y "Un poco" significan que el tesoro sí resultó útil.
    // "No mucho" significa que no resultó útil.
    const useful = rating !== 'no_mucho';
  
    trackAnalyticsEvent('card_utility_rated', {
      category,
      card_id: getAnalyticsCardId(currentCard),
      rating,
    });
  
    saveToSupabase('card_utility_feedback', {
      card_id: cardId,
      category,
      card_type: cleanText(currentCard['Modelo (Intención)']),
      useful,
      created_at: new Date().toISOString(),
    });
  };

  const handleAutoUtilitySelect = (
    rating: 'mucho' | 'un_poco' | 'no_mucho'
  ) => {
    // Usa el mismo flujo que ya funciona:
    // registra la valoración y la deja seleccionada abajo.
    handleCardUtilitySelect(rating);

    // Cierra la ventana flotante.
    setShowAutoModal(false);

    // Después de cerrarla, lleva a la valoración inferior.
    setTimeout(() => {
      const feedbackElement = document.getElementById(
        'card-utility-feedback'
      );

      if (!feedbackElement) return;

      feedbackElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      feedbackElement.classList.add('tesoros-feedback-focus');

      setTimeout(() => {
        feedbackElement.classList.remove('tesoros-feedback-focus');
      }, 1400);
    }, 180);
  };

  const handleCardReasonSubmit = () => {
    if (!cardUtilityReason.trim()) return;

    trackAnalyticsEvent('card_utility_reason_submitted', {
      category: currentCard?.['Categoría'] || '',
      card_id: getAnalyticsCardId(currentCard),
      rating: cardUtilityRating,
    });

    saveToSupabase('card_utility_feedback_reasons', {
      card_id: getAnalyticsCardId(currentCard),
      reason: cardUtilityReason,
      created_at: new Date().toISOString(),
    });

    setShowReasonInput(false);
  };

  const handleEndSessionSurveySubmit = () => {
    setRoadmapSubmitted(true);

    trackAnalyticsEvent('session_end_survey_submitted', {
      would_return: wouldReturn,
    });

    saveToSupabase('session_roadmap_feedback', {
      would_return: wouldReturn,
      roadmap_wish: roadmapWish,
      created_at: new Date().toISOString(),
    });
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
    setHasShownAutoModal(true);
  };

  const saveCardToDiary = (cardToSave: Card, feelingText?: string, noteText?: string) => {
    const currentNote = noteText !== undefined ? noteText : userNote;

    if (getPrimaryButtonType(cardToSave) === 'PRACTICA' && currentNote.trim()) {
      trackAnalyticsEvent('practice_completed', {
        category: cardToSave['Categoría'] || '',
        card_id: getAnalyticsCardId(cardToSave),
        reflection_length: currentNote.trim().length,
      });
    }

    setDiary((prevDiary) => {
      const existingIndex = prevDiary.findIndex((e) => isSameCard(e.card, cardToSave));
      let updated: DiaryEntry[];

      if (existingIndex >= 0) {
        updated = [...prevDiary];
        updated[existingIndex] = {
          ...updated[existingIndex],
          feeling: feelingText || updated[existingIndex].feeling,
          note: currentNote !== undefined ? currentNote : updated[existingIndex].note,
        };
      } else {
        const newEntry: DiaryEntry = {
          id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
          date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
          card: cardToSave,
          feeling: feelingText,
          note: currentNote,
        };
        updated = [newEntry, ...prevDiary];
      }

      localStorage.setItem('tesoros_diario', JSON.stringify(updated));
      return updated;
    });

    if (currentCard && isSameCard(currentCard, cardToSave)) {
      setIsCardSaved(true);
    }

    trackAnalyticsEvent('card_saved', {
      category: cardToSave['Categoría'] || '',
      card_id: getAnalyticsCardId(cardToSave),
    });

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
    if (targetCard) {
      trackAnalyticsEvent('card_shared', {
        category: targetCard['Categoría'] || '',
        card_id: getAnalyticsCardId(targetCard),
      });
    }
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

  const handleVoiceSubmit = () => {
    if (!voiceInput.trim()) return;

    const newVoice = {
      id: Date.now().toString(),
      author: 'Tú',
      location: 'Comunidad',
      text: voiceInput.trim(),
      feeling: '❤️ Mucho',
      category: 'COMPARTIR',
      date: 'Ahora'
    };

    setCommunityVoices([newVoice, ...communityVoices]);
    setVoiceSubmitted(true);
    trackAnalyticsEvent('user_voice_submitted', {});
    saveToSupabase('user_voices', { message: voiceInput.trim(), created_at: new Date().toISOString() });

    setTimeout(() => {
      setVoiceInput('');
      setVoiceSubmitted(false);
    }, 3500);
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

  const brightnessPercentage = Math.min(100, Math.round((cycleDay / 31) * 100));
  const currentMotivationalMessage = treasureProgressMessages.find((m) => m.day === cycleDay)?.message || treasureProgressMessages[0].message;
  const currentPhaseInfo = getPhaseInfo(cycleDay);

  const closeAutoModal = () => {
    setShowAutoModal(false);
    setHasShownAutoModal(true);
  };

  const todayFirstCategory = activityMap[getTodayKey()];
  const todayColorHex = todayFirstCategory ? CATEGORY_COLORS[todayFirstCategory] : '#FAD02C';

  if (authLoading) {
    return (
      <>
        <GoogleAnalyticsTag enabled={analyticsConsent === 'accepted'} />
        {analyticsConsent === 'pending' && (
  <AnalyticsConsentBanner onConsent={handleAnalyticsConsent} />
)}
        <main className="min-h-screen bg-[#FAF8F5] text-[#332E2B] flex flex-col items-center justify-center p-6 antialiased">
        <div className="text-6xl animate-pulse mb-4">💎</div>
        <p className="text-xs font-serif italic text-[#997343] font-semibold tracking-wider">
          Preparando tu espacio...
        </p>
      </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <GoogleAnalyticsTag enabled={analyticsConsent === 'accepted'} />
        {analyticsConsent === 'pending' && (
  <AnalyticsConsentBanner onConsent={handleAnalyticsConsent} />
)}
        <main className="min-h-screen bg-[#FAF8F5] text-[#332E2B] flex flex-col items-center justify-center p-6 antialiased">
        <div className="w-full max-w-sm bg-white rounded-[32px] border border-[#E3DDD5] shadow-xl p-7 text-center">
          <div className="text-6xl mb-4">💎</div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-[#997343] uppercase font-bold">
            TESOROS
          </p>
          <h1 className="font-serif font-bold text-2xl text-[#1C1817] mt-1">
            Del Autodescubrimiento
          </h1>
          <p className="text-sm text-[#8A827A] leading-relaxed mt-4">
            Un pequeño espacio para hacer una pausa, descubrirte y pulir tu diamante interior.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={authActionLoading}
            className="w-full mt-6 py-3.5 rounded-2xl bg-[#1C1817] text-white text-sm font-semibold hover:bg-[#332E2B] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-base">G</span>
            <span>{authActionLoading ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-[#E3DDD5]" />
            <span className="text-[10px] text-[#B5AEA7] uppercase tracking-wider">o</span>
            <div className="h-px flex-1 bg-[#E3DDD5]" />
          </div>

          <button
            onClick={handleAnonymousSignIn}
            disabled={authActionLoading}
            className="w-full py-3.5 rounded-2xl bg-white border border-[#D8D0C8] text-[#332E2B] text-sm font-semibold hover:bg-[#FAF8F5] hover:border-[#997343] disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <span>{authActionLoading ? 'Preparando tu espacio...' : 'Entrar sin registrarme'}</span>
          </button>

          <p className="text-[10px] text-[#B5AEA7] leading-relaxed mt-3">
            Puedes empezar sin crear una cuenta. Más adelante podrás registrarte para conservar tu recorrido.
          </p>

          <p className="text-[10px] text-[#B5AEA7] leading-relaxed mt-4">
            Tu cuenta permite guardar tu recorrido y asociar tus respuestas a tu espacio personal.
          </p>

          {authError && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-[10px] text-red-700 leading-relaxed">
              {authError}
            </div>
          )}
        </div>
      </main>
      </>
    );
  }

  return (
    <>
      <GoogleAnalyticsTag enabled={analyticsConsent === 'accepted'} />
      {analyticsConsent === 'pending' && (
  <AnalyticsConsentBanner onConsent={handleAnalyticsConsent} />
)}

      <style jsx global>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.18); opacity: 1; filter: drop-shadow(0 0 16px rgba(250, 208, 44, 0.85)); }
        }
        .animate-pulse-glow { animation: pulseGlow 1.6s infinite ease-in-out; }

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

      {/* MODAL MISIÓN — PROPÓSITO SOCIAL Y DOS CAMINOS */}
      {showMissionModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMissionModal(false);
          }}
        >
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-left space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowMissionModal(false)}
              className="absolute top-3 right-4 text-[#8A827A] hover:text-[#1C1817] text-lg font-bold p-1"
              aria-label="Cerrar misión"
            >
              ✕
            </button>

            <div className="w-full text-center pt-1">
              <div className="text-4xl mb-2">🇻🇪</div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase font-bold">
                ✦ MISIÓN ✦
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1C1817] mt-1">
                Los Tesoros también pueden llegar más lejos.
              </h2>
            </div>

            <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-4 space-y-3 shadow-xs">
              <div>
                <h3 className="text-xs font-serif font-bold text-[#1C1817]">
                  ¿Por qué existe esta misión?
                </h3>
                <p className="text-xs text-[#332E2B] leading-relaxed mt-1.5">
                  Tesoros del Autodescubrimiento nació con una intención que va más allá del autoconocimiento: convertir una experiencia de bienestar personal en una oportunidad para acompañar emocionalmente a otras personas que lo necesitan.
                </p>
              </div>

              <div className="border-t border-[#E3DDD5]/60 pt-3">
                <h3 className="text-xs font-serif font-bold text-[#1C1817]">
                  ¿Qué queremos hacer?
                </h3>
                <p className="text-xs text-[#332E2B] leading-relaxed mt-1.5">
                  Llevar herramientas de pausa, reflexión y autodescubrimiento a personas que atraviesan momentos difíciles, empezando por Venezuela.
                </p>
              </div>

              <p className="text-xs font-serif italic text-[#997343] leading-relaxed pt-1">
                Porque reconstruir también significa poder volver a sentirse acompañado. ❤️‍🩹
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A827A] px-1">
                ¿Cómo puedes formar parte?
              </p>

              <a
                href="https://gofundme.com"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>❤️‍🩹</span>
                <span>Apoyar la misión</span>
              </a>
              <p className="text-[10px] text-[#8A827A] text-center -mt-1">
                Contribuir mediante GoFundMe.
              </p>

              <button
                type="button"
                disabled
                className="w-full py-3 rounded-2xl bg-white border border-[#E3DDD5] text-[#8A827A] text-xs font-semibold flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                title="La reserva de la caja física estará disponible próximamente."
              >
                <span>💎</span>
                <span>Reservar mi caja</span>
                <span className="text-[9px] bg-[#FAF8F5] border border-[#E3DDD5] px-1.5 py-0.5 rounded-full">
                  Próximamente
                </span>
              </button>
              <p className="text-[10px] text-[#8A827A] text-center -mt-1">
                Acceder a la futura reserva de la caja física.
              </p>
            </div>

            <button
              onClick={() => setShowMissionModal(false)}
              className="w-full py-1 text-xs text-[#8A827A] hover:text-[#1C1817]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL RACHA Y CALENDARIO */}
      {showStreakModal && (() => {
        const { startingDayIndex, totalDays, monthName } = getCalendarDays();
        const todayStr = getTodayKey();

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-5 border border-[#E3DDD5] shadow-2xl flex flex-col items-center relative space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowStreakModal(false)}
                className="absolute top-3 right-4 text-[#8A827A] hover:text-[#1C1817] text-lg font-bold p-1"
              >
                ✕
              </button>

              {/* BANNER DE RACHA */}
              <div
                className="w-full border border-[#E3DDD5] rounded-2xl p-4 text-center space-y-1 shadow-xs transition-colors duration-500"
                style={{
                  backgroundColor: todayFirstCategory ? `${todayColorHex}25` : '#FFFBEB',
                  borderColor: todayFirstCategory ? todayColorHex : '#FDE68A',
                }}
              >
                <span className="text-4xl inline-block animate-pulse">💎</span>
                <h2 className="text-xl font-serif font-bold text-[#1C1817]">
                  {streak} {streak === 1 ? 'Día de Racha' : 'Días Puliendo tu Diamante'}
                </h2>
                <p className="text-[11px] text-[#332E2B] leading-relaxed">
                  {streak > 0 
                    ? 'Tu diamante interior se va puliendo con cada pausa activa que registras.' 
                    : 'Empieza hoy a pulir tu diamante sacando una carta y registrando tu hábito diario.'}
                </p>
              </div>

              {/* CALENDARIO DE PULIDO */}
              <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-3.5 shadow-xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-[#E3DDD5]/60 pb-2">
                  <h3 className="text-xs font-serif font-bold text-[#1C1817] uppercase tracking-wider capitalize">
                    📅 {monthName}
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-[#997343] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {Object.keys(activityMap).length} días pulidos
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono font-bold text-[#8A827A] pt-0.5">
                  <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                </div>

                <div className="grid grid-cols-7 gap-1 pt-0.5">
                  {Array.from({ length: startingDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(dayNum).padStart(2, '0');
                    const dateKey = `${year}-${month}-${dayStr}`;

                    const category = activityMap[dateKey];
                    const isActive = Boolean(category);
                    const isToday = dateKey === todayStr;

                    return (
                      <div
                        key={dateKey}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-mono relative border transition-all ${
                          isToday
                            ? 'border-[#997343] ring-2 ring-[#997343]/40 font-bold'
                            : 'border-[#E3DDD5]/60'
                        } ${
                          isActive
                            ? 'text-[#1C1817] shadow-2xs font-bold'
                            : 'bg-[#FAF8F5] text-[#B5AEA7]'
                        }`}
                        style={isActive && category ? { backgroundColor: `${CATEGORY_COLORS[category]}80` } : {}}
                      >
                        <span>{dayNum}</span>
                        {isActive && (
                          <span className="text-[8px] leading-none mt-0.5">💎</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTÓN INTEGRADOR CON MI VIAJE */}
              <div className="w-full bg-gradient-to-r from-[#1C1817] to-[#332E2B] text-white rounded-2xl p-4 shadow-md space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">🚀</div>
                  <div className="text-left">
                    <h3 className="text-xs font-serif font-bold italic">
                      Conecta con &ldquo;El Viaje&rdquo;
                    </h3>
                    <p className="text-[10px] text-amber-200/90 font-light leading-tight mt-0.5">
                      Tu racha alimenta tu avance en el ciclo de 31 días. ✨
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStreakModal(false);
                    setActiveTab('journey');
                  }}
                  className="w-full py-2 rounded-xl bg-amber-400 text-[#1C1817] text-xs font-serif italic font-bold hover:bg-amber-300 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>✨</span>
                  <span>Ver mi progreso en El Viaje</span>
                </button>
              </div>

              <button
                onClick={() => setShowStreakModal(false)}
                className="w-full py-1 text-xs text-[#8A827A] hover:text-[#1C1817]"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* MODAL DÍA 31 */}
      {showDay31Modal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-6xl animate-bounce">💎✨</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase font-bold">
                ✦ LOGRO SUPREMO ✦
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1C1817] mt-1">
                ¡DIAMANTE 100% PULIDO!
              </h3>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs font-serif italic text-[#332E2B] leading-relaxed shadow-xs">
              &ldquo;{treasureProgressMessages[30].message}&rdquo;
            </div>

            <p className="text-[11px] text-[#8A827A] leading-tight">
              Tu diamante pulido se ha guardado en la mochila de tu viaje. ¡Estás listo/a para iniciar un nuevo ciclo!
            </p>

            <button
              onClick={handleRestartCycle}
              className="w-full py-3 rounded-xl bg-[#1C1817] text-white text-xs font-serif italic font-semibold hover:bg-[#332E2B] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>Comenzar un Nuevo Ciclo de 31 Días</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE DIAMANTE DE REJILLA */}
      {selectedGridDay !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-4xl">
              {selectedGridDay <= cycleDay ? '💎' : '🔒'}
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase font-bold">
                ✦ DÍA {selectedGridDay} DE 31 ✦
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1C1817] mt-1">
                {selectedGridDay <= cycleDay ? 'Diamante Desbloqueado' : 'Próxima Faceta'}
              </h3>
            </div>

            <div className="bg-white border border-[#E3DDD5] rounded-2xl p-4 text-xs font-serif italic text-[#332E2B] leading-relaxed w-full">
              &ldquo;{treasureProgressMessages.find((m) => m.day === selectedGridDay)?.message}&rdquo;
            </div>

            <div className="text-[10px] font-mono text-[#8A827A] space-y-1">
              <p>Estado del ciclo: {selectedGridDay <= cycleDay ? 'Alcanzado' : 'En progreso'}</p>
              <p>Ciclo activo: Ciclo #{completedCycles.length + 1}</p>
            </div>

            <button
              onClick={() => setSelectedGridDay(null)}
              className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-IN INICIAL DE ENERGÍA */}
      {showEnergyModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-5">
            <div className="text-4xl">🪫⚡🔋</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase font-bold">
                ✦ CHECK-IN INICIAL ✦
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1C1817] mt-1">
                ¿Cómo llegas hoy?
              </h3>
              <p className="text-xs text-[#8A827A] mt-1">
                Mide tu nivel de energía antes de revelar tu tesoro
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 w-full pt-1">
              {[
                { lvl: 1, label: 'Agotado', icon: '🪫' },
                { lvl: 2, label: 'Bajo', icon: '📉' },
                { lvl: 3, label: 'Neutro', icon: '⚖️' },
                { lvl: 4, label: 'Bueno', icon: '🔋' },
                { lvl: 5, label: 'Pleno', icon: '⚡' },
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => handleSelectEnergy(item.lvl)}
                  className="p-2.5 rounded-2xl bg-white border border-[#E3DDD5] hover:border-[#997343] hover:bg-amber-50/60 transition-all flex flex-col items-center justify-center space-y-1 shadow-xs active:scale-95 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#1C1817]">
                    {item.lvl}
                  </span>
                  <span className="text-[8px] text-[#8A827A] leading-tight font-medium">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-[#8A827A] italic">
              Al tocar una opción revelaremos tu diamante de inmediato.
            </p>
          </div>
        </div>
      )}

      {/* MODAL AUTO: DINÁMICO PRÁCTICA VS CONTINUAR */}
      {showAutoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-4xl">✦</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase font-bold">
                ✦ {getPrimaryButtonType(currentCard) === 'PRACTICA' ? 'MOMENTO DE PRÁCTICA' : '¿CÓMO DESEAS CONTINUAR?'} ✦
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1C1817] mt-1">
                {getPrimaryButtonType(currentCard) === 'PRACTICA' ? '¡Es hora de actuar! ✨' : 'Tómate tu momento ✨'}
              </h3>
            </div>

            <div className="w-full space-y-2.5 pt-1">
              {getPrimaryButtonType(currentCard) === 'PRACTICA' ? (
                <button
                  onClick={handleDoPracticaNow}
                  className="w-full py-3 rounded-xl bg-[#1C1817] text-white text-xs font-serif italic font-semibold hover:bg-[#332E2B] transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>✍️</span>
                  <span>Quiero hacerlo ahora</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    closeAutoModal();
                    handleAnotherDiamondClick();
                  }}
                  className="w-full py-3 rounded-xl bg-[#1C1817] text-white text-xs font-serif italic font-semibold hover:bg-[#332E2B] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>✨</span>
                  <span>Continuar para sacar otro diamante</span>
                </button>
              )}

<div className="w-full pt-1">
                <div className="text-[9px] font-mono tracking-widest text-[#997343] uppercase font-bold mb-2">
                  ✦ ¿TE SIRVIÓ ESTE TESORO? ✦
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleAutoUtilitySelect('mucho')}
                    className="py-2.5 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-semibold hover:bg-[#FAF8F5] transition-all active:scale-95"
                  >
                    ❤️ Mucho
                  </button>

                  <button
                    onClick={() => handleAutoUtilitySelect('un_poco')}
                    className="py-2.5 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-semibold hover:bg-[#FAF8F5] transition-all active:scale-95"
                  >
                    🙂 Un poco
                  </button>

                  <button
                    onClick={() => handleAutoUtilitySelect('no_mucho')}
                    className="py-2.5 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-semibold hover:bg-[#FAF8F5] transition-all active:scale-95"
                  >
                    😐 No mucho
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={closeAutoModal}
              className="text-xs text-[#8A827A] hover:text-[#1C1817] pt-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL COMENTARIOS */}
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
                  placeholder="Cuéntanos: ¿qué te despertó este tesoro?, ¿cómo te ayudó? o comparte tus sugerencias..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-2xl bg-white border border-[#E3DDD5] text-[#1C1817] placeholder-[#B5AEA7] focus:outline-none focus:border-[#997343] resize-none"
                />
                <div className="w-full space-y-2">
                  <button
                onClick={() => {
                  if (!feedbackText.trim()) return;
                
                  const cardId = currentCard ? getAnalyticsCardId(currentCard) : null;
                  const category = currentCard?.['Categoría'] || null;
                
                  setFeedbackSent(true);
                
                  if (feedbackSource === 'card') {
                    trackAnalyticsEvent('card_comment_sent', {
                      card_id: cardId,
                      category,
                    });
                
                    saveToSupabase('general_user_feedback', {
                      text: feedbackText.trim(),
                      source: 'card_comment',
                      card_id: cardId,
                      category,
                      created_at: new Date().toISOString(),
                    });
                  } else {
                    trackAnalyticsEvent('general_feedback_sent', {
                      source: 'voice_button',
                    });
                
                    saveToSupabase('general_user_feedback', {
                      text: feedbackText.trim(),
                      source: 'voice_button',
                      created_at: new Date().toISOString(),
                    });
                  }
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

      {/* MODAL: LÍMITE DIARIO */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="text-4xl">🌙</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase font-bold">
                ✦ LÍMITE DIARIO ALCANZADO ✦
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1C1817] mt-1">
                ¡Nos vemos mañana!
              </h3>
            </div>
            <p className="text-xs text-[#8A827A] leading-relaxed">
              Has revelado tus <strong>3 diamantes de hoy</strong> (3/3). Tómate el día para reflexionar e integrar estos mensajes. Mañana podrás descubrir nuevos tesoros.
            </p>

            <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-4 text-left space-y-3.5 my-1 shadow-xs">
              <div className="text-center pb-1 border-b border-[#E3DDD5]/60">
                <span className="text-[10px] font-mono font-bold uppercase text-[#997343] tracking-wider">
                  ✦ ¿CÓMO TE VAS? ✦
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#1C1817]">
                  ¿Volverías mañana?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWouldReturn(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      wouldReturn === true
                        ? 'bg-[#1C1817] text-white border-[#1C1817]'
                        : 'bg-[#FAF8F5] text-[#332E2B] border-[#E3DDD5] hover:border-[#997343]'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setWouldReturn(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      wouldReturn === false
                        ? 'bg-[#1C1817] text-white border-[#1C1817]'
                        : 'bg-[#FAF8F5] text-[#332E2B] border-[#E3DDD5] hover:border-[#997343]'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-[#1C1817]">
                  ¿Qué necesitas encontrar aquí que todavía no existe? 🔥🔥🔥
                </p>
                <textarea
                  value={roadmapWish}
                  onChange={(e) => setRoadmapWish(e.target.value)}
                  placeholder="Un diario de gratitud, meditaciones de 1 min, ejercicios respiratorios..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E3DDD5] text-[#1C1817] placeholder-[#B5AEA7] focus:outline-none focus:border-[#997343] resize-none"
                />
              </div>

              {roadmapSubmitted ? (
                <div className="p-2.5 bg-amber-50 text-[#997343] text-[11px] font-semibold text-center rounded-xl border border-amber-200">
                  ✨ ¡Gracias! Tu idea nos ayuda a construir el futuro.
                </div>
              ) : (
                <button
                  onClick={handleEndSessionSurveySubmit}
                  disabled={!roadmapWish.trim() && wouldReturn === null}
                  className="w-full py-2 bg-[#997343] text-white text-xs font-semibold rounded-xl hover:bg-[#836237] disabled:opacity-40 transition-all shadow-xs"
                >
                  Guardar mis respuestas
                </button>
              )}
            </div>

            <div className="w-full space-y-2 pt-1">
              {todayCards.length > 0 && (
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    openTodayCarousel();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all flex items-center justify-center gap-1.5 shadow-sm"
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

      {/* MODAL: ELECCIÓN DE CATEGORÍA */}
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

      {/* MODAL: CUÁNTO TE AYUDÓ */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 border border-[#E3DDD5] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="text-4xl">❤️‍🩹</div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#997343] uppercase">
                ✦ REFLEXIÓN DEL MOMENTO ✦
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1C1817] mt-1">
                ¿Cuánto te ayudó?
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {[
                { label: '❤️ Mucho', desc: 'Llegó justo en el momento exacto' },
                { label: '🙂 Un poco', desc: 'Me dio una buena perspectiva' },
                { label: '😐 No mucho', desc: 'No me causó impacto por ahora' },
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
      <main className="min-h-screen bg-[#FAF8F5] text-[#332E2B] flex flex-col items-center justify-between pb-24 p-4 max-w-md mx-auto antialiased">
        
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
              <h1 className="font-serif font-bold text-[13px] leading-none tracking-[0.08em] text-[#1C1817]">
                TESOROS
              </h1>
              <p className="mt-1 text-[8px] font-mono text-[#997343] tracking-[0.16em] uppercase font-semibold">
                DEL AUTODESCUBRIMIENTO
              </p>
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
              style={todayFirstCategory ? { borderColor: todayColorHex } : {}}
              title="Ver tu racha actual y calendario"
            >
              <span className="text-amber-500 animate-pulse">🔥</span>
              <span>{streak}d</span>
            </button>

            <button
              onClick={() => setShowMissionModal(true)}
              className="text-[#8A827A] hover:underline text-xs"
            >
              🇻🇪 Misión
            </button>

            <button
              onClick={handleSignOut}
              disabled={authActionLoading}
              title={user.email ? `Cerrar sesión de ${user.email}` : 'Cerrar sesión'}
              className="w-7 h-7 rounded-full bg-white border border-[#E3DDD5] text-[#8A827A] text-[10px] font-bold flex items-center justify-center hover:border-[#997343] hover:text-[#997343] disabled:opacity-50 transition-all"
            >
              {user.email?.charAt(0).toUpperCase() || '↪'}
            </button>
          </div>
        </header>

        {/* PESTAÑA PRINCIPAL: HOY */}
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

                <div
                  ref={cardRef}
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

                {isFlipped ? (
                  <div className="w-full space-y-2.5 my-2 animate-fadeIn">
                    <button
                      onClick={handleAnotherDiamondClick}
                      className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-serif italic font-medium flex items-center justify-center gap-1.5 hover:bg-[#332E2B] shadow-sm transition-all"
                    >
                      <span>✨</span>
                      <span>Sacar otro diamante</span>
                    </button>

                    <div className="w-full bg-white border border-[#E3DDD5] rounded-2xl p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#997343] block">
                        ✦ ¿TE SIRVIÓ ESTE TESORO?
                      </span>
                      <div id="card-utility-feedback"
                            className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleAutoUtilitySelect('mucho')}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                            cardUtilityRating === 'mucho'
                              ? 'bg-amber-100 border-[#997343] text-[#997343]'
                              : 'bg-[#FAF8F5] border-[#E3DDD5] hover:border-[#997343]'
                          }`}
                        >
                          ❤️ Mucho
                        </button>
                        <button
                          onClick={() => handleAutoUtilitySelect('un_poco')}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                            cardUtilityRating === 'un_poco'
                              ? 'bg-amber-100 border-[#997343] text-[#997343]'
                              : 'bg-[#FAF8F5] border-[#E3DDD5] hover:border-[#997343]'
                          }`}
                        >
                          🙂 Un poco
                        </button>
                        <button
                          onClick={() => handleAutoUtilitySelect('no_mucho')}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                            cardUtilityRating === 'no_mucho'
                              ? 'bg-amber-100 border-[#997343] text-[#997343]'
                              : 'bg-[#FAF8F5] border-[#E3DDD5] hover:border-[#997343]'
                          }`}
                        >
                          😐 No mucho
                        </button>
                      </div>

                      {showReasonInput && (
                        <div className="pt-1 space-y-1.5 animate-fadeIn">
                          <label className="text-[9px] font-mono text-[#8A827A] uppercase block">
                            ¿Quieres contarnos por qué? (Campo opcional)
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={cardUtilityReason}
                              onChange={(e) => setCardUtilityReason(e.target.value)}
                              placeholder="Escribe brevemente tu razón..."
                              className="flex-1 text-xs p-2 rounded-xl bg-[#FAF8F5] border border-[#E3DDD5] focus:outline-none focus:border-[#997343]"
                            />
                            <button
                              onClick={handleCardReasonSubmit}
                              className="px-3 py-1 bg-[#1C1817] text-white text-xs font-semibold rounded-xl hover:bg-[#332E2B] transition-all shrink-0"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECCIÓN PRÁCTICA / MI REFLEXIÓN CON ANIMACIÓN DE ENFOQUE */}
                    <div
                      ref={practicaRef}
                      className={`w-full bg-white border rounded-2xl p-3 shadow-xs space-y-2 scroll-mt-6 transition-all duration-500 ${
                        isPracticaHighlighted
                          ? 'border-[#997343] ring-4 ring-[#997343]/30 scale-[1.02] shadow-lg animate-pulse'
                          : 'border-[#E3DDD5]'
                      }`}
                    >
                      <div className="flex justify-between items-center px-0.5">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#997343] flex items-center gap-1">
                          <span>✍️</span> PRÁCTICA / MI REFLEXIÓN:
                        </label>
                        {userNote.trim().length > 0 && (
                          <span className="text-[9px] text-[#8A827A] font-mono">
                            {userNote.length} caracteres
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          placeholder="Escribe aquí el resultado de tu ejercicio o tus pensamientos al hacer la actividad..."
                          rows={3}
                          className="w-full text-xs p-2.5 pb-9 rounded-xl bg-[#FAF8F5] border border-[#E3DDD5] text-[#1C1817] placeholder-[#B5AEA7] focus:outline-none focus:border-[#997343] resize-none transition-all"
                        />

                        {/* BOTÓN ACTUALIZAR NOTA AL LADO DEL MENSAJE/TEXTAREA */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                          <button
                            onClick={handleSaveToDiary}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1C1817] text-white hover:bg-[#332E2B] transition-all shadow-xs flex items-center gap-1"
                          >
                            <span>📝</span>
                            <span>{isCardSaved ? 'Actualizar nota' : 'Añadir nota'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* BOTONERA INFERIOR */}
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      <button
                        onClick={handleSaveToDiary}
                        className={`py-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isCardSaved
                            ? 'bg-[#997343] text-white border-[#997343] shadow-xs'
                            : 'bg-[#1C1817] text-white border-[#1C1817] hover:bg-[#332E2B]'
                        }`}
                      >
                        <span>💎</span>
                        <span>{isCardSaved ? 'Guardado a Tesoros' : '💎 Guardar a Tesoros'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setFeedbackSource('card');
                          setShowFeedbackModal(true);
                        }}
                        className="py-2.5 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>💬</span>
                        <span>Comentar</span>
                      </button>

                      <button
                        onClick={() => handleShare()}
                        className="py-2.5 rounded-xl bg-white border border-[#E3DDD5] text-[#332E2B] text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-[#FAF8F5] transition-all"
                      >
                        <span>📤</span>
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 my-2" />
                )}

                <div className="w-full flex flex-col items-center gap-1 text-center px-1">
                  <p className="text-[10px] text-[#8A827A] font-light leading-relaxed max-w-[320px] mx-auto text-center">
                    Tesoros del Autodescubrimiento nació después de los terremotos en Venezuela como parte de las donaciones que están pasando desapercibidas, tales como el apoyo emocional ❤️. Cada caja física llega primero a quien más la necesita.
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

        {/* PESTAÑA: EL VIAJE */}
        {activeTab === 'journey' && (
          <div className="w-full flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[75vh] animate-fadeIn">
            <div className="w-full bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40 border border-[#E3DDD5] rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-[#E3DDD5]/60 pb-2">
                <div>
                  <h2 className="text-xl font-serif italic text-[#1C1817] font-bold">
                    El Viaje 🎒
                  </h2>
                  <p className="text-[10px] font-mono text-[#997343] uppercase font-semibold">
                    Ciclo Activo #{completedCycles.length + 1}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowStreakModal(true)}
                    className="bg-white border border-[#E3DDD5] px-2.5 py-1 rounded-xl text-center shadow-2xs hover:border-[#997343] transition-all cursor-pointer group active:scale-95"
                    title="Abrir ventana de racha y calendario"
                  >
                    <span className="text-[9px] font-mono text-[#8A827A] uppercase block group-hover:text-[#997343]">
                      Racha 💎
                    </span>
                    <span className="text-xs font-bold text-[#1C1817]">🔥 {streak}d</span>
                  </button>
                  <button
                    onClick={() => setShowStreakModal(true)}
                    className="bg-white border border-[#E3DDD5] px-2.5 py-1 rounded-xl text-center shadow-2xs hover:border-[#997343] transition-all cursor-pointer group active:scale-95"
                    title="Ver rachas"
                  >
                    <span className="text-[9px] font-mono text-[#8A827A] uppercase block group-hover:text-[#997343]">Hits</span>
                    <span className="text-xs font-bold text-[#997343]">💎 {completedCycles.length}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#8A827A]">
                  <span>Progreso del Ciclo</span>
                  <span className="text-[#997343]">{cycleDay}/31 días</span>
                </div>
                <div className="w-full bg-[#EAE5DF] h-2.5 rounded-full overflow-hidden p-0.5 border border-black/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FAD02C] via-[#E1BEE7] to-[#81C784] transition-all duration-700"
                    style={{ width: `${Math.max(3, (cycleDay / 31) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-4 shadow-sm relative overflow-hidden">
              <div className="w-[94%] mx-auto space-y-2">
                <div className="flex justify-between items-center border-b border-[#E3DDD5]/50 pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#997343] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                    {currentPhaseInfo.title}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#1C1817] bg-[#EAE5DF]/60 px-2.5 py-0.5 rounded-md">
                    DÍA {cycleDay} DE 31
                  </span>
                </div>

                <div className="py-2 px-1">
                  <p className="text-sm font-serif italic text-[#1C1817] leading-relaxed text-center font-medium">
                    &ldquo;{currentMotivationalMessage}&rdquo;
                  </p>
                </div>

                <div className="pt-3 pb-1 border-t border-[#E3DDD5]/50">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wide text-[#8A827A]">
                      ✨ Brillo de tu diamante
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-mono font-bold text-[#997343] shadow-2xs">
                      {brightnessPercentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE5DF]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FAD02C] via-[#E1BEE7] to-[#81C784] transition-all duration-700"
                      style={{ width: `${brightnessPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-4.5 shadow-sm space-y-3">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-xs font-serif font-bold text-[#1C1817] uppercase tracking-wider">
                    Sección 1: Diamantes Pulidos
                  </h3>
                  <p className="text-[10px] text-[#8A827A]">
                    Los Grandes Hits de tu Camino (31 Días)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#997343]">
                  {cycleDay}/31
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                  const isUnlocked = dayNum <= cycleDay;
                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedGridDay(dayNum)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-[11px] font-mono transition-all duration-300 border ${
                        isUnlocked
                          ? 'bg-amber-100/80 border-amber-300 text-[#1C1817] shadow-2xs hover:scale-110 active:scale-95'
                          : 'bg-[#FAF8F5] border-[#E3DDD5]/80 text-[#B5AEA7] opacity-60'
                      }`}
                      title={`Día ${dayNum}`}
                    >
                      <span>{isUnlocked ? '💎' : '🔒'}</span>
                      <span className="text-[8px] font-bold mt-0.5">{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-3.5 shadow-sm space-y-3">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-xs font-serif font-bold text-[#1C1817] uppercase tracking-wider">
                    Sección 2: Diamantes de Cartas
                  </h3>
                  <p className="text-[10px] text-[#8A827A]">
                    Colección Diaria de Lecturas y Notas
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#1C1817]">
                  {diary.length} guardados
                </span>
              </div>

              {diary.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-[#8A827A] italic bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E3DDD5]">
                  Aún no has guardado notas o lecturas de cartas. ¡Gira una carta e intégrala aquí!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {diary.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleOpenFromDiary(entry)}
                      className="p-3 rounded-2xl border border-black/5 flex flex-col justify-between space-y-1.5 cursor-pointer hover:scale-[1.02] transition-transform shadow-2xs"
                      style={{ backgroundColor: getCardColor(entry.card['Categoría']) }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs">💎</span>
                        <span className="text-[9px] font-mono font-bold text-[#1C1817]/70 uppercase">
                          {entry.date}
                        </span>
                      </div>
                      <p className="text-[11px] font-serif italic font-bold text-[#1C1817] line-clamp-2 leading-tight">
                        &ldquo;{cleanText(entry.card['Anverso (Gancho Científico)'] || entry.card['Modelo (Intención)'])}&rdquo;
                      </p>
                      {entry.note && (
                        <span className="text-[8px] font-mono font-bold text-[#997343] bg-white/70 px-1.5 py-0.5 rounded-full self-start">
                          ✍️ Con nota
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {completedCycles.length > 0 && (
              <div className="w-full bg-[#FAF8F5] border border-[#E3DDD5] rounded-3xl p-4.5 space-y-2.5">
                <span className="text-[10px] font-mono font-bold uppercase text-[#997343] tracking-wider block">
                  🎒 Mochila de Mis Viajes ({completedCycles.length})
                </span>
                <div className="space-y-2">
                  {completedCycles.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border border-[#E3DDD5] rounded-2xl p-3 flex justify-between items-center text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-serif italic font-bold text-[#1C1817] block">
                          ✨ {record.name}
                        </span>
                        <span className="text-[9px] font-mono text-[#8A827A]">
                          Completado: {record.dateCompleted}
                        </span>
                      </div>
                      <span className="text-base">🏆</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: TESOROS */}
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
                  Gira una carta y presiona <strong>&quot;💎 Guardar a Tesoros&quot;</strong> para conservarla aquí.
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

        {/* PESTAÑA: AHORA */}
        {activeTab === 'thermometer' && (
          <div className="w-full flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[75vh] animate-fadeIn">
            {/* estilos locales del espejo — sólo viven dentro de esta pestaña */}
            <style>{`
              @keyframes mirrorTwinkle {
                0%, 100% { opacity: .22; transform: scale(.65); }
                50% { opacity: 1; transform: scale(1.15); }
              }
              .mirror-star { animation: mirrorTwinkle 2.6s ease-in-out infinite; }
              @keyframes mirrorSheen {
                0% { transform: translateX(-130%) rotate(18deg); }
                100% { transform: translateX(230%) rotate(18deg); }
              }
              .mirror-sheen { animation: mirrorSheen 5.5s ease-in-out infinite; }
            `}</style>

            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-serif italic text-[#1C1817] font-bold">
                AQUÍ Y AHORA...
              </h2>
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                EN VIVO
              </span>
            </div>

            {/* HERO: EL ESPEJO */}
            <div className="relative w-full flex flex-col items-center pt-1 pb-2">
              <div
                className="relative w-52 h-52 rounded-full overflow-hidden shadow-2xl"
                style={{
                  border: '6px solid #E8E2D8',
                  background:
                    'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.97) 0%, rgba(226,222,214,0.55) 26%, rgba(28,24,23,0.94) 76%)',
                  boxShadow: '0 12px 30px rgba(28,24,23,0.25), inset 0 0 0 1px rgba(255,255,255,0.4)',
                }}
              >
                {/* brillo de cristal deslizante */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div
                    className="mirror-sheen absolute top-0 left-0 w-1/3 h-[150%] -translate-y-6"
                    style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)' }}
                  />
                </div>

                {/* estrellas — las otras personas reflejadas contigo */}
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '14%', left: '22%', width: 4, height: 4, animationDelay: '0s', boxShadow: '0 0 5px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '24%', left: '72%', width: 3, height: 3, animationDelay: '.4s', boxShadow: '0 0 5px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '68%', left: '18%', width: 3, height: 3, animationDelay: '.9s', boxShadow: '0 0 5px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '78%', left: '64%', width: 4, height: 4, animationDelay: '1.3s', boxShadow: '0 0 5px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '46%', left: '84%', width: 3, height: 3, animationDelay: '1.7s', boxShadow: '0 0 5px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '10%', left: '54%', width: 2, height: 2, animationDelay: '2.1s', boxShadow: '0 0 4px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '58%', left: '8%', width: 2, height: 2, animationDelay: '.7s', boxShadow: '0 0 4px rgba(255,255,255,0.9)' }} />
                <span className="mirror-star absolute rounded-full bg-white" style={{ top: '86%', left: '38%', width: 2, height: 2, animationDelay: '1.5s', boxShadow: '0 0 4px rgba(255,255,255,0.9)' }} />

                {/* texto central — la persona que se refleja eres tú */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-7">
                  <span className="text-2xl mb-1 drop-shadow">🪞</span>
                  <p className="text-[11px] font-serif italic text-white/95 leading-snug drop-shadow">
                    El mayor tesoro
                  </p>
                  <p className="text-sm font-serif italic font-bold text-white leading-snug drop-shadow">
                    eres tú.
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-serif italic text-[#8A827A] text-center mt-3 max-w-[290px] leading-relaxed">
                Estamos hechos de estrellas.  
                <p>
                Ahora mismo, en algún lugar del mundo, alguien más: respira, se sostiene y busca calma, igual que tú.
              </p>
               <p>
              Mira: no estás solo/a.
              </p>
              </p>
            </div>

            {/* BANNER DINÁMICO — LO QUE DEVUELVE EL ESPEJO DE LA COMUNIDAD */}
            <div
              className="w-full rounded-2xl p-4 border shadow-sm transition-all animate-fadeIn"
              style={{
                backgroundColor: `${mostNeeded.color}30`,
                borderColor: mostNeeded.color,
              }}
            >
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#997343] block">
                🔥 LO QUE REFLEJA EL ESPEJO AHORA MISMO
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-serif font-bold text-[#1C1817]">
                  {mostNeeded.label}
                </span>
                <span className="text-xs font-mono font-bold text-[#1C1817] bg-white/80 px-2.5 py-1 rounded-full border border-black/5">
                  {mostNeeded.percentage}% de selecciones
                </span>
              </div>
              <p className="text-[11px] text-[#332E2B] leading-snug mt-1.5 italic font-serif">
                &ldquo;La comunidad está buscando mayoritariamente {CATEGORY_ACTIONS[mostNeeded.label] || 'hacer una pausa'} hoy.&rdquo;
              </p>
            </div>

            <p className="text-xs font-serif italic text-[#1C1817] font-semibold leading-tight text-center">
              En este preciso segundo, hay miles de personas que necesitan detenerse un momento.
            </p>   
            <p className="text-xs font-serif italic text-[#1C1817] font-semibold leading-tight text-center">
              Aquí y AHORA, practicamos una pausa compartida.
            </p>   

             {/* SECCIÓN 1: DISTRIBUCIÓN Y TERMÓMETRO */}
            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-3.5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-[#E3DDD5]/50 pb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#997343]">
                  ✦ DISTRIBUCIÓN EN TIEMPO REAL
                </span>
                <span className="text-[10px] font-mono font-bold text-[#1C1817]">
                  {mostNeeded.total} pausas registradas
                </span>
              </div>

              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => {
                  const count = dailyStats[cat.key] || 0;
                  const pct = mostNeeded.total > 0 ? Math.round((count / mostNeeded.total) * 100) : 0;
                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#1C1817]">
                        <span>{cat.label}</span>
                        <span className="font-mono text-[10px] text-[#8A827A]">{pct}% ({count})</span>
                      </div>
                      <div className="w-full bg-[#FAF8F5] h-2.5 rounded-full overflow-hidden border border-black/5 p-0.5">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{ backgroundColor: cat.color, width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>     
            
            {/* SECCIÓN 2: LA CIENCIA DE SENTIRNOS AHORA */}
            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-5 space-y-3 shadow-sm text-left">
              <div className="flex items-center gap-2 text-xl border-b border-[#E3DDD5]/50 pb-2">
                <span>🧠</span>
                <h3 className="text-sm font-serif font-bold text-[#1C1817]">
                  La ciencia que hay detrás ...
                </h3>
              </div>
              <p className="text-xs text-[#332E2B] leading-relaxed">
                Tu sistema nervioso está diseñado para autorregularse mediante la co-regulación. En este momento y lugar, descubrirás que tu cansancio o tu ansiedad son el reflejo de muchos otros. Tu cerebro percibirá en tiempo real que no estás solo/a en la necesidad de parar y la sensación de amenaza disminuirá. En este segundo, el cortisol baja y recuperas el tesoro más grande: tu propia calma.
              </p>
            </div>

            {/* SECCIÓN 3: A TI */}
            <div className="w-full bg-amber-50/60 border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm text-center">
              <span className="text-xs font-mono font-bold text-[#997343] uppercase tracking-widest block">
                ✦ A ti ✦
              </span>
              <p className="text-xs text-[#332E2B] leading-relaxed">
                Cada carta, cada respiración y cada pequeño ejercicio está inspirado en herramientas respaldadas por la psicología y la ciencia del bienestar, pero su verdadero propósito no es cambiar quién eres.
              </p>
              <p className="text-xs font-serif italic text-[#1C1817] font-medium leading-relaxed">
                Es ayudarte a recordar el valor que ya habita en ti.
              </p>
              <p className="text-xs text-[#332E2B] leading-relaxed">
                Y, cuando miras el reflejo de toda una comunidad, quizá descubras algo importante:
              </p>
              <blockquote className="text-xs font-serif italic font-bold text-[#997343] pt-1">
                “No eres la única persona intentando volver a encontrarse.”
              </blockquote>
            </div>

            {/* SECCIÓN 4: AHORA! EN EL PLANETA */}
            <div className="w-full bg-white border border-[#E3DDD5] rounded-3xl p-5 space-y-2 shadow-sm text-left">
              <div className="flex items-center gap-2 text-xl border-b border-[#E3DDD5]/50 pb-2">
                <span>🌍</span>
                <h3 className="text-sm font-serif font-bold text-[#1C1817]">
                  AHORA! en el planeta
                </h3>
              </div>
              <p className="text-xs text-[#332E2B] leading-relaxed pt-1">
                El respiro no tiene fronteras. Próximamente podrás ver desde qué países y ciudades se están sumando a esta misma pausa contigo.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA: TU VOZ (MISIÓN & COMUNIDAD) */}
        {activeTab === 'voice' && (
          <div className="w-full flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[75vh] animate-fadeIn text-left">
            
            {/* CARD 1: TU VOZ + ACCIONES */}
            <div className="bg-gradient-to-b from-amber-50/80 via-white to-white border border-[#E3DDD5] rounded-3xl p-5 space-y-3.5 shadow-xs relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-[#E3DDD5]/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💌</span>
                  <span className="text-[10px] font-mono font-bold text-[#997343] uppercase tracking-wider">
                    ✦ TU VOZ ✦
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-[#1C1817] text-white px-2 py-0.5 rounded-full">
                  Comunidad
                </span>
              </div>

              <div>
                <h2 className="text-xl font-serif font-bold text-[#1C1817]">
                  Tu voz también es un tesoro.
                </h2>
                <p className="text-xs font-serif italic text-[#8A827A] mt-0.5">
                  Comparte lo que esta experiencia despierta en ti.
                </p>
              </div>

              <p className="text-xs text-[#332E2B] leading-relaxed">
                Lo que vives aquí puede acompañar a alguien más. Comparte tu experiencia, deja unas palabras de aliento o descubre las voces de esta comunidad.
              </p>

              {/* BOTONERA DE ACCIÓN SOCIAL — SE MANTIENE EL FLUJO EXISTENTE */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setFeedbackSource('voice');
                    setShowFeedbackModal(true);
                  }}
                  className="py-2.5 px-3 rounded-2xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>💬</span>
                  <span>Déjanos tu Voz</span>
                </button>

                <button
                  onClick={() => setShowMissionModal(true)}
                  className="py-2.5 px-3 rounded-2xl bg-amber-100/80 border border-amber-300 text-[#997343] text-xs font-serif italic font-bold hover:bg-amber-200/80 transition-all flex items-center justify-center gap-1.5 text-center shadow-2xs"
                >
                  <span>❤️‍🩹</span>
                  <span>Apoyar GoFundMe</span>
                </button>
              </div>
            </div>

            {/* CARD 2: PUBLICAR TU PROPIA VOZ */}
            <div className="bg-white border border-[#E3DDD5] rounded-3xl p-3.5 space-y-3 shadow-xs">
              <div className="flex justify-between items-center border-b border-[#E3DDD5]/50 pb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#997343] flex items-center gap-1">
                  <span>✍️</span> COMPARTE TU REFLEXIÓN CON LA COMUNIDAD
                </span>
              </div>

              <div className="space-y-2">
                <textarea
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="Escribe cómo te ha ayudado esta app o envía un mensaje de aliento a alguien que lo necesite..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-2xl bg-[#FAF8F5] border border-[#E3DDD5] text-[#1C1817] placeholder-[#B5AEA7] focus:outline-none focus:border-[#997343] resize-none"
                />

                {voiceSubmitted ? (
                  <div className="p-2.5 bg-amber-50 text-[#997343] text-xs font-semibold text-center rounded-xl border border-amber-200 animate-fadeIn">
                    ✨ ¡Tu mensaje ha sido publicado en la comunidad!
                  </div>
                ) : (
                  <button
                    onClick={handleVoiceSubmit}
                    disabled={!voiceInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#1C1817] text-white text-xs font-semibold hover:bg-[#332E2B] disabled:opacity-40 transition-all shadow-xs"
                  >
                    Publicar mi Mensaje
                  </button>
                )}
              </div>
            </div>

            {/* CARD 3: MURO DE LA COMUNIDAD */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8A827A] px-1 block">
                ✦ VOCES DE LA COMUNIDAD ({communityVoices.length})
              </span>

              {communityVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="bg-white border border-[#E3DDD5] rounded-2xl p-4 space-y-2 shadow-2xs text-left"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-[#997343] flex items-center justify-center text-[10px] font-bold font-mono">
                        {voice.author[0]}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-[#1C1817] block leading-none">
                          {voice.author}
                        </span>
                        <span className="text-[9px] text-[#8A827A]">
                          {voice.location}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-[#8A827A]">
                      {voice.date}
                    </span>
                  </div>

                  <p className="text-xs text-[#332E2B] font-serif italic leading-relaxed">
                    &ldquo;{voice.text}&rdquo;
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-[#E3DDD5]/40 text-[10px]">
                    <span className="text-[#997343] font-semibold">
                      {voice.feeling}
                    </span>
                    <span className="font-mono text-[#8A827A] uppercase bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E3DDD5]/50">
                      {voice.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAVEGACIÓN INFERIOR DE 5 PESTAÑAS */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E3DDD5] py-2 px-2 flex justify-around items-center z-40">
          <button
            onClick={() => {
              setCurrentCard(null);
              setActiveTab('draw');
            }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'draw' ? 'text-[#997343] font-bold' : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            <span className="text-lg">💎</span>
            <span>Hoy</span>
          </button>

          <button
            onClick={() => setActiveTab('journey')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'journey' ? 'text-[#997343] font-bold' : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            <span className="text-lg">🎒</span>
            <span>El Viaje</span>
          </button>

          <button
            onClick={() => setActiveTab('diary')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors relative ${
              activeTab === 'diary' ? 'text-[#997343] font-bold' : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            <span className={`text-lg transition-transform ${isDiarySparkling ? 'scale-150 animate-bounce' : ''}`}>
              💰
            </span>
            <span>Tesoros</span>
            {diary.length > 0 && (
              <span className="absolute -top-1 right-2 w-2 h-2 bg-[#997343] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'voice' ? 'text-[#997343] font-bold' : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            <span className="text-lg">💌</span>
            <span>Tu Voz</span>
          </button>

          <button
            onClick={() => setActiveTab('thermometer')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              activeTab === 'thermometer' ? 'text-[#997343] font-bold' : 'text-[#8A827A] hover:text-[#1C1817]'
            }`}
          >
            <span className="text-lg">🪞</span>
            <span>Ahora</span>
          </button>
        </nav>
      </main>
    </>
  );
}