import { Box, Divider, Button } from "@mui/material"
import { useState, useEffect, useRef } from "react"
import { keyframes } from "@mui/system"
import mapData from "../../data/map.json"
import npcData from "../../data/npc.json"
import playerData from "../../data/player.json"
import pokemonData from "../../data/pokemon.json"
import itemData from "../../data/item.json"
import moveData from "../../data/move.json"

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

import { generatePlayerTeam } from "../../utils/teamBuilder"
import { WalkingNpc, WalkingPokemonSpawner } from "./WalkingSprites"

const fadePop = keyframes`
  0% { opacity: 0; transform: translateY(40px) scale(0.5); }
  60% { opacity: 1; transform: translateY(-10px) scale(1.1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const BagSvg = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/>
        <path d="M10 4v4h4V4a2 2 0 0 0-4 0Z"/>
        <path d="M4 10h16"/>
    </svg>
)

const BoxSvg = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
)

const fadeOutShrink = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(20px) scale(0); }
`;


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

const getCurrentScript = (npc, phase) => {
    if (!npc) return [];
    const phaseStr = String(phase || 1);
    if (npc.scripts && npc.scripts[phaseStr]) return npc.scripts[phaseStr];
    if (npc.scripts && npc.scripts["default"]) return npc.scripts["default"];
    return npc.script || [];
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
        const isIdle = currentDialogData?.action === 'showText' && !isBattling && !isTransitioning && !isSleepingBlackScreen;
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
    const isIdleForSprites = currentDialogData?.action === 'showText' && !isBattling && !isTransitioning && !isSleepingBlackScreen;



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
                const { win, defeatedEnemies, turns } = event.data;
                setIsBattling(false);
                setBattleReady(false);

                // เพิ่มเวลา 30 นาทีต่อจำนวนเทิร์น (อย่างน้อย 1 เทิร์น)
                const battleTurns = turns || 1;
                advanceTime(battleTurns * (10 / 60));

                // Calculate EXP
                let totalGainedExp = 0;
                if (defeatedEnemies && defeatedEnemies.length > 0) {
                    const partySize = player.team.filter(p => p).length;
                    defeatedEnemies.forEach(enemy => {
                        const enemyStringName = typeof enemy === 'string' ? enemy : enemy.species;
                        
                        // If it's a trainer battle, try to match by nickname or species
                        let foundEnemyInTeam = null;
                        if (wildEncounter.isTrainer && wildEncounter.team) {
                            foundEnemyInTeam = wildEncounter.team.find(p => 
                                (p.nickname && p.nickname.toLowerCase() === enemyStringName.toLowerCase()) || 
                                p.species.toLowerCase() === enemyStringName.toLowerCase()
                            );
                        }
                        
                        const actualSpecies = foundEnemyInTeam ? foundEnemyInTeam.species : enemyStringName;
                        const enemyData = pokemonData[actualSpecies.toLowerCase()];
                        
                        let enemyLevel = typeof enemy === 'string' ? 5 : (enemy.level || 5);
                        if (foundEnemyInTeam) {
                            enemyLevel = foundEnemyInTeam.level;
                        }
                        
                        const baseExp = enemyData?.baseExp || 60;
                        const a = wildEncounter.isTrainer ? 1.5 : 1;
                        const gainedExp = Math.floor((a * baseExp * enemyLevel) / (partySize * 5));
                        totalGainedExp += gainedExp;
                    });
                }

                let isLevelUp = false;
                if (totalGainedExp > 0) {
                    setPlayer(prev => {
                        const newPlayer = { ...prev };
                        newPlayer.team = prev.team.map(poke => {
                            if (!poke) return null;
                            let currentBaseExp = Math.floor((4 * Math.pow(poke.level, 3)) / 5);
                            let newTotalExp = (poke.totalExp || currentBaseExp + (poke.exp || 0)) + totalGainedExp;
                            
                            let newLevel = poke.level;
                            let nextLvlExp = Math.floor((4 * Math.pow(newLevel + 1, 3)) / 5);
                            
                            while (newTotalExp >= nextLvlExp && newLevel < 100) {
                                newLevel++;
                                nextLvlExp = Math.floor((4 * Math.pow(newLevel + 1, 3)) / 5);
                                isLevelUp = true;
                            }
                            return { ...poke, totalExp: newTotalExp, exp: newTotalExp - Math.floor((4 * Math.pow(newLevel, 3)) / 5), level: newLevel };
                        });
                        return newPlayer;
                    });
                }

                if (wildEncounter.isTrainer) {
                    // Trainer battle end logic
                    const nextNodeId = win ? wildEncounter.nextNode_win : wildEncounter.nextNode_lose;
                    if (nextNodeId && currentNpc) {
                        const currentScript = getCurrentScript(currentNpc, player.phase);
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
                            { value: "ร่างท่าต่อสู้", pos: 1, color: 'gold' },
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
            setDisplayedCharacter(stepData.character || npcObj.id);
            setIsLeaving(false);
            if (stepData.nextNode) {
                setTimeout(() => {
                    const currentScript = getCurrentScript(npcObj, player.phase);
                    const nextStep = currentScript.find(item => item.node === stepData.nextNode);
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
            setIsLeaving(true);
            setTimeout(() => {
                setDisplayedCharacter(null);
                setIsLeaving(false);
                if (stepData.nextNode) {
                    const currentScript = getCurrentScript(npcObj, player.phase);
                    const nextStep = currentScript.find(item => item.node === stepData.nextNode);
                    if (nextStep) {
                        setCurrentNode(nextStep.node);
                        processScriptStep(nextStep, npcObj, pendingActionsToSet);
                    }
                } else {
                    loadLocationState(currentLocation);
                }
            }, 400);
        }
        else if (stepData.action === "event") {
            if (stepData.eventType === "increase_phase") {
                setPlayer(prev => ({ ...prev, phase: (prev.phase || 1) + 1, points: (prev.points || 0) + 1000 }));
                setCurrentDialogData({
                    action: "talk",
                    speaker: null,
                    dialog: stepData.dialog
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
    }

    const triggerEncounter = (type) => {
        const currentMap = mapList.find(m => m.id === currentLocation)
        const list = currentMap?.encounters?.[type]
        if (list && list.length > 0) {
            const encounter = list[Math.floor(Math.random() * list.length)]
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

    const loadLocationState = (locId) => {
        const currentMap = mapList.find(m => m.id === locId)
        if (!currentMap) return

        const baseActions = [...currentMap.action]
        const npcsInLocation = npcList.filter(npc => getNpcLocation(npc, playerRef.current?.day || 1, playerRef.current?.time || 6) === locId)

        const npcActions = npcsInLocation.map(npc => {
            return {
                value: `คุยกับ ${npc.name}`,
                pos: 1,
                color: 'cyan',
                npcId: npc.id
            };
        })

        setPendingActionList([...baseActions, ...npcActions])

        setCurrentDialogData({
            action: "showText",
            speaker: null,
            dialog: `คุณอยู่ที่ ${currentMap.name} ทำอะไรต่อดี`
        })
        setCurrentNpc(null)
        setWildEncounter(null)
        setDisplayedCharacter(null)
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

        if (actionItem.value === "ฟังต่อ") {
            if (currentNpc) {
                // หา Step ปัจจุบันที่กำลังแสดงผลอยู่
                const currentScript = getCurrentScript(currentNpc, player.phase);
                const currentStep = currentScript.find(item => item.node === currentNode)
                
                // เช็คว่ามี nextNode หรือไม่
                if (currentStep && currentStep.nextNode !== null) {
                    const nextStep = currentScript.find(item => item.node === currentStep.nextNode)
                    if (nextStep) {
                        setCurrentNode(nextStep.node)
                        processScriptStep(nextStep, currentNpc, [
                            { value: "ฟังต่อ", pos: 1, color: 'white' }
                        ])
                    } else {
                        loadLocationState(currentLocation)
                    }
                } else {
                    loadLocationState(currentLocation)
                }
            } else {
                loadLocationState(currentLocation)
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
        else if (actionItem.value === "ออกจากการสนทนา") {
            loadLocationState(currentLocation)
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
                { value: "ร่างท่าต่อสู้", pos: 1, color: 'gold' },
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
                    
                    if (newPlayer.team.length < 6) {
                        newPlayer.team.push(newPokemon);
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
        else if (actionItem.value === "ร่างท่าต่อสู้") {
            setPostBattlePhase('sketching');
            const enemyMoves = wildEncounter?.moves || ['Tackle'];
            const moveActions = enemyMoves.map((m) => ({
                value: `${m}`,
                pos: 1,
                color: 'cyan'
            }));
            setPendingActionList([
                ...moveActions,
                { value: "ยกเลิกการร่าง", pos: 0, color: 'red' }
            ]);
            setCurrentDialogData({
                action: "choice",
                speaker: null,
                dialog: `เลือกท่าของ ${wildEncounter.species} ที่ต้องการร่างเลย!`
            });
        }
        else if (actionItem.value === "ยกเลิกการร่าง") {
            setPostBattlePhase('victory');
            setPendingActionList([
                { value: "ร่างท่าต่อสู้", pos: 1, color: 'gold' },
                { value: "ปล่อยหนีไป", pos: 0, color: 'white' }
            ]);
            setCurrentDialogData({
                action: "choice",
                speaker: null,
                dialog: `ยกเลิกการร่าง จะทำอะไรต่อดี?`
            });
        }
        else if (actionItem.value.startsWith("ร่างท่า: ")) {
            const moveName = actionItem.value.replace("ร่างท่า: ", "");
            setCurrentDialogData({
                action: "talk",
                speaker: null,
                dialog: `คุณได้ร่างท่า ${moveName} สำเร็จแล้ว!`
            });
            setIsLeaving(true)
            setPendingActionList([])
            setTimeout(() => {
                setIsLeaving(false)
                setPostBattlePhase(null)
                loadLocationState(currentLocation)
            }, 1000)
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
                const currentScript = getCurrentScript(targetNpc, player.phase);
                const nextStep = currentScript.find(item => item.node === actionItem.customNextNode);
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
                const currentScript = getCurrentScript(targetNpc, player.phase);
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
                <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
             
                    <Button 
                        variant="text" 
                        onClick={() => { setIsPcOpen(true); setSelectedPcSlot(null); setCurrentPcBox(0); }}
                        sx={{ 
                            fontWeight: 'bold', display: 'flex', alignItems: 'center',
                            color: '#38bdf8',
                        }}
                    >
                        กล่อง
                    </Button>
                    <Button 
                        variant="text" 
                        onClick={() => setIsBagOpen(true)}
                        sx={{ 
                            fontWeight: 'bold', display: 'flex', alignItems: 'center',
                            color: '#4ade80',

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
                                        {player.team.filter(p => p !== null).length} / 6
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
                                position: 'relative', // ADDED THIS
                                backgroundImage: `url('${isTransitioning ? previousMapUrl : (mapList.find(m => m.id === currentLocation)?.url || '')}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            {!isTransitioning && displayedCharacter && !isBattling && !wildEncounter && (
                                <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                                    <Box 
                                        component="img" 
                                        src={`https://play.pokemonshowdown.com/sprites/trainers/${displayedCharacter.toLowerCase().replace('gym_', '')}.png`} 
                                        alt={displayedCharacter}
                                        sx={{
                                            width: '250px',
                                            height: '250px',
                                            imageRendering: 'pixelated',
                                            animation: `${isLeaving ? fadeOutShrink : fadePop} ${isLeaving ? '0.4s ease-in' : '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'} forwards`
                                        }}
                                    />
                                </Box>
                            )}
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
                                            animation: `${isLeaving ? fadeOutShrink : fadePop} ${isLeaving ? '0.4s ease-in' : '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'} forwards`
                                        }}
                                    />
                                </Box>
                            )}
                            
                            {/* Walking Sprites */}
                            {isIdleForSprites && activeMap && (
                                <>
                                    {activeNpcs.map(npc => (
                                        <WalkingNpc key={npc.id} npc={npc} currentLocation={currentLocation} />
                                    ))}
                                    <WalkingPokemonSpawner encounters={activeMap.encounters} />
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
                    borderLeft: '1px solid #222'
                }}>
                    {/* จัดกลุ่มข้อความหัวข้อ + เส้น Divider ให้อยู่ชิดกัน */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* ปุ่มกลุ่มบน (pos: 1) */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {topActions.map((item, index) => (
                                    <Button 
                                        key={index}
                                        variant="outlined" 
                                        onClick={() => !item.disabled && handleActionClick(item)} disabled={item.disabled}
                                        sx={{
                                            width: '100%', 
                                            height: '50px',
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 'auto' }}>
                                {bottomActions.map((item, index) => (
                                    <Button 
                                        key={index}
                                        variant="outlined" 
                                        onClick={() => !item.disabled && handleActionClick(item)} disabled={item.disabled}
                                        sx={{
                                            width: '100%', 
                                            height: '50px',
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
                                    <Box sx={{ color: 'gray', fontWeight: 'bold', textAlign: 'center', pb: 1, borderBottom: '1px solid #222' }}>Party</Box>
                                    

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
                                    <Box sx={{ color: 'gray', fontWeight: 'bold', textAlign: 'center', pb: 1, borderBottom: '1px solid #222' }}>Party</Box>
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
        </Box>
    )
}

export default GamePage
