import { Box, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, Slider, Typography } from "@mui/material"
import { useState, useEffect, useRef } from "react"
import { keyframes } from "@mui/system"
import rawMapData from "../../data/map.json"
import rawNpcData from "../../data/npc.json"

const mapData = (() => {
    try {
        const saved = typeof window !== 'undefined' && localStorage.getItem("custom_map_data");
        return saved ? JSON.parse(saved) : rawMapData;
    } catch { return rawMapData; }
})();

const npcData = (() => {
    try {
        const saved = typeof window !== 'undefined' && localStorage.getItem("custom_npc_data");
        return saved ? JSON.parse(saved) : rawNpcData;
    } catch { return rawNpcData; }
})();
import playerData from "../../data/player.json"
import pokemonData from "../../data/pokemon.json"
import itemData from "../../data/item.json"
import moveData from "../../data/move.json"
import abilityData from "../../data/ability.json"
import tmListData from "../../data/tm_list.json"

const typeColors = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const natureList = {
    Adamant: { inc: 'atk', dec: 'spa' },
    Bashful: { inc: 'spa', dec: 'spa' }, // neutral
    Bold: { inc: 'def', dec: 'atk' },
    Brave: { inc: 'atk', dec: 'spe' },
    Calm: { inc: 'spd', dec: 'atk' },
    Careful: { inc: 'spd', dec: 'spa' },
    Docile: { inc: 'def', dec: 'def' }, // neutral
    Gentle: { inc: 'spd', dec: 'def' },
    Hardy: { inc: 'atk', dec: 'atk' }, // neutral
    Hasty: { inc: 'spe', dec: 'def' },
    Impish: { inc: 'def', dec: 'spa' },
    Jolly: { inc: 'spe', dec: 'spa' },
    Lax: { inc: 'def', dec: 'spd' },
    Lonely: { inc: 'atk', dec: 'def' },
    Mild: { inc: 'spa', dec: 'def' },
    Modest: { inc: 'spa', dec: 'atk' },
    Naive: { inc: 'spe', dec: 'spd' },
    Naughty: { inc: 'atk', dec: 'spd' },
    Quiet: { inc: 'spa', dec: 'spe' },
    Quirky: { inc: 'spd', dec: 'spd' }, // neutral
    Rash: { inc: 'spa', dec: 'spd' },
    Relaxed: { inc: 'def', dec: 'spe' },
    Sassy: { inc: 'spd', dec: 'spe' },
    Serious: { inc: 'spe', dec: 'spe' }, // neutral
    Timid: { inc: 'spe', dec: 'atk' }
};
const natureNames = Object.keys(natureList);

const statColors = {
    hp: '#ef4444',
    atk: '#eab308',
    def: '#facc15',
    spa: '#38bdf8',
    spd: '#4ade80',
    spe: '#fb923c'
};

const statNames = {
    hp: 'HP',
    atk: 'Atk',
    def: 'Def',
    spa: 'SpA',
    spd: 'SpD',
    spe: 'Spe'
};

const AnimatedQuantity = ({ count }) => {
    const [displayCount, setDisplayCount] = useState(count);
    const [isBumping, setIsBumping] = useState(false);
    const prevCountRef = useRef(count);

    useEffect(() => {
        if (count === prevCountRef.current) return;
        const startVal = displayCount;
        const diff = count - startVal;
        prevCountRef.current = count;
        setIsBumping(true);
        const bumpTimer = setTimeout(() => setIsBumping(false), 350);

        const duration = 400;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayCount(Math.round(startVal + diff * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
        return () => clearTimeout(bumpTimer);
    }, [count]);

    return (
        <Box sx={{
            fontSize: '0.68rem',
            fontWeight: 'bold',
            color: '#4ade80',
            bgcolor: isBumping ? 'rgba(74,222,128,0.3)' : 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 1,
            px: 0.8, py: 0.15,
            whiteSpace: 'nowrap',
            ml: 0.5,
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s',
            transform: isBumping ? 'scale(1.35)' : 'scale(1)',
        }}>
            x{displayCount}
        </Box>
    );
};

import { generatePlayerTeam } from "../../utils/teamBuilder"
import { WalkingNpc, WalkingPokemonSpawner } from "./WalkingSprites"

const charEnterBounce = keyframes`
  0% { opacity: 0; transform: translateY(80px) scale(0.5); filter: brightness(1.6) drop-shadow(0 0 20px rgba(56,189,248,0.9)); }
  65% { opacity: 1; transform: translateY(-14px) scale(1.08); }
  85% { transform: translateY(4px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const charExitShrink = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  30% { opacity: 0.9; transform: translateY(-10px) scale(1.06); }
  100% { opacity: 0; transform: translateY(70px) scale(0.3); filter: brightness(0.2); }
`;

const fadePop = charEnterBounce;
const fadeOutShrink = charExitShrink;


const bounceIcon = keyframes`
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-2px); }
`;

const calculateNextExp = (level) => {
    const totalExpCurrent = Math.floor((4 * Math.pow(level, 3)) / 5);
    const totalExpNext = Math.floor((4 * Math.pow(level + 1, 3)) / 5);
    return totalExpNext - totalExpCurrent;
};

const getNpcLocation = (npc, currentDay, currentTime) => {
    if (npc.schedule && npc.schedule.length > 0) {
        for (const s of npc.schedule) {
            const matchDay = !s.days || s.days.includes(currentDay % 7);
            const matchTime = currentTime >= s.start && currentTime < s.end;
            if (matchDay && matchTime) {
                return s.location;
            }
        }
    }
    return npc.defaultLocation || npc.location;
};

const getCurrentScript = (npc, phase, currentLocation, currentTime) => {
    if (!npc) return [];

    // 1. Array of conditional script blocks (e.g., location, time/start/end, phase)
    if (Array.isArray(npc.scripts)) {
        for (const entry of npc.scripts) {
            // Check phase
            if (entry.phase !== undefined && entry.phase !== null && Number(entry.phase) !== Number(phase || 1)) {
                continue;
            }
            // Check location
            if (entry.location && currentLocation && entry.location !== currentLocation) {
                continue;
            }
            // Check time
            if (entry.start !== undefined && entry.end !== undefined && currentTime !== undefined) {
                const hour = Number(currentTime);
                if (hour < entry.start || hour >= entry.end) continue;
            } else if (entry.timeOfDay && currentTime !== undefined) {
                const hour = Number(currentTime);
                if (entry.timeOfDay === 'morning' && (hour < 6 || hour >= 12)) continue;
                if (entry.timeOfDay === 'afternoon' && (hour < 12 || hour >= 18)) continue;
                if (entry.timeOfDay === 'night' && (hour >= 6 && hour < 18)) continue;
            }

            // All conditions match!
            if (entry.script) return entry.script;
        }
    }

    // 2. Object key mapping (e.g. { "1": [...], "default": [...] })
    if (npc.scripts && typeof npc.scripts === 'object' && !Array.isArray(npc.scripts)) {
        const phaseStr = String(phase || 1);
        if (npc.scripts[phaseStr]) return npc.scripts[phaseStr];
        if (npc.scripts["default"]) return npc.scripts["default"];
    }

    return npc.script || [];
};

const getScriptStepByNode = (npcObj, targetNode, phase, currentLocation, currentTime) => {
    if (!npcObj || targetNode === null || targetNode === undefined) return null;
    const currentScript = getCurrentScript(npcObj, phase, currentLocation, currentTime);
    const step = currentScript.find(item => item.node === targetNode);
    if (step) return step;

    // Fallback: Search across all script blocks of npcObj in case phase/time updated mid-script execution (e.g. increase_phase event)
    if (Array.isArray(npcObj.scripts)) {
        for (const block of npcObj.scripts) {
            if (Array.isArray(block.script)) {
                const found = block.script.find(item => item.node === targetNode);
                if (found) return found;
            }
        }
    }
    return null;
};

const getEvolutionInfo = (p, pokemonData) => {
    if (!p || !p.species || !pokemonData) return null;

    const speciesKey = p.species.toLowerCase();
    const baseKey = speciesKey.includes('-starter') ? speciesKey.replace('-starter', '') : speciesKey;
    const pData = pokemonData[speciesKey] || pokemonData[baseKey];

    if (!pData || !pData.evolutions || !Array.isArray(pData.evolutions)) return null;

    for (const evo of pData.evolutions) {
        if (!evo.species || !evo.details || !Array.isArray(evo.details)) continue;

        for (const det of evo.details) {
            if (det.min_level !== undefined && det.min_level !== null && !det.item) {
                const targetSpecies = evo.species;
                const minLevel = Number(det.min_level);
                const canEvolve = (p.level || 1) >= minLevel;

                return {
                    targetSpecies,
                    minLevel,
                    canEvolve,
                    trigger: det.trigger?.name || 'level-up'
                };
            }
        }
    }
    return null;
};

const hasTmInInventory = (player, moveId) => {
    if (!player || !player.inventory) return false;
    const cleanMoveId = (moveId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanMoveId) return false;

    for (const cat in player.inventory) {
        const list = player.inventory[cat];
        if (!Array.isArray(list)) continue;

        for (const item of list) {
            if (!item) continue;
            const itemId = (item.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const itemMove = (item.move || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const itemName = (item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            if (itemMove === cleanMoveId || itemId === cleanMoveId || itemId === 'tm' + cleanMoveId || itemName.includes(cleanMoveId)) {
                return true;
            }
        }
    }
    return false;
};

export const getPhaseLimits = (phase) => {
    const p = Number(phase) || 1;
    switch (p) {
        case 1: return { levelCap: 15, maxSlot: 2 };
        case 2: return { levelCap: 27, maxSlot: 3 };
        case 3: return { levelCap: 44, maxSlot: 3 };
        case 4: return { levelCap: 47, maxSlot: 3 };
        case 5: return { levelCap: 56, maxSlot: 4 };
        case 6: return { levelCap: 59, maxSlot: 4 };
        case 7: return { levelCap: 68, maxSlot: 5 };
        case 8: return { levelCap: 73, maxSlot: 5 };
        case 9: return { levelCap: 79, maxSlot: 6 };
        default: return { levelCap: p >= 9 ? 100 : 15, maxSlot: p >= 9 ? 6 : 2 };
    }
};

const PokemonPartyItem = ({ poke, pokemonData, bounceIcon }) => {
    if (!poke) return null;
    
    // Initialize state
    const [displayTotalExp, setDisplayTotalExp] = useState(poke.totalExp || 0);
    const [displayLevel, setDisplayLevel] = useState(poke.level);

    // Initial setup if totalExp is not set correctly
    useEffect(() => {
        const baseExp = Math.floor((4 * Math.pow(poke.level, 3)) / 5);
        const targetTotalExp = poke.totalExp || (baseExp + (poke.exp || 0));
        if (displayTotalExp === 0 && targetTotalExp > 0) {
            setDisplayTotalExp(targetTotalExp);
        }
    }, []);

    // Animate to target
    useEffect(() => {
        const baseExp = Math.floor((4 * Math.pow(poke.level, 3)) / 5);
        const targetTotalExp = poke.totalExp || (baseExp + (poke.exp || 0));
        
        if (displayTotalExp > 0 && displayTotalExp < targetTotalExp) {
            let current = displayTotalExp;
            
            const animate = () => {
                const diff = targetTotalExp - current;
                if (diff <= 0) {
                    setDisplayTotalExp(targetTotalExp);
                    return;
                }
                
                // Add exp smoothly
                const step = Math.max(1, Math.ceil(diff / 150));
                current += step;
                if (current > targetTotalExp) current = targetTotalExp;
                
                setDisplayTotalExp(current);
                
                if (current < targetTotalExp) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        } else if (displayTotalExp > targetTotalExp) {
             setDisplayTotalExp(targetTotalExp);
        }
    }, [poke.totalExp, poke.exp, poke.level]);
    
    // Calculate display level and progress based on displayTotalExp
    let currentLevel = 1;
    let nextLvlExp = Math.floor((4 * Math.pow(currentLevel + 1, 3)) / 5);
    while (displayTotalExp >= nextLvlExp && currentLevel < 100) {
        currentLevel++;
        nextLvlExp = Math.floor((4 * Math.pow(currentLevel + 1, 3)) / 5);
    }
    
    const currentLvlBase = Math.floor((4 * Math.pow(currentLevel, 3)) / 5);
    const expInLevel = displayTotalExp - currentLvlBase;
    const expNeeded = nextLvlExp - currentLvlBase;
    const progress = Math.min(100, Math.max(0, (expInLevel / expNeeded) * 100));

    const pData = pokemonData[poke.species.toLowerCase()];
    const pokeId = pData ? pData.id : 1;
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pokeId}.png`;

    return (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1, 
            borderRadius: 1, 
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <Box sx={{ width: 55, height: 45, flexShrink: 0, position: 'relative' }}>
                <Box 
                    component="img"
                    src={spriteUrl}
                    sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 68,
                        height: 56,
                        imageRendering: 'pixelated',
                        animation: `${bounceIcon} 0.6s step-end infinite`
                    }}
                />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                <Box sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{poke.nickname || poke.species}</Box>
                <Box sx={{ fontSize: '0.8rem', color: 'gray' }}>Lv. {currentLevel}</Box>
                
                {/* EXP Bar */}
                <Box sx={{ 
                    width: '100%', 
                    height: 6, 
                    bgcolor: '#4b5563',
                    borderRadius: 3,
                    mt: 0.5,
                    overflow: 'hidden'
                }}>
                    <Box sx={{ 
                        width: `${progress}%`,
                        height: '100%',
                        bgcolor: '#ffffff',
                        borderRadius: 3,
                        transition: progress === 0 ? 'none' : 'width 0.1s linear'
                    }} />
                </Box>
            </Box>
        </Box>
    );
};

function GamePage () {

    const [currentLocation, setCurrentLocation] = useState('bedroom')
    const [currentNpc, setCurrentNpc] = useState(null)
    
    // เปลี่ยนจาก dialogIndex เป็น currentNode (เริ่มต้นที่ Node ID 1)
    const [currentNode, setCurrentNode] = useState(1)
    const [currentDialogData, setCurrentDialogData] = useState(null)

    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // State สำหรับพักปุ่ม Action ชุดถัดไปไว้
    const [pendingActionList, setPendingActionList] = useState(null)
    const pendingActionListRef = useRef(pendingActionList)
    useEffect(() => {
        pendingActionListRef.current = pendingActionList
    }, [pendingActionList])
    const [actionList, setActionList] = useState([])
    const [wildEncounter, setWildEncounter] = useState(null)
    const [displayedCharacter, setDisplayedCharacter] = useState(null)
    const [displayedCharacters, setDisplayedCharacters] = useState([])
    const [leavingCharacters, setLeavingCharacters] = useState([])
    const [isLeaving, setIsLeaving] = useState(false)
    const [postBattlePhase, setPostBattlePhase] = useState(null)
    const [isSleepingBlackScreen, setIsSleepingBlackScreen] = useState(false)

    // State สำหรับ Push Transition ระหว่างฉากเก่ากับฉากใหม่
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [previousMapUrl, setPreviousMapUrl] = useState('')
    const [nextMapUrl, setNextMapUrl] = useState('')

    const [isBattling, setIsBattling] = useState(false)
    const [battleReady, setBattleReady] = useState(false)
    
    // Bag States
    const [isBagOpen, setIsBagOpen] = useState(false)
    const [selectedBagTab, setSelectedBagTab] = useState('pokeball')
    const [selectedItemAction, setSelectedItemAction] = useState(null)
    const [giveItemContext, setGiveItemContext] = useState(null) // Stores itemId when giving item
    const [bagContextMenu, setBagContextMenu] = useState(null)
    
    // PC States
    const [isPcOpen, setIsPcOpen] = useState(false)
    const [currentPcBox, setCurrentPcBox] = useState(0)
    const [selectedPcSlot, setSelectedPcSlot] = useState(null) // { type: 'party' | 'box', index: number }
    const [pcMoveMode, setPcMoveMode] = useState(false)
    const [pcContextMenu, setPcContextMenu] = useState(null)

    // Shop States
    const [isShopOpen, setIsShopOpen] = useState(false)
    const [shopTab, setShopTab] = useState('')
    const [shopCatalog, setShopCatalog] = useState([])
    
    // Team Builder States
    const [isTeamOpen, setIsTeamOpen] = useState(false)
    const [selectedTeamIndex, setSelectedTeamIndex] = useState(0)
    const [teamSubView, setTeamSubView] = useState('moves')
    const [moveCategoryTab, setMoveCategoryTab] = useState('level') // 'level' | 'tm' | 'egg'

    // Evolution Modal State
    const [evoModalState, setEvoModalState] = useState(null);

    // Wait Time Modal State (รอเวลา)
    const [isWaitModalOpen, setIsWaitModalOpen] = useState(false);
    const [waitMinutes, setWaitMinutes] = useState(30);

    const handleStartEvolution = (slotIndex, p, evoInfo) => {
        setEvoModalState({
            open: true,
            stage: 'glowing',
            slotIndex,
            oldPokemon: p,
            evoInfo
        });

        setTimeout(() => {
            setPlayer(prev => {
                const newTeam = [...prev.team];
                const current = newTeam[slotIndex];
                if (!current) return prev;

                const oldSpeciesName = current.species;
                const newSpecies = evoInfo.targetSpecies;
                const newSpeciesCapitalized = newSpecies.charAt(0).toUpperCase() + newSpecies.slice(1);

                let newNickname = current.nickname;
                if (!newNickname || newNickname.toLowerCase() === oldSpeciesName.toLowerCase() || newNickname.toLowerCase() === oldSpeciesName.toLowerCase().replace('-starter', '')) {
                    newNickname = newSpeciesCapitalized;
                }

                newTeam[slotIndex] = {
                    ...current,
                    species: newSpecies,
                    nickname: newNickname
                };
                return { ...prev, team: newTeam };
            });

            setEvoModalState(prev => prev ? { ...prev, stage: 'transformed' } : null);
        }, 2500);
    };

    // Points animated display
    const [displayPoints, setDisplayPoints] = useState(0)
    const [pointsBump, setPointsBump] = useState(false)
    
    const iframeRef = useRef(null)
    const [player, setPlayer] = useState(() => {
        const p = JSON.parse(JSON.stringify(playerData[0]));
        p.team = p.team.map(poke => {
            if (poke) {
                const baseTotalExp = Math.floor((4 * Math.pow(poke.level, 3)) / 5);
                if (typeof poke.exp === 'undefined') poke.exp = 0;
                if (typeof poke.totalExp === 'undefined') {
                    poke.totalExp = baseTotalExp + poke.exp;
                }
                poke.next_exp = calculateNextExp(poke.level);
            }
            return poke;
        });
        return p;
    });

    const playerRef = useRef(player);
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    // Animate points count-up whenever player.points changes
    useEffect(() => {
        const target = player.points || 0;
        if (target === displayPoints) return;
        const diff = target - displayPoints;
        const duration = Math.min(1200, Math.max(400, Math.abs(diff) * 2));
        const startTime = performance.now();
        const startVal = displayPoints;
        // Trigger bump flash
        setPointsBump(true);
        const timer = setTimeout(() => setPointsBump(false), 600);
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayPoints(Math.round(startVal + diff * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player.points]);

    const [isAssetsLoading, setIsAssetsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    useEffect(() => {
        const urlsToPreload = new Set();
        
        // Helper to add both icon and sprite for a given pokemon species
        const addPokeSprites = (species) => {
            if (!species) return;
            const sp = species.toLowerCase();
            // Icon
            const pData = pokemonData[sp];
            if (pData && pData.id) {
                urlsToPreload.add(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pData.id}.png`);
                // Fallback sprite url used in game
                urlsToPreload.add(`https://play.pokemonshowdown.com/sprites/gen5/${pData.id}.png`);
            }
            // Main Sprite used in game
            urlsToPreload.add(`https://play.pokemonshowdown.com/sprites/gen5/${sp}.png`);
        };

        // 1. Items
        itemData.forEach(item => {
            urlsToPreload.add(`https://www.serebii.net/itemdex/sprites/${item.id}.png`);
        });

        // 2. Player Team (Icons, Front, Back)
        player.team.forEach(poke => {
            if (poke) addPokeSprites(poke.species, true);
        });

        // 3. PC Boxes (Icons only, but we can load front sprite too for consistency)
        if (player.pc_boxes) {
            player.pc_boxes.forEach(box => {
                box.forEach(poke => {
                    if (poke) addPokeSprites(poke.species, false);
                });
            });
        }

        // 4. Wild Encounters
        Object.values(mapData).forEach(map => {
            if (map.encounters) {
                Object.values(map.encounters).forEach(area => {
                    if (Array.isArray(area)) {
                        area.forEach(enc => addPokeSprites(enc.species, false));
                    }
                });
            }
        });

        // 5. NPCs and Trainer Battles
        npcData.forEach(npc => {
            if (npc.id) {
                urlsToPreload.add(`https://play.pokemonshowdown.com/sprites/trainers/${npc.id.toLowerCase().replace('gym_', '')}.png`);
            }
            if (npc.scripts) {
                Object.values(npc.scripts).forEach(scriptArr => {
                    if (Array.isArray(scriptArr)) {
                        scriptArr.forEach(step => {
                            if (step.character) {
                                urlsToPreload.add(`https://play.pokemonshowdown.com/sprites/trainers/${step.character.toLowerCase().replace('gym_', '')}.png`);
                            }
                            if (step.enemyTeam && Array.isArray(step.enemyTeam)) {
                                step.enemyTeam.forEach(enemy => addPokeSprites(enemy.species, false));
                            }
                        });
                    }
                });
            }
        });
        
        const urls = Array.from(urlsToPreload);
        if (urls.length === 0) {
            setIsAssetsLoading(false);
            return;
        }

        let loaded = 0;
        urls.forEach(url => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loaded++;
                setLoadingProgress(Math.floor((loaded / urls.length) * 100));
                if (loaded === urls.length) {
                    setTimeout(() => setIsAssetsLoading(false), 200);
                }
            };
            img.src = url;
        });
    }, []);

    const handlePcSlotClick = (e, loc, p) => {
        if (pcMoveMode && selectedPcSlot) {
            if (selectedPcSlot.type === loc.type && selectedPcSlot.index === loc.index && selectedPcSlot.boxIndex === loc.boxIndex) {
                setPcMoveMode(false);
                return;
            }
            setPlayer(prev => {
                const newPlayer = { ...prev, team: [...prev.team], pc_boxes: prev.pc_boxes ? prev.pc_boxes.map(b => [...b]) : [Array(20).fill(null)] };
                const getP = (l) => l.type === 'party' ? newPlayer.team[l.index] : newPlayer.pc_boxes[l.boxIndex][l.index];
                const setP = (l, val) => {
                    if (l.type === 'party') newPlayer.team[l.index] = val;
                    else newPlayer.pc_boxes[l.boxIndex][l.index] = val;
                };
                const p1 = getP(selectedPcSlot);
                const p2 = getP(loc);
                const { maxSlot } = getPhaseLimits(prev.phase || 1);
                if (loc.type === 'party' && loc.index >= maxSlot) {
                    alert(`สล็อตที่ ${loc.index + 1} ถูกล็อคใน Phase นี้ (จำกัดสูงสุด ${maxSlot} ตัว)`);
                    return prev;
                }
                if (selectedPcSlot.type === 'party' && selectedPcSlot.index >= maxSlot) {
                    alert(`สล็อตที่ ${selectedPcSlot.index + 1} ถูกล็อคใน Phase นี้`);
                    return prev;
                }
                if (selectedPcSlot.type === 'box' && loc.type === 'party' && !p2 && newPlayer.team.filter(x => x).length >= maxSlot) {
                    alert(`ไม่สามารถจัดทีมเกิน ${maxSlot} ตัวได้ใน Phase นี้!`);
                    return prev;
                }
                if (selectedPcSlot.type === 'party' && !p2 && newPlayer.team.filter(x => x).length <= 1) return prev;
                if (selectedPcSlot.type === 'box' && !p1 && !p2 && newPlayer.team.filter(x => x).length <= 1) return prev;
                setP(selectedPcSlot, p2);
                setP(loc, p1);
                
                // Compact party team to shift pokemon up
                const compactedTeam = newPlayer.team.filter(x => x);
                while (compactedTeam.length < 6) compactedTeam.push(null);
                newPlayer.team = compactedTeam;
                
                return newPlayer;
            });
            setPcMoveMode(false);
            setSelectedPcSlot(loc);
            return;
        }

        if (p) {
            setSelectedPcSlot(loc);
            setPcContextMenu({ x: e.clientX, y: e.clientY, slot: loc, pokemon: p });
        } else if (pcMoveMode) {
            // Clicked empty slot in move mode, handled above, but if it reaches here it means selectedPcSlot was null somehow, just cancel
            setPcMoveMode(false);
        } else {
            setSelectedPcSlot(loc); // Select empty slot just to show Empty in Details
        }
    };

    // State สำหรับแสดงผลเวลาแบบค่อยๆ หมุน (Absolute Time)
    const [displayAT, setDisplayAT] = useState(() => {
        return ((playerData[0].day || 1) - 1) * 24 + ((playerData[0].time || 6) - 6);
    });

    useEffect(() => {
        const targetAT = (player.day - 1) * 24 + (player.time - 6);
        
        if (displayAT < targetAT) {
            let current = displayAT;
            const animate = () => {
                const diff = targetAT - current;
                if (diff <= 0) {
                    setDisplayAT(targetAT);
                    return;
                }
                
                // ค่อยๆ เพิ่มเวลา (30 เฟรมให้ถึงเป้าหมาย)
                const step = Math.max(0.01, diff / 30);
                current += step;
                if (current > targetAT) current = targetAT;
                
                setDisplayAT(current);
                
                if (current < targetAT) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        } else if (displayAT > targetAT) {
            setDisplayAT(targetAT);
        }
    }, [player.day, player.time]);

    // บังคับนอนเมื่อถึงเที่ยงคืน
    useEffect(() => {
        if (player.time >= 24 && !isSleepingBlackScreen) {
            setIsSleepingBlackScreen(true);
            setPendingActionList([{ value: "ฟังต่อ", pos: 1, color: 'white' }]);
            setCurrentDialogData({
                action: "sleep",
                speaker: null,
                dialog: "ดึกมากแล้ว... คุณง่วงนอนมากจนทนไม่ไหว จึงกลับมานอนพักผ่อนที่ห้อง"
            });
        }
    }, [player.time]);


    // โหลดหน้าจอใหม่เมื่อเวลาเปลี่ยน (เผื่อมี NPC เดินเข้ามาหรือออกไป)
    useEffect(() => {
        const isIdle = currentDialogData?.action === 'showText' && !isBattling && !isTransitioning && !isSleepingBlackScreen && !currentNpc && !wildEncounter && !displayedCharacter;
        if (isIdle) {
            loadLocationState(currentLocation);
        }
    }, [player.time]);


    // Ref สำหรับจัดการ Timer ป้องกันลูปพิมพ์ซ้ำซ้อน
    const timerRef = useRef(null)

    const npcList = npcData;

    const mapList = Object.values(mapData);
    const activeMap = mapList.find(m => m.id === currentLocation);
    const activeNpcs = npcList.filter(npc => getNpcLocation(npc, player.day || 1, player.time || 6) === currentLocation);
    const isIdleForSprites = currentDialogData?.action === 'showText' && !isBattling && !isTransitioning && !isSleepingBlackScreen && !currentNpc && !wildEncounter && !displayedCharacter;



    // ----------------------------------------------------
    // Iframe Battle Logic
    // ----------------------------------------------------
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'IFRAME_READY') {
                if (iframeRef.current && isBattling && wildEncounter) {
                    const playerPoke = generatePlayerTeam(player.team);
                    
                    let botTeamPacked;
                    if (wildEncounter.isTrainer) {
                        botTeamPacked = generatePlayerTeam(wildEncounter.team);
                    } else {
                        botTeamPacked = generatePlayerTeam([{

                        ...wildEncounter,
                        name: wildEncounter.species,
                        moves: wildEncounter.moves || ['tackle']
                    }]);
                    }

                    const playerPartyHp = player.team.map(p => p ? { hp: p.evs?.hp || 100, maxHp: p.evs?.hp || 100 } : null);

                    iframeRef.current.contentWindow.postMessage({
                        type: 'START_BATTLE',
                        playbotFormat: 'gen9customgame',
                        playerTeam: playerPoke,
                        botTeam: botTeamPacked,
                        playerName: player.name,
                        botName: wildEncounter.isTrainer ? wildEncounter.name : 'Wild ' + wildEncounter.species,
                        playerPartyHp: playerPartyHp
                    }, '*');
                    
                    setTimeout(() => setBattleReady(true), 1500);
                }
            }
            
            if (event.data && event.data.type === 'BATTLE_END') {
                const { win, defeatedEnemies, defeatedEnemyCount, turns, consumedItems } = event.data;
                setIsBattling(false);
                setBattleReady(false);

                // เพิ่มเวลา 30 นาทีต่อจำนวนเทิร์น (อย่างน้อย 1 เทิร์น)
                const battleTurns = turns || 1;
                advanceTime(battleTurns * (10 / 60));

                // Calculate EXP
                // iframe อาจส่งมาเป็น defeatedEnemies (array of species) หรือ defeatedEnemyCount (number)
                // fallback: ถ้าไม่มี array ให้ใช้ wildEncounter โดยตรง
                let totalGainedExp = 0;
                const a = wildEncounter?.isTrainer ? 1.5 : 1;

                if (defeatedEnemies && defeatedEnemies.length > 0) {
                    // กรณี iframe ส่ง array มาแบบสมบูรณ์
                    defeatedEnemies.forEach(enemy => {
                        const enemyStringName = typeof enemy === 'string' ? enemy : enemy.species;
                        let foundEnemyInTeam = null;
                        if (wildEncounter.isTrainer && wildEncounter.team) {
                            foundEnemyInTeam = wildEncounter.team.find(p =>
                                (p.nickname && p.nickname.toLowerCase() === enemyStringName.toLowerCase()) ||
                                p.species.toLowerCase() === enemyStringName.toLowerCase()
                            );
                        }
                        const actualSpecies = foundEnemyInTeam ? foundEnemyInTeam.species : enemyStringName;
                        const enemyData = pokemonData[actualSpecies.toLowerCase()];
                        const enemyLevel = foundEnemyInTeam ? foundEnemyInTeam.level : (typeof enemy === 'string' ? 5 : (enemy.level || 5));
                        const baseExp = enemyData?.baseExp || 60;
                        totalGainedExp += Math.floor((a * baseExp * enemyLevel) / 5);
                    });
                } else if (win && wildEncounter) {
                    // fallback: ใช้ข้อมูลทีมศัตรูจาก wildEncounter โดยตรง
                    // defeatedEnemyCount จาก iframe หรือนับทีมทั้งหมด (trainer) หรือ 1 (wild)
                    const numDefeated = defeatedEnemyCount ?? (wildEncounter.isTrainer && wildEncounter.enemyTeam ? wildEncounter.enemyTeam.length : 1);
                    if (wildEncounter.isTrainer && wildEncounter.enemyTeam) {
                        // นับ EXP จาก enemyTeam ทุกตัวที่แพ้
                        const enemiesToCount = wildEncounter.enemyTeam.slice(0, numDefeated);
                        enemiesToCount.forEach(enemy => {
                            const enemyData = pokemonData[(enemy.species || '').toLowerCase()];
                            const baseExp = enemyData?.baseExp || 60;
                            const enemyLevel = enemy.level || 5;
                            totalGainedExp += Math.floor((a * baseExp * enemyLevel) / 5);
                        });
                    } else {
                        // Wild encounter — ใช้ species/level ของ wildEncounter เอง
                        const enemyData = pokemonData[(wildEncounter.species || '').toLowerCase()];
                        const baseExp = enemyData?.baseExp || 60;
                        const enemyLevel = wildEncounter.level || 5;
                        totalGainedExp = Math.floor((a * baseExp * enemyLevel) / 5);
                    }
                }

                let isLevelUp = false;
                setPlayer(prev => {
                    const newPlayer = { ...prev };
                    let nonNullIndex = 0;
                    newPlayer.team = prev.team.map(poke => {
                        if (!poke) return null;
                        let updatedPoke = { ...poke };

                        // อัปเดตไอเทม: ลบไอเทมออกเฉพาะโปเกม่อนตัวที่ใช้เบอร์รี่/ไอเทมไปจริง ๆ ในการต่อสู้ (consumedItems เป็น true)
                        if (consumedItems && Array.isArray(consumedItems)) {
                            if (consumedItems[nonNullIndex] === true) {
                                updatedPoke.item = '';
                            }
                        }
                        nonNullIndex++;

                        if (totalGainedExp > 0) {
                            const { levelCap } = getPhaseLimits(prev.phase || 1);
                            let currentBaseExp = Math.floor((4 * Math.pow(updatedPoke.level, 3)) / 5);
                            let newTotalExp = (updatedPoke.totalExp || currentBaseExp + (updatedPoke.exp || 0)) + totalGainedExp;
                            
                            let newLevel = updatedPoke.level;
                            let nextLvlExp = Math.floor((4 * Math.pow(newLevel + 1, 3)) / 5);
                            
                            while (newTotalExp >= nextLvlExp && newLevel < levelCap) {
                                newLevel++;
                                nextLvlExp = Math.floor((4 * Math.pow(newLevel + 1, 3)) / 5);
                                isLevelUp = true;
                            }
                            if (newLevel >= levelCap) {
                                newLevel = levelCap;
                                const maxAllowedExp = Math.floor((4 * Math.pow(levelCap + 1, 3)) / 5) - 1;
                                if (newTotalExp > maxAllowedExp) newTotalExp = maxAllowedExp;
                            }
                            updatedPoke = { ...updatedPoke, totalExp: newTotalExp, exp: newTotalExp - Math.floor((4 * Math.pow(newLevel, 3)) / 5), level: newLevel };
                        }
                        return updatedPoke;
                    });
                    // เพิ่ม points เมื่อชนะ (1 pt ต่อ EXP ที่ได้)
                    if (win && totalGainedExp > 0) {
                        newPlayer.points = (newPlayer.points || 0) + totalGainedExp;
                    }
                    return newPlayer;
                });

                if (wildEncounter.isTrainer) {
                    // Trainer battle end logic
                    const nextNodeId = win ? wildEncounter.nextNode_win : wildEncounter.nextNode_lose;
                    setWildEncounter(null); // Reset wildEncounter so active pushed characters are rendered on screen

                    if (nextNodeId && currentNpc) {
                        const currentScript = getCurrentScript(currentNpc, player.phase, currentLocation, player.time);
                        const nextStep = currentScript.find(item => item.node === nextNodeId);
                        if (nextStep) {
                            setCurrentNode(nextStep.node);
                            processScriptStep(nextStep, currentNpc, [
                                { value: "ฟังต่อ", pos: 1, color: 'white' }
                            ]);
                        } else {
                            loadLocationState(currentLocation);
                        }
                    } else {
                        loadLocationState(currentLocation);
                    }
                    
                    const msg = win 
                        ? `คุณเอาชนะ ${wildEncounter.name} ได้สำเร็จ! ได้รับ ${totalGainedExp} EXP` 
                        : `คุณพ่ายแพ้ให้กับ ${wildEncounter.name}... แต่ก็ได้รับ ${totalGainedExp} EXP สำหรับโปเกม่อนที่ล้มได้`;
                    
                    // Update dialog manually to show EXP gain if there is no next node dialog taking precedence immediately
                } else {
                    if (win) {
                        setPostBattlePhase('victory');
                        setCurrentDialogData({
                            action: "talk",
                            speaker: null,
                            dialog: `คุณเอาชนะ ${wildEncounter.species} ได้สำเร็จ! ได้รับ ${totalGainedExp} EXP`
                        });
                        setPendingActionList([
                            { value: "พยายามจับ", pos: 1, color: '#38bdf8' },
                            { value: "ปล่อยหนีไป", pos: 0, color: 'gray' }
                        ]);
                    } else {
                        setWildEncounter(null);
                        setCurrentDialogData({
                            action: "talk",
                            speaker: null,
                            dialog: `คุณพ่ายแพ้ให้กับ ${wildEncounter.species}... แต่ก็ได้รับ ${totalGainedExp} EXP สำหรับโปเกม่อนที่ล้มได้`
                        });
                        setPendingActionList([
                            { value: "ตื่นขึ้นมาที่ห้อง", pos: 0, color: 'red', mapId: 'bedroom' }
                        ]);
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isBattling, wildEncounter, player, currentLocation]);

    // ----------------------------------------------------
    // Typewriter Effect Logic
    // ----------------------------------------------------
    useEffect(() => {
        // หากอยู่ในช่วง Transition ยังไม่ต้องแสดงข้อความหรือปุ่ม
        if (isTransitioning) return

        const fullText = currentDialogData?.dialog || ''

        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        
        if (!fullText) {
            setDisplayedText('')
            setIsTyping(false)
            return
        }

        // ถ้าเป็น action: "showText" ให้แสดงข้อความทั้งหมดทันที
        if (currentDialogData?.action === 'showText') {
            setDisplayedText(fullText)
            setIsTyping(false)

            if (pendingActionListRef.current) {
                setActionList(pendingActionListRef.current)
                setPendingActionList(null)
            }
            return
        }

        // กรณี action อื่นๆ (เช่น talk) ให้ค่อยๆ พิมพ์ตามเดิม
        setDisplayedText('')
        setIsTyping(true)
        let currentIndex = 0

        timerRef.current = setInterval(() => {
            currentIndex++
            
            if (currentIndex <= fullText.length) {
                setDisplayedText(fullText.slice(0, currentIndex))
            }

            if (currentIndex >= fullText.length) {
                setIsTyping(false)
                clearInterval(timerRef.current)

                if (pendingActionListRef.current) {
                    setActionList(pendingActionListRef.current)
                    setPendingActionList(null)
                }
            }
        }, 30)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [currentDialogData, isTransitioning])

    // ----------------------------------------------------
    // Script Step Handler (ประมวลผล action แต่ละประเภท)
    // ----------------------------------------------------
    const processScriptStep = (stepData, npcObj = currentNpc, pendingActionsToSet = null) => {
        if (!stepData) {
            loadLocationState(currentLocation)
            return
        }

        if (stepData.action === "talk" || stepData.action === "showText") {
            setCurrentDialogData(stepData)
            if (pendingActionsToSet) setPendingActionList(pendingActionsToSet)
        } 
        else if (stepData.action === "choice") {
            setCurrentDialogData(stepData);
            if (stepData.choices) {
                const choiceActions = stepData.choices.map(c => ({
                    value: c.text,
                    pos: 1,
                    color: c.color || 'white',
                    customNextNode: c.nextNode
                }));
                setPendingActionList(choiceActions);
            }
        }
        else if (stepData.action === "battle") {
            setDisplayedCharacter(null);
            setWildEncounter({
                isTrainer: true,
                name: npcObj.name,
                team: stepData.enemyTeam,
                nextNode_win: stepData.nextNode_win,
                nextNode_lose: stepData.nextNode_lose
            });
            setIsBattling(true);
            setBattleReady(false);
        }
        else if (stepData.action === "push_charactor" || stepData.action === "push_character") {
            setCurrentDialogData({
                action: "push_character",
                speaker: null,
                dialog: ""
            });

            // Parse character(s) to push: single ID, comma-separated string, or array
            let rawChars = stepData.characters || stepData.character || npcObj.id;
            let charsToAdd = [];
            if (Array.isArray(rawChars)) {
                charsToAdd = rawChars;
            } else if (typeof rawChars === 'string') {
                charsToAdd = rawChars.split(',').map(s => s.trim()).filter(Boolean);
            }
            const pushName = stepData.name || stepData.speaker || null;

            setDisplayedCharacters(prev => {
                const currentList = Array.isArray(prev) ? [...prev] : (prev ? [prev] : []);
                charsToAdd.forEach(c => {
                    const charId = typeof c === 'string' ? c : c.id;
                    const charName = (typeof c === 'object' && c.name) ? c.name : (pushName || charId);

                    const existingIdx = currentList.findIndex(item => (typeof item === 'string' ? item : item.id) === charId);
                    if (existingIdx >= 0) {
                        currentList[existingIdx] = { id: charId, name: charName };
                    } else {
                        currentList.push({ id: charId, name: charName });
                    }
                });
                return currentList;
            });
            setIsLeaving(false);

            if (stepData.nextNode) {
                setActionList([]); // ลบ action บนจอออกทันที
                setPendingActionList([]); // ลบแอคชั่นออกระหว่างรอนิเมชั่นตัวละครโผล่
                setTimeout(() => {
                    const nextStep = getScriptStepByNode(npcObj, stepData.nextNode, player.phase, currentLocation, player.time);
                    if (nextStep) {
                        setCurrentNode(nextStep.node);
                        processScriptStep(nextStep, npcObj, pendingActionsToSet);
                    }
                }, 600);
            } else if (pendingActionsToSet) {
                setPendingActionList(pendingActionsToSet);
            }
        }
        else if (stepData.action === "pop_charactor" || stepData.action === "pop_character" || stepData.action === "pop_char") {
            let rawChars = stepData.characters || stepData.character;
            let charsToPop = [];
            if (Array.isArray(rawChars)) {
                charsToPop = rawChars;
            } else if (typeof rawChars === 'string' && rawChars.trim() && rawChars !== 'all') {
                charsToPop = rawChars.split(',').map(s => s.trim()).filter(Boolean);
            }

            setActionList([]); // ลบ action บนจอออกทันที
            setPendingActionList([]); // ลบแอคชั่นออกระหว่างรอนิเมชั่นตัวละครหุบกลับ

            if (charsToPop.length > 0) {
                // Pop specific characters
                setLeavingCharacters(charsToPop);
                setTimeout(() => {
                    setDisplayedCharacters(prev => {
                        const currentList = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                        return currentList.filter(c => {
                            const cId = typeof c === 'string' ? c : c.id;
                            const cName = (typeof c === 'object' && c.name) ? c.name : cId;
                            const cleanCId = cId.toLowerCase().replace('gym_', '').replace('tm_', '').replace('npc_', '');
                            return !charsToPop.some(popItem => {
                                const target = popItem.toLowerCase();
                                const cleanTarget = target.replace('gym_', '').replace('tm_', '').replace('npc_', '');
                                return target === cId.toLowerCase() || target === cName.toLowerCase() || cleanTarget === cleanCId;
                            });
                        });
                    });
                    setLeavingCharacters([]);
                    if (stepData.nextNode) {
                        const nextStep = getScriptStepByNode(npcObj, stepData.nextNode, player.phase, currentLocation, player.time);
                        if (nextStep) {
                            setCurrentNode(nextStep.node);
                            processScriptStep(nextStep, npcObj, pendingActionsToSet);
                        }
                    } else {
                        loadLocationState(currentLocation);
                    }
                }, 400);
            } else {
                // Pop ALL characters
                setIsLeaving(true);
                setTimeout(() => {
                    setDisplayedCharacters([]);
                    setIsLeaving(false);
                    if (stepData.nextNode) {
                        const nextStep = getScriptStepByNode(npcObj, stepData.nextNode, player.phase, currentLocation, player.time);
                        if (nextStep) {
                            setCurrentNode(nextStep.node);
                            processScriptStep(nextStep, npcObj, pendingActionsToSet);
                        }
                    } else {
                        loadLocationState(currentLocation);
                    }
                }, 400);
            }
        }
        else if (stepData.action === "event") {
            if (stepData.eventType === "increase_phase") {
                setPlayer(prev => ({ ...prev, phase: (prev.phase || 1) + 1, points: (prev.points || 0) + 1000 }));
            }
            else if (stepData.eventType === "give_points") {
                const amount = stepData.amount || 0;
                setPlayer(prev => ({ ...prev, points: (prev.points || 0) + amount }));
            }
            else if (stepData.eventType === "heal_pokemon") {
                setPlayer(prev => ({
                    ...prev,
                    team: prev.team.map(p => p ? { ...p, hp: p.evs?.hp || 100 } : null)
                }));
            }

            setCurrentDialogData({
                action: "talk",
                speaker: stepData.speaker || null,
                dialog: stepData.dialog || (stepData.eventType === "give_points" ? `ได้รับ ${(stepData.amount || 0).toLocaleString()} pts!` : "")
            });
            if (pendingActionsToSet) {
                setPendingActionList(pendingActionsToSet);
            } else {
                setPendingActionList([
                    { value: "ฟังต่อ", pos: 1, color: 'white' }
                ]);
            }
        }
        else if (stepData.action === "menu_mart") {
            const tabs = stepData.tabs || [];
            setShopCatalog(tabs);
            setShopTab(tabs[0]?.key || '');
            setIsShopOpen(true);
            setCurrentDialogData({
                action: "talk",
                speaker: stepData.speaker || null,
                dialog: stepData.dialog || "เลือกดูสินค้าได้เลย"
            });
            if (pendingActionsToSet) {
                setPendingActionList(pendingActionsToSet);
            } else {
                setPendingActionList([
                    { value: "ฟังต่อ", pos: 1, color: 'white' }
                ]);
            }
        }
    }

    const triggerEncounter = (type) => {
        const currentMap = mapList.find(m => m.id === currentLocation)
        const list = currentMap?.encounters?.[type]
        if (list && list.length > 0) {
            const totalWeight = list.reduce((acc, e) => acc + (Number(e.chance || e.rate) || 1), 0);
            let r = Math.random() * totalWeight;
            let encounter = list[0];
            for (const e of list) {
                const weight = Number(e.chance || e.rate) || 1;
                if (r < weight) {
                    encounter = e;
                    break;
                }
                r -= weight;
            }
            const level = Math.floor(Math.random() * (encounter.maxLv - encounter.minLv + 1)) + encounter.minLv
            
            // ดึงท่าจาก pokemonData
            const pData = pokemonData[encounter.species.toLowerCase()];
            let latest4Moves = ['tackle']; // Default
            if (pData && pData.learnset) {
                // กรองเอาท่าที่ level ไม่เกิน level ปัจจุบัน
                const validMoves = pData.learnset.filter(m => m.level <= level);
                // เรียงจาก level มากไปน้อย
                validMoves.sort((a, b) => b.level - a.level);
                // เก็บชื่อท่า เอาแค่ไม่ซ้ำกัน
                const uniqueMoves = [];
                for (const m of validMoves) {
                    if (!uniqueMoves.includes(m.move)) {
                        uniqueMoves.push(m.move);
                    }
                }
                if (uniqueMoves.length > 0) {
                    latest4Moves = uniqueMoves.slice(0, 4);
                }
            }

            let ability = "unknown";
            if (pData && pData.abilities && pData.abilities.length > 0) {
                ability = pData.abilities[Math.floor(Math.random() * pData.abilities.length)];
            }
            
            const randomNature = natureNames[Math.floor(Math.random() * natureNames.length)];
            
            const ivs = {
                hp: Math.floor(Math.random() * 32),
                atk: Math.floor(Math.random() * 32),
                def: Math.floor(Math.random() * 32),
                spa: Math.floor(Math.random() * 32),
                spd: Math.floor(Math.random() * 32),
                spe: Math.floor(Math.random() * 32)
            };
            
            const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

            setWildEncounter({ 
                ...encounter, 
                level, 
                moves: latest4Moves,
                ability,
                nature: randomNature,
                ivs,
                evs
            })
            setCurrentDialogData({
                action: "choice",
                speaker: null,
                dialog: `อ๊ะ! ${encounter.species} ป่า (Lv.${level}) ปรากฏตัวออกมา!`
            })
            setPendingActionList([
                { value: "ต่อสู้", pos: 1, color: '#ef4444' },
                { value: "หนี", pos: 1, color: 'white' }
            ])
            setCurrentNpc(null)
        } else {
            setCurrentDialogData({
                action: "choice",
                speaker: null,
                dialog: `คุณไม่พบอะไรเลย...`
            })
            const baseActions = [...(currentMap?.action || [])]
            setPendingActionList(baseActions)
        }
    }

    const triggerSpecificEncounter = (species, encounterObj) => {
        advanceTime(10 / 60); // 10 mins
        const encounter = encounterObj || { species, minLv: 5, maxLv: 10 };
        const level = Math.floor(Math.random() * ((encounter.maxLv || 10) - (encounter.minLv || 5) + 1)) + (encounter.minLv || 5);
        
        const pData = pokemonData[species.toLowerCase()] || pokemonData[encounter.species?.toLowerCase()];
        let latest4Moves = ['tackle'];
        if (pData && pData.learnset) {
            const validMoves = pData.learnset.filter(m => m.level <= level);
            validMoves.sort((a, b) => b.level - a.level);
            const uniqueMoves = [];
            for (const m of validMoves) {
                if (!uniqueMoves.includes(m.move)) {
                    uniqueMoves.push(m.move);
                }
            }
            if (uniqueMoves.length > 0) {
                latest4Moves = uniqueMoves.slice(0, 4);
            }
        }

        let ability = "unknown";
        if (pData && pData.abilities && pData.abilities.length > 0) {
            ability = pData.abilities[Math.floor(Math.random() * pData.abilities.length)];
        }
        
        const randomNature = natureNames[Math.floor(Math.random() * natureNames.length)];
        
        const ivs = {
            hp: Math.floor(Math.random() * 32),
            atk: Math.floor(Math.random() * 32),
            def: Math.floor(Math.random() * 32),
            spa: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32),
            spe: Math.floor(Math.random() * 32)
        };
        
        const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

        setWildEncounter({ 
            ...encounter, 
            species: species || encounter.species,
            level, 
            moves: latest4Moves,
            ability,
            nature: randomNature,
            ivs,
            evs
        });
        setCurrentDialogData({
            action: "choice",
            speaker: null,
            dialog: `อ๊ะ! ${species || encounter.species} ป่า (Lv.${level}) ปรากฏตัวออกมา!`
        });
        setPendingActionList([
            { value: "ต่อสู้", pos: 1, color: '#ef4444' },
            { value: "หนี", pos: 1, color: 'white' }
        ]);
        setCurrentNpc(null);
    };

    const handleNpcClick = (targetNpc) => {
        if (isBattling || wildEncounter || currentNpc || isTransitioning || !targetNpc) return;
        setActionList([]); // ลบ action บนจอออกทันทีที่กดคลิก
        setPendingActionList([]); // ลบ action ก่อนหน้าทันที เพื่อป้องกันการกดปุ่มอื่นรัวๆ แล้วเกิดบัค
        advanceTime(10 / 60);
        setCurrentNpc(targetNpc);
        const currentScript = getCurrentScript(targetNpc, player.phase, currentLocation, player.time);
        const firstStep = currentScript.find(item => item.node === 1) || currentScript[0];
        if (firstStep) {
            setCurrentNode(firstStep.node);
            processScriptStep(firstStep, targetNpc, [
                { value: "ฟังต่อ", pos: 1, color: 'white' }
            ]);
        }
    };

    const handlePokemonClick = (poke) => {
        if (isBattling || wildEncounter || currentNpc || isTransitioning || !poke || !poke.species) return;
        setActionList([]); // ลบ action บนจอออกทันทีที่กดคลิก
        setPendingActionList([]); // ลบ action ก่อนหน้าทันที เพื่อป้องกันการกดปุ่มอื่นรัวๆ แล้วเกิดบัค
        triggerSpecificEncounter(poke.species, poke.encounter);
    };

    const loadLocationState = (locId) => {
        const currentMap = mapList.find(m => m.id === locId)
        if (!currentMap) return

        const baseActions = [...currentMap.action]
        if (!baseActions.some(a => (typeof a === 'string' ? a : a.value) === "รอเวลา")) {
            baseActions.push({ value: "รอเวลา", pos: 1, color: '#38bdf8' });
        }

        const npcsInLocation = npcList.filter(npc => getNpcLocation(npc, playerRef.current?.day || 1, playerRef.current?.time || 6) === locId)

        setPendingActionList([...baseActions])

        setCurrentDialogData({
            action: "showText",
            speaker: null,
            dialog: `คุณอยู่ที่ ${currentMap.name} ทำอะไรต่อดี`
        })
        setCurrentNpc(null)
        setWildEncounter(null)
        setDisplayedCharacter(null)
        setDisplayedCharacters([])
        setLeavingCharacters([])
    }

    // ฟังก์ชันย้ายแมพพร้อม Push Up Transition (BG เก่าเลื่อนขึ้น BG ใหม่ดันตามขึ้นมา)
    const changeMapWithTransition = (targetMapId) => {
        const curMapObj = mapList.find(m => m.id === currentLocation)
        const nextMapObj = mapList.find(m => m.id === targetMapId)

        setPreviousMapUrl(curMapObj?.url || '')
        setNextMapUrl(nextMapObj?.url || '')
        
        setActionList([])
        setDisplayedText('')
        setIsTransitioning(true)

        // ระยะเวลาเลื่อนสไลด์ขึ้น 0.8 วินาที
        setTimeout(() => {
            setCurrentLocation(targetMapId)
            loadLocationState(targetMapId)
            setIsTransitioning(false)
        }, 800)
    }

    useEffect(() => {
        loadLocationState(currentLocation)
    }, [])

    // ฟังก์ชันเพิ่มเวลา
    const advanceTime = (hours) => {
        setPlayer(prev => {
            let newTime = (prev.time || 6) + hours;
            
            return {
                ...prev,
                time: newTime
            };
        });
    };

    // เช็ค action 
    const handleActionClick = (actionItem) => {
        if (isTyping || isTransitioning) return

        if (actionItem.actionType === "open_shop" || actionItem.value === "เปิดร้านค้า") {
            setIsShopOpen(true);
            return;
        }
        else if (actionItem.value === "ฟังต่อ") {
            if (currentNpc) {
                // หา Step ปัจจุบันที่กำลังแสดงผลอยู่
                const currentStep = getScriptStepByNode(currentNpc, currentNode, player.phase, currentLocation, player.time);
                
                // เช็คว่ามี nextNode หรือไม่
                if (currentStep && currentStep.nextNode !== null && currentStep.nextNode !== undefined) {
                    const nextStep = getScriptStepByNode(currentNpc, currentStep.nextNode, player.phase, currentLocation, player.time);
                    if (nextStep) {
                        setCurrentNode(nextStep.node);
                        processScriptStep(nextStep, currentNpc, [
                            { value: "ฟังต่อ", pos: 1, color: 'white' }
                        ]);
                    } else {
                        loadLocationState(currentLocation);
                    }
                } else {
                    loadLocationState(currentLocation);
                }
            } else {
                loadLocationState(currentLocation);
            }
        } 
        else if (actionItem.value === "นอน") {
            setIsSleepingBlackScreen(true);
            setPendingActionList([{ value: "ฟังต่อ", pos: 1, color: 'white' }]);
            setCurrentDialogData({
                action: "sleep",
                speaker: null,
                dialog: "คุณได้นอนหลับพักผ่อนอย่างเต็มอิ่ม... เช้าวันใหม่เริ่มต้นขึ้นแล้ว!"
            });
        }
        else if (actionItem.value === "บันทึกข้อมูล" || actionItem.value === "บันทึก") {
            fetch('/api/save-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setPendingActionList([{ value: "ฟังต่อ", pos: 1, color: 'white' }]);
                    setCurrentDialogData({
                        action: "talk",
                        speaker: null,
                        dialog: `บันทึกข้อมูลของ "${player.name}" ลงในไฟล์ player.json ในระบบเรียบร้อยแล้ว!`
                    });
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })
            .catch(err => {
                console.error('Save error:', err);
                setPendingActionList([{ value: "ฟังต่อ", pos: 1, color: 'white' }]);
                setCurrentDialogData({
                    action: "talk",
                    speaker: null,
                    dialog: `เกิดข้อผิดพลาดในการบันทึกข้อมูลลงไฟล์ player.json: ${err.message}`
                });
            });
        }
        else if (actionItem.value === "ออกจากการสนทนา") {
            loadLocationState(currentLocation)
        } 
        else if (actionItem.value === "รอเวลา" || actionItem.value === "รอ") {
            const curHour = player.time || 6;
            const maxMins = Math.max(0, Math.floor((24 - curHour) * 60));
            setWaitMinutes(Math.min(30, maxMins > 0 ? maxMins : 0));
            setIsWaitModalOpen(true);
            return;
        }
        else if (actionItem.value === "สำรวจ") {
            advanceTime(10 / 60); // 10 mins
            triggerEncounter('grass')
        }
        else if (actionItem.value === "ตกปลา") {
            advanceTime(10 / 60); // 10 mins
            triggerEncounter('water')
        }
        else if (actionItem.value === "พยายามจับ") {
            const catchActions = [];
            if (player.inventory && player.inventory.pokeball) {
                const searchName = wildEncounter.species.toLowerCase().replace(/[^a-z0-9]/g, '');
                const pData = pokemonData[searchName] || pokemonData[wildEncounter.species.toLowerCase()];
                const catchRate = pData?.catchRate || 45;
                
                const ballBonusMap = {
                    'pokeball': 1,
                    'greatball': 1.5,
                    'ultraball': 2,
                    'masterball': 255
                };

                player.inventory.pokeball.forEach(ball => {
                    if (ball.quantity > 0) {
                        const bonus = ballBonusMap[ball.id] || 1;
                        const rawPercent = (catchRate * bonus / 255) * 100;
                        const percent = Math.min(100, Math.floor(rawPercent));
                        
                        catchActions.push({
                            actionType: 'catch',
                            value: ball.id.charAt(0).toUpperCase() + ball.id.slice(1),
                            pos: 1,
                            color: '#38bdf8',
                            icon: ball.id,
                            percent: percent,
                            ballId: ball.id
                        });
                    }
                });
            }
            
            setPendingActionList([
                ...catchActions,
                { value: "ยกเลิกการจับ", pos: 0, color: 'red' }
            ]);
            
            setCurrentDialogData({
                action: "choice",
                speaker: null,
                dialog: "เลือกลูกบอลที่จะใช้จับ:"
            });
        }
        else if (actionItem.value === "ยกเลิกการจับ") {
            setPendingActionList([
                { value: "พยายามจับ", pos: 1, color: '#38bdf8' },
                { value: "ปล่อยหนีไป", pos: 0, color: 'gray' }
            ]);
            setCurrentDialogData({
                action: "choice",
                speaker: null,
                dialog: `เอาไงต่อดีกับ ${wildEncounter.species}?`
            });
        }
        else if (actionItem.actionType === 'catch') {
            const ballId = actionItem.ballId;
            const percent = actionItem.percent;
            const success = (Math.random() * 100) < percent;
            
            setPlayer(prev => {
                const newPlayer = JSON.parse(JSON.stringify(prev)); 
                if (newPlayer.inventory && newPlayer.inventory.pokeball) {
                    const ballIndex = newPlayer.inventory.pokeball.findIndex(b => b.id === ballId);
                    if (ballIndex !== -1) {
                        newPlayer.inventory.pokeball[ballIndex].quantity -= 1;
                    }
                }
                
                if (success) {
                    const newPokemon = {
                        ...wildEncounter, // Spread all wildEncounter stats (hp, level, ivs, evs, moves, nature, etc.)
                        nickname: wildEncounter.name || wildEncounter.species,
                        item: "",
                        next_exp: Math.pow(wildEncounter.level || 5, 3)
                    };
                    
                    // Clean up properties that are only for wild battles
                    delete newPokemon.isTrainer;
                    delete newPokemon.trainerName;
                    
                    const activeCount = newPlayer.team.filter(x => x).length;
                    const { maxSlot } = getPhaseLimits(newPlayer.phase || 1);
                    if (activeCount < maxSlot) {
                        const emptyIdx = newPlayer.team.findIndex(x => !x);
                        if (emptyIdx !== -1) {
                            newPlayer.team[emptyIdx] = newPokemon;
                        } else if (newPlayer.team.length < 6) {
                            newPlayer.team.push(newPokemon);
                        }
                    } else {
                        let added = false;
                        for (let b = 0; b < newPlayer.pc_boxes.length; b++) {
                            for (let s = 0; s < newPlayer.pc_boxes[b].length; s++) {
                                if (!newPlayer.pc_boxes[b][s]) {
                                    newPlayer.pc_boxes[b][s] = newPokemon;
                                    added = true;
                                    break;
                                }
                            }
                            if (added) break;
                        }
                        if (!added) {
                            const newBox = Array(30).fill(null);
                            newBox[0] = newPokemon;
                            newPlayer.pc_boxes.push(newBox);
                        }
                    }
                }
                
                return newPlayer;
            });
            
            if (success) {
                setCurrentDialogData({
                    action: "talk",
                    speaker: null,
                    dialog: `ทำได้แล้ว! จับ ${wildEncounter.species} ได้สำเร็จ!`
                });
                setPendingActionList([]);
                setIsLeaving(true);
                setTimeout(() => {
                    setIsLeaving(false);
                    setPostBattlePhase(null);
                    setWildEncounter(null);
                    loadLocationState(currentLocation);
                }, 2000);
            } else {
                setCurrentDialogData({
                    action: "choice",
                    speaker: null,
                    dialog: `อ๊ะ! ${wildEncounter.species} ดิ้นหลุดออกมาได้... เอาไงต่อดี?`
                });
                
                const currentBall = player.inventory?.pokeball?.find(b => b.id === ballId);
                const isLastBall = currentBall && currentBall.quantity <= 1;
                
                const updatedActionList = actionList.filter(a => {
                    if (isLastBall && a.ballId === ballId) return false;
                    return true;
                });
                
                setPendingActionList(updatedActionList);
            }
        }
        else if (actionItem.value === "ปล่อยหนีไป") {
            setIsLeaving(true)
            setPendingActionList([])
            setTimeout(() => {
                setIsLeaving(false)
                setPostBattlePhase(null)
                loadLocationState(currentLocation)
            }, 400)
        }
        else if (actionItem.value === "หนี") {
            setIsLeaving(true)
            setPendingActionList([])
            setTimeout(() => {
                setIsLeaving(false)
                loadLocationState(currentLocation)
            }, 400)
        }
        else if (actionItem.value === "ต่อสู้") {
            setIsBattling(true)
            setBattleReady(false)
        }
        else if (actionItem.customNextNode !== undefined) {
            const targetNpc = currentNpc;
            if (targetNpc) {
                const nextStep = getScriptStepByNode(targetNpc, actionItem.customNextNode, player.phase, currentLocation, player.time);
                if (nextStep) {
                    setCurrentNode(nextStep.node)
                    processScriptStep(nextStep, targetNpc, [
                        { value: "ฟังต่อ", pos: 1, color: 'white' }
                    ])
                } else {
                    loadLocationState(currentLocation)
                }
            }
        }
        else if (actionItem.value.startsWith("คุยกับ ")) {
            advanceTime(10 / 60); // 10 mins for talking
            
            const targetNpc = npcList.find(npc => npc.id === actionItem.npcId || actionItem.value.includes(npc.name))
            if (targetNpc) {
                setCurrentNpc(targetNpc)
                
                // เริ่มที่ Node แรก ( Node 1 )
                const currentScript = getCurrentScript(targetNpc, player.phase, currentLocation, player.time);
                const firstStep = currentScript.find(item => item.node === 1) || currentScript[0]
                if (firstStep) {
                    setCurrentNode(firstStep.node)
                    processScriptStep(firstStep, targetNpc, [
                        { value: "ฟังต่อ", pos: 1, color: 'white' }
                    ])
                }
            }
        }
        else if (actionItem.value === "ออกจากที่นี่") {
            const mapActions = mapList
                .filter(m => m.id !== currentLocation)
                .map(m => ({
                    value: `ไป ${m.name}`,
                    mapId: m.id,
                    pos: 1,
                    color: '#eebd53'
                }))

            setPendingActionList([
                ...mapActions,
                { value: "ยกเลิก", pos: 0, color: 'white' }
            ])

            setCurrentDialogData({
                action: "showText",
                speaker: null,
                dialog: 'เลือกสถานที่ที่ต้องการเดินทางไป:'
            })
        } 
        else if (actionItem.value.startsWith("ไป ")) {
            advanceTime(10 / 60); // 10 mins for travel
            changeMapWithTransition(actionItem.mapId)
        } 
        else if (actionItem.value === "ยกเลิก") {
            loadLocationState(currentLocation)
        } 
        else {
            setCurrentDialogData({
                action: "action",
                dialog: `คุณทำกิจกรรม: ${actionItem.value}`
            })
        }
    }

    const handleDialogClick = () => {
        if (isTyping) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            setIsTyping(false);
            
            if (currentDialogData?.dialog) {
                setDisplayedText(currentDialogData.dialog);
            }
            
            if (pendingActionListRef.current) {
                setActionList(pendingActionListRef.current);
                setPendingActionList(null);
            }
        } else {
            if (currentDialogData?.action === 'sleep') {
                setPlayer(prev => ({
                    ...prev,
                    time: 6,
                    day: (prev.day || 1) + 1
                }));
                setCurrentLocation('bedroom');
                loadLocationState('bedroom');
                setIsSleepingBlackScreen(false);
            } else if (currentDialogData?.action === 'choice') {
                // Do nothing, force user to click the choice buttons
                return;
            } else {
                const nextAction = actionList.find(a => a.value === "ฟังต่อ");
                if (nextAction) {
                    handleActionClick(nextAction);
                } else if (actionList.length > 0) {
                    // Force user to click the available action buttons
                    return;
                } else {
                    loadLocationState(currentLocation);
                }
            }
        }
    };

    const topActions = actionList.filter(item => item.pos === 1 && item.value !== "ฟังต่อ")
    const bottomActions = actionList.filter(item => item.pos === 0)

    if (isAssetsLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', bgcolor: '#0b0c10', color: 'white', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <Box sx={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: 2 }}>LOADING ASSETS</Box>
                <Box sx={{ width: '300px', height: '8px', bgcolor: '#222', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ width: `${loadingProgress}%`, height: '100%', bgcolor: '#38bdf8', transition: 'width 0.1s' }} />
                </Box>
                <Box sx={{ color: 'gray', fontSize: '0.9rem', fontWeight: 'bold' }}>{loadingProgress}%</Box>
            </Box>
        )
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#0b0c10', color: 'white' }}>
            
            {/* Header / Top Bar */}
            <Box sx={{ 
                height: 50, 
                bgcolor: '#15181f', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                px: 3,
                borderBottom: '1px solid #222'
            }}>
                <Box>
                    วันที่ {Math.floor(displayAT / 24) + 1} - เวลา {
                        (() => {
                            const t = (displayAT % 24) + 6;
                            const displayTime = t % 24;
                            const hrs = Math.floor(displayTime);
                            const mins = Math.round((displayTime - hrs) * 60);
                            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                        })()
                    } น.
                </Box>
                <Box>สถานที่ปัจจุบัน: {mapList.find(m => m.id === currentLocation)?.name || currentLocation}</Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {/* Points Display */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        border: '1px solid #333',
                        borderRadius: 1.5, overflow: 'hidden',
                        transition: 'box-shadow 0.3s',
                        boxShadow: pointsBump ? '0 0 8px rgba(251,191,36,0.6)' : 'none',
                    }}>
                        <Box sx={{
                            bgcolor: '#1e2028', px: 1, py: 0.4,
                            fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: 1,
                            color: '#888', borderRight: '1px solid #333',
                            textTransform: 'uppercase',
                        }}>PTS</Box>
                        <Box sx={{
                            bgcolor: '#13151c', px: 1.5, py: 0.4,
                            fontWeight: 'bold', fontSize: '0.9rem',
                            color: pointsBump ? '#fbbf24' : '#e2c97e',
                            letterSpacing: 0.5,
                            fontFamily: 'monospace',
                            transition: 'color 0.3s',
                            minWidth: 60, textAlign: 'right',
                        }}>
                            {displayPoints.toLocaleString()}
                        </Box>
                    </Box>
             
                    <Button 
                        variant="outlined" 
                        onClick={() => { setIsTeamOpen(true); setSelectedTeamIndex(0); }}
                        sx={{ 
                            fontWeight: 'bold', display: 'flex', alignItems: 'center',
                            color: '#fbbf24',
                            borderColor: '#fbbf24 !important',
                            borderWidth: '1.5px',
                            bgcolor: 'rgba(251, 191, 36, 0.08)',
                            borderRadius: '4px',
                            minHeight: 0,
                            px: 1.2,
                            py: 0.1,
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: '#fbbf24 !important',
                                bgcolor: 'rgba(251, 191, 36, 0.2)',
                                boxShadow: '0 0 10px rgba(251, 191, 36, 0.35)'
                            }
                        }}
                    >
                        ทีม
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => { setIsPcOpen(true); setSelectedPcSlot(null); setCurrentPcBox(0); }}
                        sx={{ 
                            fontWeight: 'bold', display: 'flex', alignItems: 'center',
                            color: '#38bdf8',
                            borderColor: '#38bdf8 !important',
                            borderWidth: '1.5px',
                            bgcolor: 'rgba(56, 189, 248, 0.08)',
                            borderRadius: '4px',
                            minHeight: 0,
                            px: 1.2,
                            py: 0.1,
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: '#38bdf8 !important',
                                bgcolor: 'rgba(56, 189, 248, 0.2)',
                                boxShadow: '0 0 10px rgba(56, 189, 248, 0.35)'
                            }
                        }}
                    >
                        กล่อง
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => setIsBagOpen(true)}
                        sx={{ 
                            fontWeight: 'bold', display: 'flex', alignItems: 'center',
                            color: '#4ade80',
                            borderColor: '#4ade80 !important',
                            borderWidth: '1.5px',
                            bgcolor: 'rgba(74, 222, 128, 0.08)',
                            borderRadius: '4px',
                            minHeight: 0,
                            px: 1.2,
                            py: 0.1,
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: '#4ade80 !important',
                                bgcolor: 'rgba(74, 222, 128, 0.2)',
                                boxShadow: '0 0 10px rgba(74, 222, 128, 0.35)'
                            }
                        }}
                    >
                        กระเป๋า
                    </Button>
                </Box>
            </Box>

            {/* Main Middle Section */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                
                {/* Left Sidebar (Party) */}
                <Box sx={{ 
                    width: '15%',
                    bgcolor: '#11131a', 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderRight: '1px solid #222',
                    overflowY: 'auto'
                }}>
                    {/* จัดกลุ่มข้อความหัวข้อ + เส้น Divider ให้อยู่ชิดกัน */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'baseline' 
                            }}>
                                <Box sx={{ color: 'gray', fontWeight: 'bold' }}>ทีมของคุณ</Box>
                                <Box sx={{ color: 'gray', fontSize: '0.85rem' }}>
                                    {player.team.filter(p => p !== null).length} / {getPhaseLimits(player.phase || 1).maxSlot}
                                </Box>
                            </Box>
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                    </Box>
                    {player.team.map((p, index) => {
                        if (!p) return null;
                        return (
                            <Box key={index} sx={{ position: 'relative' }}>
                                <PokemonPartyItem poke={p} bounceIcon={bounceIcon} pokemonData={pokemonData} />
                                {p.item && (
                                    <Box sx={{ 
                                        position: 'absolute', top: -6, right: -6, 
                                        bgcolor: '#15181f', borderRadius: '50%', p: 0.4, boxShadow: 2,
                                        border: '1px solid #444',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        zIndex: 10
                                    }}>
                                        <img src={`https://www.serebii.net/itemdex/sprites/${p.item}.png`} style={{ width: 18, height: 18, imageRendering: 'pixelated' }} />
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                {/* Center Content (Game Viewport) */}
                <Box sx={{ 
                    width: '70%',
                    flexGrow: 1, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {isSleepingBlackScreen && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'black',
                            zIndex: 10
                        }} />
                    )}

                    {/* กล่อง Container เลื่อนผลักฉากขึ้นด้านบน (Push Transition Wrapper) */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '200%', // ครอบคลุมความสูงของ 2 ฉากต่อกัน
                            display: 'flex',
                            flexDirection: 'column',
                            transform: isTransitioning ? 'translateY(-50%)' : 'translateY(0%)',
                            transition: isTransitioning ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                        }}
                    >
                        {/* ฉากที่ 1 (BG ปัจจุบัน/เก่า) */}
                        <Box
                            sx={{
                                width: '100%',
                                height: '50%',
                                position: 'relative',
                                backgroundImage: `url('${isTransitioning ? previousMapUrl : (mapList.find(m => m.id === currentLocation)?.url || '')}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            {!isTransitioning && !isBattling && !wildEncounter && (() => {
                                const activeCharList = displayedCharacters.length > 0 
                                    ? displayedCharacters 
                                    : (displayedCharacter ? [displayedCharacter] : []);
                                if (activeCharList.length === 0) return null;

                                const currentSpeakerRaw = (currentDialogData?.speaker || "").toLowerCase().trim();

                                return (
                                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                                        {activeCharList.map((charItem, idx) => {
                                            const charId = typeof charItem === 'string' ? charItem : charItem.id;
                                            const charName = (typeof charItem === 'object' && charItem.name) ? charItem.name : charId;

                                            const cleanSprite = charId.toLowerCase().replace('gym_', '').replace('tm_', '').replace('npc_', '').trim();
                                            const cleanName = charName.toLowerCase().trim();

                                            const total = activeCharList.length;
                                            const leftPercent = (idx + 1) * (100 / (total + 1));
                                            const isCharLeaving = isLeaving || leavingCharacters.some(lc => {
                                                const target = lc.toLowerCase();
                                                const cleanTarget = target.replace('gym_', '').replace('tm_', '').replace('npc_', '');
                                                return target === charId.toLowerCase() || target === cleanName || cleanTarget === cleanSprite;
                                            });

                                            // Match against npcList data for exact name & sprite linkage
                                            const matchedNpc = npcList.find(n => 
                                                n.id === charId || 
                                                n.id === `gym_${charId}` || 
                                                n.id === `npc_${charId}` ||
                                                (n.sprite && n.sprite.toLowerCase() === cleanSprite) ||
                                                (n.name && n.name.toLowerCase() === cleanName)
                                            );

                                            const namesToMatch = [
                                                charId.toLowerCase(),
                                                cleanSprite,
                                                cleanName,
                                                matchedNpc?.name?.toLowerCase(),
                                                matchedNpc?.id?.toLowerCase(),
                                                matchedNpc?.sprite?.toLowerCase()
                                            ].filter(Boolean);

                                            // Check if this character is the active speaker
                                            const isSpeaker = currentSpeakerRaw && namesToMatch.some(n => 
                                                currentSpeakerRaw === n ||
                                                currentSpeakerRaw.includes(n) ||
                                                n.includes(currentSpeakerRaw)
                                            );

                                            return (
                                                <Box 
                                                    key={charId} 
                                                    sx={{ 
                                                        position: 'absolute', 
                                                        bottom: 0, 
                                                        left: `${leftPercent}%`, 
                                                        transform: 'translateX(-50%)', 
                                                        transition: 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        zIndex: isSpeaker ? 30 : 10 + idx
                                                    }}
                                                >
                                                    {/* Wrapper Box for Bounce Animation (Prevents CSS forwards from blocking scale transform) */}
                                                    <Box
                                                        sx={{
                                                            animation: `${isCharLeaving ? charExitShrink : charEnterBounce} ${isCharLeaving ? '0.38s ease-in' : '0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'} forwards`
                                                        }}
                                                    >
                                                        <Box 
                                                            component="img" 
                                                            src={`https://play.pokemonshowdown.com/sprites/trainers/${cleanSprite}.png`} 
                                                            alt={charId}
                                                            sx={{
                                                                width: total > 2 ? { xs: '140px', md: '180px' } : (total === 2 ? { xs: '180px', md: '220px' } : { xs: '220px', md: '260px' }),
                                                                height: total > 2 ? { xs: '140px', md: '180px' } : (total === 2 ? { xs: '180px', md: '220px' } : { xs: '220px', md: '260px' }),
                                                                imageRendering: 'pixelated',
                                                                transform: isSpeaker ? 'scale(1.18) translateY(-12px)' : 'scale(0.92) translateY(0px)',
                                                                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                );
                            })()}
                            {!isTransitioning && wildEncounter && (
                                <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                                    <Box 
                                        component="img" 
                                        src={`https://play.pokemonshowdown.com/sprites/${wildEncounter.isTrainer ? 'trainers/' + wildEncounter.name.toLowerCase() : 'gen5/' + wildEncounter.species.toLowerCase()}.png`} 
                                        alt={wildEncounter.isTrainer ? wildEncounter.name : wildEncounter.species}
                                        sx={{
                                            width: '300px',
                                            height: '300px',
                                            imageRendering: 'pixelated',
                                            animation: `${isLeaving ? charExitShrink : charEnterBounce} ${isLeaving ? '0.4s ease-in' : '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'} forwards`
                                        }}
                                    />
                                </Box>
                            )}
                            
                            {/* Walking Sprites */}
                            {isIdleForSprites && activeMap && (
                                <>
                                    {activeNpcs.map(npc => (
                                        <WalkingNpc key={npc.id} npc={npc} currentLocation={currentLocation} onClick={handleNpcClick} />
                                    ))}
                                    <WalkingPokemonSpawner encounters={activeMap.encounters} onPokemonClick={handlePokemonClick} />
                                </>
                            )}
                        </Box>

                        {/* ฉากที่ 2 (BG ใหม่ ต่อด้านล่าง รอสไลด์ขึ้น) */}
                        <Box
                            sx={{
                                width: '100%',
                                height: '50%',
                                backgroundImage: `url('${nextMapUrl}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    </Box>
                </Box>

                {/* Right Sidebar */}
                <Box sx={{ 
                    width: '15%',
                    bgcolor: '#11131a', 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderLeft: '1px solid #222',
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* จัดกลุ่มข้อความหัวข้อ + เส้น Divider ให้อยู่ชิดกัน */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                            <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'baseline' 
                                }}>
                                    <Box sx={{ color: 'gray', fontWeight: 'bold' }}>การกระทำ</Box>
                                    <Box sx={{ color: 'gray', fontSize: '0.85rem' }}>
                                        {topActions.length} ตัวเลือก
                                    </Box>
                                </Box>
                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                        </Box>

                    {!isTyping && !isTransitioning && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flexGrow: 1, overflow: 'hidden' }}>
                            {/* ปุ่มกลุ่มบน (pos: 1) */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', minHeight: 0, pr: 0.5, flexShrink: 1 }}>
                                {topActions.map((item, index) => (
                                    <Button 
                                        key={index}
                                        variant="outlined" 
                                        onClick={() => !item.disabled && handleActionClick(item)} disabled={item.disabled}
                                        sx={{
                                            width: '100%', 
                                            height: '50px',
                                            minHeight: '50px',
                                            flexShrink: 0,
                                            fontSize: '16px',
                                            justifyContent: 'flex-start',
                                            color: item.color,
                                            borderColor: `color-mix(in srgb, ${item.color} 30%, transparent)`,
                                            backgroundColor: `color-mix(in srgb, ${item.color} 5%, transparent)`,
                                            opacity: 1, '&:hover': {
                                                borderColor: item.color,
                                                backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`
                                            }
                                        }}
                                    >
                                        {item.icon ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <img src={`https://www.serebii.net/itemdex/sprites/${item.icon}.png`} alt={item.icon} style={{ width: 24, height: 24, objectFit: 'contain', imageRendering: 'pixelated' }} />
                                                    <Box>{item.value}</Box>
                                                </Box>
                                                {item.percent !== undefined && (
                                                    <Box sx={{ fontSize: '0.8rem', opacity: 0.8 }}>{item.percent}%</Box>
                                                )}
                                            </Box>
                                        ) : (
                                            item.value
                                        )}
                                    </Button>
                                ))}
                            </Box>

                            {/* ปุ่มกลุ่มล่าง (pos: 0) */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 'auto', pt: 1, flexShrink: 0 }}>
                                {bottomActions.map((item, index) => (
                                    <Button 
                                        key={index}
                                        variant="outlined" 
                                        onClick={() => !item.disabled && handleActionClick(item)} disabled={item.disabled}
                                        sx={{
                                            width: '100%', 
                                            height: '50px',
                                            minHeight: '50px',
                                            flexShrink: 0,
                                            fontSize: '16px',
                                            justifyContent: 'flex-start',
                                            color: item.color,
                                            borderColor: `color-mix(in srgb, ${item.color} 30%, transparent)`,
                                            backgroundColor: `color-mix(in srgb, ${item.color} 5%, transparent)`,
                                            opacity: 1, '&:hover': {
                                                borderColor: item.color,
                                                backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`
                                            }
                                        }}
                                    >
                                        {item.icon ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <img src={`https://www.serebii.net/itemdex/sprites/${item.icon}.png`} alt={item.icon} style={{ width: 24, height: 24, objectFit: 'contain', imageRendering: 'pixelated' }} />
                                                    <Box>{item.value}</Box>
                                                </Box>
                                                {item.percent !== undefined && (
                                                    <Box sx={{ fontSize: '0.8rem', opacity: 0.8 }}>{item.percent}%</Box>
                                                )}
                                            </Box>
                                        ) : (
                                            item.value
                                        )}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>

            </Box>

            {/* Bottom Dialog Box */}
            <Box 
                onClick={handleDialogClick}
                sx={{ 
                height: 180, 
                bgcolor: '#0c0e12', 
                borderTop: '1px solid #222',
                p: 4,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                    bgcolor: '#11141a'
                }
            }}>
                {/* Name Tag */}
                {
                !isTransitioning && currentDialogData?.speaker &&
                    <Box sx={{ 
                        position: 'absolute', 
                        top: -18, 
                        left: 40, 
                        bgcolor: '#eebd53', 
                        color: 'black', 
                        px: 3, 
                        py: 0.5, 
                        borderRadius: 1,
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        {currentDialogData?.speaker}
                    </Box>
                }
                
                {/* Dialog Text */}
                <Box sx={{ mt: 2, fontSize: '1.2rem' }}>
                    {!isTransitioning && displayedText}
                </Box>
                
                {/* Blinking "กดเพื่อไปต่อ" */}
                {!isTyping && currentDialogData?.action !== 'showText' && currentDialogData?.action !== 'choice' && actionList.length === 0 && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 24,
                        color: '#eebd53',
                        fontWeight: 'bold',
                        animation: 'blink 1s linear infinite',
                        '@keyframes blink': {
                            '0%': { opacity: 0.3 },
                            '100%': { opacity: 1 }
                        }
                    }}>
                        ▶ กดเพื่อไปต่อ
                    </Box>
                )}
            </Box>

            {/* หน้าต่างต่อสู้ */}
            {isBattling && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    bgcolor: '#05050f', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    {!battleReady && (
                        <Box sx={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', 
                            justifyContent: 'center', alignItems: 'center', zIndex: 10000, color: 'white'
                        }}>
                            <Box 
                                component="img" 
                                src={wildEncounter ? `https://play.pokemonshowdown.com/sprites/${wildEncounter.isTrainer ? 'trainers/' + wildEncounter.name.toLowerCase() : 'gen5/' + wildEncounter.species.toLowerCase()}.png` : ''} 
                                sx={{ width: '100px', height: '100px', imageRendering: 'pixelated', animation: `${fadePop} 1s infinite` }} 
                            />
                            <Box sx={{ mt: 2, color: '#60a5fa', fontSize: '1.5rem', fontWeight: 'bold' }}>Entering Battle...</Box>
                            <Box sx={{ color: '#94a3b8' }}>Setting up the arena...</Box>
                        </Box>
                    )}
                    
                    <Box sx={{ width: '100%', height: '100%', position: 'relative', opacity: battleReady ? 1 : 0, transition: 'opacity 0.5s' }}>
                        <iframe
                            ref={iframeRef}
                            src="http://localhost:8080/testclient-new.html?~~localhost:8000"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    </Box>
                </Box>
            )}

            {/* Bag Modal */}
            {isBagOpen && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.85)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Box sx={{
                        width: '85%', height: '85%', bgcolor: '#15181f', borderRadius: 4,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white',
                        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                        border: '1px solid #333'
                    }}>
                        {/* Modal Header */}
                        <Box sx={{ 
                            height: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            px: 3, borderBottom: '1px solid #222', bgcolor: '#0b0c10' 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#eebd53' }}>
                                <BagSvg />
                                <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: 1 }}>Bag</Box>
                            </Box>
                            <Button 
                                onClick={() => { setIsBagOpen(false); setSelectedItemAction(null); setGiveItemContext(null); }}
                                sx={{ color: '#aaa', minWidth: 40, width: 40, height: 40, borderRadius: '50%', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' } }}
                            >
                                X
                            </Button>
                        </Box>

                        {/* Modal Content */}
                        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                            {/* Left Panel: Pokemon Party */}
                            <Box sx={{
                                width: '22%', minWidth: 0, bgcolor: '#11131a', p: 2,
                                display: 'flex', flexDirection: 'column',
                                borderRight: '1px solid #222',
                            }}>
                                <Box sx={{ 
                                    bgcolor: '#15181f', borderRadius: 2, p: 1, border: '1px solid #222', 
                                    display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 
                                }}>
                                    <Box sx={{ color: 'gray', fontWeight: 'bold', textAlign: 'center', pb: 1, borderBottom: '1px solid #222' }}>
                                        Party ({player.team.filter(p => p !== null).length} / {getPhaseLimits(player.phase || 1).maxSlot})
                                    </Box>
                                    

                                    {[0, 1, 2, 3, 4, 5].map((index) => {
                                        const p = player.team[index];
                                        const pData = p ? pokemonData[p.species.toLowerCase()] : null;
                                        const spriteUrl = pData ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pData.id}.png` : '';
                                        
                                        return (
                                            <Box key={index} 
                                                title={(!giveItemContext && p?.item) ? "Click to remove item" : ""}
                                                onClick={() => {
                                                    if (giveItemContext && p) {
                                                        setPlayer(prev => {
                                                            const newPlayer = { ...prev };
                                                            const poke = newPlayer.team[index];
                                                            
                                                            if (poke.item) {
                                                                let returnTab = 'hold_items';
                                                                const oldItemData = itemData.find(i => i.id === poke.item);
                                                                if (oldItemData && oldItemData.type === 'berry') returnTab = 'berries';
                                                                if (!newPlayer.inventory[returnTab]) newPlayer.inventory[returnTab] = [];
                                                                const existingOld = newPlayer.inventory[returnTab].find(i => i.id === poke.item);
                                                                if (existingOld) existingOld.quantity += 1;
                                                                else newPlayer.inventory[returnTab].push({ id: poke.item, quantity: 1 });
                                                            }
                                                            
                                                            poke.item = giveItemContext;
                                                            
                                                            const currentTabItems = newPlayer.inventory[selectedBagTab];
                                                            const itemIndex = currentTabItems.findIndex(i => i.id === giveItemContext);
                                                            if (itemIndex > -1) {
                                                                currentTabItems[itemIndex].quantity -= 1;
                                                                if (currentTabItems[itemIndex].quantity <= 0) {
                                                                    currentTabItems.splice(itemIndex, 1);
                                                                }
                                                            }
                                                            return newPlayer;
                                                        });
                                                        setGiveItemContext(null);
                                                        setSelectedItemAction(null);
                                                    } else if (!giveItemContext && p?.item) {
                                                        setPlayer(prev => {
                                                            const newPlayer = { ...prev };
                                                            const poke = newPlayer.team[index];
                                                            const itemToReturn = poke.item;
                                                            
                                                            let returnTab = 'hold_items';
                                                            const oldItemData = itemData.find(i => i.id === itemToReturn);
                                                            if (oldItemData && oldItemData.type === 'berry') returnTab = 'berries';
                                                            if (!newPlayer.inventory[returnTab]) newPlayer.inventory[returnTab] = [];
                                                            
                                                            const existingOld = newPlayer.inventory[returnTab].find(i => i.id === itemToReturn);
                                                            if (existingOld) existingOld.quantity += 1;
                                                            else newPlayer.inventory[returnTab].push({ id: itemToReturn, quantity: 1 });
                                                            
                                                            poke.item = null;
                                                            return newPlayer;
                                                        });
                                                    }
                                                }}
                                                sx={{ 
                                                    flex: 1,
                                                    bgcolor: p ? (giveItemContext ? 'rgba(238,189,83,0.1)' : '#1a1e27') : 'rgba(255,255,255,0.02)', 
                                                    borderRadius: 2, p: 1, 
                                                    color: 'white', position: 'relative',
                                                    cursor: (giveItemContext || p?.item) ? 'pointer' : 'default',
                                                    border: giveItemContext ? '2px dashed #eebd53' : '2px solid transparent',
                                                    transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                    '&:hover': (giveItemContext || p?.item) ? { 
                                                        bgcolor: giveItemContext ? 'rgba(238,189,83,0.2)' : '#222',
                                                        borderColor: '#eebd53',
                                                        '& .remove-overlay': { opacity: 1 }
                                                    } : {}
                                                }}>
                                                {p ? (
                                                    <>
                                                        <Box component="img" src={spriteUrl} sx={{ width: 68, height: 56, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                                        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>{p.nickname || p.species}</Box>
                                                            <Box sx={{ fontSize: '0.75rem', color: '#ccc' }}>Lv. {p.level}</Box>
                                                        </Box>
                                                        {p.item && (
                                                            <Box sx={{ 
                                                                position: 'absolute', top: -4, right: -4, 
                                                                bgcolor: '#15181f', borderRadius: '50%', p: 0.4, boxShadow: 2, border: '1px solid #444',
                                                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10
                                                            }}>
                                                                <img src={`https://www.serebii.net/itemdex/sprites/${p.item}.png`} style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />
                                                                {!giveItemContext && (
                                                                    <Box className="remove-overlay" sx={{
                                                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                                        bgcolor: 'rgba(255,75,75,0.95)', borderRadius: '50%',
                                                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                                        color: 'white', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1,
                                                                        opacity: 0, transition: 'all 0.2s'
                                                                    }}>
                                                                        ×
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Box sx={{ color: '#555', fontStyle: 'italic', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>Empty</Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Right Panel: Inventory */}
                            <Box sx={{
                                flexGrow: 1, display: 'flex', flexDirection: 'column',
                                bgcolor: '#15181f', p: 3, minHeight: 0
                            }}>
                                {/* Tabs */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                    {[
                                        { id: 'pokeball', label: 'Pokeball' },
                                        { id: 'berries', label: 'Berries' },
                                        { id: 'hold_items', label: 'Hold items' },
                                        { id: 'evo_item', label: 'Evo Item' },
                                        { id: 'machines', label: 'Machines' }
                                    ].map(tab => (
                                        <Button
                                            key={tab.id}
                                            onClick={() => { setSelectedBagTab(tab.id); setSelectedItemAction(null); }}
                                            sx={{
                                                bgcolor: selectedBagTab === tab.id ? '#eebd53' : 'transparent',
                                                color: selectedBagTab === tab.id ? '#0b0c10' : '#888',
                                                fontWeight: 'bold', borderRadius: 4, px: 2,
                                                border: selectedBagTab === tab.id ? 'none' : '1px solid #333',
                                                '&:hover': { bgcolor: selectedBagTab === tab.id ? '#eebd53' : '#222', color: selectedBagTab === tab.id ? '#0b0c10' : 'white' }
                                            }}
                                        >
                                            {tab.label}
                                        </Button>
                                    ))}
                                </Box>

                                {/* Item List */}
                                <Box sx={{ 
                                    flexGrow: 1, overflowY: 'auto', pr: 2,
                                    display: 'flex', flexDirection: 'column', gap: 1
                                }}>
                                    {(player.inventory?.[selectedBagTab] || []).map((itemEntry, idx) => {
                                        const itemInfo = itemData.find(i => i.id === itemEntry.id);
                                        const isSelected = selectedItemAction === itemEntry.id;

                                        return (
                                            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Box 
                                                    onClick={(e) => {
                                                        setSelectedItemAction(isSelected ? null : itemEntry.id);
                                                        if (giveItemContext) setGiveItemContext(null);
                                                        if (!isSelected) {
                                                            setBagContextMenu({ x: e.clientX, y: e.clientY, itemEntry, itemInfo });
                                                        } else {
                                                            setBagContextMenu(null);
                                                        }
                                                    }}
                                                    sx={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        p: 2, bgcolor: isSelected ? 'rgba(238,189,83,0.1)' : '#1a1e27',
                                                        color: 'white',
                                                        borderRadius: 2, cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        border: isSelected ? '1px solid #eebd53' : '1px solid #222',
                                                        '&:hover': { bgcolor: isSelected ? 'rgba(238,189,83,0.15)' : '#222' }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box 
                                                            component="img" 
                                                            src={`https://www.serebii.net/itemdex/sprites/${itemEntry.id}.png`} 
                                                            sx={{ width: 28, height: 28, imageRendering: 'pixelated' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                        <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: isSelected ? '#eebd53' : 'white' }}>
                                                            {itemInfo ? itemInfo.name : itemEntry.id}
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: isSelected ? '#eebd53' : '#888' }}>
                                                        x {itemEntry.quantity}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                    {(player.inventory?.[selectedBagTab] || []).length === 0 && (
                                        <Box sx={{ textAlign: 'center', color: '#777', mt: 4, fontSize: '1.2rem' }}>
                                            ไม่มีไอเทมในหมวดนี้
                                        </Box>
                                    )}
                                </Box>
                                
                                {/* Item Description (Bottom Right) */}
                                <Box sx={{ 
                                    mt: 3, p: 2, bgcolor: '#11131a', borderRadius: 2, 
                                    height: 120, flexShrink: 0, overflowY: 'auto', border: '1px solid #222'
                                }}>
                                    {selectedItemAction ? (
                                        <Box>
                                            <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#eebd53', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <img 
                                                    src={`https://www.serebii.net/itemdex/sprites/${selectedItemAction}.png`} 
                                                    style={{ width: 24, height: 24, imageRendering: 'pixelated' }} 
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                {itemData.find(i => i.id === selectedItemAction)?.name || selectedItemAction}
                                            </Box>
                                            <Box sx={{ fontSize: '1rem', color: '#ccc', wordBreak: 'break-word' }}>
                                                {itemData.find(i => i.id === selectedItemAction)?.effect || "ไม่มีคำอธิบาย"}
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ fontSize: '1rem', color: '#555', fontStyle: 'italic', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            เลือกไอเทมเพื่อดูคำอธิบาย...
                                        </Box>
                                    )}
                                </Box>

                            </Box>
                    </Box>

                    {/* Bag Context Menu Overlay */}
                    {bagContextMenu && (
                        <Box 
                            onClick={() => setBagContextMenu(null)}
                            onContextMenu={(e) => { e.preventDefault(); setBagContextMenu(null); }}
                            sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10001, cursor: 'default' }}
                        >
                            <Box sx={{
                                position: 'absolute',
                                top: Math.min(bagContextMenu.y, window.innerHeight - 150),
                                left: Math.min(bagContextMenu.x + 10, window.innerWidth - 150),
                                bgcolor: '#1a1e27',
                                border: '1px solid #333',
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                minWidth: 140
                            }}>
                                {selectedBagTab === 'pokeball' && (
                                    <Button sx={{ color: '#ff4b4b', justifyContent: 'flex-start', p: 1.5, borderRadius: 0, borderBottom: '1px solid #222', '&:hover': { bgcolor: '#d43b3b', color: 'white' } }} onClick={() => setBagContextMenu(null)}>Toss</Button>
                                )}
                                {(selectedBagTab === 'berries' || selectedBagTab === 'hold_items') && (
                                    <>
                                        <Button 
                                            onClick={() => { setGiveItemContext(bagContextMenu.itemEntry.id); setBagContextMenu(null); }}
                                            sx={{ color: '#4caf50', justifyContent: 'flex-start', p: 1.5, borderRadius: 0, borderBottom: '1px solid #222', '&:hover': { bgcolor: '#388e3c', color: 'white' } }}
                                        >
                                            {giveItemContext === bagContextMenu.itemEntry.id ? 'Selecting...' : 'Give Item'}
                                        </Button>
                                        <Button sx={{ color: '#ff4b4b', justifyContent: 'flex-start', p: 1.5, borderRadius: 0, borderBottom: '1px solid #222', '&:hover': { bgcolor: '#d43b3b', color: 'white' } }} onClick={() => setBagContextMenu(null)}>Toss</Button>
                                    </>
                                )}
                                {selectedBagTab === 'evo_item' && (
                                    <>
                                        <Button sx={{ color: '#4caf50', justifyContent: 'flex-start', p: 1.5, borderRadius: 0, borderBottom: '1px solid #222', '&:hover': { bgcolor: '#388e3c', color: 'white' } }} onClick={() => setBagContextMenu(null)}>Use Item</Button>
                                        <Button sx={{ color: '#ff4b4b', justifyContent: 'flex-start', p: 1.5, borderRadius: 0, borderBottom: '1px solid #222', '&:hover': { bgcolor: '#d43b3b', color: 'white' } }} onClick={() => setBagContextMenu(null)}>Toss</Button>
                                    </>
                                )}
                                {selectedBagTab === 'machines' && (
                                    <Box sx={{ color: '#777', fontStyle: 'italic', px: 2, py: 1.5, borderBottom: '1px solid #222' }}>Cannot use here</Box>
                                )}
                                <Button 
                                    onClick={() => setBagContextMenu(null)}
                                    sx={{ color: '#aaa', justifyContent: 'flex-start', p: 1.5, borderRadius: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>

                    {/* PC Context Menu Overlay */}
                    {pcContextMenu && (
                        <Box 
                            onClick={() => setPcContextMenu(null)}
                            onContextMenu={(e) => { e.preventDefault(); setPcContextMenu(null); }}
                            sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10001, cursor: 'default' }}
                        >
                            <Box sx={{
                                position: 'absolute',
                                top: Math.min(pcContextMenu.y, window.innerHeight - 150),
                                left: Math.min(pcContextMenu.x + 10, window.innerWidth - 150),
                                bgcolor: '#1a1e27',
                                border: '1px solid #333',
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                minWidth: 140
                            }}>
                                <Button 
                                    onClick={() => {
                                        setPcMoveMode(true);
                                        setPcContextMenu(null);
                                    }}
                                    sx={{ 
                                        color: 'white', justifyContent: 'flex-start', p: 1.5,
                                        borderRadius: 0, borderBottom: '1px solid #222',
                                        '&:hover': { bgcolor: '#38bdf8', color: 'black' } 
                                    }}
                                >
                                    Move Pokemon
                                </Button>
                                {pcContextMenu.pokemon.item && (
                                    <Button 
                                        onClick={() => {
                                            setPlayer(prev => {
                                                const newPlayer = { ...prev, team: [...prev.team], pc_boxes: prev.pc_boxes ? prev.pc_boxes.map(b=>[...b]) : [] };
                                                const getP = (loc) => loc.type === 'party' ? newPlayer.team[loc.index] : newPlayer.pc_boxes[loc.boxIndex][loc.index];
                                                const pTarget = getP(pcContextMenu.slot);
                                                const itemToGive = pTarget.item;
                                                pTarget.item = null;
                                                
                                                if (!newPlayer.bag) newPlayer.bag = {};
                                                newPlayer.bag[itemToGive] = (newPlayer.bag[itemToGive] || 0) + 1;
                                                return newPlayer;
                                            });
                                            setPcContextMenu(null);
                                        }}
                                        sx={{ 
                                            color: '#eebd53', justifyContent: 'flex-start', p: 1.5,
                                            borderRadius: 0, borderBottom: '1px solid #222',
                                            '&:hover': { bgcolor: '#eebd53', color: 'black' } 
                                        }}
                                    >
                                        Take Item
                                    </Button>
                                )}
                                <Button 
                                    onClick={() => setPcContextMenu(null)}
                                    sx={{ 
                                        color: '#aaa', justifyContent: 'flex-start', p: 1.5, borderRadius: 0,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
            {isPcOpen && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.85)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Box sx={{
                        width: '95%', maxWidth: 1200, height: '90%', maxHeight: 800, 
                        bgcolor: '#15181f', borderRadius: 4,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white',
                        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                    }}>
                        {/* Header */}
                        <Box sx={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            p: 2, borderBottom: '1px solid #222', bgcolor: '#0b0c10' 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: 1, color: '#38bdf8' }}>PC Storage</Box>
                            </Box>
                            <Button 
                                onClick={() => { setIsPcOpen(false); setSelectedPcSlot(null); }}
                                sx={{ color: '#aaa', minWidth: 40, width: 40, height: 40, borderRadius: '50%', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' } }}
                            >
                                X
                            </Button>
                        </Box>

                        {/* Content */}
                        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                            
                            {/* Left Panel: Party */}
                            <Box sx={{
                                width: '22%', minWidth: 0, bgcolor: '#11131a', p: 2,
                                display: 'flex', flexDirection: 'column',
                                borderRight: '1px solid #222',
                            }}>
                                <Box sx={{ 
                                    bgcolor: '#15181f', borderRadius: 2, p: 1, border: '1px solid #222', 
                                    display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 
                                }}>
                                    <Box sx={{ color: 'gray', fontWeight: 'bold', textAlign: 'center', pb: 1, borderBottom: '1px solid #222' }}>
                                        Party ({player.team.filter(p => p !== null).length} / {getPhaseLimits(player.phase || 1).maxSlot})
                                    </Box>
                                    {[0, 1, 2, 3, 4, 5].map((index) => {
                                        const p = player.team[index];
                                        const isSelected = selectedPcSlot?.type === 'party' && selectedPcSlot?.index === index;
                                        const pData = p ? pokemonData[p.species.toLowerCase()] : null;
                                        const spriteUrl = pData ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pData.id}.png` : '';
                                        
                                        return (
                                            <Box key={index} 
                                                onClick={(e) => handlePcSlotClick(e, { type: 'party', index, boxIndex: null }, p)}
                                            sx={{ 
                                                flex: 1,
                                                bgcolor: p ? (isSelected ? (pcMoveMode ? 'rgba(74,222,128,0.2)' : 'rgba(56,189,248,0.2)') : '#1a1e27') : 'rgba(255,255,255,0.02)', 
                                                borderRadius: 2, p: 1, 
                                                color: 'white', position: 'relative',
                                                cursor: 'pointer',
                                                border: isSelected ? (pcMoveMode ? '2px dashed #4ade80' : '2px solid #38bdf8') : '2px solid transparent',
                                                transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                    '&:hover': { bgcolor: isSelected ? 'rgba(56,189,248,0.3)' : (p ? '#222' : 'rgba(255,255,255,0.05)') }
                                                }}>
                                                {p ? (
                                                    <>
                                                        <Box component="img" src={spriteUrl} sx={{ width: 68, height: 56, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                                        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>{p.nickname || p.species}</Box>
                                                            <Box sx={{ fontSize: '0.75rem', color: '#ccc' }}>Lv. {p.level}</Box>
                                                        </Box>
                                                        {p.item && (
                                                            <Box sx={{ 
                                                                position: 'absolute', top: -4, right: -4, 
                                                                bgcolor: '#15181f', borderRadius: '50%', p: 0.4, boxShadow: 2, border: '1px solid #444',
                                                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10
                                                            }}>
                                                                <img src={`https://www.serebii.net/itemdex/sprites/${p.item}.png`} style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />
                                                            </Box>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Box sx={{ color: '#555', fontStyle: 'italic', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>Empty</Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Center Panel: Box Grid */}
                            <Box sx={{
                                flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
                                bgcolor: '#15181f', p: 3, minHeight: 0
                            }}>
                                {/* Box Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: '#1a1e27', borderRadius: 2, p: 1 }}>
                                    <Button onClick={() => setCurrentPcBox(prev => Math.max(0, prev - 1))} disabled={currentPcBox === 0} sx={{ color: 'white', minWidth: 40 }}>&lt;</Button>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Box {currentPcBox + 1}</Box>
                                        <Box sx={{ fontSize: '0.75rem', color: '#888' }}>Select to Move</Box>
                                    </Box>
                                    <Button onClick={() => {
                                        setPlayer(prev => {
                                            const newPlayer = { 
                                                ...prev, 
                                                team: [...prev.team], 
                                                pc_boxes: prev.pc_boxes ? prev.pc_boxes.map(b => [...b]) : [Array(20).fill(null)]
                                            };
                                            if (currentPcBox === newPlayer.pc_boxes.length - 1) {
                                                newPlayer.pc_boxes.push(Array(20).fill(null));
                                            }
                                            return newPlayer;
                                        });
                                        setCurrentPcBox(prev => prev + 1);
                                    }} sx={{ color: 'white', minWidth: 40 }}>&gt;</Button>
                                </Box>

                                {/* Grid */}
                                <Box sx={{ 
                                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, 
                                    flexGrow: 1, overflowY: 'auto', p: 1, minHeight: 0
                                }}>
                                    {Array(20).fill(null).map((_, slotIndex) => {
                                        const box = player.pc_boxes?.[currentPcBox] || [];
                                        const p = box[slotIndex] || null;
                                        const isSelected = selectedPcSlot?.type === 'box' && selectedPcSlot?.boxIndex === currentPcBox && selectedPcSlot?.index === slotIndex;
                                        const pData = p ? pokemonData[p.species.toLowerCase()] : null;
                                        const spriteUrl = pData ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pData.id}.png` : '';

                                        return (
                                            <Box key={slotIndex} 
                                                onClick={(e) => handlePcSlotClick(e, { type: 'box', index: slotIndex, boxIndex: currentPcBox }, p)}
                                                sx={{ 
                                                    bgcolor: p ? (isSelected ? (pcMoveMode ? 'rgba(74,222,128,0.2)' : 'rgba(56,189,248,0.2)') : '#1a1e27') : 'rgba(255,255,255,0.02)', 
                                                    borderRadius: 2, 
                                                    border: isSelected ? (pcMoveMode ? '2px dashed #4ade80' : '2px solid #38bdf8') : '1px solid rgba(255,255,255,0.05)',
                                                    cursor: 'pointer', position: 'relative',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    transition: 'all 0.1s',
                                                    '&:hover': { bgcolor: isSelected ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)' }
                                                }}>
                                                <Box sx={{ width: '100%', paddingBottom: '100%', position: 'absolute', top: 0, left: 0 }} />
                                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    {p && (
                                                        <>
                                                            <Box component="img" src={spriteUrl} sx={{ width: '80%', height: '80%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                                                            {p.item && (
                                                                <Box sx={{ 
                                                                    position: 'absolute', top: 2, right: 2, 
                                                                    bgcolor: '#15181f', borderRadius: '50%', p: 0.2, boxShadow: 1, border: '1px solid #444',
                                                                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10
                                                                }}>
                                                                    <img src={`https://www.serebii.net/itemdex/sprites/${p.item}.png`} style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />
                                                                </Box>
                                                            )}
                                                            <Box sx={{ position: 'absolute', bottom: 2, right: 4, fontSize: '0.7rem', fontWeight: 'bold', color: '#ccc', textShadow: '1px 1px 2px black' }}>
                                                                Lv.{p.level}
                                                            </Box>
                                                        </>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Right Panel: Details */}
                            <Box sx={{
                                width: '30%', minWidth: 0, bgcolor: '#11131a', p: 3,
                                display: 'flex', flexDirection: 'column',
                                borderLeft: '1px solid #222',
                                overflowY: 'auto', minHeight: 0
                            }}>
                                {(() => {
                                    if (!selectedPcSlot) return <Box sx={{ color: '#555', m: 'auto', fontStyle: 'italic' }}>Select a Pokémon...</Box>;
                                    const p = selectedPcSlot.type === 'party' ? player.team[selectedPcSlot.index] : player.pc_boxes?.[selectedPcSlot.boxIndex]?.[selectedPcSlot.index];
                                    if (!p) return <Box sx={{ color: '#555', m: 'auto', fontStyle: 'italic' }}>Empty Slot Selected</Box>;
                                    const pData = pokemonData[p.species.toLowerCase()];
                                    if (!pData) return null;
                                    
                                    const spriteUrl = `https://play.pokemonshowdown.com/sprites/gen5/${p.species.toLowerCase()}.png`;

                                    return (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ fontSize: '1.4rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nickname || p.species}</Box>
                                                <Box sx={{ fontSize: '1.1rem', color: '#ccc', flexShrink: 0 }}>Lv. {p.level}</Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {pData.types.map(t => (
                                                    <Box key={t} sx={{ 
                                                        bgcolor: typeColors[t.toLowerCase()] || '#333', 
                                                        px: 1.5, py: 0.3, borderRadius: 1, fontSize: '0.8rem', 
                                                        textTransform: 'uppercase', color: 'white', 
                                                        textShadow: '1px 1px 1px rgba(0,0,0,0.7)',
                                                        boxShadow: 'inset 0 0 4px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)'
                                                    }}>
                                                        {t}
                                                    </Box>
                                                ))}
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, height: 100 }}>
                                                <Box component="img" src={spriteUrl} sx={{ objectFit: 'contain', width: '100%', height: '100%', imageRendering: 'pixelated' }} onError={(e) => { e.target.src = `https://play.pokemonshowdown.com/sprites/gen5/${pData.id}.png`; }} />
                                            </Box>
                                            
                                            <Box sx={{ bgcolor: '#1a1e27', p: 1.5, borderRadius: 2 }}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                                                    {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((stat) => {
                                                        const base = pData.baseStats[stat] || 50;
                                                        const iv = p.ivs?.[stat] || 31;
                                                        const ev = p.evs?.[stat] || 0;
                                                        const level = p.level || 50;
                                                        
                                                        let calcStat = 0;
                                                        const nature = p.nature || 'Hardy';
                                                        const natureMod = natureList[nature];

                                                        if (stat === 'hp') {
                                                            calcStat = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + level + 10;
                                                        } else {
                                                            calcStat = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + 5;
                                                            if (natureMod) {
                                                                if (natureMod.inc === stat && natureMod.dec !== stat) calcStat = Math.floor(calcStat * 1.1);
                                                                if (natureMod.dec === stat && natureMod.inc !== stat) calcStat = Math.floor(calcStat * 0.9);
                                                            }
                                                        }
                                                        
                                                        let statColor = 'inherit';
                                                        let statSuffix = '';
                                                        if (stat !== 'hp' && natureMod) {
                                                            if (natureMod.inc === stat && natureMod.dec !== stat) {
                                                                statColor = '#4ade80'; // Green
                                                                statSuffix = '(+)';
                                                            }
                                                            if (natureMod.dec === stat && natureMod.inc !== stat) {
                                                                statColor = '#f87171'; // Red
                                                                statSuffix = '(-)';
                                                            }
                                                        }

                                                        return (
                                                            <Box key={stat} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                                <Box sx={{ color: '#888', textTransform: 'uppercase' }}>{stat}</Box>
                                                                <Box sx={{ fontWeight: 'bold', color: statColor }}>{calcStat} {statSuffix}</Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                                
                                                <Divider sx={{ borderColor: '#333', mb: 1 }} />
                                                
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', mb: 0.5 }}>
                                                    <Box sx={{ color: '#888' }}>Nature</Box>
                                                    <Box>{p.nature || 'Hardy'}</Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', mb: 0.5 }}>
                                                    <Box sx={{ color: '#888' }}>Ability</Box>
                                                    <Box>{p.ability || 'unknown'}</Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <Box sx={{ color: '#888' }}>Held Item</Box>
                                                    <Box sx={{ color: p.item ? '#eebd53' : 'inherit' }}>{p.item ? itemData.find(i=>i.id===p.item)?.name || p.item : '—'}</Box>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                                {p.moves.map((m, i) => {
                                                    const moveId = m.toLowerCase().replace(/ /g, '-');
                                                    const moveType = moveData[moveId]?.type || 'normal';
                                                    return (
                                                        <Box key={i} sx={{ 
                                                            bgcolor: typeColors[moveType] || 'rgba(255,255,255,0.05)', 
                                                            p: 1, borderRadius: 1, textAlign: 'center', fontSize: '0.85rem',
                                                            color: 'white', textShadow: '1px 1px 1px rgba(0,0,0,0.7)',
                                                            boxShadow: 'inset 0 0 4px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)'
                                                        }}>
                                                            {m}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    );
                                })()}
                            </Box>

                        </Box>

                        {/* PC Context Menu Overlay */}
                        {pcContextMenu && (
                            <Box 
                                onClick={() => setPcContextMenu(null)}
                                onContextMenu={(e) => { e.preventDefault(); setPcContextMenu(null); }}
                                sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10001, cursor: 'default' }}
                            >
                                <Box sx={{
                                    position: 'absolute',
                                    top: Math.min(pcContextMenu.y, window.innerHeight - 150),
                                    left: Math.min(pcContextMenu.x + 10, window.innerWidth - 150),
                                    bgcolor: '#1a1e27',
                                    border: '1px solid #333',
                                    borderRadius: 2,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    minWidth: 140
                                }}>
                                    <Button 
                                        onClick={() => {
                                            setPcMoveMode(true);
                                            setPcContextMenu(null);
                                        }}
                                        sx={{ 
                                            color: 'white', justifyContent: 'flex-start', p: 1.5,
                                            borderRadius: 0, borderBottom: '1px solid #222',
                                            '&:hover': { bgcolor: '#38bdf8', color: 'black' } 
                                        }}
                                    >
                                        Move Pokemon
                                    </Button>
                                    {pcContextMenu.pokemon.item && (
                                        <Button 
                                            onClick={() => {
                                                setPlayer(prev => {
                                                    const newPlayer = { ...prev, team: [...prev.team], pc_boxes: prev.pc_boxes ? prev.pc_boxes.map(b=>[...b]) : [] };
                                                    const getP = (loc) => loc.type === 'party' ? newPlayer.team[loc.index] : newPlayer.pc_boxes[loc.boxIndex][loc.index];
                                                    const pTarget = getP(pcContextMenu.slot);
                                                    const itemToGive = pTarget.item;
                                                    pTarget.item = null;
                                                    
                                                    if (!newPlayer.bag) newPlayer.bag = {};
                                                    newPlayer.bag[itemToGive] = (newPlayer.bag[itemToGive] || 0) + 1;
                                                    return newPlayer;
                                                });
                                                setPcContextMenu(null);
                                            }}
                                            sx={{ 
                                                color: '#eebd53', justifyContent: 'flex-start', p: 1.5,
                                                borderRadius: 0, borderBottom: '1px solid #222',
                                                '&:hover': { bgcolor: '#eebd53', color: 'black' } 
                                            }}
                                        >
                                            Take Item
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={() => setPcContextMenu(null)}
                                        sx={{ 
                                            color: '#aaa', justifyContent: 'flex-start', p: 1.5, borderRadius: 0,
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {/* Team Builder Modal */}
            {isTeamOpen && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.85)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Box sx={{
                        width: '95%', maxWidth: 1250, height: '90%', maxHeight: 850, 
                        bgcolor: '#15181f', borderRadius: 4,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'white',
                        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                    }}>
                        {/* Header */}
                        <Box sx={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            p: 2.5, borderBottom: '1px solid #222', bgcolor: '#0b0c10' 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: 1, color: 'white' }}>Team Builder</Box>
                            </Box>
                            <Button 
                                onClick={() => setIsTeamOpen(false)}
                                sx={{ bgcolor: '#2a2d36', color: 'white', px: 3, py: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: '#333' } }}
                            >
                                Close
                            </Button>
                        </Box>

                        {/* Content */}
                        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                            
                            {/* Left Panel: Party อันเก่า */}
                            <Box sx={{
                                width: '25%', minWidth: 240, bgcolor: '#11131a', p: 2,
                                display: 'flex', flexDirection: 'column',
                                borderRight: '1px solid #222',
                                overflowY: 'auto'
                            }}>
                                <Box sx={{ 
                                    bgcolor: '#15181f', borderRadius: 2, p: 1.5, border: '1px solid #222', 
                                    display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 
                                }}>
                                    <Box sx={{ color: 'gray', fontWeight: 'bold', textAlign: 'center', pb: 1, borderBottom: '1px solid #222' }}>
                                        Party ({player.team.filter(p => p !== null).length} / {getPhaseLimits(player.phase || 1).maxSlot})
                                    </Box>
                                    {[0, 1, 2, 3, 4, 5].map((index) => {
                                        const p = player.team[index];
                                        const isSelected = selectedTeamIndex === index;
                                        const pData = p ? pokemonData[p.species.toLowerCase()] : null;
                                        const spriteUrl = pData ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pData.id}.png` : '';
                                        
                                        return (
                                            <Box key={index} 
                                                onClick={() => { if (p) setSelectedTeamIndex(index); }}
                                                sx={{ 
                                                    flex: 1, minHeight: 65,
                                                    bgcolor: p ? (isSelected ? 'rgba(56,189,248,0.2)' : '#1a1e27') : 'rgba(255,255,255,0.02)', 
                                                    borderRadius: 2, p: 1, 
                                                    color: 'white', position: 'relative',
                                                    cursor: p ? 'pointer' : 'default',
                                                    border: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
                                                    transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                                    '&:hover': { bgcolor: isSelected ? 'rgba(56,189,248,0.3)' : (p ? '#222' : 'rgba(255,255,255,0.05)') }
                                                }}>
                                                {p ? (
                                                    <>
                                                        <Box component="img" src={spriteUrl} sx={{ width: 60, height: 50, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                                        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Box sx={{ fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>{p.nickname || p.species}</Box>
                                                            <Box sx={{ fontSize: '0.8rem', color: '#ccc' }}>Lv. {p.level}</Box>
                                                        </Box>
                                                        {p.item && (
                                                            <Box sx={{ 
                                                                position: 'absolute', top: 4, right: 4, 
                                                                bgcolor: '#15181f', borderRadius: '50%', p: 0.4, boxShadow: 2, border: '1px solid #444',
                                                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10
                                                            }}>
                                                                <img src={`https://www.serebii.net/itemdex/sprites/${p.item}.png`} style={{ width: 14, height: 14, imageRendering: 'pixelated' }} />
                                                            </Box>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Box sx={{ color: '#555', fontStyle: 'italic', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>Empty</Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Right Panel: ในรูป (Team Builder UI) */}
                            <Box sx={{
                                flexGrow: 1, display: 'flex', flexDirection: 'column',
                                bgcolor: '#15181f', p: 3, overflowY: 'auto', minHeight: 0
                            }}>
                                {(() => {
                                    const p = player.team[selectedTeamIndex];
                                    if (!p) return <Box sx={{ color: '#555', m: 'auto', fontStyle: 'italic' }}>Select a Pokémon from your Party on the left...</Box>;
                                    const pData = pokemonData[p.species.toLowerCase()];
                                    if (!pData) return null;
                                    
                                    const spriteUrl = `https://play.pokemonshowdown.com/sprites/gen5/${p.species.toLowerCase()}.png`;
                                    const learnset = pData.learnset || [];
                                    const sortedLearnset = [...learnset].sort((a, b) => a.level - b.level);

                                    return (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            
                                            {/* Top 4 Columns Section */}
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.6fr 2.2fr', gap: 3, pb: 3, borderBottom: '1px solid #222' }}>
                                                
                                                {/* Column 1: Pokemon Identity */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#11131a', p: 1.5, borderRadius: 2, border: '1px solid #222' }}>
                                                    <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                                                        <Box component="img" src={spriteUrl} sx={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%', imageRendering: 'pixelated' }} onError={(e) => { e.target.src = `https://play.pokemonshowdown.com/sprites/gen5/${pData.id}.png`; }} />
                                                    </Box>
                                                    <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold', mb: 0.2 }}>{p.nickname || p.species}</Box>
                                                    <Box sx={{ fontSize: '0.85rem', color: '#ccc', mb: 0.8 }}>Lv. {p.level}</Box>
                                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                        {pData.types.map(t => (
                                                            <Box key={t} sx={{ 
                                                                bgcolor: typeColors[t.toLowerCase()] || '#333', 
                                                                px: 1.5, py: 0.3, borderRadius: 1, fontSize: '0.8rem', 
                                                                textTransform: 'uppercase', color: 'white', fontWeight: 'bold',
                                                                textShadow: '1px 1px 1px rgba(0,0,0,0.7)',
                                                                boxShadow: 'inset 0 0 4px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)'
                                                            }}>
                                                                {t}
                                                            </Box>
                                                        ))}
                                                    </Box>

                                                    {/* Evolution Section */}
                                                    {(() => {
                                                        const evoInfo = getEvolutionInfo(p, pokemonData);
                                                        if (!evoInfo) return null;

                                                        if (evoInfo.canEvolve) {
                                                            return (
                                                                <Button
                                                                    onClick={() => handleStartEvolution(selectedTeamIndex, p, evoInfo)}
                                                                    sx={{
                                                                        mt: 1.5, width: '100%', py: 0.8, fontSize: '0.85rem', fontWeight: 'bold', borderRadius: 1.5,
                                                                        textTransform: 'none',
                                                                        bgcolor: '#38bdf8', color: '#0f172a',
                                                                        boxShadow: '0 0 15px rgba(56,189,248,0.5)',
                                                                        '&:hover': {
                                                                            bgcolor: '#0284c7',
                                                                            color: 'white'
                                                                        }
                                                                    }}
                                                                >
                                                                    พัฒนาร่าง
                                                                </Button>
                                                            );
                                                        } else {
                                                            return (
                                                                <Box sx={{ mt: 1.5, fontSize: '0.8rem', color: '#777', textAlign: 'center' }}>
                                                                    พัฒนาเลเวล {evoInfo.minLevel}
                                                                </Box>
                                                            );
                                                        }
                                                    })()}
                                                </Box>

                                                {/* Column 2: Nature / Item / Ability */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, justifyContent: 'center', bgcolor: '#11131a', p: 1.5, borderRadius: 2, border: '1px solid #222' }}>
                                                    {/* Nature Card */}
                                                    <Box 
                                                        onClick={() => setTeamSubView('nature')}
                                                        sx={{ 
                                                            bgcolor: teamSubView === 'nature' ? 'rgba(56,189,248,0.15)' : '#1a1e27',
                                                            border: teamSubView === 'nature' ? '2px solid #38bdf8' : '1px solid #333',
                                                            borderRadius: 1.5, p: 1.2, cursor: 'pointer', transition: 'all 0.15s',
                                                            '&:hover': { bgcolor: teamSubView === 'nature' ? 'rgba(56,189,248,0.22)' : '#222733', borderColor: '#38bdf8' }
                                                        }}
                                                    >
                                                        <Box sx={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, mb: 0.3 }}>Nature</Box>
                                                        <Box sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{p.nature || 'Hardy'}</Box>
                                                    </Box>

                                                    {/* Item Card */}
                                                    <Box 
                                                        onClick={() => setTeamSubView('item')}
                                                        sx={{ 
                                                            bgcolor: teamSubView === 'item' ? 'rgba(251,191,36,0.15)' : '#1a1e27',
                                                            border: teamSubView === 'item' ? '2px solid #fbbf24' : '1px solid #333',
                                                            borderRadius: 1.5, p: 1.2, cursor: 'pointer', transition: 'all 0.15s',
                                                            '&:hover': { bgcolor: teamSubView === 'item' ? 'rgba(251,191,36,0.22)' : '#222733', borderColor: '#fbbf24' }
                                                        }}
                                                    >
                                                        <Box sx={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, mb: 0.3 }}>Item</Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                            {p.item && <img src={`https://www.serebii.net/itemdex/sprites/${p.item}.png`} style={{ width: 22, height: 22, imageRendering: 'pixelated' }} onError={(e)=>{e.target.style.display='none'}} />}
                                                            <Box sx={{ fontSize: '1rem', fontWeight: 'bold', color: p.item ? '#fbbf24' : '#777', fontStyle: p.item ? 'normal' : 'italic', textTransform: 'capitalize' }}>
                                                                {p.item ? (itemData.find(i=>i.id===p.item)?.name || p.item) : 'None'}
                                                            </Box>
                                                        </Box>
                                                    </Box>

                                                    {/* Ability Card */}
                                                    <Box 
                                                        onClick={() => setTeamSubView('ability')}
                                                        sx={{ 
                                                            bgcolor: teamSubView === 'ability' ? 'rgba(168,85,247,0.15)' : '#1a1e27',
                                                            border: teamSubView === 'ability' ? '2px solid #c084fc' : '1px solid #333',
                                                            borderRadius: 1.5, p: 1.2, cursor: 'pointer', transition: 'all 0.15s',
                                                            '&:hover': { bgcolor: teamSubView === 'ability' ? 'rgba(168,85,247,0.22)' : '#222733', borderColor: '#c084fc' }
                                                        }}
                                                    >
                                                        <Box sx={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, mb: 0.3 }}>Ability</Box>
                                                        <Box sx={{ fontSize: '1rem', fontWeight: 'bold', color: '#c084fc', textTransform: 'capitalize' }}>
                                                            {p.ability || (pData?.abilities?.[0]) || 'Synchronize'}
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                {/* Column 3: Moves */}
                                                <Box 
                                                    onClick={() => setTeamSubView('moves')}
                                                    sx={{ 
                                                        display: 'flex', flexDirection: 'column', bgcolor: '#11131a', p: 2, borderRadius: 2, 
                                                        border: teamSubView === 'moves' ? '2px solid #4ade80' : '1px solid #222',
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                        '&:hover': { borderColor: '#4ade80' }
                                                    }}
                                                >
                                                    <Box sx={{ fontSize: '0.95rem', fontWeight: 'bold', mb: 1.5, color: 'white' }}>Moves</Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, justifyContent: 'center' }}>
                                                        {[0, 1, 2, 3].map((slotIdx) => {
                                                            const moveName = p.moves?.[slotIdx];
                                                            const moveId = moveName ? moveName.toLowerCase().replace(/ /g, '-') : null;
                                                            const mInfo = moveId ? moveData[moveId] : null;
                                                            const displayName = mInfo ? mInfo.name : (moveName || '(Empty)');
                                                            
                                                            return (
                                                                <Box key={slotIdx} sx={{
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                    bgcolor: moveName ? '#2a2d36' : '#15181f',
                                                                    border: moveName ? '1px solid #3e424e' : '1px dashed #333',
                                                                    borderRadius: 1.5, px: 1.5, py: 1, minHeight: 38
                                                                }}>
                                                                    <Box sx={{ 
                                                                        fontWeight: moveName ? 'bold' : 'normal', 
                                                                        color: moveName ? 'white' : '#555',
                                                                        fontSize: '0.9rem', fontStyle: moveName ? 'normal' : 'italic',
                                                                        textTransform: moveName ? 'capitalize' : 'none'
                                                                    }}>
                                                                        {displayName}
                                                                    </Box>
                                                                    {moveName && (
                                                                        <Box 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPlayer(prev => {
                                                                                    const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                                    const poke = newPlayer.team[selectedTeamIndex];
                                                                                    if (!poke) return prev;
                                                                                    if (poke.moves && poke.moves.length > slotIdx) {
                                                                                        poke.moves.splice(slotIdx, 1);
                                                                                    }
                                                                                    return newPlayer;
                                                                                });
                                                                            }}
                                                                            sx={{
                                                                                bgcolor: '#ef4444', color: 'white', width: 22, height: 22,
                                                                                borderRadius: '50%', display: 'flex', alignItems: 'center',
                                                                                justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold',
                                                                                cursor: 'pointer', '&:hover': { bgcolor: '#dc2626' }
                                                                            }}
                                                                        >
                                                                            ✕
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                </Box>

                                                {/* Column 4: Stats */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#11131a', p: 2, borderRadius: 2, border: '1px solid #222' }}>
                                                    <Box sx={{ fontSize: '0.95rem', fontWeight: 'bold', mb: 1, color: 'white' }}>Stats</Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, flexGrow: 1, justifyContent: 'center' }}>
                                                        {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((stat) => {
                                                            const base = pData.baseStats[stat] || 50;
                                                            const iv = p.ivs?.[stat] || 31;
                                                            const ev = p.evs?.[stat] || 0;
                                                            const level = p.level || 50;
                                                            
                                                            let calcStat = 0;
                                                            const nature = p.nature || 'Hardy';
                                                            const natureMod = natureList[nature];
                                                            const isInc = natureMod && natureMod.inc === stat && natureMod.dec !== stat;
                                                            const isDec = natureMod && natureMod.dec === stat && natureMod.inc !== stat;

                                                            if (stat === 'hp') {
                                                                calcStat = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + level + 10;
                                                            } else {
                                                                calcStat = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + 5;
                                                                if (isInc) calcStat = Math.floor(calcStat * 1.1);
                                                                if (isDec) calcStat = Math.floor(calcStat * 0.9);
                                                            }
                                                            
                                                            const barColor = isInc ? '#4ade80' : isDec ? '#ef4444' : statColors[stat];
                                                            const labelColor = isInc ? '#4ade80' : isDec ? '#ef4444' : '#aaa';
                                                            const numColor = isInc ? '#4ade80' : isDec ? '#ef4444' : 'white';

                                                            return (
                                                                <Box key={stat} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Box sx={{ width: 35, color: labelColor, fontWeight: isInc || isDec ? 'bold' : 'normal', fontSize: '0.85rem' }}>
                                                                        {statNames[stat]}
                                                                    </Box>
                                                                    <Box sx={{ width: 32, fontWeight: 'bold', color: numColor, fontSize: '0.9rem', textAlign: 'right' }}>{calcStat}</Box>
                                                                    <Box sx={{ flexGrow: 1, height: 10, bgcolor: '#1a1e27', borderRadius: 5, overflow: 'hidden', border: '1px solid #222' }}>
                                                                        <Box sx={{ width: `${Math.min(100, (calcStat / 180) * 100)}%`, height: '100%', bgcolor: barColor, borderRadius: 5, transition: 'all 0.3s' }} />
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                </Box>

                                            </Box>

                                            {/* Bottom Table: Dynamic Views (Moves / Nature / Item / Ability) */}
                                            <Box sx={{ pt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                {/* Navigation Tabs */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                    <Button 
                                                        onClick={() => setTeamSubView('moves')}
                                                        sx={{ 
                                                            px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'none',
                                                            bgcolor: teamSubView === 'moves' ? '#4ade80' : '#1a1e27',
                                                            color: teamSubView === 'moves' ? 'black' : '#aaa',
                                                            border: '1px solid', borderColor: teamSubView === 'moves' ? '#4ade80' : '#333',
                                                            '&:hover': { bgcolor: teamSubView === 'moves' ? '#22c55e' : '#2a2d36', color: 'white' }
                                                        }}
                                                    >
                                                        Learnable Moves
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setTeamSubView('nature')}
                                                        sx={{ 
                                                            px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'none',
                                                            bgcolor: teamSubView === 'nature' ? '#38bdf8' : '#1a1e27',
                                                            color: teamSubView === 'nature' ? 'black' : '#aaa',
                                                            border: '1px solid', borderColor: teamSubView === 'nature' ? '#38bdf8' : '#333',
                                                            '&:hover': { bgcolor: teamSubView === 'nature' ? '#0ea5e9' : '#2a2d36', color: 'white' }
                                                        }}
                                                    >
                                                        Nature (นิสัย)
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setTeamSubView('item')}
                                                        sx={{ 
                                                            px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'none',
                                                            bgcolor: teamSubView === 'item' ? '#fbbf24' : '#1a1e27',
                                                            color: teamSubView === 'item' ? 'black' : '#aaa',
                                                            border: '1px solid', borderColor: teamSubView === 'item' ? '#fbbf24' : '#333',
                                                            '&:hover': { bgcolor: teamSubView === 'item' ? '#f59e0b' : '#2a2d36', color: 'white' }
                                                        }}
                                                    >
                                                        Item (ไอเทม)
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setTeamSubView('ability')}
                                                        sx={{ 
                                                            px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'none',
                                                            bgcolor: teamSubView === 'ability' ? '#c084fc' : '#1a1e27',
                                                            color: teamSubView === 'ability' ? 'black' : '#aaa',
                                                            border: '1px solid', borderColor: teamSubView === 'ability' ? '#c084fc' : '#333',
                                                            '&:hover': { bgcolor: teamSubView === 'ability' ? '#a855f7' : '#2a2d36', color: 'white' }
                                                        }}
                                                    >
                                                        Ability (ความสามารถ)
                                                    </Button>
                                                </Box>

                                                {/* 1. Moves View (Level-Up / TM / Egg) */}
                                                {teamSubView === 'moves' && (
                                                    <>
                                                        {/* Move Category Selector */}
                                                        <Box sx={{ display: 'flex', gap: 1, mb: 1.2 }}>
                                                            <Button
                                                                onClick={() => setMoveCategoryTab('level')}
                                                                sx={{
                                                                    px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'none',
                                                                    bgcolor: moveCategoryTab === 'level' ? '#4ade80' : '#141722',
                                                                    color: moveCategoryTab === 'level' ? '#0b0c10' : '#888',
                                                                    border: '1px solid', borderColor: moveCategoryTab === 'level' ? '#4ade80' : '#222',
                                                                    '&:hover': { bgcolor: moveCategoryTab === 'level' ? '#22c55e' : '#2a2d36', color: 'white' }
                                                                }}
                                                            >
                                                                Learnable Moves ({sortedLearnset.length})
                                                            </Button>

                                                            <Button
                                                                onClick={() => setMoveCategoryTab('tm')}
                                                                sx={{
                                                                    px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'none',
                                                                    bgcolor: moveCategoryTab === 'tm' ? '#38bdf8' : '#141722',
                                                                    color: moveCategoryTab === 'tm' ? '#0b0c10' : '#888',
                                                                    border: '1px solid', borderColor: moveCategoryTab === 'tm' ? '#38bdf8' : '#222',
                                                                    '&:hover': { bgcolor: moveCategoryTab === 'tm' ? '#0ea5e9' : '#2a2d36', color: 'white' }
                                                                }}
                                                            >
                                                                TM Moves ({(pData.tm_moves || []).length})
                                                            </Button>

                                                            <Button
                                                                onClick={() => setMoveCategoryTab('egg')}
                                                                sx={{
                                                                    px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'none',
                                                                    bgcolor: moveCategoryTab === 'egg' ? '#c084fc' : '#141722',
                                                                    color: moveCategoryTab === 'egg' ? '#0b0c10' : '#888',
                                                                    border: '1px solid', borderColor: moveCategoryTab === 'egg' ? '#c084fc' : '#222',
                                                                    '&:hover': { bgcolor: moveCategoryTab === 'egg' ? '#a855f7' : '#2a2d36', color: 'white' }
                                                                }}
                                                            >
                                                                Egg Moves ({(pData.egg_moves || []).length})
                                                            </Button>
                                                        </Box>

                                                        {/* Moves Table Header */}
                                                        <Box sx={{ 
                                                            display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 80px 80px 140px', 
                                                            p: 1.2, bgcolor: '#0b0c10', borderRadius: '6px 6px 0 0',
                                                            border: '1px solid #222', borderBottom: 'none',
                                                            color: '#888', fontWeight: 'bold', fontSize: '0.85rem'
                                                        }}>
                                                            <Box>{moveCategoryTab === 'level' ? 'Lv' : 'Source'}</Box>
                                                            <Box>Name</Box>
                                                            <Box>Type</Box>
                                                            <Box>Cat</Box>
                                                            <Box>Power</Box>
                                                            <Box>Acc</Box>
                                                            <Box sx={{ textAlign: 'right', pr: 1 }}>Status</Box>
                                                        </Box>

                                                        {/* Moves Table Content */}
                                                        <Box sx={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #222', borderRadius: '0 0 6px 6px', bgcolor: '#0e1017' }}>
                                                            {moveCategoryTab === 'level' && sortedLearnset.map((entry, idx) => {
                                                                const moveId = entry.move ? entry.move.toLowerCase().replace(/ /g, '-') : '';
                                                                const mInfo = moveData[moveId] || { name: entry.move, type: 'normal', category: 'physical', power: '-', accuracy: '-' };
                                                                const isKnown = (p.moves || []).some(m => m.toLowerCase().replace(/ /g, '-') === moveId);
                                                                const canLearn = entry.level <= (p.level || 100);
                                                                
                                                                return (
                                                                    <Box 
                                                                        key={`${moveId}-${idx}`}
                                                                        onClick={() => {
                                                                            if (!canLearn) {
                                                                                alert(`Requires Lv. ${entry.level} to learn!`);
                                                                                return;
                                                                            }
                                                                            if (isKnown) return;
                                                                            setPlayer(prev => {
                                                                                const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                                const poke = newPlayer.team[selectedTeamIndex];
                                                                                if (!poke) return prev;
                                                                                if (!poke.moves) poke.moves = [];
                                                                                
                                                                                if (poke.moves.some(m => m.toLowerCase().replace(/ /g, '-') === moveId)) return prev;
                                                                                if (poke.moves.length >= 4) {
                                                                                    alert("ช่องใส่ท่าเต็มแล้ว (4/4)! กรุณากดลบ (✕) ท่าเดิมออกก่อน");
                                                                                    return prev;
                                                                                }
                                                                                poke.moves.push(mInfo.name || entry.move);
                                                                                return newPlayer;
                                                                            });
                                                                        }}
                                                                        sx={{
                                                                            display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 80px 80px 140px',
                                                                            p: 1.2, alignItems: 'center', borderBottom: '1px solid #1a1e27',
                                                                            bgcolor: isKnown ? 'rgba(56,189,248,0.1)' : (canLearn ? 'transparent' : 'rgba(255,255,255,0.01)'),
                                                                            opacity: canLearn ? (isKnown ? 0.6 : 1) : 0.4,
                                                                            cursor: canLearn && !isKnown ? 'pointer' : 'default',
                                                                            transition: 'background-color 0.15s',
                                                                            '&:hover': canLearn && !isKnown ? { bgcolor: 'rgba(255,255,255,0.06)' } : {}
                                                                        }}
                                                                    >
                                                                        <Box sx={{ fontWeight: 'bold', color: canLearn ? 'white' : '#666' }}>{entry.level}</Box>
                                                                        <Box sx={{ fontWeight: 'bold', color: isKnown ? '#38bdf8' : 'white', textTransform: 'capitalize' }}>
                                                                            {mInfo.name || entry.move} {isKnown && '✓'}
                                                                        </Box>
                                                                        <Box sx={{ color: typeColors[mInfo.type?.toLowerCase()] || '#A8A77A', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                                                            {mInfo.type || 'NORMAL'}
                                                                        </Box>
                                                                        <Box sx={{ textTransform: 'capitalize', color: '#ccc', fontSize: '0.85rem' }}>
                                                                            {mInfo.category || 'Physical'}
                                                                        </Box>
                                                                        <Box sx={{ color: '#ccc' }}>{mInfo.power || '-'}</Box>
                                                                        <Box sx={{ color: '#ccc' }}>{mInfo.accuracy || '-'}</Box>
                                                                        <Box sx={{ textAlign: 'right', pr: 1, fontSize: '0.75rem', fontWeight: 'bold', color: isKnown ? '#38bdf8' : (canLearn ? '#4ade80' : '#ef4444') }}>
                                                                            {isKnown ? 'เรียนรู้อยู่' : (canLearn ? 'พร้อมเรียน' : `Lv. ${entry.level}`)}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}

                                                            {moveCategoryTab === 'tm' && (pData.tm_moves || []).map((moveId, idx) => {
                                                                const cleanMoveId = moveId.toLowerCase().replace(/ /g, '-');
                                                                const mInfo = moveData[cleanMoveId] || { name: moveId, type: 'normal', category: 'physical', power: '-', accuracy: '-' };
                                                                const isKnown = (p.moves || []).some(m => m.toLowerCase().replace(/ /g, '-') === cleanMoveId);
                                                                const hasTM = hasTmInInventory(player, cleanMoveId);

                                                                return (
                                                                    <Box 
                                                                        key={`tm-${cleanMoveId}-${idx}`}
                                                                        onClick={() => {
                                                                            if (!hasTM) {
                                                                                alert(`คุณยังไม่มีไอเทม TM ชนิดนี้ในกระเป๋า ต้องสะสม TM ก่อนจึงจะปลดล็อกให้กดเรียนได้`);
                                                                                return;
                                                                            }
                                                                            if (isKnown) return;
                                                                            setPlayer(prev => {
                                                                                const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                                const poke = newPlayer.team[selectedTeamIndex];
                                                                                if (!poke) return prev;
                                                                                if (!poke.moves) poke.moves = [];
                                                                                
                                                                                if (poke.moves.some(m => m.toLowerCase().replace(/ /g, '-') === cleanMoveId)) return prev;
                                                                                if (poke.moves.length >= 4) {
                                                                                    alert("ช่องใส่ท่าเต็มแล้ว (4/4)! กรุณากดลบ (✕) ท่าเดิมออกก่อน");
                                                                                    return prev;
                                                                                }
                                                                                poke.moves.push(mInfo.name || moveId);
                                                                                return newPlayer;
                                                                            });
                                                                        }}
                                                                        sx={{
                                                                            display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 80px 80px 140px',
                                                                            p: 1.2, alignItems: 'center', borderBottom: '1px solid #1a1e27',
                                                                            bgcolor: isKnown ? 'rgba(56,189,248,0.1)' : (hasTM ? 'rgba(56,189,248,0.05)' : 'rgba(0,0,0,0.2)'),
                                                                            opacity: hasTM ? (isKnown ? 0.6 : 1) : 0.45,
                                                                            cursor: hasTM && !isKnown ? 'pointer' : 'default',
                                                                            transition: 'background-color 0.15s',
                                                                            '&:hover': hasTM && !isKnown ? { bgcolor: 'rgba(56,189,248,0.15)' } : {}
                                                                        }}
                                                                    >
                                                                        <Box sx={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '0.8rem' }}>TM</Box>
                                                                        <Box sx={{ fontWeight: 'bold', color: isKnown ? '#38bdf8' : (hasTM ? 'white' : '#888'), textTransform: 'capitalize' }}>
                                                                            {mInfo.name || moveId} {isKnown && '✓'}
                                                                        </Box>
                                                                        <Box sx={{ color: typeColors[mInfo.type?.toLowerCase()] || '#A8A77A', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                                                            {mInfo.type || 'NORMAL'}
                                                                        </Box>
                                                                        <Box sx={{ textTransform: 'capitalize', color: '#ccc', fontSize: '0.85rem' }}>
                                                                            {mInfo.category || 'Physical'}
                                                                        </Box>
                                                                        <Box sx={{ color: '#ccc' }}>{mInfo.power || '-'}</Box>
                                                                        <Box sx={{ color: '#ccc' }}>{mInfo.accuracy || '-'}</Box>
                                                                        <Box sx={{ textAlign: 'right', pr: 1, fontSize: '0.75rem', fontWeight: 'bold', color: isKnown ? '#38bdf8' : (hasTM ? '#4ade80' : '#64748b') }}>
                                                                            {isKnown ? 'เรียนรู้อยู่' : (hasTM ? 'ปลดล็อกแล้ว (มี TM)' : 'ล็อกอยู่ (ต้องใช้ TM)')}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}

                                                            {moveCategoryTab === 'egg' && (pData.egg_moves || []).map((moveId, idx) => {
                                                                const cleanMoveId = moveId.toLowerCase().replace(/ /g, '-');
                                                                const mInfo = moveData[cleanMoveId] || { name: moveId, type: 'normal', category: 'physical', power: '-', accuracy: '-' };
                                                                const isKnown = (p.moves || []).some(m => m.toLowerCase().replace(/ /g, '-') === cleanMoveId);

                                                                return (
                                                                    <Box 
                                                                        key={`egg-${cleanMoveId}-${idx}`}
                                                                        sx={{
                                                                            display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 80px 80px 140px',
                                                                            p: 1.2, alignItems: 'center', borderBottom: '1px solid #1a1e27',
                                                                            bgcolor: isKnown ? 'rgba(56,189,248,0.08)' : 'rgba(192,132,252,0.04)',
                                                                            opacity: 0.55,
                                                                            cursor: 'not-allowed',
                                                                        }}
                                                                    >
                                                                        <Box sx={{ fontWeight: 'bold', color: '#c084fc', fontSize: '0.8rem' }}>EGG</Box>
                                                                        <Box sx={{ fontWeight: 'bold', color: isKnown ? '#38bdf8' : '#aaa', textTransform: 'capitalize' }}>
                                                                            {mInfo.name || moveId} {isKnown && '✓'}
                                                                        </Box>
                                                                        <Box sx={{ color: typeColors[mInfo.type?.toLowerCase()] || '#A8A77A', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                                                            {mInfo.type || 'NORMAL'}
                                                                        </Box>
                                                                        <Box sx={{ textTransform: 'capitalize', color: '#888', fontSize: '0.85rem' }}>
                                                                            {mInfo.category || 'Physical'}
                                                                        </Box>
                                                                        <Box sx={{ color: '#888' }}>{mInfo.power || '-'}</Box>
                                                                        <Box sx={{ color: '#888' }}>{mInfo.accuracy || '-'}</Box>
                                                                        <Box sx={{ textAlign: 'right', pr: 1, fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                                                                            ท่าไข่ (ยังเรียนไม่ได้)
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}

                                                            {((moveCategoryTab === 'level' && sortedLearnset.length === 0) ||
                                                              (moveCategoryTab === 'tm' && (pData.tm_moves || []).length === 0) ||
                                                              (moveCategoryTab === 'egg' && (pData.egg_moves || []).length === 0)) && (
                                                                <Box sx={{ p: 3, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                                                    ไม่พบข้อมูลท่าเรียนรู้ประเภทนี้ในฐานข้อมูล
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </>
                                                )}

                                                {/* 2. Nature View */}
                                                {teamSubView === 'nature' && (
                                                    <>
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 100px', p: 1.2, bgcolor: '#0b0c10', borderRadius: '6px 6px 0 0', border: '1px solid #222', borderBottom: 'none', color: '#888', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            <Box>Nature (ชื่อ)</Box>
                                                            <Box>+ Stat (บวก)</Box>
                                                            <Box>- Stat (ลบ)</Box>
                                                            <Box sx={{ textAlign: 'center' }}>Status</Box>
                                                        </Box>
                                                        <Box sx={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #222', borderRadius: '0 0 6px 6px', bgcolor: '#0e1017' }}>
                                                            {natureNames.map(nat => {
                                                                const mod = natureList[nat];
                                                                const isCurrent = (p.nature || 'Hardy') === nat;
                                                                return (
                                                                    <Box key={nat}
                                                                        onClick={() => {
                                                                            if (isCurrent) return;
                                                                            setPlayer(prev => {
                                                                                const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                                if (newPlayer.team[selectedTeamIndex]) {
                                                                                    newPlayer.team[selectedTeamIndex].nature = nat;
                                                                                }
                                                                                return newPlayer;
                                                                            });
                                                                        }}
                                                                        sx={{
                                                                            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 100px', p: 1.2, alignItems: 'center',
                                                                            borderBottom: '1px solid #1a1e27',
                                                                            bgcolor: isCurrent ? 'rgba(56,189,248,0.15)' : 'transparent',
                                                                            cursor: isCurrent ? 'default' : 'pointer',
                                                                            '&:hover': isCurrent ? {} : { bgcolor: 'rgba(255,255,255,0.06)' }
                                                                        }}
                                                                    >
                                                                        <Box sx={{ fontWeight: 'bold', color: isCurrent ? '#38bdf8' : 'white' }}>{nat}</Box>
                                                                        <Box sx={{ color: '#4ade80', fontWeight: 'bold' }}>{mod.inc !== mod.dec ? `+ 10% ${statNames[mod.inc]}` : '-'}</Box>
                                                                        <Box sx={{ color: '#ef4444', fontWeight: 'bold' }}>{mod.inc !== mod.dec ? `- 10% ${statNames[mod.dec]}` : '-'}</Box>
                                                                        <Box sx={{ textAlign: 'center', color: isCurrent ? '#38bdf8' : '#666', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                                                                            {isCurrent ? 'Equipped ✓' : 'Select'}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    </>
                                                )}

                                                {/* 3. Item View */}
                                                {teamSubView === 'item' && (
                                                    <>
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr 80px 100px', p: 1.2, bgcolor: '#0b0c10', borderRadius: '6px 6px 0 0', border: '1px solid #222', borderBottom: 'none', color: '#888', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            <Box>Item (ชื่อ)</Box>
                                                            <Box>Effect (ความสามารถ)</Box>
                                                            <Box sx={{ textAlign: 'center' }}>Qty (จำนวน)</Box>
                                                            <Box sx={{ textAlign: 'center' }}>Status</Box>
                                                        </Box>
                                                        <Box sx={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #222', borderRadius: '0 0 6px 6px', bgcolor: '#0e1017' }}>
                                                            {p.item && (
                                                                <Box 
                                                                    onClick={() => {
                                                                        setPlayer(prev => {
                                                                            const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                            const poke = newPlayer.team[selectedTeamIndex];
                                                                            if (!poke || !poke.item) return prev;
                                                                            const oldItem = poke.item;
                                                                            
                                                                            if (!newPlayer.inventory) newPlayer.inventory = {};
                                                                            let returnTab = 'hold_items';
                                                                            for (const tab of ['pokeball', 'berries', 'hold_items', 'evo_item', 'machines']) {
                                                                                if ((newPlayer.inventory[tab] || []).some(i => i.id === oldItem)) {
                                                                                    returnTab = tab;
                                                                                    break;
                                                                                }
                                                                            }
                                                                            const oldItemData = itemData.find(i => i.id === oldItem);
                                                                            if (oldItemData && oldItemData.type === 'berry') returnTab = 'berries';
                                                                            if (oldItemData && oldItemData.type === 'evolution') returnTab = 'evo_item';
                                                                            
                                                                            if (!newPlayer.inventory[returnTab]) newPlayer.inventory[returnTab] = [];
                                                                            const existingOld = newPlayer.inventory[returnTab].find(i => i.id === oldItem);
                                                                            if (existingOld) existingOld.quantity += 1;
                                                                            else newPlayer.inventory[returnTab].push({ id: oldItem, quantity: 1 });
                                                                            
                                                                            poke.item = null;
                                                                            return newPlayer;
                                                                        });
                                                                    }}
                                                                    sx={{
                                                                        display: 'grid', gridTemplateColumns: '1.5fr 2.5fr 80px 100px', p: 1.2, alignItems: 'center',
                                                                        borderBottom: '1px solid #1a1e27', bgcolor: 'rgba(239, 68, 68, 0.15)', cursor: 'pointer',
                                                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.25)' }
                                                                    }}
                                                                >
                                                                    <Box sx={{ fontWeight: 'bold', color: '#ef4444' }}>✕ None (ถอดไอเทม)</Box>
                                                                    <Box sx={{ color: '#aaa', fontStyle: 'italic' }}>Unequip current hold item: {itemData.find(i=>i.id===p.item)?.name || p.item}</Box>
                                                                    <Box sx={{ textAlign: 'center', color: '#888' }}>-</Box>
                                                                    <Box sx={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>Unequip</Box>
                                                                </Box>
                                                            )}

                                                            {(() => {
                                                                const allItems = ['hold_items', 'berries', 'evo_item'].flatMap(tab => 
                                                                    (player.inventory?.[tab] || []).map(i => ({ ...i, tab }))
                                                                );
                                                                
                                                                if (allItems.length === 0 && !p.item) {
                                                                    return <Box sx={{ p: 3, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No items in inventory (ไม่มีไอเทมสวมใส่ในกระเป๋า)</Box>;
                                                                }

                                                                return allItems.map((invItem, idx) => {
                                                                    const itemInfo = itemData.find(i => i.id === invItem.id) || { name: invItem.id, effect: 'No effect description.' };
                                                                    const isEquipped = p.item === invItem.id;

                                                                    return (
                                                                        <Box key={`${invItem.id}-${idx}`}
                                                                            onClick={() => {
                                                                                if (isEquipped) return;
                                                                                setPlayer(prev => {
                                                                                    const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                                    const poke = newPlayer.team[selectedTeamIndex];
                                                                                    if (!poke) return prev;
                                                                                    const oldItem = poke.item || '';
                                                                                    const newItem = invItem.id;
                                                                                    if (oldItem === newItem) return prev;

                                                                                    if (!newPlayer.inventory) newPlayer.inventory = {};

                                                                                    if (oldItem) {
                                                                                        let returnTab = 'hold_items';
                                                                                        for (const tab of ['pokeball', 'berries', 'hold_items', 'evo_item', 'machines']) {
                                                                                            if ((newPlayer.inventory[tab] || []).some(i => i.id === oldItem)) {
                                                                                                returnTab = tab;
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                        const oldItemData = itemData.find(i => i.id === oldItem);
                                                                                        if (oldItemData && oldItemData.type === 'berry') returnTab = 'berries';
                                                                                        if (oldItemData && oldItemData.type === 'evolution') returnTab = 'evo_item';
                                                                                        
                                                                                        if (!newPlayer.inventory[returnTab]) newPlayer.inventory[returnTab] = [];
                                                                                        const existingOld = newPlayer.inventory[returnTab].find(i => i.id === oldItem);
                                                                                        if (existingOld) existingOld.quantity += 1;
                                                                                        else newPlayer.inventory[returnTab].push({ id: oldItem, quantity: 1 });
                                                                                    }

                                                                                    for (const tab of ['pokeball', 'berries', 'hold_items', 'evo_item', 'machines']) {
                                                                                        if (newPlayer.inventory[tab]) {
                                                                                            const idx = newPlayer.inventory[tab].findIndex(i => i.id === newItem);
                                                                                            if (idx > -1) {
                                                                                                newPlayer.inventory[tab][idx].quantity -= 1;
                                                                                                if (newPlayer.inventory[tab][idx].quantity <= 0) {
                                                                                                    newPlayer.inventory[tab].splice(idx, 1);
                                                                                                }
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                    }

                                                                                    poke.item = newItem;
                                                                                    return newPlayer;
                                                                                });
                                                                            }}
                                                                            sx={{
                                                                                display: 'grid', gridTemplateColumns: '1.5fr 2.5fr 80px 100px', p: 1.2, alignItems: 'center',
                                                                                borderBottom: '1px solid #1a1e27',
                                                                                bgcolor: isEquipped ? 'rgba(251,191,36,0.15)' : 'transparent',
                                                                                cursor: isEquipped ? 'default' : 'pointer',
                                                                                '&:hover': isEquipped ? {} : { bgcolor: 'rgba(255,255,255,0.06)' }
                                                                            }}
                                                                        >
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                <img src={`https://www.serebii.net/itemdex/sprites/${invItem.id}.png`} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} onError={(e)=>{e.target.style.display='none'}} />
                                                                                <Box sx={{ fontWeight: 'bold', color: isEquipped ? '#fbbf24' : 'white', textTransform: 'capitalize' }}>{itemInfo.name}</Box>
                                                                            </Box>
                                                                            <Box sx={{ color: '#ccc', fontSize: '0.85rem', lineHeight: 1.3 }}>{itemInfo.effect || 'No description available.'}</Box>
                                                                            <Box sx={{ textAlign: 'center', fontWeight: 'bold', color: '#fbbf24' }}>x{invItem.quantity}</Box>
                                                                            <Box sx={{ textAlign: 'center', color: isEquipped ? '#fbbf24' : '#4ade80', fontWeight: isEquipped ? 'bold' : 'normal' }}>
                                                                                {isEquipped ? 'Equipped ✓' : 'Equip'}
                                                                            </Box>
                                                                        </Box>
                                                                    );
                                                                });
                                                            })()}
                                                        </Box>
                                                    </>
                                                )}

                                                {/* 4. Ability View */}
                                                {teamSubView === 'ability' && (
                                                    <>
                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 100px', p: 1.2, bgcolor: '#0b0c10', borderRadius: '6px 6px 0 0', border: '1px solid #222', borderBottom: 'none', color: '#888', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            <Box>Ability (ชื่อ)</Box>
                                                            <Box>Effect (ความสามารถ)</Box>
                                                            <Box sx={{ textAlign: 'center' }}>Status</Box>
                                                        </Box>
                                                        <Box sx={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #222', borderRadius: '0 0 6px 6px', bgcolor: '#0e1017' }}>
                                                            {(pData?.abilities || [p.ability || 'Synchronize']).map((abName, idx) => {
                                                                const abKey = abName.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                                const abInfo = abilityData[abKey];
                                                                const isCurrent = (p.ability || pData?.abilities?.[0]) === abName;
                                                                return (
                                                                    <Box key={idx}
                                                                        onClick={() => {
                                                                            if (isCurrent) return;
                                                                            setPlayer(prev => {
                                                                                const newPlayer = JSON.parse(JSON.stringify(prev));
                                                                                if (newPlayer.team[selectedTeamIndex]) {
                                                                                    newPlayer.team[selectedTeamIndex].ability = abName;
                                                                                }
                                                                                return newPlayer;
                                                                            });
                                                                        }}
                                                                        sx={{
                                                                            display: 'grid', gridTemplateColumns: '1.5fr 3fr 100px', p: 1.5, alignItems: 'center',
                                                                            borderBottom: '1px solid #1a1e27',
                                                                            bgcolor: isCurrent ? 'rgba(168,85,247,0.15)' : 'transparent',
                                                                            cursor: isCurrent ? 'default' : 'pointer',
                                                                            '&:hover': isCurrent ? {} : { bgcolor: 'rgba(255,255,255,0.06)' }
                                                                        }}
                                                                    >
                                                                        <Box sx={{ fontWeight: 'bold', color: isCurrent ? '#c084fc' : 'white', fontSize: '1rem' }}>{abName}</Box>
                                                                        <Box sx={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.4 }}>{abInfo?.desc || 'No description available.'}</Box>
                                                                        <Box sx={{ textAlign: 'center', color: isCurrent ? '#c084fc' : '#666', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                                                                            {isCurrent ? 'Equipped ✓' : 'Select'}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    </>
                                                )}
                                            </Box>

                                        </Box>
                                    );
                                })()}
                            </Box>

                        </Box>
                    </Box>
                </Box>
            )}
            {/* ===== SHOP MODAL ===== */}
            {isShopOpen && (() => {
                const catalog = (shopCatalog && shopCatalog.length > 0) ? shopCatalog : [
                    {
                        key: 'balls',
                        label: 'Poke Balls',
                        inventoryType: 'pokeball',
                        items: [
                            { id: 'pokeball', price: 100 },
                            { id: 'greatball', price: 300 },
                            { id: 'ultraball', price: 600 }
                        ]
                    },
                    {
                        key: 'berries',
                        label: 'Berries',
                        inventoryType: 'berries',
                        items: [
                            { id: 'oranberry', price: 80 },
                            { id: 'sitrusberry', price: 200 },
                            { id: 'leppaberry', price: 150 },
                            { id: 'cheriberry', price: 80 },
                            { id: 'pechaberry', price: 80 },
                            { id: 'rawstberry', price: 80 },
                            { id: 'aspearberry', price: 80 },
                            { id: 'chestoberry', price: 80 },
                            { id: 'kebiaberry', price: 120 },
                            { id: 'lumberry', price: 350 },
                            { id: 'persimberry', price: 100 }
                        ]
                    }
                ];

                const activeTabObj = catalog.find(t => t.key === shopTab) || catalog[0];
                const activeTabKey = activeTabObj?.key || '';
                const currentInventoryType = activeTabObj?.inventoryType || 'berries';
                
                const rawItems = activeTabObj?.use_all_tms 
                    ? tmListData.map(tm => ({ id: tm.id, name: tm.name, move: tm.move, price: 500 }))
                    : (activeTabObj?.items || []);

                const items = rawItems.map(rawItem => {
                    const meta = itemData.find(i => i.id === rawItem.id) || {};
                    return {
                        id: rawItem.id,
                        name: rawItem.name || meta.name || rawItem.id,
                        move: rawItem.move || meta.move,
                        desc: meta.effect || meta.desc || (rawItem.move ? `สอนท่า ${rawItem.move} ให้กับโปเกม่อนที่รองรับ` : 'ไอเทมใช้งานในเกม'),
                        price: rawItem.price !== undefined ? rawItem.price : (meta.price || 100),
                        qty: 1,
                        inventoryType: currentInventoryType,
                        imageUrl: `https://www.serebii.net/itemdex/sprites/${rawItem.id.replace('tm-', '')}.png`
                    };
                });

                const pts = player.points || 0;

                const handleCloseShop = () => {
                    setIsShopOpen(false);
                    if (currentNpc) {
                        const currentScript = getCurrentScript(currentNpc, player.phase, currentLocation, player.time);
                        const currentStep = currentScript.find(item => item.node === currentNode);
                        if (currentStep && currentStep.nextNode !== null && currentStep.nextNode !== undefined) {
                            const nextStep = currentScript.find(item => item.node === currentStep.nextNode);
                            if (nextStep) {
                                setCurrentNode(nextStep.node);
                                processScriptStep(nextStep, currentNpc);
                                return;
                            }
                        }
                        loadLocationState(currentLocation);
                    }
                };

                const handleBuy = (item) => {
                    if (pts < item.price) return;
                    setPlayer(prev => {
                        const np = JSON.parse(JSON.stringify(prev));
                        np.points = (np.points || 0) - item.price;
                        if (!np.inventory) np.inventory = {};
                        if (!np.inventory[item.inventoryType]) np.inventory[item.inventoryType] = [];
                        const existing = np.inventory[item.inventoryType].find(x => x.id === item.id);
                        if (existing) { existing.quantity += item.qty; }
                        else { 
                            const itemObj = { id: item.id, quantity: item.qty };
                            if (item.move) itemObj.move = item.move;
                            if (item.name) itemObj.name = item.name;
                            np.inventory[item.inventoryType].push(itemObj); 
                        }
                        return np;
                    });
                };

                return (
                    <Box sx={{
                        position: 'fixed', inset: 0, zIndex: 1300,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(6px)',
                    }} onClick={handleCloseShop}>
                        <Box sx={{
                            width: 720, maxWidth: '96vw',
                            bgcolor: '#0f1117',
                            border: '1px solid #2a2d3a',
                            borderRadius: 3,
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
                        }} onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 3, py: 2,
                                borderBottom: '1px solid #1e2130',
                                bgcolor: '#0b0d14',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                                    <Box sx={{ fontSize: '1.15rem', fontWeight: 'bold', letterSpacing: 1, color: '#e2e8f0' }}>POKEMON MART</Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 0,
                                        border: '1px solid #333', borderRadius: 1, overflow: 'hidden',
                                    }}>
                                        <Box sx={{ bgcolor: '#1e2028', px: 1, py: 0.35, fontSize: '0.65rem', fontWeight: 'bold', color: '#666', letterSpacing: 1 }}>PTS</Box>
                                        <Box sx={{ bgcolor: '#13151c', px: 1.2, py: 0.35, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.95rem', color: '#e2c97e', minWidth: 65, textAlign: 'right' }}>
                                            {displayPoints.toLocaleString()}
                                        </Box>
                                    </Box>
                                    <Button onClick={handleCloseShop}
                                        sx={{ minWidth: 32, width: 32, height: 32, borderRadius: '50%', color: '#666', '&:hover': { bgcolor: '#1e2130', color: '#fff' } }}>X</Button>
                                </Box>
                            </Box>

                            {/* Tabs */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #1e2130', bgcolor: '#0d0f18' }}>
                                {catalog.map(t => {
                                    const isSelected = activeTabKey === t.key;
                                    return (
                                        <Box key={t.key} onClick={() => setShopTab(t.key)} sx={{
                                            px: 3, py: 1.5, cursor: 'pointer', fontSize: '0.82rem',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            color: isSelected ? '#38bdf8' : '#64748b',
                                            borderBottom: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
                                            transition: 'all 0.2s',
                                            letterSpacing: 0.5,
                                            '&:hover': { color: '#94a3b8' },
                                        }}>{t.label}</Box>
                                    );
                                })}
                            </Box>

                            {/* Item Grid */}
                            <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, maxHeight: 440, overflowY: 'auto',
                                '&::-webkit-scrollbar': { width: 6 },
                                '&::-webkit-scrollbar-track': { bgcolor: '#0b0d14' },
                                '&::-webkit-scrollbar-thumb': { bgcolor: '#2a2d3a', borderRadius: 3 },
                            }}>
                                {items.map(item => {
                                    const canAfford = pts >= item.price;
                                    const ownedEntry = player.inventory?.[item.inventoryType]?.find(x => x.id === item.id);
                                    const owned = ownedEntry?.quantity || 0;
                                    return (
                                        <Box key={item.id} sx={{
                                            bgcolor: '#13151e', border: '1px solid',
                                            borderColor: canAfford ? '#1e2a38' : '#1a1a22',
                                            borderRadius: 2, p: 1.8,
                                            display: 'flex', gap: 1.5, alignItems: 'center',
                                            transition: 'border-color 0.2s, background 0.2s',
                                            '&:hover': canAfford ? { bgcolor: '#151820', borderColor: '#38bdf850' } : {},
                                        }}>
                                            {/* Item Icon */}
                                            <Box sx={{
                                                width: 48, height: 48, minWidth: 48,
                                                bgcolor: '#0a0b10', border: '1px solid #1e2130', borderRadius: 2,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5
                                            }}>
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.id}.png`;
                                                    }}
                                                />
                                            </Box>

                                            {/* Item Details */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100%', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                                                        <Box sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Box>
                                                        {owned > 0 && (
                                                            <Box sx={{ fontSize: '0.65rem', color: '#4ade80', bgcolor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 1, px: 0.8, py: 0.1, whiteSpace: 'nowrap', ml: 0.5 }}>x{owned}</Box>
                                                        )}
                                                    </Box>
                                                    <Box sx={{
                                                        fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3,
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                    }}>
                                                        {item.desc}
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                    <Box sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.82rem', color: canAfford ? '#e2c97e' : '#444' }}>
                                                        {item.price.toLocaleString()} PTS
                                                    </Box>
                                                    <Button
                                                        disabled={!canAfford}
                                                        onClick={() => handleBuy(item)}
                                                        sx={{
                                                            minWidth: 60, height: 26, px: 1.2,
                                                            fontSize: '0.7rem', fontWeight: 'bold', borderRadius: 1,
                                                            bgcolor: canAfford ? '#1a3a4a' : '#111318',
                                                            color: canAfford ? '#38bdf8' : '#333',
                                                            border: '1px solid', borderColor: canAfford ? '#38bdf840' : '#222',
                                                            '&:hover': { bgcolor: canAfford ? '#1e4a5e' : '#111318' },
                                                            '&.Mui-disabled': { color: '#333', bgcolor: '#111318' },
                                                        }}
                                                    >BUY</Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Footer */}
                            <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid #1e2130', bgcolor: '#0b0d14', display: 'flex', justifyContent: 'flex-end' }}>
                                <Box sx={{ fontSize: '0.7rem', color: '#475569', letterSpacing: 0.5 }}>ชำระเงินด้วย PTS จากระบบภารกิจและบทสนทนา</Box>
                            </Box>
                        </Box>
                    </Box>
                );
            })()}

            {/* Evolution Modal Overlay */}
            {evoModalState && evoModalState.open && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.92)', zIndex: 20000,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    color: 'white', p: 3
                }}>
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        bgcolor: '#11131a', borderRadius: 4, p: 4, maxWidth: 450, width: '90%',
                        border: '2px solid #38bdf8', boxShadow: '0 0 50px rgba(56,189,248,0.4)',
                        textAlign: 'center', position: 'relative', overflow: 'hidden'
                    }}>
                        <Box sx={{ fontSize: '1.4rem', fontWeight: 'bold', mb: 2, color: '#38bdf8', letterSpacing: 1 }}>
                            {evoModalState.stage === 'glowing' ? 'กำลังวิวัฒนาการร่าง...' : 'วิวัฒนาการสำเร็จ!'}
                        </Box>

                        {/* Sprite Display Container */}
                        <Box sx={{
                            width: 170, height: 170, display: 'flex', justifyContent: 'center', alignItems: 'center',
                            my: 2, position: 'relative'
                        }}>
                            {/* Glow ring animation */}
                            <Box sx={{
                                position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
                                background: evoModalState.stage === 'glowing'
                                    ? 'radial-gradient(circle, rgba(56,189,248,0.6) 0%, rgba(0,0,0,0) 70%)'
                                    : 'radial-gradient(circle, rgba(250,204,21,0.7) 0%, rgba(0,0,0,0) 70%)',
                                animation: evoModalState.stage === 'glowing' ? 'pulseGlow 1s infinite alternate' : 'none',
                                '@keyframes pulseGlow': {
                                    '0%': { transform: 'scale(0.8)', opacity: 0.5 },
                                    '100%': { transform: 'scale(1.2)', opacity: 1 }
                                }
                            }} />

                            {evoModalState.stage === 'glowing' ? (
                                <Box
                                    component="img"
                                    src={`https://play.pokemonshowdown.com/sprites/gen5/${evoModalState.oldPokemon.species.toLowerCase()}.png`}
                                    sx={{
                                        width: 130, height: 130, objectFit: 'contain', imageRendering: 'pixelated',
                                        filter: 'drop-shadow(0 0 15px #38bdf8) brightness(1.5)',
                                        animation: 'bounceEvo 0.6s infinite alternate',
                                        '@keyframes bounceEvo': {
                                            '0%': { transform: 'scale(0.95)' },
                                            '100%': { transform: 'scale(1.1)' }
                                        }
                                    }}
                                />
                            ) : (
                                <Box
                                    component="img"
                                    src={`https://play.pokemonshowdown.com/sprites/gen5/${evoModalState.evoInfo.targetSpecies.toLowerCase()}.png`}
                                    sx={{
                                        width: 140, height: 140, objectFit: 'contain', imageRendering: 'pixelated',
                                        filter: 'drop-shadow(0 0 20px #facc15)',
                                        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        '@keyframes popIn': {
                                            '0%': { transform: 'scale(0.2)', opacity: 0 },
                                            '100%': { transform: 'scale(1)', opacity: 1 }
                                        }
                                    }}
                                />
                            )}
                        </Box>

                        <Box sx={{ fontSize: '1.05rem', fontWeight: 'bold', my: 2 }}>
                            {evoModalState.stage === 'glowing' ? (
                                <span style={{ color: '#94a3b8' }}>
                                    {evoModalState.oldPokemon.nickname || evoModalState.oldPokemon.species} กำลังเปล่งแสง...
                                </span>
                            ) : (
                                <span style={{ color: '#4ade80' }}>
                                    {evoModalState.oldPokemon.nickname || evoModalState.oldPokemon.species} ได้พัฒนาเป็น{' '}
                                    <strong style={{ color: '#facc15', textTransform: 'capitalize' }}>
                                        {evoModalState.evoInfo.targetSpecies}
                                    </strong>{' '}
                                    แล้ว!
                                </span>
                            )}
                        </Box>

                        {evoModalState.stage === 'transformed' && (
                            <Button
                                onClick={() => setEvoModalState(null)}
                                sx={{
                                    mt: 2, px: 4, py: 1, bgcolor: '#facc15', color: '#0f172a', fontWeight: 'bold',
                                    fontSize: '0.95rem', borderRadius: 2, '&:hover': { bgcolor: '#eab308' },
                                    boxShadow: '0 0 15px rgba(250,204,21,0.5)'
                                }}
                            >
                                ตกลง
                            </Button>
                        )}
                    </Box>
                </Box>
            )}

            {/* Wait Time Modal (รอเวลา) */}
            {(() => {
                const curHour = player.time || 6;
                const maxMins = Math.max(0, Math.floor((24 - curHour) * 60));

                const formatHourToTimeString = (h) => {
                    const totalMins = Math.floor(h * 60);
                    const hour = Math.floor(totalMins / 60) % 24;
                    const mins = totalMins % 60;
                    return `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')} น.`;
                };

                const handleConfirmWait = () => {
                    const minutesToWait = Math.min(waitMinutes, maxMins);
                    if (minutesToWait <= 0) return;

                    const hours = minutesToWait / 60;
                    advanceTime(hours);
                    setIsWaitModalOpen(false);

                    const timeStr = formatHourToTimeString(curHour + hours);
                    const waitStr = minutesToWait >= 60 
                        ? `${Math.floor(minutesToWait / 60)} ชม. ${minutesToWait % 60 > 0 ? `${minutesToWait % 60} นาที` : ''}` 
                        : `${minutesToWait} นาที`;

                    setCurrentDialogData({
                        action: "showText",
                        speaker: null,
                        dialog: `คุณนั่งรอเวลาผ่านไป ${waitStr}... (เวลาปัจจุบัน: ${timeStr})`
                    });
                };

                return (
                    <Dialog 
                        open={isWaitModalOpen} 
                        onClose={() => setIsWaitModalOpen(false)}
                        slotProps={{
                            paper: {
                                sx: {
                                    bgcolor: '#141722',
                                    color: 'white',
                                    border: '1px solid #1e293b',
                                    borderRadius: 3,
                                    p: 1,
                                    minWidth: { xs: 320, sm: 440 }
                                }
                            }
                        }}
                    >
                        <DialogTitle sx={{ fontWeight: 'bold', color: '#38bdf8', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            ⏳ รอเวลา (Pass Time)
                        </DialogTitle>
                        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
                            <Box sx={{ bgcolor: '#0f172a', p: 1.5, borderRadius: 2, border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>เวลาปัจจุบัน</Typography>
                                    <Typography sx={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '1.1rem' }}>
                                        {formatHourToTimeString(curHour)}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#64748b' }}>➔</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>เวลาหลังข้าม</Typography>
                                    <Typography sx={{ fontWeight: 'bold', color: '#4ade80', fontSize: '1.1rem' }}>
                                        {formatHourToTimeString(curHour + (Math.min(waitMinutes, maxMins) / 60))}
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="caption" sx={{ color: maxMins <= 0 ? '#ef4444' : '#64748b' }}>
                                {maxMins <= 0 
                                    ? '⚠️ ขณะนี้เป็นเวลาเที่ยงคืนแล้ว (24:00 น.) ต้องกลับไปนอนพักผ่อนที่ห้อง' 
                                    : `🛑 ห้ามข้ามเวลากินเที่ยงคืน (24:00 น.) — เหลือข้ามได้อีกสูงสุด ${Math.floor(maxMins / 60)} ชม. ${maxMins % 60} นาที`
                                }
                            </Typography>

                            {/* Quick Presets */}
                            {maxMins > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {[15, 30, 60, 120, 180, maxMins].map((mins, i) => {
                                        if (mins <= 0 || mins > maxMins) return null;
                                        const isSelected = waitMinutes === mins;
                                        const label = mins === maxMins 
                                            ? `จนถึงเที่ยงคืน (${mins}m)` 
                                            : (mins >= 60 ? `+${mins / 60} ชม.` : `+${mins} นาที`);

                                        return (
                                            <Button
                                                key={i}
                                                size="small"
                                                variant={isSelected ? "contained" : "outlined"}
                                                onClick={() => setWaitMinutes(mins)}
                                                sx={{
                                                    bgcolor: isSelected ? "#38bdf8" : "transparent",
                                                    color: isSelected ? "black" : "#38bdf8",
                                                    borderColor: "#38bdf8",
                                                    fontWeight: "bold",
                                                    fontSize: "0.78rem"
                                                }}
                                            >
                                                {label}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            )}

                            {/* Slider input */}
                            {maxMins > 0 && (
                                <Box sx={{ px: 1, pt: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>ปรับเวลารอระบุนาที: <b>{waitMinutes} นาที</b></Typography>
                                    <Slider
                                        min={5}
                                        max={Math.max(5, maxMins)}
                                        step={5}
                                        value={Math.min(waitMinutes, maxMins)}
                                        onChange={(_, val) => setWaitMinutes(val)}
                                        sx={{ color: '#38bdf8', mt: 1 }}
                                    />
                                </Box>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 2, pt: 0 }}>
                            <Button onClick={() => setIsWaitModalOpen(false)} sx={{ color: '#94a3b8' }}>ยกเลิก</Button>
                            <Button 
                                variant="contained" 
                                onClick={handleConfirmWait}
                                disabled={maxMins <= 0 || waitMinutes <= 0}
                                sx={{ bgcolor: '#38bdf8', color: 'black', fontWeight: "bold", "&:hover": { bgcolor: '#0284c7' } }}
                            >
                                ยืนยันการรอ
                            </Button>
                        </DialogActions>
                    </Dialog>
                );
            })()}

        </Box>
    )
}

export default GamePage
