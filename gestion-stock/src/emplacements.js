// Chaque sac a ses propres emplacements : config.emplacements = { "Sac 1": ["Pochette…", …] }.
// Un sac sans entrée utilise encore la liste commune config.categories (anciennes données).

export const getEmplacements = (config, sac) => config.emplacements?.[sac] ?? config.categories;

// Tous les emplacements, dans l'ordre des sacs (pour "Tous" et pour le tri)
export const allEmplacements = (config) =>
  [...new Set(config.sacs.flatMap(s => getEmplacements(config, s)))];

// Emplacement à garder quand un produit change de sac
export const emplacementFor = (config, sac, current) => {
  const list = getEmplacements(config, sac);
  return list.includes(current) ? current : (list[0] ?? '');
};
