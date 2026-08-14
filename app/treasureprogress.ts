export interface TreasureProgressMessage {
  day: number;
  title: string;
  message: string;
}

export const treasureProgressMessages: TreasureProgressMessage[] = [
  {
    day: 1,
    title: "El comienzo",
    message: "✨ Todo gran tesoro comienza con una decisión: la de empezar. Hoy ya diste el primer paso."
  },
  {
    day: 2,
    title: "Intención",
    message: "🌱 Lo que atiendes, crece. Hoy elegiste dedicarte un poquito de atención. Sigue así."
  },
  {
    day: 3,
    title: "Constancia",
    message: "💫 No necesitas hacerlo perfecto. Solo necesitas seguir apareciendo. Y aquí estás."
  },
  {
    day: 4,
    title: "Descubrimiento",
    message: "🔎 Cada día que te conoces un poco más, encuentras una parte de ti que estaba esperando ser descubierta."
  },
  {
    day: 5,
    title: "Progreso",
    message: "🌿 Tal vez todavía no veas cuánto has avanzado… pero cada pequeño paso cuenta."
  },
  {
    day: 6,
    title: "Confianza",
    message: "✨ Confía en el proceso. Algunas transformaciones empiezan mucho antes de que podamos verlas."
  },
  {
    day: 7,
    title: "Primera semana",
    message: "🎉 ¡Una semana! Ya tienes algo que ayer no tenías: la prueba de que puedes ser constante contigo."
  },
  {
    day: 8,
    title: "Semilla",
    message: "🌱 Lo que estás sembrando hoy puede convertirse en algo enorme mañana. Sigue regando esa semilla."
  },
  {
    day: 9,
    title: "Curiosidad",
    message: "🔮 Hazte preguntas. Explora. Sorpréndete. Conocerte también puede ser una aventura."
  },
  {
    day: 10,
    title: "10%",
    message: "💎 ¡10 días! No estás acumulando días: estás acumulando descubrimientos sobre ti."
  },
  {
    day: 11,
    title: "Mirarte",
    message: "🪞 Mirarte con honestidad no es juzgarte. Es darte la oportunidad de comprenderte."
  },
  {
    day: 12,
    title: "Pequeños cambios",
    message: "✨ Los grandes cambios rara vez llegan de golpe. Muchas veces empiezan con una pequeña decisión repetida."
  },
  {
    day: 13,
    title: "Elección",
    message: "🌟 Hoy tienes una nueva oportunidad de elegir qué quieres alimentar dentro de ti."
  },
  {
    day: 14,
    title: "Dos semanas",
    message: "🎉 ¡14 días! Dos semanas eligiéndote. Eso también es progreso."
  },
  {
    day: 15,
    title: "Mitad del camino",
    message: "💎 ¡Llegaste a la mitad! Ya no estás simplemente empezando: estás construyendo un hábito de encontrarte contigo."
  },
  {
    day: 16,
    title: "Evolución",
    message: "🌱 No tienes que ser quien eras ayer. Tienes permiso para crecer, cambiar y sorprenderte."
  },
  {
    day: 17,
    title: "Tu ritmo",
    message: "🦋 No compares tu proceso con el de nadie. Tu tesoro se descubre a tu propio ritmo."
  },
  {
    day: 18,
    title: "Intuición",
    message: "✨ A veces ya sabes la respuesta. Solo necesitas hacer suficiente silencio para escucharla."
  },
  {
    day: 19,
    title: "Valentía",
    message: "🔥 Conocerte también requiere valentía: la valentía de mirar dentro y seguir amándote."
  },
  {
    day: 20,
    title: "20 días",
    message: "💎 ¡20 días! Ya estás demostrando que un pequeño gesto diario puede convertirse en una gran transformación."
  },
  {
    day: 21,
    title: "Integración",
    message: "🌿 Tres semanas. Lo que empezó como una curiosidad comienza a convertirse en parte de ti."
  },
  {
    day: 22,
    title: "Tu historia",
    message: "📖 No puedes cambiar todas las páginas que ya escribiste, pero sí puedes decidir qué escribir en las siguientes."
  },
  {
    day: 23,
    title: "Potencial",
    message: "✨ Hay partes de ti que todavía no conoces. Sigue explorando. Puede que tu próximo descubrimiento te sorprenda."
  },
  {
    day: 24,
    title: "Reencuentro",
    message: "🪞 Quizás el verdadero tesoro no sea convertirte en alguien diferente, sino volver a encontrarte con quien ya eres."
  },
  {
    day: 25,
    title: "Casi",
    message: "💎 ¡25 días! Mira todo lo que has recorrido. El primer diamante ya empieza a brillar."
  },
  {
    day: 26,
    title: "Persistencia",
    message: "🌟 Seguir cuando la emoción inicial desaparece también es parte del proceso. Y tú sigues aquí."
  },
  {
    day: 27,
    title: "Transformación",
    message: "🦋 No siempre notarás cuándo estás cambiando. A veces un día simplemente miras atrás y descubres que ya no eres la misma persona."
  },
  {
    day: 28,
    title: "Cuatro semanas",
    message: "🎉 ¡28 días! Cuatro semanas explorándote, preguntándote y descubriéndote. Esto ya es mucho más que un juego."
  },
  {
    day: 29,
    title: "Penúltimo paso",
    message: "✨ Estás a solo dos días de conseguir tu primer diamante. Pero recuerda: el verdadero tesoro ha sido todo lo que descubriste en el camino."
  },
  {
    day: 30,
    title: "Último paso",
    message: "💎 ¡Mañana es el gran día! Has llegado hasta aquí. Guarda este momento: estás a punto de pulir tu primer diamante."
  },
  {
    day: 31,
    title: "PRIMER DIAMANTE",
    message: "💎✨ ¡FELICIDADES! Has obtenido tu primer diamante 100% pulido.\n31 días. 31 pequeños pasos.\nY detrás de cada uno hay algo mucho más valioso: tú, conociéndote un poquito más.\nEste es solo tu primer tesoro.\n¿Lista/o para descubrir el siguiente? ✨"
  }
];

export interface PhaseInfo {
  phase: number;
  name: string;
  icon: string;
  description: string;
}

export function getPhaseInfo(day: number): PhaseInfo {
  if (day <= 7) {
    return {
      phase: 1,
      name: "Siembra e Inicio",
      icon: "🌱",
      description: "Dando los primeros pasos de tu camino."
    };
  } else if (day <= 15) {
    return {
      phase: 2,
      name: "Crecimiento y Claridad",
      icon: "🌿",
      description: "Tus descubrimientos comienzan a tomar forma."
    };
  } else if (day <= 24) {
    return {
      phase: 3,
      name: "Profundización",
      icon: "✨",
      description: "Conectando más profundo con tu proceso interior."
    };
  } else {
    return {
      phase: 4,
      name: "Integración y Diamante",
      icon: "💎",
      description: "A punto de pulir tu primer gran tesoro."
    };
  }
}