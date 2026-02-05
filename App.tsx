

import React, { useState } from 'react';
import { MainMenu } from './components/screens/MainMenu';
import { GameScreen } from './components/screens/GameScreen';
import { DiagnosticScreen } from './components/screens/DiagnosticScreen';
import { DashboardScreen } from './components/screens/DashboardScreen'; // Added
import { GameState, GameMode } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<GameState>(GameState.MENU);
  const [selectedSurah, setSelectedSurah] = useState<string>("");
  const [verseRange, setVerseRange] = useState<{start: number, end?: number}>({start: 1});
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('CLASSIC');
  const [gameConfig, setGameConfig] = useState<any>({});
  
  // State for passing deep link props to Menu
  const [menuInitialState, setMenuInitialState] = useState<{
    step: 'SELECT_MODE',
    surah: string,
    range: { start: number, end?: number }
  } | undefined>(undefined);

  const handleStartGame = (surah: string, startVerse: number = 1, endVerse?: number, mode: GameMode = 'CLASSIC', config?: any) => {
    setSelectedSurah(surah);
    setVerseRange({
        start: startVerse,
        end: endVerse
    });
    setSelectedGameMode(mode);
    setGameConfig(config || {});
    setAppState(GameState.PLAYING);
  };

  const handleStartDiagnostic = (surah: string) => {
    setSelectedSurah(surah);
    setAppState(GameState.DIAGNOSTIC);
  };

  const handleDiagnosticComplete = (surah: string, startVerse: number, endVerse?: number) => {
    // Instead of forcing CLASSIC, we go back to MENU but in SELECT_MODE state
    // with the specific range derived from diagnosis.
    setMenuInitialState({
        step: 'SELECT_MODE',
        surah: surah,
        range: { start: startVerse, end: endVerse }
    });
    setAppState(GameState.MENU);
  };

  const handleOpenDashboard = () => {
    setAppState(GameState.DASHBOARD);
  };

  const handleExit = () => {
    setAppState(GameState.MENU);
    setMenuInitialState(undefined); // Reset deep link
    setSelectedSurah("");
    setGameConfig({});
  };

  return (
    <div className="antialiased font-sans text-white">
      {appState === GameState.MENU && (
          <MainMenu 
            onStartGame={handleStartGame} 
            onStartDiagnostic={handleStartDiagnostic}
            onOpenDashboard={handleOpenDashboard}
            initialState={menuInitialState}
          />
      )}

      {appState === GameState.DASHBOARD && (
          <DashboardScreen 
            onBack={handleExit}
          />
      )}
      
      {appState === GameState.DIAGNOSTIC && (
          <DiagnosticScreen 
            targetSurah={selectedSurah}
            onDiagnosticComplete={handleDiagnosticComplete}
            onBack={handleExit}
          />
      )}

      {appState === GameState.PLAYING && (
          <GameScreen 
            surahName={selectedSurah} 
            initialVerse={verseRange.start}
            endVerse={verseRange.end}
            gameMode={selectedGameMode}
            config={gameConfig}
            onExit={handleExit} 
          />
      )}
    </div>
  );
};

export default App;
