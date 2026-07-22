import { Box, Divider, Button } from "@mui/material"
import { useState, useEffect, useRef } from "react"

function GamePage () {

    const [currentLocation, setCurrentLocation] = useState('room')
    const [currentNpc, setCurrentNpc] = useState(null)
    
    // เปลี่ยนจาก dialogIndex เป็น currentNode (เริ่มต้นที่ Node ID 1)
    const [currentNode, setCurrentNode] = useState(1)
    const [currentDialogData, setCurrentDialogData] = useState(null)

    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // State สำหรับพักปุ่ม Action ชุดถัดไปไว้
    const [pendingActionList, setPendingActionList] = useState(null)
    const [actionList, setActionList] = useState([])

    // Ref สำหรับจัดการ Timer ป้องกันลูปพิมพ์ซ้ำซ้อน
    const timerRef = useRef(null)

    const npcList = [
        {
            id: "barry",
            name: "ดำ",
            location: "room",
            script: [
                { node: 1, nextNode: 2, action: "talk", speaker: 'ดำ', dialog: 'สวัสดี ฉัน นิกก้า' },
                { node: 2, nextNode: 3, action: "talk", speaker: 'ดำ', dialog: 'นายชื่อไรหย๋อ' },
                { node: 3, nextNode: null, action: "talk", speaker: 'ดำ', dialog: 'อีดอกทอง' }
            ]
        },
        {
            id: "nigga",
            name: "นิกก้า",
            location: "room",
            script: [
                { node: 1, nextNode: 2, action: "talk", speaker: 'ดำ', dialog: 'ควยไร' },
                { node: 2, nextNode: 3, action: "talk", speaker: 'ดำ', dialog: 'ต่อยกันป่าว' },
                { node: 3, nextNode: 4, action: "talk", speaker: 'ดำ', dialog: 'นาฮี' },
                { node: 4, nextNode: null, action: "battle" }
            ]
        },
        {
            id: "nami",
            name: "นามิ",
            location: "school",
            script: [
                { node: 1, nextNode: 2, action: "talk", speaker: 'นามิ', dialog: 'อีหน้าแตด' },
                { node: 2, nextNode: 3, action: "talk", speaker: 'นามิ', dialog: 'อีหน้าตด' },
                { node: 3, nextNode: null, action: "talk", speaker: 'นามิ', dialog: 'อีหน้าตูด' }
            ]
        },
    ]

    const mapList = [
        {
            id: 'room',
            name: 'ห้องนอน',
            url: '',
            action: [
                { value: "นอน", pos: 1, color: 'white' }, 
                { value: "ออกจากที่นี่", pos: 0, color: 'red' }
            ]
        },
        {
            id: 'school',
            name: 'โรงเรียน',
            url: '',
            action: [
                { value: "เดิน", pos: 1, color: 'white' }, 
                { value: "ออกจากที่นี่", pos: 0, color: 'red' }
            ]
        },
    ]



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
                height: 100, 
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
                    borderRight: '1px solid #222'
                }}>

                </Box>

                {/* Center Content (Game Viewport) */}
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                }}>
                    <img style={{width:'100%', height:'100%'}} src="https://media.discordapp.net/attachments/1058688943450751098/1516031005121712228/image.png?ex=6a61f0e6&is=6a609f66&hm=19709444f551bd1c73d3ecab34c8abcff3f3cbc8e75d9c1d24f79de09b9b04ae&=&format=webp&quality=lossless&width=365&height=269" alt="punch" />
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
                height: 250, 
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
        </Box>
    )
}

export default GamePage