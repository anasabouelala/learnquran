
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Zap, Sparkles, Skull, Crosshair, Bomb, Star } from 'lucide-react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
    surahName: string;
    question: Question;
    onGameEnd: (victory: boolean) => void;
}

// --- ENTITY TYPES ---
interface Enemy {
    id: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    hp: number;
    maxHp: number;
    speed: number;
    type: 'BASIC' | 'FAST' | 'TANK' | 'ELITE';
    frozen?: number; // timestamp until frozen
}

interface Projectile {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    targetId?: string; // Homing logic
    color: string;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface CombatText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

export const HifzSurvivorGame: React.FC<Props> = ({ surahName, question, onGameEnd }) => {
    // --- UI STATE ---
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('START');
    const [hp, setHp] = useState(100);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [ultimateCharge, setUltimateCharge] = useState(0);

    // --- LOGIC REFS (Source of Truth) ---
    const gameStateRef = useRef<'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('START');
    const hpRef = useRef(100);
    const xpRef = useRef(0);
    const levelRef = useRef(1);
    const scoreRef = useRef(0);
    const ultRef = useRef(0);

    // Entities
    const enemiesRef = useRef<Enemy[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const combatTextRef = useRef<CombatText[]>([]);

    // Timing
    const lastTimeRef = useRef<number>(0);
    const reqRef = useRef<number>(0);
    const nextSpawnRef = useRef<number>(0);
    const damageCooldownRef = useRef<number>(0);

    // Word Progress
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState<string>(""); // Current target word
    const [options, setOptions] = useState<string[]>([]);
    const targetWordsRef = useRef<string[]>([]);

    // Visuals
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [shake, setShake] = useState(false);

    // Constants
    const PLAYER_POS = { x: 50, y: 50 };
    const PLAYER_SIZE = 6;

    // --- INIT ---
    // --- INIT ---
    useEffect(() => {
        if (question.surferData?.words && question.surferData.words.length > 0) {
            targetWordsRef.current = question.surferData.words;

            // AUTO-START NEXT WAVE
            if (hpRef.current > 0 && gameStateRef.current !== 'START') {
                console.log("🌊 STARTING NEXT WAVE");

                // Reset to first word
                setCurrentWordIndex(0);
                setCurrentWord(question.surferData.words[0]); // This triggers option generation

                // Heal / Bonus
                hpRef.current = Math.min(100, hpRef.current + 15);
                setHp(hpRef.current);

                // Force State to PLAYING
                gameStateRef.current = 'PLAYING';
                setGameState('PLAYING');

                // Restart Loop if stopped
                if (!reqRef.current) {
                    lastTimeRef.current = performance.now();
                    reqRef.current = requestAnimationFrame(gameLoop);
                }

                // Visual Feedback
                combatTextRef.current.push({
                    id: `wave-${Date.now()}`,
                    x: 50, y: 30,
                    text: "WAVE CLEARED!",
                    color: "#4ade80",
                    life: 2.5
                });
            } else {
                // First load - set first word
                setCurrentWord(question.surferData.words[0]);
            }
        }
    }, [question]);

    // Cleanup Loop on Unmount
    useEffect(() => {
        return () => cancelAnimationFrame(reqRef.current);
    }, []);

    // Auto-generate options when current word changes
    useEffect(() => {
        if (!currentWord || !question.surferData) return;

        console.log("🎯 Generating options for word:", currentWord);

        let distractors: string[] = [];

        // 1. Try to find specific challenges (Best for grammar/context match)
        if (question.surferData.wordChallenges) {
            const challenge = question.surferData.wordChallenges.find(c => c.word === currentWord);
            if (challenge && challenge.distractors.length >= 2) {
                console.log(`⚔️ Playing Challenge for "${currentWord}":`, challenge.distractors);
                distractors = [...challenge.distractors].sort(() => Math.random() - 0.5).slice(0, 2);
            }
        }

        // 2. Fallback to general pool (Legacy/Backup)
        if (distractors.length < 2 && question.surferData.distractors) {
            const pool = question.surferData.distractors.filter(d => d !== currentWord);
            distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
        }

        // 3. Final Options (Correct Answer + 2 Wrong)
        const newOptions = [currentWord, ...distractors].sort(() => Math.random() - 0.5);

        console.log("🔘 New options:", newOptions);
        setOptions(newOptions);
    }, [currentWord, question]);

    const startGame = () => {
        // Reset Logic Refs
        gameStateRef.current = 'PLAYING';
        hpRef.current = 100;
        xpRef.current = 0;
        levelRef.current = 1;
        scoreRef.current = 0;
        ultRef.current = 0;

        // Reset Entities
        enemiesRef.current = [];
        projectilesRef.current = [];
        particlesRef.current = [];
        combatTextRef.current = [];

        // Reset UI State
        setGameState('PLAYING');
        setHp(100);
        setXp(0);
        setLevel(1);
        setScore(0);
        setUltimateCharge(0);
        setCurrentWordIndex(0);

        // Set first word (triggers option generation)
        if (targetWordsRef.current.length > 0) {
            setCurrentWord(targetWordsRef.current[0]);
        }

        // Initial Spawn
        spawnEnemy();
        spawnEnemy();

        lastTimeRef.current = performance.now();
        nextSpawnRef.current = lastTimeRef.current + 500;
        reqRef.current = requestAnimationFrame(gameLoop);
    };

    // --- GAME LOOP ---
    const gameLoop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        if (gameStateRef.current === 'PLAYING') {
            updatePhysics(delta, time);
            setRenderTrigger(prev => prev + 1); // Force render for canvas-like updates
            reqRef.current = requestAnimationFrame(gameLoop);
        }
    };

    const updatePhysics = (delta: number, time: number) => {
        // 1. Spawning Logic
        if (time > nextSpawnRef.current) {
            spawnEnemy();
            // Ramp difficulty: Spawn faster as level increases
            const spawnRate = Math.max(300, 1500 - (levelRef.current * 100));
            nextSpawnRef.current = time + spawnRate;
        }

        // 2. Projectiles
        const activeProjectiles: Projectile[] = [];
        projectilesRef.current.forEach(proj => {
            let newX = proj.x;
            let newY = proj.y;

            // Homing
            if (proj.targetId) {
                const target = enemiesRef.current.find(e => e.id === proj.targetId);
                if (target) {
                    const dx = target.x - proj.x;
                    const dy = target.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const speed = 70;
                    newX += (dx / dist) * speed * delta;
                    newY += (dy / dist) * speed * delta;
                } else {
                    newX += proj.vx * delta;
                    newY += proj.vy * delta;
                }
            } else {
                newX += proj.vx * delta;
                newY += proj.vy * delta;
            }

            proj.x = newX;
            proj.y = newY;

            let hit = false;
            for (const enemy of enemiesRef.current) {
                const dist = Math.sqrt(Math.pow(enemy.x - proj.x, 2) + Math.pow(enemy.y - proj.y, 2));
                if (dist < 5) { // Hit radius
                    damageEnemy(enemy, proj.damage);
                    createImpactEffect(enemy.x, enemy.y, proj.color);
                    hit = true;
                    break;
                }
            }

            // Cleanup out of bounds
            if (!hit && newX > -10 && newX < 110 && newY > -10 && newY < 110) {
                activeProjectiles.push(proj);
            }
        });
        projectilesRef.current = activeProjectiles;

        // 3. Enemies
        const activeEnemies: Enemy[] = [];
        let takingDamage = false;

        enemiesRef.current.forEach(enemy => {
            if (enemy.frozen && time < enemy.frozen) {
                activeEnemies.push(enemy);
                return;
            }

            const dx = PLAYER_POS.x - enemy.x;
            const dy = PLAYER_POS.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > (PLAYER_SIZE / 2 + 2)) {
                const vx = (dx / dist) * enemy.speed * delta;
                const vy = (dy / dist) * enemy.speed * delta;
                enemy.x += vx;
                enemy.y += vy;
            } else {
                takingDamage = true;
            }

            // Aura Passive Damage (Small constant ticks)
            if (dist < 15) {
                if (Math.random() < 0.05) {
                    damageEnemy(enemy, 0.2); // Chip damage
                    if (Math.random() > 0.5) createImpactEffect(enemy.x, enemy.y, "#06b6d4", 1);
                }
            }

            if (enemy.hp > 0) {
                activeEnemies.push(enemy);
            } else {
                handleEnemyDeath(enemy);
            }
        });
        enemiesRef.current = activeEnemies;

        // 4. Player Damage
        if (takingDamage) {
            if (time > damageCooldownRef.current) {
                const dmg = 10;
                hpRef.current = Math.max(0, hpRef.current - dmg);
                setHp(hpRef.current);
                damageCooldownRef.current = time + 500;
                triggerShake();
                if (hpRef.current <= 0) handleGameOver();
            }
        }

        // 5. Cleanup particles
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= delta;
            return p.life > 0;
        });
        combatTextRef.current = combatTextRef.current.filter(t => {
            t.y -= 10 * delta;
            t.life -= delta;
            return t.life > 0;
        });
    };

    const spawnEnemy = () => {
        const side = Math.floor(Math.random() * 4);
        let startX = 50, startY = 50;
        const offset = 5;

        switch (side) {
            case 0: startX = Math.random() * 100; startY = -offset; break;
            case 1: startX = 100 + offset; startY = Math.random() * 100; break;
            case 2: startX = Math.random() * 100; startY = 100 + offset; break;
            case 3: startX = -offset; startY = Math.random() * 100; break;
        }

        // Difficulty Logic
        const level = levelRef.current;
        const roll = Math.random();

        let type: Enemy['type'] = 'BASIC';
        let speed = 8 + (level * 0.5);
        let hp = 1; // Default 1-hit kill

        if (level >= 2 && roll > 0.7) {
            type = 'FAST';
            speed *= 1.4;
            hp = 1; // Fast but weak
        }

        if (level >= 3 && roll > 0.85) {
            type = 'ELITE'; // 2 hits
            speed *= 0.8;
            hp = 2;
        }

        if (level >= 5 && roll > 0.95) {
            type = 'TANK'; // 3+ hits
            speed *= 0.5;
            hp = 3 + Math.floor((level - 5) / 2);
        }

        enemiesRef.current.push({
            id: Math.random().toString(),
            x: startX,
            y: startY,
            hp,
            maxHp: hp,
            speed,
            type
        });
    };

    const damageEnemy = (enemy: Enemy, amount: number) => {
        const prevHp = Math.ceil(enemy.hp);
        enemy.hp -= amount;
        const currentHp = Math.ceil(enemy.hp);

        // Visual feedback only on integer threshold crosses or big hits
        if (currentHp < prevHp || amount >= 1) {
            combatTextRef.current.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y,
                text: amount >= 1 ? `-${Math.floor(amount)}` : '',
                color: '#fff',
                life: 0.5
            });
        }
    };

    const handleEnemyDeath = (enemy: Enemy) => {
        // Particles
        for (let i = 0; i < 6; i++) {
            particlesRef.current.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                life: 0.5,
                color: enemy.type === 'TANK' ? '#a855f7' : '#ef4444',
                size: Math.random() * 3 + 2
            });
        }

        let xpGain = 10;
        if (enemy.type === 'ELITE') xpGain = 20;
        if (enemy.type === 'TANK') xpGain = 50;

        xpRef.current += xpGain;
        scoreRef.current += xpGain;

        // Level Up
        if (xpRef.current >= 100) {
            xpRef.current -= 100;
            levelRef.current += 1;
            hpRef.current = Math.min(100, hpRef.current + 20); // Heal

            // Knockback AOE
            enemiesRef.current.forEach(e => {
                const dx = e.x - PLAYER_POS.x;
                const dy = e.y - PLAYER_POS.y;
                e.x += dx * 0.8;
                e.y += dy * 0.8;
            });

            combatTextRef.current.push({
                id: "lvlup", x: 50, y: 40, text: "LEVEL UP!", color: "#fbbf24", life: 1.5
            });
        }

        ultRef.current = Math.min(100, ultRef.current + 5);

        // Sync UI
        setXp(xpRef.current);
        setLevel(levelRef.current);
        setScore(scoreRef.current);
        setHp(hpRef.current);
        setUltimateCharge(ultRef.current);
    };

    // --- ACTIONS ---
    const handleOptionClick = (word: string) => {
        if (word === currentWord) {

            // Fire projectiles
            const count = 3 + Math.floor(levelRef.current / 3);
            for (let i = 0; i < count; i++) {
                const sortedEnemies = [...enemiesRef.current].sort((a, b) => {
                    const da = Math.pow(a.x - 50, 2) + Math.pow(a.y - 50, 2);
                    const db = Math.pow(b.x - 50, 2) + Math.pow(b.y - 50, 2);
                    return da - db;
                });

                const target = sortedEnemies[i % sortedEnemies.length];

                projectilesRef.current.push({
                    id: Math.random().toString(),
                    x: PLAYER_POS.x,
                    y: PLAYER_POS.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    damage: 1,
                    targetId: target?.id,
                    color: '#67e8f9'
                });
            }

            ultRef.current = Math.min(100, ultRef.current + 10);
            setUltimateCharge(ultRef.current);

            // Advance to next word
            const nextIdx = currentWordIndex + 1;

            if (nextIdx >= targetWordsRef.current.length) {
                // Verse complete! Signal next verse load but keep game running
                // Don't stop the game - just clear options temporarily
                setOptions([]);
                setCurrentWord("");
                // Signal GameScreen to load next question
                // The game loop continues, enemies keep spawning
                setTimeout(() => onGameEnd(true), 100);
            } else {
                // Set next word (this triggers option regeneration)
                setCurrentWordIndex(nextIdx);
                setCurrentWord(targetWordsRef.current[nextIdx]);
            }

        } else {
            spawnEnemy();
            hpRef.current = Math.max(0, hpRef.current - 10);
            setHp(hpRef.current);
            triggerShake();
            if (hpRef.current <= 0) handleGameOver();
        }
    };

    const triggerUltimate = () => {
        if (ultRef.current < 100) return;
        ultRef.current = 0;
        setUltimateCharge(0);

        createImpactEffect(50, 50, "#fbbf24", 50);

        // Nuke Screen
        enemiesRef.current.forEach(e => {
            damageEnemy(e, 999);
            e.x += (e.x - 50) * 3;
            e.y += (e.y - 50) * 3;
            e.frozen = performance.now() + 2000;
        });
        triggerShake();
    };

    const createImpactEffect = (x: number, y: number, color: string, count = 5) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random().toString(),
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                life: 0.4,
                color: color,
                size: Math.random() * 3
            });
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 300);
    };

    const handleGameOver = () => {
        gameStateRef.current = 'GAME_OVER';
        setGameState('GAME_OVER');
        cancelAnimationFrame(reqRef.current);
        onGameEnd(false);
    };

    const handleVictory = () => {
        gameStateRef.current = 'VICTORY';
        setGameState('VICTORY');
        cancelAnimationFrame(reqRef.current);
        onGameEnd(true);
    };

    return (
        <div className={`fixed inset-0 bg-slate-950 overflow-hidden flex flex-col font-sans select-none touch-none ${shake ? 'animate-shake' : ''}`}>

            {/* --- HUD --- */}
            <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
                        <div className="w-48 h-4 bg-slate-800 rounded-full border border-slate-600 overflow-hidden">
                            <motion.div
                                className="h-full bg-red-500"
                                animate={{ width: `${hp}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        <div className="w-48 h-2 bg-slate-800 rounded-full border border-slate-600 overflow-hidden">
                            <motion.div
                                className="h-full bg-yellow-400"
                                animate={{ width: `${xp}%` }}
                            />
                        </div>
                        <span className="text-yellow-400 font-arcade text-xs">LVL {level}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-arcade-cyan font-arcade text-2xl drop-shadow-neon">{score}</div>
                    <div className="text-slate-500 text-xs font-arabic">{surahName}</div>
                    <div className="text-slate-600 text-[10px] mt-1">Word {currentWordIndex + 1}/{targetWordsRef.current.length}</div>
                </div>
            </div>

            {/* --- GAME FIELD --- */}
            <div className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>

                {/* PARTICLES */}
                {particlesRef.current.map(p => (
                    <div
                        key={p.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            opacity: p.life / 0.5,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                ))}

                {/* PROJECTILES */}
                {projectilesRef.current.map(p => (
                    <div
                        key={p.id}
                        className="absolute w-3 h-3 bg-arcade-cyan rounded-full shadow-[0_0_10px_cyan]"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="absolute inset-0 animate-ping bg-white rounded-full opacity-50"></div>
                    </div>
                ))}

                {/* PLAYER */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                    style={{ width: `${PLAYER_SIZE}%`, height: `${PLAYER_SIZE}%` }}
                >
                    <div className="absolute w-[300%] h-[300%] rounded-full border border-arcade-cyan/20 animate-[spin_4s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 w-3 h-3 bg-arcade-cyan/50 rounded-full shadow-[0_0_10px_cyan]"></div>
                        <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-arcade-cyan/50 rounded-full shadow-[0_0_10px_cyan]"></div>
                    </div>
                    <div className="relative w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-full border-2 border-white shadow-[0_0_20px_white] flex items-center justify-center z-20">
                        <Shield className="w-6 h-6 md:w-8 md:h-8 text-white fill-slate-900" />
                    </div>
                </div>

                {/* ENEMIES */}
                {enemiesRef.current.map(enemy => (
                    <div
                        key={enemy.id}
                        className="absolute z-10 flex flex-col items-center justify-center transition-transform will-change-transform"
                        style={{
                            left: `${enemy.x}%`,
                            top: `${enemy.y}%`,
                            transform: `translate(-50%, -50%) scale(${enemy.frozen ? 1.1 : 1})`
                        }}
                    >
                        <div className={`
                        rounded-full shadow-lg flex items-center justify-center relative transition-colors duration-200
                        ${enemy.type === 'FAST' ? 'bg-orange-500 w-6 h-6' : ''}
                        ${enemy.type === 'BASIC' ? 'bg-red-600 w-8 h-8' : ''}
                        ${enemy.type === 'ELITE' ? 'bg-blue-600 w-10 h-10 border-2 border-blue-400' : ''}
                        ${enemy.type === 'TANK' ? 'bg-purple-700 w-12 h-12 border-4 border-purple-900' : ''}
                    `}>
                            <Skull className="w-1/2 h-1/2 text-black/50" />

                            {/* HP Bar/Pips for tougher enemies */}
                            {enemy.maxHp > 1 && (
                                <div className="absolute -top-3 flex gap-0.5">
                                    {[...Array(Math.ceil(enemy.hp))].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm border border-black/20" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* COMBAT TEXT */}
                {combatTextRef.current.map(t => (
                    <div
                        key={t.id}
                        className="absolute font-arcade text-lg font-bold pointer-events-none whitespace-nowrap z-50"
                        style={{
                            left: `${t.x}%`,
                            top: `${t.y}%`,
                            color: t.color,
                            opacity: t.life,
                            transform: 'translate(-50%, -50%)',
                            textShadow: '2px 2px 0 #000'
                        }}
                    >
                        {t.text}
                    </div>
                ))}
            </div>

            {/* --- ULTIMATE BUTTON --- */}
            <div className="absolute bottom-32 right-4 z-50">
                <button
                    onClick={triggerUltimate}
                    disabled={ultimateCharge < 100}
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300
                    ${ultimateCharge >= 100
                            ? 'bg-yellow-500 border-yellow-200 shadow-[0_0_40px_rgba(234,179,8,0.8)] animate-pulse scale-110 cursor-pointer'
                            : 'bg-slate-800 border-slate-600 grayscale opacity-50 cursor-not-allowed'}
                `}
                >
                    <Bomb className={`w-10 h-10 ${ultimateCharge >= 100 ? 'text-white' : 'text-slate-400'}`} />
                    <div className="absolute -bottom-6 text-xs font-arcade text-white whitespace-nowrap">SAKINA BLAST</div>
                </button>
            </div>

            {/* --- CONTROLS --- */}
            {gameState === 'PLAYING' && (
                <div className="absolute bottom-0 w-full p-4 pb-8 z-50 bg-gradient-to-t from-slate-950 to-transparent">
                    <div className="flex justify-center gap-4 max-w-4xl mx-auto">
                        {options.map((opt, i) => (
                            <ArcadeButton
                                key={`${opt}-${currentWord}`}
                                variant="secondary"
                                onClick={() => handleOptionClick(opt)}
                                className="flex-1 text-lg md:text-2xl font-arabic py-6 shadow-lg border-b-8 active:border-b-0 active:translate-y-2 group relative overflow-hidden"
                            >
                                <span className="relative z-10">{opt}</span>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                <Crosshair className="absolute top-2 right-2 w-4 h-4 opacity-20" />
                            </ArcadeButton>
                        ))}
                    </div>
                </div>
            )}

            {/* --- START OVERLAY --- */}
            {gameState === 'START' && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-red-900/30 border-4 border-red-500 flex items-center justify-center mb-6 animate-pulse">
                        <Skull className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-5xl font-arcade text-white mb-2 text-red-500 drop-shadow-[0_0_10px_red]">SURVIVOR</h1>
                    <h2 className="text-xl font-arabic text-slate-400 mb-8">
                        دافع عن قلبك بالقرآن<br />
                        <span className="text-sm text-arcade-cyan mt-2 block">أجب صحيحاً لإطلاق النور</span>
                    </h2>
                    <ArcadeButton onClick={startGame} size="lg" variant="danger" className="animate-bounce-short">
                        ابدأ المعركة
                    </ArcadeButton>
                </div>
            )}
        </div>
    );
};
