export const lossCatalog = {
    "A1" : "Falla Mecánica",
    "A2" : "Falla Eléctrica",
    "A3" : "Neumática u otras",
    "B1" : "Falta de Energía",
    "B2" : "Falta de Aire Comprimido",
    "B3" : "Falta de Vapor",
    "C1" : "Falta de Material",
    "C2" : "Falta de ...",
    "D1" : "Hora de Comida",
    "D2" : "Simulacro de Emergencia",
    "E1" : "Falta de Operador",
    "E2" : "Gymnastic",
    "E3" : "Entrenamiento",
    "E4" : "Baño",
    "E5" : "Junta",
    "F1" : "Cambio de Herramienta",
    "F2" : "Changeover",
    "F3" : "Cambio de Materia Prima",
    "G1" : "Ajuste de Maquina",
    "G2" : "Ajuste de Herramientas",
    "H1" : "Paros Menores - Bloqueo",
    "H2" : "Paros Menores - Starving",
    "H3" : "Paros Menores - Inactivo",
    "H4" : "Paros Menores - Fallo",
    "I1" : "Perdida de Velocidad",
    "J1" : "Scrap",
    "J2" : "Re-Trabajo"
}

export const getLossDescription = (codigo) => {
    return lossCatalog[codigo] ? `${codigo} - ${lossCatalog[codigo]}` : codigo;
};