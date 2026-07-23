import { Box, Divider, Button } from "@mui/material"
import { useState, useEffect, useRef } from "react"
import { keyframes } from "@mui/system"
import mapData from "../../data/map.json"
import npcData from "../../data/npc.json"
import playerData from "../../data/player.json"
import pokemonData from "../../data/pokemon.json"
import { generatePlayerTeam } from "../../utils/teamBuilder"
import { WalkingNpc, WalkingPokemonSpawner } from "./WalkingSprites"

const fadePop = keyframes`
  0% { opacity: 0; transform: translateY(40px) scale(0.5); }
  60% { opacity: 1; transform: translateY(-10px) scale(1.1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

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

    // ระบบเวลาเดินอัตโนมัติ (10 นาทีในเกม ต่อ 10 วินาทีในชีวิตจริง)
    useEffect(() => {
        const isIdle = currentDialogData?.action === 'showText' && !isBattling && !isTransitioning && !isSleepingBlackScreen;
        if (!isIdle) return;

        const interval = setInterval(() => {
            setPlayer(prev => {
                let newTime = (prev.time || 6) + (10 / 60);
                return { ...prev, time: newTime };
            });
        }, 10000); // 10 วินาที

        return () => clearInterval(interval);
    }, [currentDialogData?.action, isBattling, isTransitioning, isSleepingBlackScreen]);

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
                advanceTime(battleTurns * 0.5);

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
                            { value: "ปล่อยหนีไป", pos: 1, color: 'white' }
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

            if (pendingActionList) {
                setActionList(pendingActionList)
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

                if (pendingActionList) {
                    setActionList(pendingActionList)
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

            setWildEncounter({ ...encounter, level, moves: latest4Moves })
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
        const npcsInLocation = npcList.filter(npc => getNpcLocation(npc, player.day || 1, player.time || 6) === locId)

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
            advanceTime(0.5); // 30 mins
            triggerEncounter('grass')
        }
        else if (actionItem.value === "ตกปลา") {
            advanceTime(0.5); // 30 mins
            triggerEncounter('water')
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
            advanceTime(0.25); // 15 mins for talking
            
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
                { value: "ยกเลิก", pos: 0, color: 'red' }
            ])

            setCurrentDialogData({
                action: "showText",
                speaker: null,
                dialog: 'เลือกสถานที่ที่ต้องการเดินทางไป:'
            })
        } 
        else if (actionItem.value.startsWith("ไป ")) {
            advanceTime(1); // 1 hour for travel
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
            
            if (pendingActionList) {
                setActionList(pendingActionList);
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
                } else {
                    loadLocationState(currentLocation);
                }
            }
        }
    };

    const topActions = actionList.filter(item => item.pos === 1 && item.value !== "ฟังต่อ")
    const bottomActions = actionList.filter(item => item.pos === 0)

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
                            const mins = Math.floor((displayTime - hrs) * 60);
                            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                        })()
                    } น.
                </Box>
                <Box>สถานที่ปัจจุบัน: {mapList.find(m => m.id === currentLocation)?.name || currentLocation}</Box>
                <Box>Top Right (Points/Bag/Logout)</Box>
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
                        return <PokemonPartyItem key={index} poke={p} bounceIcon={bounceIcon} pokemonData={pokemonData} />;
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
                                        {item.value}
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
                                        {item.value}
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
                {!isTyping && currentDialogData?.action !== 'showText' && currentDialogData?.action !== 'choice' && (
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
        </Box>
    )
}

export default GamePage
