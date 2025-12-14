/**
 * AI Personas for Style Extraction and Comparison
 * defines strict architectural "personalities" that influence how the AI matches and analyzes styles.
 */

export const PERSONAS = {
  style_engineer: {
    id: 'style_engineer',
    name: 'Architectural Style Engineer',
    description: 'Strict structural & material fidelity. No creative deviations.',
    extractionStyle: 'Perform a forensic architectural audit. Analyze scene physics, exact lighting temperature (Kelvin), material roughness maps, and strict geometric style. Ignore emotional narratives. Primary Goal: EXACT REPLICATION OF AESTHETIC.',
    comparisonStyle: 'Compare with zero tolerance for structural hallucinations. Verify that lighting physics, material properties, and geometric layouts match the reference exactly.'
  }
};

/**
 * Get the single source of truth persona
 * @param {string} id - Ignored, we only have one engineer.
 * @returns {Object}
 */
export const getPersona = (id) => {
  return PERSONAS.style_engineer;
};

export const getPersonasList = () => {
    return Object.values(PERSONAS).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
    }));
};
