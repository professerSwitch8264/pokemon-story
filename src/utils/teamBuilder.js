export function packPokemon(p) {
    if (!p) return '';
    // Showdown packed team format:
    // name|species|item|ability|moves|nature|evs|gender|ivs|shiny|level|happiness,pokeball,hpType
    const rawName = p.nickname || p.name || p.species || 'Unknown';
    const rawSpecies = p.species || rawName || 'Porygon';
    const name = String(rawName);
    const species = String(rawSpecies);
    const item = String(p.item || '');
    const ability = String(p.ability || 'Synchronize');
    const level = Number(p.level) || 5;
  
    let movesArr = p.moves || [];
    if (typeof movesArr === 'string') {
      movesArr = movesArr.split(',').map(m => m.trim()).filter(Boolean);
    }
    const moves = movesArr.filter(Boolean).map(String).slice(0, 4).join(',');
  
    const formatStats = (statsObj, fallback) => {
        if (typeof statsObj === 'object' && statsObj !== null) {
            return `${statsObj.hp||fallback},${statsObj.atk||fallback},${statsObj.def||fallback},${statsObj.spa||fallback},${statsObj.spd||fallback},${statsObj.spe||fallback}`;
        }
        return `${fallback},${fallback},${fallback},${fallback},${fallback},${fallback}`;
    };

    const evs = formatStats(p.evs, 0);
    const ivs = formatStats(p.ivs, 31);
    
    const nature = String(p.nature || 'Hardy');
    const gender = '';
    const shiny = p.shiny ? 'S' : '';
    const happiness = '';

    return `${name}|${species}|${item}|${ability}|${moves}|${nature}|${evs}|${gender}|${ivs}|${shiny}|${level}|${happiness}`;
}
  
export function generatePlayerTeam(playerPokemon) {
    if (Array.isArray(playerPokemon)) {
      return playerPokemon.filter(Boolean).map(p => packPokemon(p)).join(']');
    }
    if (!playerPokemon) return '';
    return packPokemon(playerPokemon);
}
