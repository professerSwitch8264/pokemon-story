import React, { useState, useRef } from "react";
import { 
    Box, Typography, Button, TextField, Select, MenuItem, 
    Card, IconButton, Slider, Chip, Tabs, Tab 
} from "@mui/material";
import initialMapData from "../../data/map.json";
import initialNpcData from "../../data/npc.json";
import pokemonData from "../../data/pokemon.json";

export default function AdminPage() {
    const [mapList, setMapList] = useState(() => {
        const saved = localStorage.getItem("custom_map_data");
        return saved ? JSON.parse(saved) : initialMapData;
    });

    const [npcList, setNpcList] = useState(() => {
        const saved = localStorage.getItem("custom_npc_data");
        return saved ? JSON.parse(saved) : initialNpcData;
    });

    const [currentTab, setCurrentTab] = useState(0);

    // Selected items
    const [selectedMapId, setSelectedMapId] = useState("bedroom");
    const [selectedNpcId, setSelectedNpcId] = useState(npcList[0]?.id || "gym_brock");

    // Pokemon helper functions for Battle Enemy Team Editor
    const getPokemonData = (speciesName) => {
        if (!speciesName || !pokemonData) return null;
        const cleanKey = speciesName.toLowerCase().replace('-starter', '').trim();
        return pokemonData[cleanKey] || pokemonData[speciesName.toLowerCase().trim()] || null;
    };

    const getAbilitiesForSpecies = (speciesName) => {
        const pData = getPokemonData(speciesName);
        if (!pData || !pData.abilities) return [];
        return pData.abilities;
    };

    const getAvailableMovesForSpecies = (speciesName, level = 100) => {
        const pData = getPokemonData(speciesName);
        if (!pData) return [];

        const movesMap = new Map();

        // 1. Level-up moves (level <= currentLevel)
        if (pData.learnset && Array.isArray(pData.learnset)) {
            pData.learnset.forEach(entry => {
                if (entry.level <= Number(level || 100)) {
                    const moveId = entry.move.toLowerCase();
                    if (!movesMap.has(moveId)) {
                        movesMap.set(moveId, { moveId: entry.move, source: `Lv.${entry.level}` });
                    }
                }
            });
        }

        // 2. TM moves
        if (pData.tm_moves && Array.isArray(pData.tm_moves)) {
            pData.tm_moves.forEach(m => {
                const moveId = m.toLowerCase();
                if (!movesMap.has(moveId)) {
                    movesMap.set(moveId, { moveId: m, source: "TM" });
                }
            });
        }

        // 3. Egg moves
        if (pData.egg_moves && Array.isArray(pData.egg_moves)) {
            pData.egg_moves.forEach(m => {
                const moveId = m.toLowerCase();
                if (!movesMap.has(moveId)) {
                    movesMap.set(moveId, { moveId: m, source: "Egg" });
                }
            });
        }

        return Array.from(movesMap.values());
    };

    // Drag and Drop state for NPC placement
    const canvasRef = useRef(null);
    const [draggingNpc, setDraggingNpc] = useState(null);

    // Save state to localStorage for live persistence in dev mode
    const handleSaveLocal = () => {
        localStorage.setItem("custom_map_data", JSON.stringify(mapList));
        localStorage.setItem("custom_npc_data", JSON.stringify(npcList));
        alert("บันทึกข้อมูลแผนที่และ NPC ลงใน Local Storage สำเร็จ!");
    };

    // ------------------------------------------------------------------------
    // MAP EDIT HANDLERS
    // ------------------------------------------------------------------------
    const selectedMap = mapList[selectedMapId] || { id: "", name: "", url: "", action: [], encounters: { grass: [], water: [] } };

    const handleUpdateMapField = (field, value) => {
        setMapList(prev => ({
            ...prev,
            [selectedMapId]: {
                ...prev[selectedMapId],
                [field]: value
            }
        }));
    };

    const handleAddMap = () => {
        const newId = `map_${Date.now()}`;
        setMapList(prev => ({
            ...prev,
            [newId]: {
                id: newId,
                name: "แผนที่ใหม่",
                url: "https://i.pinimg.com/736x/8d/62/1e/8d621e25e9ff094a4c6a6f1947b744a4.jpg",
                action: [{ value: "ออกจากที่นี่", pos: 0, color: "red" }],
                encounters: { grass: [], water: [] }
            }
        }));
        setSelectedMapId(newId);
    };

    const handleDeleteMap = (id) => {
        if (Object.keys(mapList).length <= 1) {
            alert("ไม่สามารถลบแผนที่ทั้งหมดได้");
            return;
        }
        if (confirm(`ยืนยันการลบแผนที่ ${mapList[id]?.name || id}?`)) {
            setMapList(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
            const remaining = Object.keys(mapList).filter(k => k !== id);
            setSelectedMapId(remaining[0]);
        }
    };

    const handleAddEncounter = (type) => {
        setMapList(prev => {
            const currentMap = prev[selectedMapId];
            const encounters = currentMap.encounters || { grass: [], water: [] };
            const currentList = encounters[type] || [];

            return {
                ...prev,
                [selectedMapId]: {
                    ...currentMap,
                    encounters: {
                        ...encounters,
                        [type]: [...currentList, { species: "Pikachu", minLv: 5, maxLv: 10, chance: 0.2 }]
                    }
                }
            };
        });
    };

    const handleUpdateEncounter = (type, index, field, value) => {
        setMapList(prev => {
            const currentMap = prev[selectedMapId];
            const encounters = currentMap.encounters || { grass: [], water: [] };
            const currentList = [...(encounters[type] || [])];
            currentList[index] = { ...currentList[index], [field]: value };

            return {
                ...prev,
                [selectedMapId]: {
                    ...currentMap,
                    encounters: {
                        ...encounters,
                        [type]: currentList
                    }
                }
            };
        });
    };

    const handleDeleteEncounter = (type, index) => {
        setMapList(prev => {
            const currentMap = prev[selectedMapId];
            const encounters = currentMap.encounters || { grass: [], water: [] };
            const currentList = (encounters[type] || []).filter((_, i) => i !== index);

            return {
                ...prev,
                [selectedMapId]: {
                    ...currentMap,
                    encounters: {
                        ...encounters,
                        [type]: currentList
                    }
                }
            };
        });
    };

    // ------------------------------------------------------------------------
    // NPC DRAG & DROP POSITION HANDLERS
    // ------------------------------------------------------------------------
    const handleCanvasMouseDown = (npcId, e) => {
        e.preventDefault();
        setDraggingNpc(npcId);
    };

    const handleCanvasMouseMove = (e) => {
        if (!draggingNpc || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // X = left% from left edge, Y = bottom% from bottom edge (same as game!)
        const posXPercent = Math.max(0, Math.min(100, Math.round((mouseX / rect.width) * 100)));
        const posYPercent = Math.max(0, Math.min(100, Math.round(((rect.height - mouseY) / rect.height) * 100)));

        setNpcList(prev => prev.map(npc => {
            if (npc.id === draggingNpc) {
                const currentPos = npc.mapPositions?.[selectedMapId] || { x: 50, y: 20, size: 140 };
                return {
                    ...npc,
                    mapPositions: {
                        ...(npc.mapPositions || {}),
                        [selectedMapId]: {
                            ...currentPos,
                            x: posXPercent,
                            y: posYPercent
                        }
                    }
                };
            }
            return npc;
        }));
    };

    const handleCanvasMouseUp = () => {
        setDraggingNpc(null);
    };

    // Helper: get trainer sprite URL same as WalkingNpc in game
    // Reads npc.sprite if set, otherwise derives from ID
    const getNpcSpriteUrl = (npc) => {
        if (typeof npc === "string") {
            // legacy: called with just an ID
            const cleanId = npc.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "");
            return `https://play.pokemonshowdown.com/sprites/trainers/${cleanId}.png`;
        }
        const spriteName = npc.sprite ||
            npc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "");
        return `https://play.pokemonshowdown.com/sprites/trainers/${spriteName}.png`;
    };

    const handleUpdateNpcSize = (npcId, sizeValue) => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === npcId) {
                const currentPos = npc.mapPositions?.[selectedMapId] || { x: 50, y: 20, size: 90 };
                return {
                    ...npc,
                    mapPositions: {
                        ...(npc.mapPositions || {}),
                        [selectedMapId]: {
                            ...currentPos,
                            size: sizeValue
                        }
                    }
                };
            }
            return npc;
        }));
    };

    // Update the 'sprite' field on an NPC (trainer sprite name like 'brock', 'misty', 'oak')
    const handleUpdateNpcSprite = (npcId, spriteValue) => {
        setNpcList(prev => prev.map(npc =>
            npc.id === npcId ? { ...npc, sprite: spriteValue } : npc
        ));
    };

    const handleUpdateNpcName = (npcId, nameValue) => {
        setNpcList(prev => prev.map(npc =>
            npc.id === npcId ? { ...npc, name: nameValue } : npc
        ));
    };

    // ------------------------------------------------------------------------
    // NPC SCHEDULE & TIME HANDLERS
    // ------------------------------------------------------------------------
    const selectedNpc = npcList.find(n => n.id === selectedNpcId) || npcList[0];

    const handleUpdateNpcDefaultLoc = (location) => {
        setNpcList(prev => prev.map(n => n.id === selectedNpcId ? { ...n, defaultLocation: location } : n));
    };

    const handleAddScheduleItem = () => {
        setNpcList(prev => prev.map(n => {
            if (n.id === selectedNpcId) {
                const sched = n.schedule || [];
                return {
                    ...n,
                    schedule: [...sched, { start: 8, end: 18, location: selectedMapId }]
                };
            }
            return n;
        }));
    };

    const handleUpdateScheduleItem = (index, field, value) => {
        setNpcList(prev => prev.map(n => {
            if (n.id === selectedNpcId) {
                const sched = [...(n.schedule || [])];
                sched[index] = { ...sched[index], [field]: value };
                return { ...n, schedule: sched };
            }
            return n;
        }));
    };

    const handleDeleteScheduleItem = (index) => {
        setNpcList(prev => prev.map(n => {
            if (n.id === selectedNpcId) {
                const sched = (n.schedule || []).filter((_, i) => i !== index);
                return { ...n, schedule: sched };
            }
            return n;
        }));
    };

    // ------------------------------------------------------------------------
    // NPC SCRIPT BUILDER HANDLERS
    // ------------------------------------------------------------------------
    const handleAddScriptBlock = () => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = npc.scripts || [];
                return {
                    ...npc,
                    scripts: [
                        ...scripts,
                        {
                            location: selectedMapId,
                            phase: 1,
                            start: 8,
                            end: 18,
                            script: [
                                { node: 1, nextNode: 2, action: "push_character", character: npc.id },
                                { node: 2, nextNode: 99, action: "talk", speaker: npc.name, dialog: "สวัสดี!" },
                                { node: 99, nextNode: null, action: "pop_character" }
                            ]
                        }
                    ]
                };
            }
            return npc;
        }));
    };

    const handleUpdateBlockMeta = (bIdx, field, value) => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = [...(npc.scripts || [])];
                scripts[bIdx] = { ...scripts[bIdx], [field]: value };
                return { ...npc, scripts };
            }
            return npc;
        }));
    };

    const handleDeleteScriptBlock = (bIdx) => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = (npc.scripts || []).filter((_, i) => i !== bIdx);
                return { ...npc, scripts };
            }
            return npc;
        }));
    };

    const handleAddScriptStep = (blockIndex) => {
        let createdNodeId = null;
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = [...(npc.scripts || [])];
                const block = scripts[blockIndex];
                const steps = [...(block.script || [])];

                const nextNodeId = (steps.length > 0 ? Math.max(...steps.map(s => s.node)) : 0) + 1;
                createdNodeId = nextNodeId;

                steps.push({
                    node: nextNodeId,
                    nextNode: null,
                    action: "talk",
                    speaker: npc.name,
                    dialog: "ข้อความใหม่..."
                });

                scripts[blockIndex] = { ...block, script: steps };
                return { ...npc, scripts };
            }
            return npc;
        }));

        if (createdNodeId !== null) {
            setTimeout(() => {
                const el = document.getElementById(`node-step-${blockIndex}-${createdNodeId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 80);
        }
    };

    const handleUpdateScriptStep = (blockIndex, stepIndex, field, value) => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = [...(npc.scripts || [])];
                const block = scripts[blockIndex];
                const steps = [...(block.script || [])];

                if (field === "action") {
                    // Rebuild clean step object when changing action type to remove irrelevant fields like speaker
                    const oldStep = steps[stepIndex];
                    const newStep = {
                        node: oldStep.node,
                        nextNode: oldStep.nextNode,
                        action: value
                    };

                    if (value === "talk" || value === "showText") {
                        newStep.speaker = npc.name;
                        newStep.dialog = oldStep.dialog || "ข้อความใหม่...";
                    } else if (value === "push_character") {
                        newStep.character = oldStep.character || npc.id;
                        newStep.name = oldStep.name || npc.name;
                    } else if (value === "pop_character") {
                        newStep.character = oldStep.character || npc.id;
                    } else if (value === "battle") {
                        newStep.nextNode = null;
                        newStep.enemyTeam = oldStep.enemyTeam || [];
                        newStep.nextNode_win = oldStep.nextNode_win || (oldStep.node + 1);
                        newStep.nextNode_lose = oldStep.nextNode_lose || (oldStep.node + 2);
                    } else if (value === "event") {
                        newStep.eventType = oldStep.eventType || "increase_phase";
                        newStep.dialog = oldStep.dialog || "ข้อความแจ้งเตือนผู้เล่น";
                    } else if (value === "choice") {
                        newStep.speaker = npc.name;
                        newStep.dialog = "เลือกการกระทำ:";
                        newStep.choices = [{ text: "ตัวเลือก 1", nextNode: oldStep.node + 1, color: "orange" }];
                    } else if (value === "menu_mart") {
                        newStep.speaker = npc.name;
                        newStep.dialog = "เลือกซื้อสินค้าได้เลย";
                    }

                    steps[stepIndex] = newStep;
                } else {
                    steps[stepIndex] = { ...steps[stepIndex], [field]: value };
                }

                scripts[blockIndex] = { ...block, script: steps };
                return { ...npc, scripts };
            }
            return npc;
        }));
    };

    const handleDeleteScriptStep = (blockIndex, stepIndex) => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = [...(npc.scripts || [])];
                const block = scripts[blockIndex];
                const steps = (block.script || []).filter((_, i) => i !== stepIndex);

                scripts[blockIndex] = { ...block, script: steps };
                return { ...npc, scripts };
            }
            return npc;
        }));
    };

    const handleMoveScriptStep = (blockIndex, stepIndex, direction) => {
        setNpcList(prev => prev.map(npc => {
            if (npc.id === selectedNpcId) {
                const scripts = [...(npc.scripts || [])];
                const block = scripts[blockIndex];
                const steps = [...(block.script || [])];

                const targetIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;
                if (targetIndex < 0 || targetIndex >= steps.length) return npc;

                const temp = steps[stepIndex];
                steps[stepIndex] = steps[targetIndex];
                steps[targetIndex] = temp;

                scripts[blockIndex] = { ...block, script: steps };
                return { ...npc, scripts };
            }
            return npc;
        }));
    };

    const handleAddNpc = () => {
        const newId = `npc_${Date.now()}`;
        const newNpc = {
            id: newId,
            name: "NPC ใหม่",
            defaultLocation: selectedMapId,
            schedule: [],
            scripts: [
                {
                    location: selectedMapId,
                    script: [
                        { node: 1, nextNode: 2, action: "push_character", character: newId },
                        { node: 2, nextNode: 99, action: "talk", speaker: "NPC ใหม่", dialog: "สวัสดี!" },
                        { node: 99, nextNode: null, action: "pop_character" }
                    ]
                }
            ],
            mapPositions: {
                [selectedMapId]: { x: 50, y: 30, size: 140 }
            }
        };
        setNpcList(prev => [...prev, newNpc]);
        setSelectedNpcId(newId);
    };

    return (
        <Box sx={{ 
            height: "100vh", maxHeight: "100vh", width: "100%", maxWidth: "100%", overflow: "hidden", 
            bgcolor: "#0b0c10", color: "#e2e8f0", p: 1.5, 
            display: "flex", flexDirection: "column", boxSizing: "border-box",
            fontFamily: "Noto Sans Thai, sans-serif" 
        }}>
            {/* Top Fixed Header */}
            <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, borderBottom: "1px solid #1e293b", pb: 1 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: "bold", background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        SYSTEM ADMIN DASHBOARD
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        จัดการแผนที่, ตารางเวลาเดินทาง NPC ตามสถานที่/ช่วงเวลา/Phase, ลากวางพิกัดบนแมพ และสร้างสคริปต์ (100% Edge-to-Edge Full Width)
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button 
                        variant="contained" size="small"
                        onClick={handleSaveLocal}
                        sx={{ bgcolor: "#059669", color: "white", fontWeight: "bold", "&:hover": { bgcolor: "#10b981" } }}
                    >
                        บันทึกเข้า Local Storage
                    </Button>
                    <Button 
                        variant="outlined" size="small"
                        href="/game"
                        sx={{ borderColor: "#38bdf8", color: "#38bdf8", fontWeight: "bold", "&:hover": { bgcolor: "#38bdf815" } }}
                    >
                        กลับเข้าเกม (/game)
                    </Button>
                </Box>
            </Box>

            {/* Navigation Tabs (Fixed) */}
            <Box sx={{ flexShrink: 0, mb: 1.5 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={(_, v) => setCurrentTab(v)}
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: '#1e293b',
                        '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', fontSize: '0.88rem', minHeight: 38, py: 0.5 },
                        '& .Mui-selected': { color: '#38bdf8 !important' }
                    }}
                >
                    <Tab label="🗺️ จัดการ Map & Encounters" />
                    <Tab label="👥 จัดการ NPC" />
                    <Tab label="👤 ลากวางพิกัด NPC บน Map" />
                    <Tab label="🕒 ตารางเวลา NPC (Schedule)" />
                    <Tab label="📜 Script & Dialogue Builder" />
                    <Tab label="💾 Export JSON Config" />
                </Tabs>
            </Box>

            {/* Flexible Scrollable Main Area (100% Edge-to-Edge Width) */}
            <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden", width: "100%" }}>
                
                {/* TAB 0: MAP MANAGEMENT */}
                {currentTab === 0 && (
                    <Box sx={{ display: "flex", gap: 2, height: "100%", width: "100%", boxSizing: "border-box" }}>
                        {/* Left: Map List Column */}
                        <Card sx={{ width: 300, minWidth: 260, flexShrink: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexShrink: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8" }}>รายชื่อแผนที่ ({Object.keys(mapList).length})</Typography>
                                <Button size="small" variant="contained" onClick={handleAddMap} sx={{ bgcolor: "#38bdf8", color: "#000", fontWeight: "bold" }}>+ เพิ่ม</Button>
                            </Box>
                            <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                                {Object.keys(mapList).map(mId => (
                                    <Box 
                                        key={mId} 
                                        onClick={() => setSelectedMapId(mId)}
                                        sx={{ 
                                            p: 1.2, borderRadius: 1.5, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                                            bgcolor: selectedMapId === mId ? "rgba(56,189,248,0.15)" : "#0f172a",
                                            border: "1px solid", borderColor: selectedMapId === mId ? "#38bdf8" : "#1e293b",
                                            "&:hover": { bgcolor: "rgba(56,189,248,0.08)" }
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: selectedMapId === mId ? "#38bdf8" : "white" }}>{mapList[mId].name}</Typography>
                                            <Typography variant="caption" sx={{ color: "#64748b" }}>ID: {mId}</Typography>
                                        </Box>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteMap(mId); }} sx={{ color: "#ef4444" }}>✕</IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Card>

                        {/* Right: Map Detail Editor */}
                        <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2.5, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", boxSizing: "border-box" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 2 }}>
                                แก้ไขข้อมูลแผนที่: {selectedMap.name} ({selectedMapId})
                            </Typography>

                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                <TextField 
                                    size="small" fullWidth label="ชื่อแผนที่ (Name)" value={selectedMap.name || ""} 
                                    onChange={(e) => handleUpdateMapField("name", e.target.value)}
                                    sx={{ input: { color: "white" }, label: { color: "#94a3b8" } }}
                                />
                                <TextField 
                                    size="small" fullWidth label="Image URL แผนที่" value={selectedMap.url || ""} 
                                    onChange={(e) => handleUpdateMapField("url", e.target.value)}
                                    sx={{ input: { color: "white" }, label: { color: "#94a3b8" } }}
                                />
                            </Box>

                            {/* Image Preview */}
                            <Box sx={{ mb: 2, position: "relative", width: "100%", height: 160, borderRadius: 2, overflow: "hidden", border: "1px solid #334155", flexShrink: 0 }}>
                                <img src={selectedMap.url} alt="map preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <Box sx={{ position: "absolute", bottom: 6, left: 6, bgcolor: "rgba(0,0,0,0.7)", px: 1, py: 0.2, borderRadius: 1 }}>
                                    <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: "bold" }}>Preview Background Image</Typography>
                                </Box>
                            </Box>

                            {/* Encounters Editor */}
                            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#4ade80", mb: 1 }}>
                                🌿 Wild Encounters (โปเกม่อนที่พบในแผนที่นี้)
                            </Typography>

                            <Box sx={{ display: "flex", gap: 2 }}>
                                {/* Grass Encounters */}
                                <Box sx={{ flex: 1, bgcolor: "#0f172a", p: 1.5, borderRadius: 2, border: "1px solid #1e293b" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "#4ade80" }}>พงหญ้า (Grass)</Typography>
                                        <Button size="small" onClick={() => handleAddEncounter("grass")} sx={{ color: "#4ade80", fontSize: "0.75rem" }}>+ เพิ่มชนิด</Button>
                                    </Box>
                                    {(selectedMap.encounters?.grass || []).map((enc, idx) => (
                                        <Box key={idx} sx={{ display: "flex", gap: 0.8, alignItems: "center", mb: 0.8, bgcolor: "#1e293b", p: 0.8, borderRadius: 1 }}>
                                            <TextField 
                                                size="small" label="Species" value={enc.species} 
                                                onChange={(e) => handleUpdateEncounter("grass", idx, "species", e.target.value)}
                                                sx={{ input: { color: "white", fontSize: "0.78rem" }, flex: 1 }}
                                            />
                                            <TextField 
                                                size="small" label="MinLv" type="number" value={enc.minLv} 
                                                onChange={(e) => handleUpdateEncounter("grass", idx, "minLv", Number(e.target.value))}
                                                sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 60 }}
                                            />
                                            <TextField 
                                                size="small" label="MaxLv" type="number" value={enc.maxLv} 
                                                onChange={(e) => handleUpdateEncounter("grass", idx, "maxLv", Number(e.target.value))}
                                                sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 60 }}
                                            />
                                            <IconButton size="small" onClick={() => handleDeleteEncounter("grass", idx)} sx={{ color: "#ef4444", p: 0.3 }}>✕</IconButton>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Water Encounters */}
                                <Box sx={{ flex: 1, bgcolor: "#0f172a", p: 1.5, borderRadius: 2, border: "1px solid #1e293b" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "#38bdf8" }}>ทางน้ำ/ตกปลา (Water)</Typography>
                                        <Button size="small" onClick={() => handleAddEncounter("water")} sx={{ color: "#38bdf8", fontSize: "0.75rem" }}>+ เพิ่มชนิด</Button>
                                    </Box>
                                    {(selectedMap.encounters?.water || []).map((enc, idx) => (
                                        <Box key={idx} sx={{ display: "flex", gap: 0.8, alignItems: "center", mb: 0.8, bgcolor: "#1e293b", p: 0.8, borderRadius: 1 }}>
                                            <TextField 
                                                size="small" label="Species" value={enc.species} 
                                                onChange={(e) => handleUpdateEncounter("water", idx, "species", e.target.value)}
                                                sx={{ input: { color: "white", fontSize: "0.78rem" }, flex: 1 }}
                                            />
                                            <TextField 
                                                size="small" label="MinLv" type="number" value={enc.minLv} 
                                                onChange={(e) => handleUpdateEncounter("water", idx, "minLv", Number(e.target.value))}
                                                sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 60 }}
                                            />
                                            <TextField 
                                                size="small" label="MaxLv" type="number" value={enc.maxLv} 
                                                onChange={(e) => handleUpdateEncounter("water", idx, "maxLv", Number(e.target.value))}
                                                sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 60 }}
                                            />
                                            <IconButton size="small" onClick={() => handleDeleteEncounter("water", idx)} sx={{ color: "#ef4444", p: 0.3 }}>✕</IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* TAB 1: NPC MANAGER — ชื่อ / Sprite / DefaultLocation / เพิ่ม-ลบ */}
                {currentTab === 1 && (
                    <Box sx={{ display: "flex", gap: 2, height: "100%", width: "100%", boxSizing: "border-box" }}>
                        {/* Left: NPC List */}
                        <Card sx={{ width: 300, minWidth: 260, flexShrink: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexShrink: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8" }}>NPC ทั้งหมด ({npcList.length})</Typography>
                                <Button size="small" variant="contained" onClick={handleAddNpc} sx={{ bgcolor: "#38bdf8", color: "#000", fontWeight: "bold" }}>+ เพิ่ม</Button>
                            </Box>
                            <Box sx={{ overflowY: "auto", flexGrow: 1, display: "flex", flexDirection: "column", gap: 1, pr: 0.5 }}>
                                {npcList.map(npc => {
                                    const isSelected = selectedNpcId === npc.id;
                                    return (
                                        <Box
                                            key={npc.id}
                                            onClick={() => setSelectedNpcId(npc.id)}
                                            sx={{
                                                display: "flex", gap: 1.5, alignItems: "center",
                                                p: 1.2, borderRadius: 1.5, cursor: "pointer",
                                                bgcolor: isSelected ? "rgba(56,189,248,0.12)" : "#0f172a",
                                                border: "1px solid", borderColor: isSelected ? "#38bdf8" : "#1e293b",
                                                "&:hover": { bgcolor: "rgba(56,189,248,0.06)" }
                                            }}
                                        >
                                            <img
                                                src={getNpcSpriteUrl(npc)}
                                                alt={npc.name}
                                                draggable={false}
                                                style={{ width: 48, height: 48, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0, filter: isSelected ? "drop-shadow(0 0 6px #38bdf8)" : "none" }}
                                                onError={(e) => { e.target.src = "https://play.pokemonshowdown.com/sprites/trainers/oak.png"; }}
                                            />
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: "bold", fontSize: "0.88rem", color: isSelected ? "#38bdf8" : "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{npc.name}</Typography>
                                                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>ID: {npc.id}</Typography>
                                                <Typography variant="caption" sx={{ color: "#475569" }}>sprite: {npc.sprite || "(auto)"}</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Card>

                        {/* Right: NPC Detail Editor */}
                        {(() => {
                            const editNpc = npcList.find(n => n.id === selectedNpcId);
                            if (!editNpc) return <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography sx={{ color: "#475569" }}>เลือก NPC ทางซ้าย</Typography></Box>;

                            return (
                                <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 3, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", boxSizing: "border-box" }}>
                                    {/* Big Sprite Preview */}
                                    <Box sx={{ display: "flex", gap: 3, mb: 3, alignItems: "flex-start" }}>
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
                                            <Box sx={{ width: 160, height: 160, bgcolor: "#0f172a", borderRadius: 3, border: "2px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                                                <img
                                                    key={getNpcSpriteUrl(editNpc)}
                                                    src={getNpcSpriteUrl(editNpc)}
                                                    alt={editNpc.name}
                                                    draggable={false}
                                                    style={{ width: 140, height: 140, objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 4px 16px rgba(56,189,248,0.4))" }}
                                                    onError={(e) => { e.target.src = "https://play.pokemonshowdown.com/sprites/trainers/oak.png"; }}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ color: "#64748b", textAlign: "center", fontSize: "0.7rem" }}>
                                                /{editNpc.sprite || editNpc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "")}.png
                                            </Typography>
                                        </Box>

                                        {/* Info Fields */}
                                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                                            <Box sx={{ bgcolor: "#0f172a", px: 2, py: 1, borderRadius: 1.5, border: "1px solid #1e293b" }}>
                                                <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace" }}>ID (แก้ไขไม่ได้)</Typography>
                                                <Typography sx={{ fontWeight: "bold", color: "#c084fc", fontFamily: "monospace", fontSize: "0.95rem" }}>{editNpc.id}</Typography>
                                            </Box>

                                            <TextField
                                                fullWidth label="ชื่อ NPC (name)"
                                                value={editNpc.name}
                                                onChange={(e) => handleUpdateNpcName(editNpc.id, e.target.value)}
                                                sx={{
                                                    "& .MuiInputBase-input": { color: "white", fontSize: "1rem" },
                                                    "& .MuiInputLabel-root": { color: "#94a3b8" },
                                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#334155" },
                                                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#38bdf8" }
                                                }}
                                            />

                                            <Box>
                                                <TextField
                                                    fullWidth label="ชื่อ Sprite (sprite) — ดูชื่อได้จาก pokemonshowdown.com/sprites/trainers/"
                                                    value={editNpc.sprite || editNpc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "")}
                                                    onChange={(e) => handleUpdateNpcSprite(editNpc.id, e.target.value)}
                                                    sx={{
                                                        "& .MuiInputBase-input": { color: "#fbbf24", fontSize: "1rem", fontFamily: "monospace" },
                                                        "& .MuiInputLabel-root": { color: "#94a3b8" },
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#92400e" },
                                                        "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fbbf24" }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: "#64748b", mt: 0.5, display: "block" }}>
                                                    ตัวอย่าง: brock, misty, oak, youngster, lass, hiker, beauty, scientist, channeler, engineer, gentlewoman, tm_librarian
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 0.8 }}>สถานที่ประจำ (defaultLocation)</Typography>
                                                <Select
                                                    fullWidth size="small"
                                                    value={editNpc.defaultLocation || ""}
                                                    onChange={(e) => handleUpdateNpcDefaultLoc(e.target.value)}
                                                    sx={{ color: "white", bgcolor: "#0f172a", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#334155" } }}
                                                >
                                                    <MenuItem value="">ไม่มี (None - ปรากฏเฉพาะในเวลาสคริปต์)</MenuItem>
                                                    {Object.keys(mapList).map(mId => (
                                                        <MenuItem key={mId} value={mId}>{mapList[mId].name} ({mId})</MenuItem>
                                                    ))}
                                                </Select>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Quick Sprite Gallery */}
                                    <Box sx={{ bgcolor: "#0f172a", p: 2, borderRadius: 2, border: "1px solid #1e293b" }}>
                                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 1.5 }}>
                                            ตัวอย่าง Sprite — คลิกเพื่อใช้
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {["lucas","dawn","youngster-gen4dp","lass-gen4dp","camper","picnicker","bugcatcher-gen4dp","aromalady","twins-gen4dp","hiker-gen4","battlegirl-gen4","fisherman-gen4","cyclist-gen4","cyclistf-gen4","blackbelt-gen4dp","artist-gen4","pokemonbreeder-gen4","pokemonbreederf-gen4","cowgirl","jogger","pokefan-gen4","pokefanf-gen4","pokekid","youngcouple-gen4dp","acetrainer-gen4dp","acetrainerf-gen4dp","waitress-gen4","veteran-gen4","ninjaboy","dragontamer","birdkeeper-gen4dp","doubleteam","richboy-gen4","lady-gen4","gentleman-gen4dp","madame-gen4dp","beauty-gen4dp","collector","policeman-gen4","pokemonranger-gen4","pokemonrangerf-gen4","scientist-gen4dp","swimmer-gen4dp","swimmerf-gen4dp","tuber","tuberf","sailor","sisandbro","ruinmaniac","psychic-gen4","psychicf-gen4","gambler","guitarist-gen4","acetrainersnow","acetrainersnowf","skier","skierf-gen4dp","roughneck-gen4","clown","worker-gen4","schoolkid-gen4dp","schoolkidf-gen4","roark","barry","byron","aaron","bertha","flint","lucian","cynthia-gen4","bellepa","rancher","mars","galacticgrunt","gardenia","crasherwake","maylene","fantina","candice","volkner","parasollady-gen4","waiter-gen4dp","interviewers","cameraman","reporter","idol","cyrus","jupiter","saturn","galacticgruntf","argenta","palmer","thorton","buck","darach-caitlin","marley","mira","cheryl","riley","dahlia","ethan","lyra","twins-gen4","lass-gen4","acetrainer-gen4","acetrainerf-gen4","juggler","sage","li","gentleman-gen4","teacher","beauty","birdkeeper","swimmer-gen4","swimmerf-gen4","kimonogirl","scientist-gen4","acetrainercouple","youngcouple","supernerd","medium","schoolkid-gen4","blackbelt-gen4","pokemaniac","firebreather","burglar","biker-gen4","skierf","boarder","rocketgrunt","rocketgruntf","archer","ariana","proton","petrel","eusine","lucas-gen4pt","dawn-gen4pt","madame-gen4","waiter-gen4","falkner","bugsy","whitney","morty","chuck","jasmine","pryce","clair","will","koga","bruno","karen","lance","brock","misty","ltsurge","erika","janine","sabrina","blaine","blue","red","silver","giovanni","hilbert","hilda","youngster","lass","schoolkid","schoolkidf","smasher","linebacker","waiter","waitress","chili","cilan","cress","nurseryaide","preschoolerf","preschooler","twins","pokemonbreeder","pokemonbreederf","lenora","burgh","elesa","clay","skyla","pokemonranger","pokemonrangerf","worker","backpacker","backpackerf","fisherman","musician","dancer","harlequin","artist","baker","psychic","psychicf","cheren","bianca","plasmagrunt-gen5bw","n","richboy","lady","pilot","workerice","hoopster","scientistf","clerkf","acetrainerf","acetrainer","blackbelt","scientist","striker","brycen","iris","drayden","roughneck","janitor","pokefan","pokefanf","doctor","nurse","hooligans","battlegirl","parasollady","clerk","clerk-boss","backers","backersf","veteran","veteranf","biker","infielder","hiker","madame","gentleman","plasmagruntf-gen5bw","shauntal","marshal","grimsley","caitlin","ghetsis-gen5bw","depotagent","swimmer","swimmerf","policeman","maid","ingo","alder","cyclist","cyclistf","cynthia","emmet","hugh","rosa","nate","colress","beauty-gen5bw2","ghetsis","plasmagrunt","plasmagruntf","iris-gen5bw2","brycenman","shadowtriad","rood","zinzolin","cheren-gen5bw2","marlon","roxie","roxanne","brawly","wattson","flannery","norman","winona","tate","liza","juan","guitarist","steven","wallace","bellelba","benga","ash","oak"].map(sp => (
                                                <Box
                                                    key={sp}
                                                    onClick={() => handleUpdateNpcSprite(editNpc.id, sp)}
                                                    sx={{
                                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3,
                                                        p: 0.8, borderRadius: 1.5, cursor: "pointer",
                                                        bgcolor: (editNpc.sprite || editNpc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "")) === sp ? "rgba(56,189,248,0.2)" : "#141722",
                                                        border: "1px solid",
                                                        borderColor: (editNpc.sprite || editNpc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "")) === sp ? "#38bdf8" : "#1e293b",
                                                        "&:hover": { bgcolor: "rgba(56,189,248,0.1)", borderColor: "#38bdf8" },
                                                        transition: "all 0.15s"
                                                    }}
                                                >
                                                    <img
                                                        src={`https://play.pokemonshowdown.com/sprites/trainers/${sp}.png`}
                                                        alt={sp}
                                                        draggable={false}
                                                        style={{ width: 48, height: 48, objectFit: "contain", imageRendering: "pixelated" }}
                                                        onError={(e) => { e.target.style.opacity = "0.2"; }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.6rem", textAlign: "center", maxWidth: 60, wordBreak: "break-all" }}>{sp}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>

                                    {/* Delete NPC */}
                                    <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #1e293b" }}>
                                        <Button
                                            variant="outlined" fullWidth
                                            onClick={() => {
                                                if (confirm(`ลบ NPC "${editNpc.name}" (${editNpc.id}) ออกจากระบบ?`)) {
                                                    setNpcList(prev => prev.filter(n => n.id !== editNpc.id));
                                                    setSelectedNpcId(npcList[0]?.id || "");
                                                }
                                            }}
                                            sx={{ borderColor: "#ef4444", color: "#ef4444", fontWeight: "bold", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
                                        >
                                            ลบ NPC นี้ออกจากระบบ
                                        </Button>
                                    </Box>
                                </Card>
                            );
                        })()}
                    </Box>
                )}

                {/* TAB 2: DRAG & DROP NPC POSITION PLACEMENT */}
                {currentTab === 2 && (
                    <Box sx={{ display: "flex", gap: 2, height: "100%", width: "100%", boxSizing: "border-box" }}>
                        {/* Main Canvas: Takes 100% of available remaining width! */}
                        <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexShrink: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                                    ตำแหน่ง NPC บนแผนที่: {selectedMap.name} (คลิกลากเพื่อย้ายพิกัด X, Y)
                                </Typography>
                                <Select 
                                    size="small" 
                                    value={selectedMapId} 
                                    onChange={(e) => setSelectedMapId(e.target.value)}
                                    sx={{ color: "white", bgcolor: "#0f172a", fontSize: "0.85rem", minWidth: 200 }}
                                >
                                    {Object.keys(mapList).map(mId => (
                                        <MenuItem key={mId} value={mId}>{mapList[mId].name} ({mId})</MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            {/* Canvas for Drag & Drop - STRETCHES FULLY with REAL NPC SPRITES! */}
                            <Box 
                                ref={canvasRef}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                sx={{ 
                                    position: "relative", width: "100%", flexGrow: 1, borderRadius: 2, overflow: "hidden", 
                                    backgroundImage: `url(${selectedMap.url})`, backgroundSize: "cover", backgroundPosition: "center",
                                    border: "2px solid #38bdf8", cursor: draggingNpc ? "grabbing" : "default"
                                }}
                            >
                                {/* Coordinate hint overlay */}
                                <Box sx={{ position: "absolute", top: 8, left: 8, bgcolor: "rgba(0,0,0,0.65)", px: 1.2, py: 0.4, borderRadius: 1, zIndex: 20, pointerEvents: "none" }}>
                                    <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: "bold", fontSize: "0.7rem" }}>
                                        ลากตัว NPC เพื่อตั้งพิกัด X (ซ้าย-ขวา) Y (บน-ล่าง) | X=0 ซ้ายสุด X=100 ขวาสุด | Y=0 ล่างสุด Y=100 บนสุด
                                    </Typography>
                                </Box>

                                {npcList.map(npc => {
                                    const pos = npc.mapPositions?.[selectedMapId];
                                    const hasPos = !!pos;
                                    const isOnThisMap = hasPos || npc.defaultLocation === selectedMapId;
                                    if (!isOnThisMap) return null;

                                    const { x = 50, y = 20, size = 90 } = pos || {};
                                    const isSelected = selectedNpcId === npc.id;
                                    const isDragging = draggingNpc === npc.id;

                                    return (
                                        <Box 
                                            key={npc.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setSelectedNpcId(npc.id);
                                                handleCanvasMouseDown(npc.id, e);
                                            }}
                                            sx={{ 
                                                position: "absolute",
                                                left: `${x}%`,
                                                bottom: `${y}%`,
                                                transform: "translateX(-50%)",
                                                cursor: isDragging ? "grabbing" : "grab",
                                                userSelect: "none",
                                                zIndex: isSelected ? 10 : 2,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                            }}
                                        >
                                            {/* Name label */}
                                            <Box sx={{
                                                bgcolor: isSelected ? "#38bdf8" : "rgba(0,0,0,0.8)",
                                                color: isSelected ? "black" : "white",
                                                fontWeight: "bold", fontSize: "0.7rem",
                                                px: 1, py: 0.2, borderRadius: 1, mb: 0.3,
                                                whiteSpace: "nowrap",
                                                boxShadow: isSelected ? "0 0 8px #38bdf8" : "none"
                                            }}>
                                                {npc.name} ({x}%, {y}%)
                                            </Box>

                                            {/* REAL NPC Sprite (same URL as in-game WalkingNpc!) */}
                                            <img 
                                                src={getNpcSpriteUrl(npc)}
                                                alt={npc.name}
                                                draggable={false}
                                                style={{ 
                                                    width: `${size}px`,
                                                    height: `${size}px`,
                                                    objectFit: "contain",
                                                    imageRendering: "pixelated",
                                                    filter: isSelected
                                                        ? "drop-shadow(0 0 14px #38bdf8) drop-shadow(0 0 6px #38bdf8)"
                                                        : "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                                                    opacity: isDragging ? 0.75 : 0.92,
                                                    transition: isDragging ? "none" : "filter 0.2s",
                                                }}
                                                onError={(e) => {
                                                    e.target.src = "https://play.pokemonshowdown.com/sprites/trainers/oak.png";
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Card>

                        {/* Right Sidebar: NPC List with sprite thumbnails */}
                        <Card sx={{ width: 320, minWidth: 280, flexShrink: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 1.5, flexShrink: 0 }}>
                                NPC ในแมพนี้ ({selectedMap.name})
                            </Typography>
                            <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                                {npcList.map(npc => {
                                    const pos = npc.mapPositions?.[selectedMapId] || { x: 50, y: 20, size: 90 };
                                    const isSelected = selectedNpcId === npc.id;
                                    const isOnMap = !!(npc.mapPositions?.[selectedMapId] || npc.defaultLocation === selectedMapId);

                                    return (
                                        <Box 
                                            key={npc.id}
                                            onClick={() => setSelectedNpcId(npc.id)}
                                            sx={{ 
                                                p: 1, borderRadius: 1.5,
                                                bgcolor: isSelected ? "rgba(56,189,248,0.12)" : "#0f172a",
                                                border: "1px solid", borderColor: isSelected ? "#38bdf8" : (isOnMap ? "#334155" : "#1e293b"),
                                                cursor: "pointer",
                                                display: "flex", gap: 1.5, alignItems: "flex-start"
                                            }}
                                        >
                                            {/* Sprite thumbnail — big preview */}
                                            <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                                                <img
                                                    src={getNpcSpriteUrl(npc)}
                                                    alt={npc.name}
                                                    draggable={false}
                                                    style={{
                                                        width: 64, height: 64,
                                                        objectFit: "contain",
                                                        imageRendering: "pixelated",
                                                        filter: isSelected ? "drop-shadow(0 0 8px #38bdf8)" : "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                                                        background: "rgba(255,255,255,0.04)",
                                                        borderRadius: 4,
                                                    }}
                                                    onError={(e) => { e.target.src = "https://play.pokemonshowdown.com/sprites/trainers/oak.png"; }}
                                                />
                                            </Box>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {/* NPC Name editable */}
                                                <TextField
                                                    size="small" fullWidth
                                                    label="ชื่อ NPC"
                                                    value={npc.name}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleUpdateNpcName(npc.id, e.target.value)}
                                                    sx={{
                                                        mb: 0.8,
                                                        "& .MuiInputBase-input": { color: isSelected ? "#38bdf8" : "white", fontSize: "0.82rem", py: 0.6 },
                                                        "& .MuiInputLabel-root": { color: "#64748b", fontSize: "0.78rem" },
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: isSelected ? "#38bdf8" : "#334155" }
                                                    }}
                                                />

                                                {/* Sprite name editable with live preview */}
                                                <TextField
                                                    size="small" fullWidth
                                                    label="ชื่อ Sprite (เช่น brock, misty, oak)"
                                                    value={npc.sprite || npc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "")}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleUpdateNpcSprite(npc.id, e.target.value)}
                                                    sx={{
                                                        mb: 0.8,
                                                        "& .MuiInputBase-input": { color: "#fbbf24", fontSize: "0.82rem", py: 0.6 },
                                                        "& .MuiInputLabel-root": { color: "#64748b", fontSize: "0.78rem" },
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#92400e" }
                                                    }}
                                                />

                                                <Typography variant="caption" sx={{ color: isOnMap ? "#4ade80" : "#64748b", display: "block", mb: 0.2 }}>
                                                    {isOnMap ? `X: ${pos.x}%  Y: ${pos.y}%  |  Size: ${pos.size}px` : "ไม่อยู่ในแมพนี้"}
                                                </Typography>

                                                <Typography variant="caption" sx={{ color: "#94a3b8" }}>ขนาด Sprite</Typography>
                                                <Slider 
                                                    size="small" min={60} max={260} value={pos.size || 90}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(_, val) => handleUpdateNpcSize(npc.id, val)}
                                                    sx={{ color: isSelected ? "#38bdf8" : "#475569", py: 0.3, mt: 0 }}
                                                />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* TAB 3: SCHEDULE & CONDITIONS EDITOR */}
                {currentTab === 3 && (
                    <Box sx={{ display: "flex", gap: 2, height: "100%", width: "100%", boxSizing: "border-box" }}>
                        <Card sx={{ width: 300, minWidth: 260, flexShrink: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 1.5, flexShrink: 0 }}>
                                เลือก NPC
                            </Typography>
                            <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                                {npcList.map(npc => (
                                    <Box 
                                        key={npc.id}
                                        onClick={() => setSelectedNpcId(npc.id)}
                                        sx={{ 
                                            p: 1.2, borderRadius: 1.5, cursor: "pointer",
                                            bgcolor: selectedNpcId === npc.id ? "rgba(56,189,248,0.15)" : "#0f172a",
                                            border: "1px solid", borderColor: selectedNpcId === npc.id ? "#38bdf8" : "#1e293b"
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: selectedNpcId === npc.id ? "#38bdf8" : "white" }}>{npc.name}</Typography>
                                        <Typography variant="caption" sx={{ color: "#64748b" }}>ID: {npc.id} | Default: {npc.defaultLocation || "None"}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Card>

                        <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2.5, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", boxSizing: "border-box" }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 2 }}>
                                🕒 ตารางเวลาและการปรากฏตัวของ: {selectedNpc.name} ({selectedNpc.id})
                            </Typography>

                            {/* Default Location */}
                            <Box sx={{ bgcolor: "#0f172a", p: 2, borderRadius: 2, mb: 3, border: "1px solid #1e293b" }}>
                                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#4ade80", mb: 1 }}>
                                    📍 สถานที่ประจำ/เริ่มต้น (Default Location)
                                </Typography>
                                <Select 
                                    size="small" fullWidth value={selectedNpc.defaultLocation || ""} 
                                    onChange={(e) => handleUpdateNpcDefaultLoc(e.target.value)}
                                    sx={{ color: "white", bgcolor: "#1e293b" }}
                                >
                                    <MenuItem value="">ไม่มี (None - ปรากฏเฉพาะในเวลาสคริปต์)</MenuItem>
                                    {Object.keys(mapList).map(mId => (
                                        <MenuItem key={mId} value={mId}>{mapList[mId].name} ({mId})</MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            {/* Time Schedule */}
                            <Box sx={{ bgcolor: "#0f172a", p: 2, borderRadius: 2, mb: 3, border: "1px solid #1e293b" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                                        ⏰ ตารางเดินทางตามเวลา (Time Schedule)
                                    </Typography>
                                    <Button size="small" variant="contained" onClick={handleAddScheduleItem} sx={{ bgcolor: "#38bdf8", color: "black", fontWeight: "bold", fontSize: "0.75rem" }}>
                                        + เพิ่มช่วงเวลาเดินทาง
                                    </Button>
                                </Box>

                                {(selectedNpc.schedule || []).length === 0 && (
                                    <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic" }}>
                                        ไม่มีตารางเวลาพิเศษ (NPC จะประจำอยู่ที่ Default Location ตลอดเวลา)
                                    </Typography>
                                )}

                                {(selectedNpc.schedule || []).map((sch, idx) => (
                                    <Box key={idx} sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1, bgcolor: "#1e293b", p: 1, borderRadius: 1.5 }}>
                                        <TextField 
                                            size="small" label="ตั้งแต่ (Start น.)" type="number" value={sch.start} 
                                            onChange={(e) => handleUpdateScheduleItem(idx, "start", Number(e.target.value))}
                                            sx={{ input: { color: "white", fontSize: "0.8rem" }, width: 110 }}
                                        />
                                        <TextField 
                                            size="small" label="ถึง (End น.)" type="number" value={sch.end} 
                                            onChange={(e) => handleUpdateScheduleItem(idx, "end", Number(e.target.value))}
                                            sx={{ input: { color: "white", fontSize: "0.8rem" }, width: 110 }}
                                        />
                                        <Select 
                                            size="small" value={sch.location} 
                                            onChange={(e) => handleUpdateScheduleItem(idx, "location", e.target.value)}
                                            sx={{ color: "white", bgcolor: "#0f172a", fontSize: "0.8rem", flexGrow: 1 }}
                                        >
                                            {Object.keys(mapList).map(mId => (
                                                <MenuItem key={mId} value={mId}>{mapList[mId].name} ({mId})</MenuItem>
                                            ))}
                                        </Select>
                                        <IconButton size="small" onClick={() => handleDeleteScheduleItem(idx)} sx={{ color: "#ef4444" }}>✕</IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Script Condition Overview */}
                            <Box sx={{ bgcolor: "#0f172a", p: 2, borderRadius: 2, border: "1px solid #1e293b" }}>
                                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#c084fc", mb: 1 }}>
                                    📜 สรุปเงื่อนไขบทสนทนา (Script Blocks Conditions)
                                </Typography>
                                {(selectedNpc.scripts || []).map((block, bIdx) => (
                                    <Box key={bIdx} sx={{ bgcolor: "#1e293b", p: 1, borderRadius: 1, mb: 1, display: "flex", gap: 2, alignItems: "center" }}>
                                        <Chip label={`Block #${bIdx + 1}`} size="small" color="secondary" />
                                        <Typography variant="caption" sx={{ color: "white" }}>
                                            Location: <b>{block.location || "ทุกสถานที่"}</b> | Phase: <b>{block.phase || "ทุกเฟส"}</b> | เวลา: <b>{block.start !== undefined ? `${block.start}-${block.end}น.` : "ตลอดวัน"}</b>
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* TAB 4: SCRIPT & DIALOGUE BUILDER */}
                {currentTab === 4 && (
                    <Box sx={{ display: "flex", gap: 2, height: "100%", width: "100%", boxSizing: "border-box" }}>
                        <Card sx={{ width: 300, minWidth: 260, flexShrink: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexShrink: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8" }}>เลือก NPC</Typography>
                                <Button size="small" variant="contained" onClick={handleAddNpc} sx={{ bgcolor: "#38bdf8", color: "#000", fontWeight: "bold" }}>+ เพิ่ม NPC</Button>
                            </Box>
                            <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                                {npcList.map(npc => (
                                    <Box 
                                        key={npc.id}
                                        onClick={() => setSelectedNpcId(npc.id)}
                                        sx={{ 
                                            p: 1.2, borderRadius: 1.5, cursor: "pointer",
                                            bgcolor: selectedNpcId === npc.id ? "rgba(56,189,248,0.15)" : "#0f172a",
                                            border: "1px solid", borderColor: selectedNpcId === npc.id ? "#38bdf8" : "#1e293b"
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: selectedNpcId === npc.id ? "#38bdf8" : "white" }}>{npc.name}</Typography>
                                        <Typography variant="caption" sx={{ color: "#64748b" }}>ID: {npc.id}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Card>

                        <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2.5, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", boxSizing: "border-box" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexShrink: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                                    จัดการสคริปต์สำหรับ {selectedNpc.name} ({selectedNpc.id})
                                </Typography>
                                <Button size="small" variant="contained" onClick={handleAddScriptBlock} sx={{ bgcolor: "#4ade80", color: "#000", fontWeight: "bold" }}>+ เพิ่มเงื่อนไข Script Block</Button>
                            </Box>

                            {(selectedNpc.scripts || []).map((block, bIdx) => (
                                <Card key={bIdx} sx={{ bgcolor: "#0f172a", border: "1px solid #1e293b", p: 1.8, mb: 2, flexShrink: 0 }}>
                                    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                                        <Chip label={`Block #${bIdx + 1}`} color="primary" size="small" />
                                        <Select 
                                            size="small" value={block.location || ""} 
                                            onChange={(e) => handleUpdateBlockMeta(bIdx, "location", e.target.value)}
                                            sx={{ color: "white", bgcolor: "#1e293b", fontSize: "0.78rem" }}
                                        >
                                            <MenuItem value="">ทุกสถานที่ (Any)</MenuItem>
                                            {Object.keys(mapList).map(mId => (
                                                <MenuItem key={mId} value={mId}>{mapList[mId].name} ({mId})</MenuItem>
                                            ))}
                                        </Select>
                                        <TextField 
                                            size="small" label="Phase" type="number" value={block.phase || ""} 
                                            onChange={(e) => handleUpdateBlockMeta(bIdx, "phase", e.target.value ? Number(e.target.value) : undefined)}
                                            sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 80 }}
                                        />
                                        <TextField 
                                            size="small" label="Start น." type="number" value={block.start || ""} 
                                            onChange={(e) => handleUpdateBlockMeta(bIdx, "start", e.target.value ? Number(e.target.value) : undefined)}
                                            sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 85 }}
                                        />
                                        <TextField 
                                            size="small" label="End น." type="number" value={block.end || ""} 
                                            onChange={(e) => handleUpdateBlockMeta(bIdx, "end", e.target.value ? Number(e.target.value) : undefined)}
                                            sx={{ input: { color: "white", fontSize: "0.78rem" }, width: 85 }}
                                        />
                                        <Button size="small" onClick={() => handleAddScriptStep(bIdx)} sx={{ color: "#38bdf8", ml: "auto", fontSize: "0.75rem" }}>+ เพิ่ม Node Step</Button>
                                        <IconButton size="small" onClick={() => handleDeleteScriptBlock(bIdx)} sx={{ color: "#ef4444" }}>✕</IconButton>
                                    </Box>

                                    {/* Steps list */}
                                    {(block.script || []).map((step, sIdx) => {
                                        const actionType = step.action || "talk";

                                        return (
                                            <Box id={`node-step-${bIdx}-${step.node}`} key={sIdx} sx={{ bgcolor: "#1e293b", p: 1.8, borderRadius: 2, mb: 1.5, border: "1px solid #334155" }}>
                                                {/* Header Row: Node ID, Action Select, NextNode, Up/Down, Delete */}
                                                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
                                                    {/* Move Up / Down Buttons */}
                                                    <Box sx={{ display: "flex", gap: 0.2, alignItems: "center", bgcolor: "#0f172a", borderRadius: 1, px: 0.5, py: 0.2, border: "1px solid #334155" }}>
                                                        <IconButton
                                                            size="small"
                                                            disabled={sIdx === 0}
                                                            onClick={() => handleMoveScriptStep(bIdx, sIdx, "up")}
                                                            sx={{ color: sIdx === 0 ? "#475569" : "#38bdf8", p: 0.3 }}
                                                            title="เลื่อนโหนดขึ้น"
                                                        >
                                                            ▲
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            disabled={sIdx === (block.script || []).length - 1}
                                                            onClick={() => handleMoveScriptStep(bIdx, sIdx, "down")}
                                                            sx={{ color: sIdx === (block.script || []).length - 1 ? "#475569" : "#38bdf8", p: 0.3 }}
                                                            title="เลื่อนโหนดลง"
                                                        >
                                                            ▼
                                                        </IconButton>
                                                    </Box>

                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: "bold" }}>Node #</Typography>
                                                        <TextField
                                                            size="small" type="number" value={step.node}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "node", Number(e.target.value))}
                                                            sx={{ input: { color: "#38bdf8", fontWeight: "bold", fontSize: "0.85rem", py: 0.5 }, width: 70 }}
                                                        />
                                                    </Box>

                                                    <Select
                                                        size="small" value={actionType}
                                                        onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "action", e.target.value)}
                                                        sx={{ color: "white", bgcolor: "#0f172a", fontSize: "0.82rem", width: 220 }}
                                                    >
                                                        <MenuItem value="talk">💬 talk (พูดคุย/บทสนทนา)</MenuItem>
                                                        <MenuItem value="push_character">👤 push_character (โผล่บนจอ)</MenuItem>
                                                        <MenuItem value="pop_character">🏃 pop_character (หุบออกจากจอ)</MenuItem>
                                                        <MenuItem value="choice">🔀 choice (สร้างตัวเลือก)</MenuItem>
                                                        <MenuItem value="battle">⚔️ battle (เริ่มการประลอง)</MenuItem>
                                                        <MenuItem value="event">🎁 event (แจกพ้อยท์/เพิ่มเฟส)</MenuItem>
                                                        <MenuItem value="menu_mart">🛒 menu_mart (เปิดร้านค้า/TM)</MenuItem>
                                                    </Select>

                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>ไปที่ Node:</Typography>
                                                        <TextField
                                                            size="small" type="number"
                                                            placeholder="ถัดไป"
                                                            value={step.nextNode !== undefined && step.nextNode !== null ? step.nextNode : ""}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "nextNode", e.target.value === "" ? null : Number(e.target.value))}
                                                            sx={{ input: { color: "#4ade80", fontWeight: "bold", fontSize: "0.85rem", py: 0.5 }, width: 85 }}
                                                        />
                                                    </Box>

                                                    <IconButton size="small" onClick={() => handleDeleteScriptStep(bIdx, sIdx)} sx={{ color: "#ef4444", ml: "auto" }}>✕</IconButton>
                                                </Box>

                                                {/* ACTION SPECIFIC EDITORS */}
                                                
                                                {/* 1. TALK / SHOWTEXT */}
                                                {(actionType === "talk" || actionType === "showText") && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <TextField
                                                            size="small" label="ผู้พูด (Speaker Name — ปล่อยว่างเพื่อเป็นผู้บรรยาย)"
                                                            value={step.speaker || ""}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "speaker", e.target.value)}
                                                            sx={{ input: { color: "#fbbf24", fontSize: "0.85rem" }, label: { color: "#94a3b8" } }}
                                                        />
                                                        <TextField
                                                            size="small" multiline rows={2} fullWidth
                                                            label="ข้อความบทสนทนา (Dialog Text)"
                                                            value={step.dialog || ""}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "dialog", e.target.value)}
                                                            sx={{ textarea: { color: "white", fontSize: "0.85rem" }, label: { color: "#94a3b8" } }}
                                                        />
                                                    </Box>
                                                )}

                                                {/* 2. PUSH_CHARACTER (MULTI-NPC & DISPLAY NAME SUPPORT) */}
                                                {actionType === "push_character" && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: "bold" }}>
                                                            👤 กำหนดตัวละครที่ต้องการให้โผล่เข้าสู่หน้าจอ (Push Character & Display Name)
                                                        </Typography>
                                                        <Box sx={{ display: "flex", gap: 1.5 }}>
                                                            <TextField
                                                                size="small"
                                                                label="Sprite ID (เช่น brock, misty)"
                                                                value={step.character || (Array.isArray(step.characters) ? step.characters.join(", ") : selectedNpc.id)}
                                                                onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "character", e.target.value)}
                                                                sx={{ input: { color: "#38bdf8", fontSize: "0.85rem", fontWeight: "bold" }, flex: 1 }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                label="ชื่อผู้พูด / Display Name (เช่น บร็อก)"
                                                                value={step.name || ""}
                                                                onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "name", e.target.value)}
                                                                sx={{ input: { color: "#fbbf24", fontSize: "0.85rem", fontWeight: "bold" }, flex: 1 }}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                                            💡 <b>ระบบเชื่อมโยงผู้พูด:</b> ใส่ชื่อในช่อง <b>Display Name</b> เพื่อเชื่อมกับช่อง <b>Speaker (ผู้พูด)</b> ใน Node บทสนทนา (`talk`) ตัวละครที่มีชื่อตรงกับผู้พูดจะเด้งขยายตัวโตขึ้นทันทีเมื่อถึงคิวพูด!
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* 3. POP_CHARACTER (SELECTIVE OR ALL) */}
                                                {actionType === "pop_character" && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: "bold" }}>
                                                            🏃 หุบตัวละครออกจากหน้าจอ (Pop Specific OR Pop All)
                                                        </Typography>
                                                        <TextField
                                                            size="small" fullWidth
                                                            label="ระบุตัวละครที่ต้องการหุบออก (เช่น brock หรือปล่อยว่างเพื่อหุบออกหมดทุกตัว)"
                                                            value={step.character || (Array.isArray(step.characters) ? step.characters.join(", ") : "")}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "character", e.target.value)}
                                                            sx={{ input: { color: "#f87171", fontSize: "0.85rem" } }}
                                                        />
                                                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                                            💡 <b>ระบบหุบเฉพาะตัว:</b> ระบุชื่อ เช่น <code style={{ color: "#f87171" }}>brock</code> เพื่อหุบแค่ Brock ออกไป แล้วให้ Misty ยืนต่อพร้อมขยับกลับเข้าตรงกลาง | <b>ปล่อยว่างไว้</b> = หุบตัวละครทั้งหมดออกจากหน้าจอ
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* 4. CHOICE */}
                                                {actionType === "choice" && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <TextField
                                                            size="small" label="ผู้ถาม"
                                                            value={step.speaker || selectedNpc.name}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "speaker", e.target.value)}
                                                            sx={{ input: { color: "#fbbf24", fontSize: "0.85rem" } }}
                                                        />
                                                        <TextField
                                                            size="small" fullWidth label="คำถาม / ข้อความนำก่อนเลือก"
                                                            value={step.dialog || ""}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "dialog", e.target.value)}
                                                            sx={{ input: { color: "white", fontSize: "0.85rem" } }}
                                                        />

                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: "#c084fc", fontWeight: "bold" }}>รายการตัวเลือก (Choices)</Typography>
                                                            <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    const choices = [...(step.choices || [])];
                                                                    choices.push({ text: "ตัวเลือกใหม่", nextNode: step.node + 1, color: "orange" });
                                                                    handleUpdateScriptStep(bIdx, sIdx, "choices", choices);
                                                                }}
                                                                sx={{ color: "#c084fc", fontSize: "0.75rem" }}
                                                            >
                                                                + เพิ่มตัวเลือก
                                                            </Button>
                                                        </Box>

                                                        {(step.choices || []).map((ch, cIdx) => (
                                                            <Box key={cIdx} sx={{ display: "flex", gap: 1, alignItems: "center", bgcolor: "#1e293b", p: 0.8, borderRadius: 1 }}>
                                                                <TextField
                                                                    size="small" label="ข้อความปุ่ม"
                                                                    value={ch.text}
                                                                    onChange={(e) => {
                                                                        const choices = [...step.choices];
                                                                        choices[cIdx].text = e.target.value;
                                                                        handleUpdateScriptStep(bIdx, sIdx, "choices", choices);
                                                                    }}
                                                                    sx={{ input: { color: "white", fontSize: "0.8rem" }, flex: 1 }}
                                                                />
                                                                <TextField
                                                                    size="small" label="ไป Node" type="number"
                                                                    value={ch.nextNode}
                                                                    onChange={(e) => {
                                                                        const choices = [...step.choices];
                                                                        choices[cIdx].nextNode = Number(e.target.value);
                                                                        handleUpdateScriptStep(bIdx, sIdx, "choices", choices);
                                                                    }}
                                                                    sx={{ input: { color: "#4ade80", fontSize: "0.8rem" }, width: 85 }}
                                                                />
                                                                <Select
                                                                    size="small" value={ch.color || "white"}
                                                                    onChange={(e) => {
                                                                        const choices = [...step.choices];
                                                                        choices[cIdx].color = e.target.value;
                                                                        handleUpdateScriptStep(bIdx, sIdx, "choices", choices);
                                                                    }}
                                                                    sx={{ color: "white", bgcolor: "#0f172a", fontSize: "0.78rem", width: 110 }}
                                                                >
                                                                    <MenuItem value="orange">Orange</MenuItem>
                                                                    <MenuItem value="white">White</MenuItem>
                                                                    <MenuItem value="red">Red</MenuItem>
                                                                    <MenuItem value="cyan">Cyan</MenuItem>
                                                                    <MenuItem value="yellow">Yellow</MenuItem>
                                                                    <MenuItem value="green">Green</MenuItem>
                                                                </Select>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        const choices = step.choices.filter((_, i) => i !== cIdx);
                                                                        handleUpdateScriptStep(bIdx, sIdx, "choices", choices);
                                                                    }}
                                                                    sx={{ color: "#ef4444", p: 0.3 }}
                                                                >✕</IconButton>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}

                                                {/* 5. BATTLE */}
                                                {actionType === "battle" && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <Box sx={{ display: "flex", gap: 2 }}>
                                                            <TextField
                                                                size="small" label="ไป Node ไหนเมื่อ ชนะ (nextNode_win)" type="number"
                                                                value={step.nextNode_win || ""}
                                                                onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "nextNode_win", Number(e.target.value))}
                                                                sx={{ input: { color: "#4ade80", fontWeight: "bold" }, flex: 1 }}
                                                            />
                                                            <TextField
                                                                size="small" label="ไป Node ไหนเมื่อ แพ้ (nextNode_lose)" type="number"
                                                                value={step.nextNode_lose || ""}
                                                                onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "nextNode_lose", Number(e.target.value))}
                                                                sx={{ input: { color: "#f87171", fontWeight: "bold" }, flex: 1 }}
                                                            />
                                                        </Box>

                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: "bold" }}>ทีมโปเกม่อนของคู่ต่อสู้ (Enemy Team)</Typography>
                                                            <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    const team = [...(step.enemyTeam || [])];
                                                                    team.push({ species: "Pikachu", level: 10, moves: ["tackle", "thundershock"] });
                                                                    handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                }}
                                                                sx={{ color: "#fbbf24", fontSize: "0.75rem" }}
                                                            >
                                                                + เพิ่มโปเกม่อนทีมคู่ต่อสู้
                                                            </Button>
                                                        </Box>

                                                        {(step.enemyTeam || []).map((poke, pIdx) => {
                                                            const speciesAbilities = getAbilitiesForSpecies(poke.species);
                                                            const availableMoves = getAvailableMovesForSpecies(poke.species, poke.level || 100);
                                                            const selectedMoves = Array.isArray(poke.moves) ? poke.moves : (poke.moves || "").split(",").map(s => s.trim()).filter(Boolean);

                                                            return (
                                                                <Box key={pIdx} sx={{ display: "flex", flexDirection: "column", gap: 1, bgcolor: "#1e293b", p: 1.2, borderRadius: 1.5, border: "1px solid #334155" }}>
                                                                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                                                        <TextField
                                                                            size="small" label="Species (โปเกม่อน)"
                                                                            value={poke.species}
                                                                            onChange={(e) => {
                                                                                const team = [...step.enemyTeam];
                                                                                const newSpecies = e.target.value;
                                                                                const newAbilities = getAbilitiesForSpecies(newSpecies);
                                                                                team[pIdx] = {
                                                                                    ...team[pIdx],
                                                                                    species: newSpecies,
                                                                                    ability: newAbilities[0] || team[pIdx].ability || ""
                                                                                };
                                                                                handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                            }}
                                                                            sx={{ input: { color: "white", fontSize: "0.85rem" }, flex: 1.2 }}
                                                                        />

                                                                        <TextField
                                                                            size="small" label="Level" type="number"
                                                                            value={poke.level}
                                                                            onChange={(e) => {
                                                                                const team = [...step.enemyTeam];
                                                                                team[pIdx].level = Number(e.target.value);
                                                                                handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                            }}
                                                                            sx={{ input: { color: "#fbbf24", fontSize: "0.85rem", fontWeight: "bold" }, width: 85 }}
                                                                        />

                                                                        {/* Ability Select Dropdown */}
                                                                        <Select
                                                                            size="small"
                                                                            displayEmpty
                                                                            value={poke.ability || ""}
                                                                            onChange={(e) => {
                                                                                const team = [...step.enemyTeam];
                                                                                team[pIdx].ability = e.target.value;
                                                                                handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                            }}
                                                                            sx={{ color: "#38bdf8", bgcolor: "#0f172a", fontSize: "0.82rem", flex: 1 }}
                                                                        >
                                                                            <MenuItem value=""><em>Ability (Default)</em></MenuItem>
                                                                            {speciesAbilities.map(ab => (
                                                                                <MenuItem key={ab} value={ab}>{ab}</MenuItem>
                                                                            ))}
                                                                        </Select>

                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => {
                                                                                const team = step.enemyTeam.filter((_, i) => i !== pIdx);
                                                                                handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                            }}
                                                                            sx={{ color: "#ef4444", p: 0.5 }}
                                                                        >✕</IconButton>
                                                                    </Box>

                                                                    {/* Moves Picker */}
                                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, bgcolor: "rgba(0,0,0,0.25)", p: 1, borderRadius: 1 }}>
                                                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: "bold" }}>
                                                                                ท่าต่อสู้ (Moves): {selectedMoves.length}/4
                                                                            </Typography>

                                                                            {/* Dropdown to add learnable move */}
                                                                            <Select
                                                                                size="small"
                                                                                displayEmpty
                                                                                value=""
                                                                                onChange={(e) => {
                                                                                    if (!e.target.value) return;
                                                                                    if (!selectedMoves.includes(e.target.value) && selectedMoves.length < 4) {
                                                                                        const newMoves = [...selectedMoves, e.target.value];
                                                                                        const team = [...step.enemyTeam];
                                                                                        team[pIdx].moves = newMoves;
                                                                                        handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                                    }
                                                                                }}
                                                                                sx={{ color: "#4ade80", bgcolor: "#0f172a", fontSize: "0.78rem", height: 32, maxWidth: 280 }}
                                                                            >
                                                                                <MenuItem value="" disabled>+ เลือกท่าเพิ่ม (กรองตาม Lv.{poke.level || 100} + TM + Egg)</MenuItem>
                                                                                {availableMoves.map(m => (
                                                                                    <MenuItem key={m.moveId} value={m.moveId}>
                                                                                        [{m.source}] {m.moveId}
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </Box>

                                                                        {/* Selected Move Chips */}
                                                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                                                            {selectedMoves.map((mName, mIdx) => (
                                                                                <Chip
                                                                                    key={mIdx}
                                                                                    label={mName}
                                                                                    size="small"
                                                                                    onDelete={() => {
                                                                                        const newMoves = selectedMoves.filter((_, i) => i !== mIdx);
                                                                                        const team = [...step.enemyTeam];
                                                                                        team[pIdx].moves = newMoves;
                                                                                        handleUpdateScriptStep(bIdx, sIdx, "enemyTeam", team);
                                                                                    }}
                                                                                    sx={{ bgcolor: "#334155", color: "#38bdf8", fontWeight: "bold", fontSize: "0.75rem" }}
                                                                                />
                                                                            ))}
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                )}

                                                {/* 6. EVENT */}
                                                {actionType === "event" && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <Select
                                                            size="small" value={step.eventType || "increase_phase"}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "eventType", e.target.value)}
                                                            sx={{ color: "white", bgcolor: "#1e293b", fontSize: "0.82rem" }}
                                                        >
                                                            <MenuItem value="increase_phase">🌟 increase_phase (ปลดล็อกเพิ่ม Phase + Max Level Cap)</MenuItem>
                                                            <MenuItem value="give_points">💎 give_points (เพิ่มแต้ม Points ให้ผู้เล่น)</MenuItem>
                                                            <MenuItem value="give_item">🎁 give_item (แจกไอเทมใส่กระเป๋า)</MenuItem>
                                                            <MenuItem value="heal_team">💖 heal_team (ฟื้นฟูพลังทีมโปเกม่อนทั้งหมด)</MenuItem>
                                                        </Select>

                                                        {step.eventType === "give_points" && (
                                                            <TextField
                                                                size="small" label="จำนวนแต้ม (Points)" type="number"
                                                                value={step.amount || 1000}
                                                                onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "amount", Number(e.target.value))}
                                                                sx={{ input: { color: "#4ade80", fontWeight: "bold" } }}
                                                            />
                                                        )}

                                                        {step.eventType === "give_item" && (
                                                            <TextField
                                                                size="small" label="ID ไอเทม (e.g. potion, pokeball, tm-acrobatics)"
                                                                value={step.itemId || ""}
                                                                onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "itemId", e.target.value)}
                                                                sx={{ input: { color: "#38bdf8" } }}
                                                            />
                                                        )}

                                                        <TextField
                                                            size="small" fullWidth label="ข้อความแจ้งเตือนผู้เล่น (Dialog Text)"
                                                            value={step.dialog || ""}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "dialog", e.target.value)}
                                                            sx={{ input: { color: "white", fontSize: "0.85rem" } }}
                                                        />
                                                    </Box>
                                                )}

                                                {/* 7. MENU_MART */}
                                                {actionType === "menu_mart" && (
                                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, bgcolor: "#0f172a", p: 1.5, borderRadius: 1.5 }}>
                                                        <TextField
                                                            size="small" label="ชื่อผู้ขาย / ร้านค้า"
                                                            value={step.speaker || selectedNpc.name}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "speaker", e.target.value)}
                                                            sx={{ input: { color: "#fbbf24", fontSize: "0.85rem" } }}
                                                        />
                                                        <TextField
                                                            size="small" fullWidth label="ข้อความต้อนรับหน้าร้าน"
                                                            value={step.dialog || "เลือกซื้อสินค้าได้เลย"}
                                                            onChange={(e) => handleUpdateScriptStep(bIdx, sIdx, "dialog", e.target.value)}
                                                            sx={{ input: { color: "white", fontSize: "0.85rem" } }}
                                                        />
                                                        <Box sx={{ bgcolor: "#1e293b", p: 1, borderRadius: 1, border: "1px solid #334155" }}>
                                                            <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: "bold" }}>
                                                                🛒 ร้านค้านี้เปิดขาย TM ทั้งหมด 238 ชนิดที่มีในเกมอัตโนมัติ (use_all_tms: true)
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Card>
                            ))}
                        </Card>
                    </Box>
                )}

                {/* TAB 5: EXPORT JSON */}
                {currentTab === 5 && (() => {
                    const cleanNpcList = npcList.map(npc => {
                        if (!npc.scripts) return npc;
                        const scripts = npc.scripts.map(block => {
                            if (!block.script) return block;
                            const script = block.script.map(step => {
                                const s = { ...step };
                                if (["event", "push_character", "pop_character", "battle"].includes(s.action)) {
                                    delete s.speaker;
                                }
                                if (s.action === "event" && !s.eventType) {
                                    s.eventType = "increase_phase";
                                }
                                return s;
                            });
                            return { ...block, script };
                        });
                        return { ...npc, scripts };
                    });

                    return (
                        <Box sx={{ display: "flex", gap: 2, height: "100%", width: "100%", boxSizing: "border-box" }}>
                            <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 1, flexShrink: 0 }}>map.json Export</Typography>
                                <Button size="small" variant="outlined" onClick={() => navigator.clipboard.writeText(JSON.stringify(mapList, null, 2))} sx={{ mb: 1, color: "#38bdf8", flexShrink: 0 }}>Copy map.json</Button>
                                <textarea 
                                    readOnly 
                                    value={JSON.stringify(mapList, null, 2)} 
                                    style={{ flexGrow: 1, width: "100%", backgroundColor: "#0f172a", color: "#4ade80", fontFamily: "monospace", border: "1px solid #334155", borderRadius: 4, padding: 8, boxSizing: "border-box", resize: "none" }}
                                />
                            </Card>
                            <Card sx={{ flex: 1, minWidth: 0, bgcolor: "#141722", border: "1px solid #1e293b", p: 2, height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#38bdf8", mb: 1, flexShrink: 0 }}>npc.json Export</Typography>
                                <Button size="small" variant="outlined" onClick={() => navigator.clipboard.writeText(JSON.stringify(cleanNpcList, null, 2))} sx={{ mb: 1, color: "#38bdf8", flexShrink: 0 }}>Copy npc.json</Button>
                                <textarea 
                                    readOnly 
                                    value={JSON.stringify(cleanNpcList, null, 2)} 
                                    style={{ flexGrow: 1, width: "100%", backgroundColor: "#0f172a", color: "#38bdf8", fontFamily: "monospace", border: "1px solid #334155", borderRadius: 4, padding: 8, boxSizing: "border-box", resize: "none" }}
                                />
                            </Card>
                        </Box>
                    );
                })()}
            </Box>
        </Box>
    );
}
