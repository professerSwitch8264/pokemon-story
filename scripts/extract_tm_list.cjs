/**
 * extract_tm_list.cjs
 * Extract all Gen 9 (Scarlet/Violet) TM moves from Showdown learnsets.js + moves.js
 */

const fs = require('fs');
const path = require('path');

const LEARNSETS_PATH = path.join(__dirname, '../../pokemon-showdown-client/play.pokemonshowdown.com/data/learnsets.js');
const MOVES_PATH = path.join(__dirname, '../../pokemon-showdown-client/play.pokemonshowdown.com/data/moves.js');
const OUTPUT_PATH = path.join(__dirname, '../src/data/tm_list.json');

// Load learnsets using require trick (exports.BattleLearnsets = {...})
const exports_ = {};
const learnsetCode = fs.readFileSync(LEARNSETS_PATH, 'utf-8');
eval(learnsetCode.replace('exports.', 'exports_.'));
const learnsets = exports_.BattleLearnsets;

// Load moves using require trick (exports.BattleMoveAnims = {...} or similar)
const exports2_ = {};
const movesCode = fs.readFileSync(MOVES_PATH, 'utf-8');
eval(movesCode.replace('exports.', 'exports2_.'));
const movesKey = Object.keys(exports2_)[0];
const moves = exports2_[movesKey];

console.log('Learnsets loaded:', Object.keys(learnsets).length, 'species');
console.log('Moves loaded:', Object.keys(moves).length, 'moves, key:', movesKey);

// Extract all Gen 9 TM moves (methods array contains "9M")
const tmSet = new Set();

for (const [species, data] of Object.entries(learnsets)) {
    if (!data.learnset) continue;
    for (const [moveId, methods] of Object.entries(data.learnset)) {
        if (methods.includes('9M')) {
            tmSet.add(moveId);
        }
    }
}

console.log(`Found ${tmSet.size} unique Gen 9 TM moves`);

// Build TM list with move data
const tmList = [];
let tmNum = 1;

for (const moveId of [...tmSet].sort()) {
    const moveInfo = moves[moveId] || {};
    const displayName = moveInfo.name || moveId;

    tmList.push({
        id: `tm-${moveId}`,
        name: `TM ${displayName}`,
        move: moveId,
        type: (moveInfo.type || 'Normal').toLowerCase(),
        category: (moveInfo.category || 'Physical').toLowerCase(),
        power: moveInfo.basePower || null,
        accuracy: (moveInfo.accuracy === true || moveInfo.accuracy === undefined) ? null : moveInfo.accuracy,
        pp: moveInfo.pp || null,
        tm_number: tmNum++,
        quantity: 0
    });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tmList, null, 2), 'utf-8');

console.log(`\nSaved ${tmList.length} TMs to: ${OUTPUT_PATH}`);
console.log('\nFirst 15 TMs:');
tmList.slice(0, 15).forEach(tm => {
    console.log(`  TM${String(tm.tm_number).padStart(3,'0')} [${tm.move}] ${tm.name} (${tm.type}/${tm.category}, BP:${tm.power || '-'})`);
});
