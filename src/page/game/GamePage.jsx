import { Box, Divider, Button } from "@mui/material"
import { useState, useEffect, useRef } from "react"
import { keyframes } from "@mui/system"
import mapData from "../../data/map.json"
import npcData from "../../data/npc.json"
import playerData from "../../data/player.json"
import pokemonData from "../../data/pokemon.json"
import { generatePlayerTeam } from "../../utils/teamBuilder"

const fadePop = keyframes`
  0% { opacity: 0; transform: translateY(40px) scale(0.5); }
  60% { opacity: 1; transform: translateY(-10px) scale(1.1); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const fadeOutShrink = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(20px) scale(0); }
`;

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
    const [isLeaving, setIsLeaving] = useState(false)
    const [postBattlePhase, setPostBattlePhase] = useState(null)

    const [isBattling, setIsBattling] = useState(false)
    const [battleReady, setBattleReady] = useState(false)
    const iframeRef = useRef(null)
    const player = playerData[0]

    // Ref สำหรับจัดการ Timer ป้องกันลูปพิมพ์ซ้ำซ้อน
    const timerRef = useRef(null)

    const npcList = npcData;

    const mapList = Object.values(mapData);



    // ----------------------------------------------------
    // Iframe Battle Logic
    // ----------------------------------------------------
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'IFRAME_READY') {
                if (iframeRef.current && isBattling && wildEncounter) {
                    const playerPoke = generatePlayerTeam(player.team);
                    
                    const botTeamPacked = generatePlayerTeam([{
                        ...wildEncounter,
                        name: wildEncounter.species,
                        moves: wildEncounter.moves || ['tackle']
                    }]);

                    const playerPartyHp = player.team.map(p => p ? { hp: p.evs?.hp || 100, maxHp: p.evs?.hp || 100 } : null);

                    iframeRef.current.contentWindow.postMessage({
                        type: 'START_BATTLE',
                        playbotFormat: 'gen9customgame',
                        playerTeam: playerPoke,
                        botTeam: botTeamPacked,
                        playerName: player.name,
                        botName: 'Wild ' + wildEncounter.species,
                        playerPartyHp: playerPartyHp
                    }, '*');
                    
                    setTimeout(() => setBattleReady(true), 1500);
                }
            }
            
            if (event.data && event.data.type === 'BATTLE_END') {
                const { win } = event.data;
                setIsBattling(false);
                setBattleReady(false);
                
                if (win) {
                    setPostBattlePhase('victory');
                    setCurrentDialogData({
                        action: "system",
                        speaker: 'ระบบ',
                        dialog: `คุณเอาชนะ ${wildEncounter.species} ได้สำเร็จ! จะทำอะไรต่อดี?`
                    });
                    setPendingActionList([
                        { value: "ร่างท่าต่อสู้", pos: 1, color: 'gold' },
                        { value: "ปล่อยหนีไป", pos: 0, color: 'white' }
                    ]);
                } else {
                    setWildEncounter(null);
                    setCurrentLocation('bedroom');
                    const bedMap = mapList.find(m => m.id === 'bedroom');
                    setPendingActionList(bedMap ? bedMap.action : []);
                    setCurrentDialogData({
                        action: "system",
                        speaker: 'ระบบ',
                        dialog: `คุณพ่ายแพ้... แต่มีคนช่วยคุณพากลับมาพักฟื้นได้ทันเวลา`
                    });
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
        const fullText = currentDialogData?.dialog || ''

        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        
        if (!fullText) {
            setDisplayedText('')
            setIsTyping(false)
            return
        }

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
    }, [currentDialogData])

    // ----------------------------------------------------
    // Script Step Handler (ประมวลผล action แต่ละประเภท)
    // ----------------------------------------------------
    const processScriptStep = (stepData) => {
        if (!stepData) {
            loadLocationState(currentLocation)
            return
        }

        if (stepData.action === "talk") {
            setCurrentDialogData(stepData)
        } 
        else if (stepData.action === "battle") {
            console.log("เข้าสู่การต่อสู้!")
            loadLocationState(currentLocation)
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
                action: "system",
                speaker: 'ระบบ',
                dialog: `อ๊ะ! ${encounter.species} ป่า (Lv.${level}) ปรากฏตัวออกมา!`
            })
            setPendingActionList([
                { value: "ต่อสู้", pos: 1, color: '#ef4444' },
                { value: "หนี", pos: 0, color: 'white' }
            ])
            setCurrentNpc(null)
        } else {
            setCurrentDialogData({
                action: "system",
                speaker: 'ระบบ',
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
        const npcsInLocation = npcList.filter(npc => npc.location === locId)

        const npcActions = npcsInLocation.map(npc => ({
            value: `คุยกับ ${npc.name}`,
            pos: 1,
            color: 'cyan',
            npcId: npc.id
        }))

        setPendingActionList([...baseActions, ...npcActions])

        setCurrentDialogData({
            action: "system",
            speaker: 'ระบบ',
            dialog: `คุณอยู่ที่ ${currentMap.name} ทำอะไรต่อดีงับ`
        })
        setCurrentNpc(null)
        setWildEncounter(null)
    }

    useEffect(() => {
        loadLocationState(currentLocation)
    }, [currentLocation])

    // เช็ค action 
    const handleActionClick = (actionItem) => {
        if (isTyping) return

        if (actionItem.value === "ฟังต่อ") {
            if (currentNpc) {
                // หา Step ปัจจุบันที่กำลังแสดงผลอยู่
                const currentStep = currentNpc.script.find(item => item.node === currentNode)
                
                // เช็คว่ามี nextNode หรือไม่
                if (currentStep && currentStep.nextNode !== null) {
                    const nextStep = currentNpc.script.find(item => item.node === currentStep.nextNode)
                    if (nextStep) {
                        setCurrentNode(nextStep.node)
                        processScriptStep(nextStep)
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
        else if (actionItem.value === "ออกจากการสนทนา") {
            loadLocationState(currentLocation)
        } 
        else if (actionItem.value === "สำรวจ") {
            triggerEncounter('grass')
        }
        else if (actionItem.value === "ตกปลา") {
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
                action: "system",
                speaker: 'ระบบ',
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
                action: "system",
                speaker: 'ระบบ',
                dialog: `ยกเลิกการร่าง จะทำอะไรต่อดี?`
            });
        }
        else if (actionItem.value.startsWith("ร่างท่า: ")) {
            const moveName = actionItem.value.replace("ร่างท่า: ", "");
            setCurrentDialogData({
                action: "system",
                speaker: 'ระบบ',
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
        else if (actionItem.value.startsWith("คุยกับ ")) {
            const targetNpc = npcList.find(npc => npc.id === actionItem.npcId || actionItem.value.includes(npc.name))
            if (targetNpc) {
                setCurrentNpc(targetNpc)
                
                // เริ่มที่ Node แรก ( Node 1 )
                const firstStep = targetNpc.script.find(item => item.node === 1) || targetNpc.script[0]
                if (firstStep) {
                    setCurrentNode(firstStep.node)
                    processScriptStep(firstStep)
                }
                
                setPendingActionList([
                    { value: "ฟังต่อ", pos: 1, color: 'white' }, 
                    { value: "ออกจากการสนทนา", pos: 0, color: 'red' }
                ])
            }
        } 
        else if (actionItem.value === "ออกจากที่นี่") {
            const mapActions = mapList.map(m => ({
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
                action: "system",
                speaker: 'ระบบ',
                dialog: 'เลือกสถานที่ที่ต้องการเดินทางไป:'
            })
        } 
        else if (actionItem.value.startsWith("ไป ")) {
            setCurrentLocation(actionItem.mapId)
        } 
        else if (actionItem.value === "ยกเลิก") {
            loadLocationState(currentLocation)
        } 
        else {
            setCurrentDialogData({
                action: "action",
                speaker: 'ระบบ',
                dialog: `คุณทำกิจกรรม: ${actionItem.value}`
            })
        }
    }

    const topActions = actionList.filter(item => item.pos === 1)
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
                <Box>Top Left (Trainer Info)</Box>
                <Box>สถานที่ปัจจุบัน: {mapList.find(m => m.id === currentLocation)?.name || currentLocation}</Box>
                <Box>Top Right (Points/Bag/Logout)</Box>
            </Box>

            {/* Main Middle Section */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                
                {/* Left Sidebar (Party) */}
                <Box sx={{ 
                    width: 270, 
                    bgcolor: '#11131a', 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderRight: '1px solid #222',
                    overflowY: 'auto'
                }}>
                    <Box sx={{ color: 'gray' }}>ทีมโปเกม่อน</Box>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                    {player.team.map((p, index) => {
                        if (!p) return null;
                        const spriteUrl = `https://play.pokemonshowdown.com/sprites/gen5/${p.species.toLowerCase()}.png`;
                        return (
                            <Box key={index} sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2, 
                                p: 1, 
                                borderRadius: 1, 
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Box 
                                    component="img" 
                                    src={spriteUrl}
                                    sx={{ width: 50, height: 50, imageRendering: 'pixelated', objectFit: 'contain' }}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{p.nickname || p.species}</Box>
                                    <Box sx={{ fontSize: '0.8rem', color: 'gray' }}>Lv. {p.level}</Box>
                                </Box>
                            </Box>
                        )
                    })}
                </Box>

                {/* Center Content (Game Viewport) */}
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundImage: `url('${mapList.find(m => m.id === currentLocation)?.url || ''}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}>
                    {wildEncounter && (
                        <Box 
                            component="img" 
                            src={`https://play.pokemonshowdown.com/sprites/gen5/${wildEncounter.species.toLowerCase()}.png`} 
                            alt={wildEncounter.species}
                            sx={{
                                width: '300px',
                                height: '300px',
                                imageRendering: 'pixelated',
                                animation: `${isLeaving ? fadeOutShrink : fadePop} ${isLeaving ? '0.4s ease-in' : '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'} forwards`
                            }}
                        />
                    )}
                </Box>

                {/* Right Sidebar */}
                <Box sx={{ 
                    width: 270, 
                    bgcolor: '#11131a', 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderLeft: '1px solid #222'
                }}>
                    <Box sx={{ color: 'gray' }}>การกระทำ</Box>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

                    {!isTyping && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* ปุ่มกลุ่มบน (pos: 1) */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {topActions.map((item, index) => (
                                    <Button 
                                        key={index}
                                        variant="outlined" 
                                        onClick={() => handleActionClick(item)}
                                        sx={{
                                            width: '100%', 
                                            fontSize: '18px', 
                                            justifyContent: 'flex-start',
                                            color: item.color,
                                            borderColor: item.color,
                                            '&:hover': {
                                                borderColor: item.color,
                                                bgcolor: 'rgba(255, 255, 255, 0.05)'
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
                                        onClick={() => handleActionClick(item)}
                                        sx={{
                                            width: '100%', 
                                            fontSize: '18px', 
                                            justifyContent: 'flex-start',
                                            color: item.color,
                                            borderColor: item.color,
                                            '&:hover': {
                                                borderColor: item.color,
                                                bgcolor: 'rgba(255, 255, 255, 0.05)'
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
            <Box sx={{ 
                height: 200, 
                bgcolor: '#050508', 
                borderTop: '1px solid #222',
                p: 4,
                position: 'relative'
            }}>
                {/* Name Tag */}
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
                    {currentDialogData?.speaker || 'Unknown'}
                </Box>
                
                {/* Dialog Text */}
                <Box sx={{ mt: 2, fontSize: '1.2rem' }}>
                    {displayedText}
                </Box>
                
            </Box>

            {/* Battle Overlay */}
            {isBattling && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.9)', zIndex: 9999,
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
                                src={wildEncounter ? `https://play.pokemonshowdown.com/sprites/gen5/${wildEncounter.species.toLowerCase()}.png` : ''} 
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