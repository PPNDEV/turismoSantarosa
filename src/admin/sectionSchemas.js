// Esquemas que describen el contenido editorial anidado de cada nodo del CMS.
// El editor genérico AdminSectionEditor se construye a partir de estos esquemas.
//
// Tipos de campo soportados:
//   - "text":     input de una línea
//   - "textarea": texto largo
//   - "select":   lista desplegable (requiere `options: [{value,label}]`)
//   - "image":    imagen (subida de archivo + URL)
//   - "object":   objeto anidado (requiere `fields: [...]`)
//   - "list":     lista de objetos (requiere `item: [...]` con los campos de cada fila)

const ESTABLECIMIENTO_FIELDS = [
  { name: "nombre", label: "Nombre", type: "text" },
  { name: "actividad", label: "Servicio / Actividad", type: "text" },
  { name: "contacto", label: "Teléfono / Contacto", type: "text" },
  { name: "descripcion", label: "Descripción", type: "textarea" },
  { name: "imagen", label: "Imagen", type: "image" },
];

const COOPERATIVA_FIELDS = [
  { name: "nombre", label: "Nombre de la cooperativa", type: "text" },
  { name: "ruta", label: "Ruta", type: "text" },
  { name: "procedencia", label: "Procedencia", type: "text" },
];

export const SECTION_SCHEMAS = {
  actividades: {
    title: "Actividades turísticas",
    description:
      "Texto introductorio y listado de actividades del archipiélago.",
    fields: [
      {
        name: "descripcion",
        label: "Introducción",
        type: "textarea",
      },
      {
        name: "listado",
        label: "Listado de actividades",
        type: "list",
        itemLabel: "Actividad",
        item: [
          { name: "nombre", label: "Nombre", type: "text" },
          { name: "descripcion", label: "Descripción", type: "textarea" },
          {
            name: "icono",
            label: "Ícono",
            type: "select",
            options: [
              { value: "water", label: "Agua / deportes acuáticos" },
              { value: "walk", label: "Caminata" },
              { value: "tree", label: "Naturaleza / manglar" },
              { value: "glass", label: "Vida nocturna" },
              { value: "fish", label: "Pesca" },
              { value: "beach", label: "Playa" },
            ],
          },
          { name: "imagen", label: "Imagen", type: "image" },
        ],
      },
    ],
  },

  gastronomia: {
    title: "Gastronomía",
    description: "Establecimientos de alimentos y bebidas por isla.",
    fields: [
      {
        name: "jambeli",
        label: "Establecimientos en Jambelí",
        type: "list",
        itemLabel: "Establecimiento",
        item: ESTABLECIMIENTO_FIELDS,
      },
      {
        name: "sanGregorio",
        label: "Establecimientos en San Gregorio",
        type: "list",
        itemLabel: "Establecimiento",
        item: ESTABLECIMIENTO_FIELDS,
      },
    ],
  },

  hospedajes: {
    title: "Hospedaje",
    description: "Descripción general, alojamientos y tarifas referenciales.",
    fields: [
      { name: "descripcion", label: "Descripción general", type: "textarea" },
      {
        name: "jambeli",
        label: "Hospedajes en Jambelí",
        type: "list",
        itemLabel: "Hospedaje",
        item: ESTABLECIMIENTO_FIELDS,
      },
      {
        name: "tarifas",
        label: "Tarifas referenciales",
        type: "list",
        itemLabel: "Tarifa",
        item: [
          { name: "tipo", label: "Tipo de habitación", type: "text" },
          { name: "tarifa", label: "Tarifa", type: "text" },
        ],
      },
    ],
  },

  floraFauna: {
    title: "Flora y Fauna",
    description: "Biodiversidad: descripción general, fauna y flora.",
    fields: [
      {
        name: "descripcionGeneral",
        label: "Descripción general",
        type: "textarea",
      },
      {
        name: "fauna",
        label: "Fauna",
        type: "object",
        fields: [
          { name: "descripcion", label: "Descripción", type: "textarea" },
          {
            name: "especies",
            label: "Especies de fauna",
            type: "list",
            itemLabel: "Especie",
            item: [
              { name: "nombre", label: "Nombre común", type: "text" },
              {
                name: "nombreCientifico",
                label: "Nombre científico",
                type: "text",
              },
              { name: "grupo", label: "Grupo (Ave, Mamífero...)", type: "text" },
              { name: "imagen", label: "Imagen", type: "image" },
            ],
          },
        ],
      },
      {
        name: "flora",
        label: "Flora",
        type: "object",
        fields: [
          { name: "descripcion", label: "Descripción", type: "textarea" },
          {
            name: "especies",
            label: "Especies de flora",
            type: "list",
            itemLabel: "Especie",
            item: [
              { name: "nombreComun", label: "Nombre común", type: "text" },
              {
                name: "nombreCientifico",
                label: "Nombre científico",
                type: "text",
              },
              { name: "imagen", label: "Imagen", type: "image" },
            ],
          },
        ],
      },
    ],
  },

  eventos: {
    title: "Cultura y Patrimonio",
    description:
      "Manifestaciones culturales y patrimonio del archipiélago de Jambelí.",
    fields: [
      {
        name: "descripcionGeneral",
        label: "Descripción general",
        type: "textarea",
      },
      {
        name: "manifestaciones",
        label: "Manifestaciones culturales",
        type: "list",
        itemLabel: "Manifestación",
        item: [
          { name: "tipo", label: "Tipo", type: "text" },
          { name: "subtipo", label: "Subtipo / Título", type: "text" },
          { name: "descripcion", label: "Descripción", type: "textarea" },
          { name: "imagen", label: "Imagen", type: "image" },
        ],
      },
      {
        name: "patrimonio",
        label: "Patrimonio",
        type: "object",
        fields: [
          { name: "tangible", label: "Patrimonio tangible", type: "textarea" },
          {
            name: "intangible",
            label: "Patrimonio intangible",
            type: "textarea",
          },
        ],
      },
    ],
  },

  cooperativas: {
    title: "Transporte fluvial",
    description: "Cooperativas y rutas fluviales por destino.",
    fields: [
      {
        name: "jambeli",
        label: "Cooperativas ruta Jambelí",
        type: "list",
        itemLabel: "Cooperativa",
        item: COOPERATIVA_FIELDS,
      },
      {
        name: "sanGregorio",
        label: "Cooperativas ruta San Gregorio / Costa Rica",
        type: "list",
        itemLabel: "Cooperativa",
        item: COOPERATIVA_FIELDS,
      },
    ],
  },
};

/** Construye un valor vacío para un campo según su tipo. */
export function emptyValueForField(field) {
  switch (field.type) {
    case "list":
      return [];
    case "object":
      return emptyValueForFields(field.fields);
    case "number":
      return 0;
    default:
      return "";
  }
}

/** Construye un objeto vacío a partir de una lista de campos. */
export function emptyValueForFields(fields) {
  const out = {};
  for (const field of fields) {
    out[field.name] = emptyValueForField(field);
  }
  return out;
}
