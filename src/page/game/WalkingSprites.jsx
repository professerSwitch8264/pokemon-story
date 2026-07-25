import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/system";
import pokemonData from "../../data/pokemon.json";

const iconPopIn = keyframes`
  0% { opacity: 0; transform: translateX(-50%) scale(0) translateY(30px); }
  60% { opacity: 1; transform: translateX(-50%) scale(1.15) translateY(-10px); }
  80% { transform: translateX(-50%) scale(0.95) translateY(5px); }
  100% { opacity: 0.9; transform: translateX(-50%) scale(1) translateY(0); }
`;

const iconShrinkOut = keyframes`
  0% { opacity: 0.9; transform: translateX(-50%) scale(1) translateY(0); }
  30% { opacity: 1; transform: translateX(-50%) scale(1.15) translateY(-8px); }
  100% { opacity: 0; transform: translateX(-50%) scale(0) translateY(25px); }
`;

export const WalkingNpc = ({ npc, currentLocation, onClick }) => {
    // กำหนดตำแหน่งเกิดแบบสุ่ม แต่ไม่ต้องอัปเดตให้เดิน
    const customPos = npc.mapPositions?.[currentLocation];
    const [pos] = useState({ 
        x: customPos?.x !== undefined ? customPos.x : 30 + Math.random() * 40,
        y: customPos?.y !== undefined ? customPos.y : 20 + Math.random() * 15,
        size: customPos?.size || 90,
        direction: Math.random() > 0.5 ? 1 : -1 
    });

    const spriteName = npc.sprite ||
        npc.id.toLowerCase().replace("gym_", "").replace("tm_", "").replace("npc_", "");
    const imageUrl = `https://play.pokemonshowdown.com/sprites/trainers/${spriteName}.png`;

    return (
        <Box 
            component="img"
            src={imageUrl}
            onClick={() => onClick && onClick(npc)}
            sx={{
                position: "absolute",
                bottom: `${pos.y}%`,
                left: `${pos.x}%`,
                transform: `translateX(-50%) scaleX(${pos.direction})`,
                width: `${pos.size}px`,
                height: `${pos.size}px`,
                imageRendering: "pixelated",
                zIndex: 5,
                opacity: 0.85,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    opacity: 1,
                    transform: `translateX(-50%) scaleX(${pos.direction}) scale(1.15) translateY(-5px)`,
                    filter: "drop-shadow(0 0 8px rgba(0, 255, 255, 0.8))"
                }
            }}
        />
    );
};

const WalkingPokemonIcon = ({ poke, onRemove, onClick }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // สุ่มอายุขัยให้อยู่ระหว่าง 4 ถึง 7 วินาที
        const lifespan = 4000 + Math.random() * 3000;
        const timer = setTimeout(() => {
            setIsLeaving(true);
        }, lifespan);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isLeaving) {
            // อะนิเมชั่นหุบใช้เวลา 0.5 วินาที พอจบแล้วจึงเรียก onRemove เพื่อลบออกจาก DOM
            const removeTimer = setTimeout(() => {
                onRemove(poke.id);
            }, 500);
            return () => clearTimeout(removeTimer);
        }
    }, [isLeaving, poke.id, onRemove]);

    return (
        <Box
            onClick={() => {
                if (onClick) onClick(poke);
                onRemove(poke.id);
            }}
            sx={{
                position: "absolute",
                bottom: `${poke.y}%`,
                left: `${poke.x}%`,
                zIndex: 4,
                animation: `${isLeaving ? iconShrinkOut : iconPopIn} ${isLeaving ? '0.5s ease-in' : '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'} forwards`,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    transform: "scale(1.2) translateY(-8px)",
                    filter: "drop-shadow(0 0 10px rgba(255, 255, 0, 0.9))"
                }
            }}
        >
            <Box
                component="img"
                src={poke.url}
                sx={{
                    transform: `scaleX(${poke.direction})`,
                    width: "150px", // ขนาดโปเกม่อนใหญ่ขึ้น
                    height: "150px",
                    imageRendering: "pixelated",
                    display: "block",
                    opacity: 0.9,
                    transition: "opacity 0.2s",
                    "&:hover": {
                        opacity: 1
                    }
                }}
            />
        </Box>
    );
};

export const WalkingPokemonSpawner = ({ encounters, onPokemonClick }) => {
    const [activePokemons, setActivePokemons] = useState([]);

    const handleRemove = (id) => {
        setActivePokemons(prev => prev.filter(p => p.id !== id));
    };

    useEffect(() => {
        if (!encounters || Object.keys(encounters).length === 0) return;

        const spawnPokemon = () => {
            const list = Array.isArray(encounters) ? encounters : Object.values(encounters || {}).flat(); 
            if (!list || list.length === 0) return;
            const totalWeight = list.reduce((acc, e) => acc + (Number(e.chance || e.rate) || 1), 0);
            let r = Math.random() * totalWeight;
            let encounterObj = list[0];
            for (const e of list) {
                const weight = Number(e.chance || e.rate) || 1;
                if (r < weight) {
                    encounterObj = e;
                    break;
                }
                r -= weight;
            }
            const randomSpecies = encounterObj.species;
            
            const pData = pokemonData[randomSpecies.toLowerCase()];
            const pokeId = pData ? pData.id : 1;
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pokeId}.png`;

            const newPoke = {
                id: Math.random().toString(36).substr(2, 9),
                url: spriteUrl,
                species: randomSpecies,
                encounter: encounterObj,
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 10,
                direction: Math.random() > 0.5 ? 1 : -1
            };

            setActivePokemons(prev => {
                if (prev.length >= 3) return prev;
                return [...prev, newPoke];
            });
        };

        // ลองเกิดทุกๆ 2 วินาที
        const spawnInterval = setInterval(() => {
            if (Math.random() > 0.3) { // โอกาสเกิด 70%
                spawnPokemon();
            }
        }, 2000);

        return () => clearInterval(spawnInterval);
    }, [encounters]);

    return (
        <>
            {activePokemons.map(p => (
                <WalkingPokemonIcon key={p.id} poke={p} onRemove={handleRemove} onClick={onPokemonClick} />
            ))}
        </>
    );
};
