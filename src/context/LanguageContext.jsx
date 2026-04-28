import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./language-context";

const STORAGE_KEY = "visit-santa-rosa-language";
const BASE_URL = import.meta.env.BASE_URL || "/";

const AVAILABLE_LANGUAGES = [
  {
    code: "es",
    label: "Español",
    flagIcon: `${BASE_URL}flags/es.svg`,
    locale: "es-EC",
  },
  {
    code: "en",
    label: "English",
    flagIcon: `${BASE_URL}flags/us.svg`,
    locale: "en-US",
  },
  {
    code: "pt",
    label: "Português",
    flagIcon: `${BASE_URL}flags/br.svg`,
    locale: "pt-BR",
  },
];

const translations = {
  es: {
    meta: {
      browserTitle: "Turismo Santa Rosa",
    },
    header: {
      nav: {
        home: "Inicio",
        destinations: "Destinos",
        gastronomy: "Gastronom\u00eda",
        lodging: "Hospedaje",
        transport: "Transporte",
        floraFauna: "Flora y Fauna",
        touristInfo: "Info Turística",
        activities: "Actividades",
        events: "Eventos",
        gallery: "Galería",
        blog: "Blog",
      },
      socialLabel: "Redes sociales",
      logoAlt: "Escudo del GAD Municipal de Santa Rosa",
      logoTitle: "Santa Rosa",
      logoSubtitle: "El Oro · Ecuador",
      admin: "Administrador",
      logout: "Salir",
      menu: "Menú",
      languageSwitcherAria: "Cambiar idioma",
    },
    home: {
      stats: {
        islands: "Islas del Archipiélago",
        population: "Habitantes del cantón",
        temperature: "Temperatura máxima",
        yearlyEvents: "Eventos al año",
        foundation: "Año de fundación",
      },
    },
    hero: {
      howToGetButton: "¿Cómo Llegar?",
      prevSlide: "Slide anterior",
      nextSlide: "Siguiente slide",
      goToSlide: "Ir al slide",
    },
    heroSlides: {
      "hero-1": {
        tag: "Archipiélago de Jambelí",
        title: "Paraíso Natural del Pacífico",
        sub: "Playas vírgenes, manglares y fauna única te esperan en el sur del Ecuador.",
        cta: "Explorar Destinos",
      },
      "hero-2": {
        tag: "Gastronomía del Mar",
        title: "Sabores que no Olvidarás",
        sub: "Puerto Jelí y sus mariscos frescos, cebiches y la auténtica parihuela orense.",
        cta: "Ver Blog",
      },
      "hero-3": {
        tag: "Agosto - Octubre",
        title: "Avistamiento de Ballenas",
        sub: "Isla Santa Clara: el santuario marino donde la naturaleza deslumbra cada año.",
        cta: "Ver Eventos",
      },
    },
    comoLlegar: {
      titleStart: "¿Cómo",
      titleAccent: "Llegar",
      subtitle:
        "Santa Rosa, La Benemérita, te espera. Aquí todas las rutas para llegar.",
      terrestrial: {
        title: "Conectividad Terrestre",
        description:
          "Acceso desde las principales ciudades del Ecuador con múltiples frecuencias diarias.",
        item1: "Desde Guayaquil: 3h por la vía Pasaje-Machala-Santa Rosa",
        item2: "Desde Cuenca: 4h por la ruta Loja-Machala",
        item3: "Desde Loja: 3.5h por la carretera panamericana",
        item4: "Terminal Terrestre en el centro de la ciudad",
        item5: "Operadoras: Rutas Orenses, TACsa, Panamericana",
      },
      maritime: {
        title: "Conectividad Marítima",
        description:
          "Acceso al Archipiélago de Jambelí desde los puertos más cercanos a Santa Rosa.",
        item1: "Puerto Hualtaco -> Isla Jambelí: 30 min en lancha",
        item2: "Puerto Bolívar -> Islas del archipiélago: 45-60 min",
        item3: "Salidas regulares desde las 7h00 hasta las 17h00",
        item4: "Tarifas accesibles: desde $2 por trayecto",
        item5: "Verificar condiciones climáticas antes de viajar",
      },
      air: {
        title: "Vía Aérea",
        description:
          "El aeropuerto más cercano es el de Machala, a solo 20 minutos de Santa Rosa.",
        item1: "Aeropuerto Santa Rosa (IATA: ETR) - vuelos regionales",
        item2: "Aeropuerto Machala: vuelos desde Quito y Guayaquil",
        item3: "LATAM y AeroPaul operan rutas nacionales",
        item4: "Taxis y buses locales desde el aeropuerto",
      },
    },
    queHacer: {
      titleStart: "¿Qué",
      titleAccent: "Hacer",
      titleEnd: "en Santa Rosa?",
      subtitle:
        "Desde playas paradisíacas hasta cultura y gastronomía única, Santa Rosa lo tiene todo.",
      activities: {
        beach: { name: "Playas & Islas", desc: "Jambelí, San Gregorio" },
        nature: { name: "Naturaleza", desc: "Isla Santa Clara" },
        gastronomy: { name: "Gastronomía", desc: "Puerto Jelí" },
        fishing: { name: "Pesca", desc: "Mar abierto" },
        ecotourism: { name: "Ecoturismo", desc: "La Tembladera" },
        culture: { name: "Cultura", desc: "Fiestas & Tradición" },
        mangrove: { name: "Manglares", desc: "Tours de kayak" },
        photo: { name: "Fotografía", desc: "Paisajes únicos" },
      },
    },
    destinosSection: {
      titleStart: "Destinos",
      titleAccent: "Destacados",
      subtitle: "Descubre los lugares más increíbles del cantón Santa Rosa.",
      cta: "Ver Todos los Destinos",
    },
    eventosSection: {
      titleStart: "Agenda",
      titleAccent: "de Eventos",
      subtitle:
        "Los próximos eventos del cantón, actualizados desde el panel de administración.",
      emptyState:
        "Todavía no hay eventos publicados. Ingresa al admin para crear el primero.",
      defaultType: "Evento",
      dateToConfirm: "Fecha por confirmar",
      cta: "Ver Página Informativa de Eventos",
    },
    generalidades: {
      titleStart: "Generalidades del",
      titleAccent: "Destino",
      subtitle:
        "Todo lo que necesitas saber sobre Santa Rosa, La Benemérita de El Oro.",
      altitude: "Altitud",
      population: "Población",
      province: "Provincia",
      currency: "Moneda",
      temperature: "Temperatura",
      timeZone: "Zona Horaria",
      language: "Idioma",
      languageValue: "Español",
      country: "País",
      countryValue: "Ecuador",
    },
    galeriaSection: {
      titleStart: "Galería",
      titleAccent: "Visual",
      subtitle: "Descubre la belleza de Santa Rosa a través de sus imágenes.",
      photos: "Fotos",
      videos: "Videos",
      emptyVideos: "Próximamente videos de Santa Rosa",
    },
    blogSection: {
      titleStart: "Blog &",
      titleAccent: "Noticias",
      subtitle: "Artículos, guías y noticias turísticas de Santa Rosa.",
      readMore: "Leer más",
      viewAll: "Ver Todos los Artículos",
    },
    footer: {
      brandDescription:
        "Santa Rosa, La Benemérita, es un paraíso costero en la provincia de El Oro. Archipiélagos, gastronomía del mar y cultura única te esperan.",
      discoverTitle: "Descubre",
      links: {
        destinations: "Destinos",
        events: "Eventos 2026",
        touristInfo: "Información Turística",
        activities: "Actividades",
        gallery: "Galería",
        blog: "Blog Turístico",
        howToGet: "Cómo Llegar",
        whatToDo: "Qué Hacer",
      },
      contactTitle: "Contacto",
      contact: {
        location: "Santa Rosa, El Oro, Ecuador",
        phone: "+593 7 294-xxxx",
        email: "info@visitsantarosa.ec",
        schedule: "Lun-Vie: 8h00-17h00",
      },
      writeUsTitle: "Escríbenos",
      messageSent: "¡Mensaje enviado! Te responderemos pronto.",
      form: {
        namePlaceholder: "Tu nombre",
        emailPlaceholder: "Tu correo electrónico",
        messagePlaceholder: "Tu mensaje...",
      },
      sendMessage: "Enviar Mensaje",
      bottomCopyright:
        "© 2026 Santa Rosa - Municipio de Santa Rosa, El Oro, Ecuador",
      madeWith: "Hecho con",
      byTourismOffice: "por la Dirección de Turismo",
    },
    login: {
      title: "Panel de Administración",
      subtitle: "Santa Rosa — El Oro, Ecuador",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      loading: "Ingresando...",
      enterButton: "Ingresar al Panel",
      hint: "Acceso con cuentas de Firebase. Si el proyecto aún no tiene usuarios creados, el sistema puede usar cuentas demo de respaldo.",
      invalidCredentials: "Credenciales incorrectas",
    },
    pages: {
      destinations: "Destinos de Santa Rosa",
      touristInfo: "Información Turística Integral",
      activities: "Actividades Turísticas Editoriales",
      events: "Agenda Informativa de Eventos",
      gallery: "Galería Visual",
      blog: "Blog & Noticias",
    },
    eventsPage: {
      planningTitle: "Planifica tu visita a Santa Rosa",
      planningDescription:
        "Revisa la agenda oficial actualizada desde el panel administrativo. Aquí verás los eventos activos, su ubicación y datos de contacto para participar.",
      publishedEvents: "Eventos publicados",
      withConfirmedTime: "Con hora confirmada",
      registeredPlaces: "Lugares registrados",
      emptyState:
        "No hay eventos activos por el momento. Regresa pronto para revisar la nueva programación.",
      defaultType: "Evento",
      dateToConfirm: "Fecha por confirmar",
      placeToConfirm: "Lugar por confirmar",
      timeToConfirm: "Hora por confirmar",
      organizerLabel: "Organiza",
      contactLabel: "Contacto",
      noteTitle: "Información útil para asistir",
      noteItem1: "Confirma fecha y hora antes de viajar.",
      noteItem2: "Llega con anticipación en eventos masivos.",
      noteItem3: "Consulta al organizador para reservas o registros previos.",
    },
  },
  en: {
    meta: {
      browserTitle: "Santa Rosa Tourism",
    },
    header: {
      nav: {
        home: "Home",
        destinations: "Destinations",
        gastronomy: "Gastronomy",
        lodging: "Lodging",
        transport: "Transport",
        floraFauna: "Flora & Fauna",
        touristInfo: "Tourist Info",
        activities: "Activities",
        events: "Events",
        gallery: "Gallery",
        blog: "Blog",
      },
      socialLabel: "Social media",
      logoAlt: "Santa Rosa Municipal Crest",
      logoTitle: "Santa Rosa",
      logoSubtitle: "El Oro · Ecuador",
      admin: "Admin",
      logout: "Log out",
      menu: "Menu",
      languageSwitcherAria: "Change language",
    },
    home: {
      stats: {
        islands: "Archipelago Islands",
        population: "Canton population",
        temperature: "Maximum temperature",
        yearlyEvents: "Events per year",
        foundation: "Foundation year",
      },
    },
    hero: {
      howToGetButton: "How to get there?",
      prevSlide: "Previous slide",
      nextSlide: "Next slide",
      goToSlide: "Go to slide",
    },
    heroSlides: {
      "hero-1": {
        tag: "Jambeli Archipelago",
        title: "Pacific Natural Paradise",
        sub: "Virgin beaches, mangroves, and unique wildlife await you in southern Ecuador.",
        cta: "Explore Destinations",
      },
      "hero-2": {
        tag: "Seafood Cuisine",
        title: "Flavors You Will Never Forget",
        sub: "Puerto Jeli and its fresh seafood, ceviches, and authentic coastal soup await you.",
        cta: "View Blog",
      },
      "hero-3": {
        tag: "August - October",
        title: "Whale Watching",
        sub: "Santa Clara Island: a marine sanctuary where nature amazes visitors every year.",
        cta: "View Events",
      },
    },
    comoLlegar: {
      titleStart: "How to",
      titleAccent: "Get There",
      subtitle:
        "Santa Rosa, La Benemérita, is waiting for you. Here are all the routes to arrive.",
      terrestrial: {
        title: "Road Connectivity",
        description:
          "Access from Ecuador's main cities with multiple daily frequencies.",
        item1: "From Guayaquil: 3h via Pasaje-Machala-Santa Rosa",
        item2: "From Cuenca: 4h via Loja-Machala route",
        item3: "From Loja: 3.5h via Pan-American highway",
        item4: "Main bus terminal in downtown",
        item5: "Operators: Rutas Orenses, TACsa, Panamericana",
      },
      maritime: {
        title: "Maritime Connectivity",
        description:
          "Access to Jambeli Archipelago from the nearest ports to Santa Rosa.",
        item1: "Hualtaco Port -> Jambeli Island: 30 min by boat",
        item2: "Bolivar Port -> Archipelago islands: 45-60 min",
        item3: "Regular departures from 7:00 to 17:00",
        item4: "Affordable fares: from $2 per trip",
        item5: "Check weather conditions before traveling",
      },
      air: {
        title: "By Air",
        description:
          "The nearest airport is Machala, only 20 minutes from Santa Rosa.",
        item1: "Santa Rosa Airport (IATA: ETR) - regional flights",
        item2: "Machala Airport: flights from Quito and Guayaquil",
        item3: "LATAM and AeroPaul operate domestic routes",
        item4: "Local taxis and buses available from the airport",
      },
    },
    queHacer: {
      titleStart: "What to",
      titleAccent: "Do",
      titleEnd: "in Santa Rosa?",
      subtitle:
        "From paradise beaches to culture and unique gastronomy, Santa Rosa has it all.",
      activities: {
        beach: { name: "Beaches & Islands", desc: "Jambeli, San Gregorio" },
        nature: { name: "Nature", desc: "Santa Clara Island" },
        gastronomy: { name: "Gastronomy", desc: "Puerto Jeli" },
        fishing: { name: "Fishing", desc: "Open sea" },
        ecotourism: { name: "Ecotourism", desc: "La Tembladera" },
        culture: { name: "Culture", desc: "Festivities & Tradition" },
        mangrove: { name: "Mangroves", desc: "Kayak tours" },
        photo: { name: "Photography", desc: "Unique landscapes" },
      },
    },
    destinosSection: {
      titleStart: "Featured",
      titleAccent: "Destinations",
      subtitle: "Discover the most amazing places in Santa Rosa canton.",
      cta: "View All Destinations",
    },
    eventosSection: {
      titleStart: "Events",
      titleAccent: "Agenda",
      subtitle:
        "Upcoming canton events, updated directly from the admin panel.",
      emptyState:
        "No events have been published yet. Enter admin to create the first one.",
      defaultType: "Event",
      dateToConfirm: "Date to be confirmed",
      cta: "View Events Information Page",
    },
    generalidades: {
      titleStart: "Destination",
      titleAccent: "Overview",
      subtitle:
        "Everything you need to know about Santa Rosa, La Benemérita of El Oro.",
      altitude: "Altitude",
      population: "Population",
      province: "Province",
      currency: "Currency",
      temperature: "Temperature",
      timeZone: "Time zone",
      language: "Language",
      languageValue: "Spanish",
      country: "Country",
      countryValue: "Ecuador",
    },
    galeriaSection: {
      titleStart: "Visual",
      titleAccent: "Gallery",
      subtitle: "Discover Santa Rosa's beauty through images.",
      photos: "Photos",
      videos: "Videos",
      emptyVideos: "Santa Rosa videos coming soon",
    },
    blogSection: {
      titleStart: "Blog &",
      titleAccent: "News",
      subtitle: "Articles, guides, and tourism news from Santa Rosa.",
      readMore: "Read more",
      viewAll: "View All Articles",
    },
    footer: {
      brandDescription:
        "Santa Rosa, La Benemérita, is a coastal paradise in El Oro province. Archipelagos, seafood cuisine, and unique culture await you.",
      discoverTitle: "Discover",
      links: {
        destinations: "Destinations",
        events: "Events 2026",
        touristInfo: "Tourist Information",
        activities: "Activities",
        gallery: "Gallery",
        blog: "Tourism Blog",
        howToGet: "How to Get There",
        whatToDo: "What to Do",
      },
      contactTitle: "Contact",
      contact: {
        location: "Santa Rosa, El Oro, Ecuador",
        phone: "+593 7 294-xxxx",
        email: "info@visitsantarosa.ec",
        schedule: "Mon-Fri: 8:00-17:00",
      },
      writeUsTitle: "Write to us",
      messageSent: "Message sent! We will reply soon.",
      form: {
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        messagePlaceholder: "Your message...",
      },
      sendMessage: "Send Message",
      bottomCopyright:
        "© 2026 Santa Rosa - Municipality of Santa Rosa, El Oro, Ecuador",
      madeWith: "Made with",
      byTourismOffice: "by the Tourism Department",
    },
    login: {
      title: "Administration Panel",
      subtitle: "Santa Rosa — El Oro, Ecuador",
      emailLabel: "Email",
      passwordLabel: "Password",
      loading: "Signing in...",
      enterButton: "Enter Panel",
      hint: "Access with Firebase accounts. If the project has not been seeded yet, the app can use fallback demo accounts.",
      invalidCredentials: "Incorrect credentials",
    },
    content: {
      destinations: {
        1: {
          name: "Jambeli Island",
          description:
            "The most visited beach in the archipelago. White-sand beaches, lodges, and seafood flavors by the shore.",
          category: "Beach",
        },
        2: {
          name: "Santa Clara Island",
          description:
            "Protected area with sea lions, blue-footed boobies, and humpback whale watching (August-October).",
          category: "Nature",
        },
        3: {
          name: "Puerto Jeli",
          description:
            "Famous for fresh seafood cuisine and an atmosphere linked to fishing culture and mangroves.",
          category: "Gastronomy",
        },
        4: {
          name: "La Tembladera Lagoon",
          description:
            "Natural wetland ideal for ecotourism, kayaking, and birdwatching in a biodiverse environment.",
          category: "Ecotourism",
        },
      },
      events: {
        1: {
          name: "Saint Rose of Lima Festivities",
          description:
            "Patron celebration with parades, music, and local culture. The most important event in the canton.",
          place: "Santa Rosa Central Park",
          type: "Cultural",
          organizer: "Santa Rosa Municipality",
        },
        2: {
          name: "Shrimp King Festival",
          description:
            "Tribute to the shrimp industry, a key pillar of Santa Rosa's economy. Gastronomy, music, and crafts.",
          place: "Santa Rosa Boardwalk",
          type: "Gastronomic",
          organizer: "Santa Rosa Entrepreneurs Association",
        },
        3: {
          name: "Whale Watching Tour",
          description:
            "Humpback whale season. Maritime excursions from Hualtaco Port to Santa Clara Island.",
          place: "Hualtaco Port",
          type: "Tourism",
          organizer: "Authorized tourism operators",
        },
        4: {
          name: "El Oro Culture Week",
          description:
            "Cultural exhibitions, folk dance, and artistic showcases from El Oro province.",
          place: "House of Culture, Santa Rosa",
          type: "Cultural",
          organizer: "House of Culture, El Oro Chapter",
        },
      },
      blog: {
        1: {
          title: "5 reasons to visit the Jambeli Archipelago",
          summary:
            "Virgin beaches, mangroves, and unique wildlife await you in this coastal paradise in southern Ecuador.",
          category: "Destinations",
          author: "Santa Rosa Tourism",
        },
        2: {
          title: "Santa Rosa gastronomy: Flavors from the sea",
          summary:
            "From traditional seafood soup to shellfish ceviches, discover why Santa Rosa is El Oro's food destination.",
          category: "Gastronomy",
          author: "Santa Rosa Tourism",
        },
        3: {
          title: "Santa Clara Island: Marine life sanctuary",
          summary:
            "Discover the protected area where sea lions, blue-footed boobies, and humpback whales coexist.",
          category: "Nature",
          author: "Santa Rosa Tourism",
        },
        4: {
          title: "Complete guide to get to Santa Rosa",
          summary:
            "From Guayaquil, Cuenca, or Loja: all the routes to reach La Benemerita of Ecuador.",
          category: "Travel",
          author: "Editorial Team",
        },
        5: {
          title: "La Tembladera Lagoon: A wetland to discover",
          summary:
            "Birdwatching, kayaking, and pure nature in this natural water laboratory of Santa Rosa.",
          category: "Ecotourism",
          author: "Santa Rosa Tourism",
        },
        6: {
          title: "Puerto Jeli: The seafood gastronomy corner",
          summary:
            "A tour of the best seafood restaurants and fishing culture in Puerto Jeli.",
          category: "Gastronomy",
          author: "Editorial Team",
        },
      },
      gallery: {
        1: { title: "Beaches of the Jambeli Archipelago" },
        2: { title: "Fresh seafood from Puerto Jeli" },
        3: { title: "La Tembladera Lagoon" },
        4: { title: "Marine wildlife of Santa Clara Island" },
        5: { title: "Transportation to the islands" },
        6: { title: "Whale watching" },
        7: { title: "Saint Rose of Lima Festival" },
        8: { title: "Traditional gastronomy" },
        9: { title: "Culture and traditions" },
      },
    },
    pages: {
      destinations: "Destinations in Santa Rosa",
      touristInfo: "Comprehensive Tourist Information",
      activities: "Editorial Tourism Activities",
      events: "Event Information Agenda",
      gallery: "Visual Gallery",
      blog: "Blog & News",
    },
    eventsPage: {
      planningTitle: "Plan your visit to Santa Rosa",
      planningDescription:
        "Check the official agenda updated from the admin panel. Here you can see active events, location details, and contact information to join.",
      publishedEvents: "Published events",
      withConfirmedTime: "With confirmed time",
      registeredPlaces: "Registered places",
      emptyState:
        "There are no active events right now. Come back soon to review the new schedule.",
      defaultType: "Event",
      dateToConfirm: "Date to be confirmed",
      placeToConfirm: "Place to be confirmed",
      timeToConfirm: "Time to be confirmed",
      organizerLabel: "Organizer",
      contactLabel: "Contact",
      noteTitle: "Useful information to attend",
      noteItem1: "Confirm date and time before traveling.",
      noteItem2: "Arrive early for high-attendance events.",
      noteItem3:
        "Contact the organizer for reservations or prior registration.",
    },
  },
  pt: {
    meta: {
      browserTitle: "Turismo Santa Rosa",
    },
    header: {
      nav: {
        home: "Início",
        destinations: "Destinos",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        transport: "Transporte",
        floraFauna: "Flora e Fauna",
        touristInfo: "Info Turística",
        activities: "Atividades",
        events: "Eventos",
        gallery: "Galeria",
        blog: "Blog",
      },
      socialLabel: "Redes sociais",
      logoAlt: "Escudo Municipal de Santa Rosa",
      logoTitle: "Santa Rosa",
      logoSubtitle: "El Oro · Equador",
      admin: "Admin",
      logout: "Sair",
      menu: "Menu",
      languageSwitcherAria: "Alterar idioma",
    },
    home: {
      stats: {
        islands: "Ilhas do Arquipélago",
        population: "Habitantes do cantão",
        temperature: "Temperatura máxima",
        yearlyEvents: "Eventos por ano",
        foundation: "Ano de fundação",
      },
    },
    hero: {
      howToGetButton: "Como chegar?",
      prevSlide: "Slide anterior",
      nextSlide: "Próximo slide",
      goToSlide: "Ir para o slide",
    },
    heroSlides: {
      "hero-1": {
        tag: "Arquipélago de Jambeli",
        title: "Paraíso Natural do Pacífico",
        sub: "Praias virgens, manguezais e fauna única esperam por você no sul do Equador.",
        cta: "Explorar Destinos",
      },
      "hero-2": {
        tag: "Gastronomia do Mar",
        title: "Sabores que Você Não Vai Esquecer",
        sub: "Puerto Jeli e seus frutos do mar frescos, ceviches e a autêntica sopa costeira.",
        cta: "Ver Blog",
      },
      "hero-3": {
        tag: "Agosto - Outubro",
        title: "Observação de Baleias",
        sub: "Ilha Santa Clara: o santuário marinho onde a natureza encanta a cada ano.",
        cta: "Ver Eventos",
      },
    },
    comoLlegar: {
      titleStart: "Como",
      titleAccent: "Chegar",
      subtitle:
        "Santa Rosa, La Benemérita, espera por você. Aqui estão todas as rotas para chegar.",
      terrestrial: {
        title: "Conectividade Terrestre",
        description:
          "Acesso das principais cidades do Equador com várias frequências diárias.",
        item1: "De Guayaquil: 3h pela via Pasaje-Machala-Santa Rosa",
        item2: "De Cuenca: 4h pela rota Loja-Machala",
        item3: "De Loja: 3,5h pela rodovia Panamericana",
        item4: "Terminal rodoviário no centro da cidade",
        item5: "Operadoras: Rutas Orenses, TACsa, Panamericana",
      },
      maritime: {
        title: "Conectividade Marítima",
        description:
          "Acesso ao Arquipélago de Jambeli pelos portos mais próximos de Santa Rosa.",
        item1: "Porto Hualtaco -> Ilha Jambeli: 30 min de lancha",
        item2: "Porto Bolivar -> Ilhas do arquipélago: 45-60 min",
        item3: "Saídas regulares das 7h00 às 17h00",
        item4: "Tarifas acessíveis: a partir de $2 por trecho",
        item5: "Verifique as condições climáticas antes de viajar",
      },
      air: {
        title: "Via Aérea",
        description:
          "O aeroporto mais próximo é o de Machala, a apenas 20 minutos de Santa Rosa.",
        item1: "Aeroporto Santa Rosa (IATA: ETR) - voos regionais",
        item2: "Aeroporto Machala: voos de Quito e Guayaquil",
        item3: "LATAM e AeroPaul operam rotas nacionais",
        item4: "Táxis e ônibus locais a partir do aeroporto",
      },
    },
    queHacer: {
      titleStart: "O que",
      titleAccent: "Fazer",
      titleEnd: "em Santa Rosa?",
      subtitle:
        "De praias paradisíacas à cultura e gastronomia única, Santa Rosa tem de tudo.",
      activities: {
        beach: { name: "Praias & Ilhas", desc: "Jambeli, San Gregorio" },
        nature: { name: "Natureza", desc: "Ilha Santa Clara" },
        gastronomy: { name: "Gastronomia", desc: "Puerto Jeli" },
        fishing: { name: "Pesca", desc: "Mar aberto" },
        ecotourism: { name: "Ecoturismo", desc: "La Tembladera" },
        culture: { name: "Cultura", desc: "Festas & Tradição" },
        mangrove: { name: "Manguezais", desc: "Passeios de caiaque" },
        photo: { name: "Fotografia", desc: "Paisagens únicas" },
      },
    },
    destinosSection: {
      titleStart: "Destinos",
      titleAccent: "em Destaque",
      subtitle: "Descubra os lugares mais incríveis do cantão Santa Rosa.",
      cta: "Ver Todos os Destinos",
    },
    eventosSection: {
      titleStart: "Agenda",
      titleAccent: "de Eventos",
      subtitle:
        "Próximos eventos do cantão, atualizados no painel de administração.",
      emptyState:
        "Ainda não há eventos publicados. Entre no admin para criar o primeiro.",
      defaultType: "Evento",
      dateToConfirm: "Data a confirmar",
      cta: "Ver Página Informativa de Eventos",
    },
    generalidades: {
      titleStart: "Informações do",
      titleAccent: "Destino",
      subtitle:
        "Tudo o que você precisa saber sobre Santa Rosa, La Benemérita de El Oro.",
      altitude: "Altitude",
      population: "População",
      province: "Província",
      currency: "Moeda",
      temperature: "Temperatura",
      timeZone: "Fuso horário",
      language: "Idioma",
      languageValue: "Espanhol",
      country: "País",
      countryValue: "Equador",
    },
    galeriaSection: {
      titleStart: "Galeria",
      titleAccent: "Visual",
      subtitle: "Descubra a beleza de Santa Rosa através de imagens.",
      photos: "Fotos",
      videos: "Vídeos",
      emptyVideos: "Em breve vídeos de Santa Rosa",
    },
    blogSection: {
      titleStart: "Blog &",
      titleAccent: "Notícias",
      subtitle: "Artigos, guias e notícias turísticas de Santa Rosa.",
      readMore: "Ler mais",
      viewAll: "Ver Todos os Artigos",
    },
    footer: {
      brandDescription:
        "Santa Rosa, La Benemérita, é um paraíso costeiro na província de El Oro. Arquipélagos, gastronomia do mar e cultura única esperam por você.",
      discoverTitle: "Descubra",
      links: {
        destinations: "Destinos",
        events: "Eventos 2026",
        touristInfo: "Informação Turística",
        activities: "Atividades",
        gallery: "Galeria",
        blog: "Blog Turístico",
        howToGet: "Como Chegar",
        whatToDo: "O que Fazer",
      },
      contactTitle: "Contato",
      contact: {
        location: "Santa Rosa, El Oro, Equador",
        phone: "+593 7 294-xxxx",
        email: "info@visitsantarosa.ec",
        schedule: "Seg-Sex: 8h00-17h00",
      },
      writeUsTitle: "Escreva para nós",
      messageSent: "Mensagem enviada! Responderemos em breve.",
      form: {
        namePlaceholder: "Seu nome",
        emailPlaceholder: "Seu e-mail",
        messagePlaceholder: "Sua mensagem...",
      },
      sendMessage: "Enviar Mensagem",
      bottomCopyright:
        "© 2026 Santa Rosa - Município de Santa Rosa, El Oro, Equador",
      madeWith: "Feito com",
      byTourismOffice: "pela Direção de Turismo",
    },
    login: {
      title: "Painel de Administração",
      subtitle: "Santa Rosa — El Oro, Equador",
      emailLabel: "E-mail",
      passwordLabel: "Senha",
      loading: "Entrando...",
      enterButton: "Entrar no Painel",
      hint: "Acesso com contas do Firebase. Se o projeto ainda não estiver populado, o app pode usar contas demo de respaldo.",
      invalidCredentials: "Credenciais incorretas",
    },
    content: {
      destinations: {
        1: {
          name: "Ilha Jambeli",
          description:
            "A praia mais visitada do arquipélago. Areias brancas, hospedagens e sabores do mar à beira da praia.",
          category: "Praia",
        },
        2: {
          name: "Ilha Santa Clara",
          description:
            "Área protegida com leões-marinhos, atobás-de-patas-azuis e observação de baleias-jubarte (agosto-outubro).",
          category: "Natureza",
        },
        3: {
          name: "Puerto Jeli",
          description:
            "Famoso pela gastronomia de frutos do mar frescos e pelo ambiente ligado à cultura pesqueira e aos manguezais.",
          category: "Gastronomia",
        },
        4: {
          name: "Lagoa La Tembladera",
          description:
            "Área úmida natural ideal para ecoturismo, caiaque e observação de aves em um ambiente biodiverso.",
          category: "Ecoturismo",
        },
      },
      events: {
        1: {
          name: "Festas de Santa Rosa de Lima",
          description:
            "Celebração patronal com desfiles, música e cultura local. O evento mais importante do cantão.",
          place: "Parque Central de Santa Rosa",
          type: "Cultural",
          organizer: "Município de Santa Rosa",
        },
        2: {
          name: "Festival do Rei Camarão",
          description:
            "Homenagem à indústria camaronera, pilar da economia de Santa Rosa. Gastronomia, música e artesanato.",
          place: "Calçadão de Santa Rosa",
          type: "Gastronômico",
          organizer: "Associação de Empreendedores de Santa Rosa",
        },
        3: {
          name: "Tour de Observação de Baleias",
          description:
            "Temporada de baleias-jubarte. Excursões marítimas de Puerto Hualtaco até a Ilha Santa Clara.",
          place: "Puerto Hualtaco",
          type: "Turístico",
          organizer: "Operadoras turísticas autorizadas",
        },
        4: {
          name: "Semana da Cultura de El Oro",
          description:
            "Exposições culturais, dança folclórica e mostras artísticas da província de El Oro.",
          place: "Casa da Cultura, Santa Rosa",
          type: "Cultural",
          organizer: "Casa da Cultura Núcleo de El Oro",
        },
      },
      blog: {
        1: {
          title: "5 razões para visitar o Arquipélago de Jambeli",
          summary:
            "Praias virgens, manguezais e fauna única esperam por você neste paraíso costeiro do sul do Equador.",
          category: "Destinos",
          author: "Turismo Santa Rosa",
        },
        2: {
          title: "Gastronomia de Santa Rosa: Sabores do mar",
          summary:
            "Da sopa de frutos do mar aos ceviches de concha, descubra por que Santa Rosa é o destino gastronômico de El Oro.",
          category: "Gastronomia",
          author: "Turismo Santa Rosa",
        },
        3: {
          title: "Ilha Santa Clara: O santuário da vida marinha",
          summary:
            "Conheça a área protegida onde convivem leões-marinhos, atobás-de-patas-azuis e baleias-jubarte.",
          category: "Natureza",
          author: "Turismo Santa Rosa",
        },
        4: {
          title: "Guia completo para chegar a Santa Rosa",
          summary:
            "De Guayaquil, Cuenca ou Loja: todas as rotas para chegar à La Benemerita do Equador.",
          category: "Viagem",
          author: "Redação",
        },
        5: {
          title: "Lagoa La Tembladera: Um pântano por descobrir",
          summary:
            "Observação de aves, caiaque e natureza pura neste laboratório natural de água de Santa Rosa.",
          category: "Ecoturismo",
          author: "Turismo Santa Rosa",
        },
        6: {
          title: "Puerto Jeli: O recanto gastronômico dos mariscos",
          summary:
            "Um passeio pelos melhores restaurantes de frutos do mar e pela cultura pesqueira de Puerto Jeli.",
          category: "Gastronomia",
          author: "Redação",
        },
      },
      gallery: {
        1: { title: "Praias do Arquipélago de Jambeli" },
        2: { title: "Frutos do mar frescos de Puerto Jeli" },
        3: { title: "Lagoa La Tembladera" },
        4: { title: "Fauna marinha da Ilha Santa Clara" },
        5: { title: "Transporte para as ilhas" },
        6: { title: "Observação de baleias" },
        7: { title: "Festival de Santa Rosa de Lima" },
        8: { title: "Gastronomia típica" },
        9: { title: "Cultura e tradições" },
      },
    },
    pages: {
      destinations: "Destinos de Santa Rosa",
      touristInfo: "Informação Turística Integral",
      activities: "Atividades Turísticas Editoriais",
      events: "Agenda Informativa de Eventos",
      gallery: "Galeria Visual",
      blog: "Blog e Notícias",
    },
    eventsPage: {
      planningTitle: "Planeje sua visita a Santa Rosa",
      planningDescription:
        "Confira a agenda oficial atualizada no painel administrativo. Aqui você verá os eventos ativos, localização e dados de contato para participar.",
      publishedEvents: "Eventos publicados",
      withConfirmedTime: "Com horário confirmado",
      registeredPlaces: "Locais registrados",
      emptyState:
        "Não há eventos ativos no momento. Volte em breve para ver a nova programação.",
      defaultType: "Evento",
      dateToConfirm: "Data a confirmar",
      placeToConfirm: "Local a confirmar",
      timeToConfirm: "Horário a confirmar",
      organizerLabel: "Organiza",
      contactLabel: "Contato",
      noteTitle: "Informação útil para participar",
      noteItem1: "Confirme data e horário antes de viajar.",
      noteItem2: "Chegue com antecedência em eventos de grande público.",
      noteItem3: "Consulte o organizador para reservas ou inscrições prévias.",
    },
  },
};

function findLanguage(code) {
  return AVAILABLE_LANGUAGES.find((language) => language.code === code);
}

function readStoredLanguage() {
  if (typeof window === "undefined") {
    return "es";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return findLanguage(stored) ? stored : "es";
}

function resolveTranslation(languageCode, key) {
  const keyParts = key.split(".");
  const dictionaries = [translations[languageCode], translations.es];

  for (const dictionary of dictionaries) {
    const value = keyParts.reduce(
      (current, part) => current?.[part],
      dictionary,
    );
    if (typeof value === "string") {
      return value;
    }
  }

  return key;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readStoredLanguage);

  const currentLanguage = findLanguage(language) || AVAILABLE_LANGUAGES[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.title = resolveTranslation(language, "meta.browserTitle");
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      locale: currentLanguage.locale,
      availableLanguages: AVAILABLE_LANGUAGES,
      setLanguage,
      t: (key) => resolveTranslation(language, key),
    }),
    [language, currentLanguage.locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
