
import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import pokemonData from "../../data/pokemon.json";

export const WalkingNpc = ({ npc, currentLocation }) => {
    // กำหนดตำแหน่งเกิดแบบสุ่ม แต่ไม่ต้องอัปเดตให้เดิน
    const customPos = npc.mapPositions?.[currentLocation];
    const [pos] = useState({ 
        x: customPos?.x !== undefined ? customPos.x : 30 + Math.random() * 40,
        y: customPos?.y !== undefined ? customPos.y : 20 + Math.random() * 15,
        size: customPos?.size || 90,
        direction: Math.random() > 0.5 ? 1 : -1 
    });

    const imageUrl = `https://play.pokemonshowdown.com/sprites/trainers/${npc.id.toLowerCase().replace("gym_", "")}.png`;

    return (
        <Box 
            component="img"
            src={imageUrl}
            sx={{
                position: "absolute",
                bottom: `${pos.y}%`,
                left: `${pos.x}%`,
                transform: `translateX(-50%) scaleX(${pos.direction})`,
                width: `${pos.size}px`,
                height: `${pos.size}px`,
                imageRendering: "pixelated",
                zIndex: 5,
                opacity: 0.8
            }}
        />
    );
};

export const WalkingPokemonSpawner = ({ encounters }) => {
    const [activePokemons, setActivePokemons] = useState([]);

    useEffect(() => {
        if (!encounters || Object.keys(encounters).length === 0) return;

        const spawnPokemon = () => {
            const list = Array.isArray(encounters) ? encounters : Object.values(encounters || {}).flat(); 
            const speciesList = list.map(e => e.species);
            const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
            
            const pData = pokemonData[randomSpecies.toLowerCase()];
            const pokeId = pData ? pData.id : 1;
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${pokeId}.png`;

            const newPoke = {
                id: Math.random().toString(36).substr(2, 9),
                url: spriteUrl,
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 30,
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

    // หายไปตามอายุขัย (ไม่เดิน)
    useEffect(() => {
        if (activePokemons.length === 0) return;
        
        const lifespanInterval = setInterval(() => {
            setActivePokemons(prev => {
                if (prev.length === 0) return prev;
                // สุ่มตัวเก่าออก
                if (Math.random() > 0.4) {
                    return prev.slice(1);
                }
                return prev;
            });
        }, 3000); // เช็คทุก 3 วิ

        return () => clearInterval(lifespanInterval);
    }, [activePokemons]);

    return (
        <>
            {activePokemons.map(p => (
                <Box
                    key={p.id}
                    component="img"
                    src={p.url}
                    sx={{
                        position: "absolute",
                        bottom: `${p.y}%`,
                        left: `${p.x}%`,
                        transform: `translateX(-50%) scaleX(${p.direction})`,
                        width: "150px", // ขนาดโปเกม่อนใหญ่ขึ้น
                        height: "150px",
                        imageRendering: "pixelated",
                        zIndex: 4,
                        opacity: 0.9
                    }}
                />
            ))}
        </>
    );
};

