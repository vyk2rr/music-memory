import { useState, useEffect } from "react";
import PianoBase from "../PianoBase/PianoBase";
import MemoryBoard from "./MemoryBoard/MemoryBoard";
import type { tChord, tChordWithName } from "../PianoBase/PianoBase.types";
import { generateChordsForNote, getChordColor, simplifyNoteName } from "./MemoryBoard/MemoryBoard.utils";
import "./PianoMemoryGame.css";

const DEFAULT_CHORD_COUNT = 15;

type GameCard = {
  id: string;
  chord: tChordWithName;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function PianoMemoryGame() {
  const [currentChord, setCurrentChord] = useState<tChord>([]);
  const [currentColor, setCurrentColor] = useState<string>("");
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<number>(0);
  const [gameWon, setGameWon] = useState<boolean>(false);

  // Inicializar el juego
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Generar todos los acordes disponibles
    const allChords: tChordWithName[] = [];
    const notes: ('C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B')[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    notes.forEach(note => {
      allChords.push(...generateChordsForNote(note, 4));
    });

    // Filtrar solo acordes básicos (no inversiones) para simplificar
    const basicChords = allChords.filter(chord => !chord.id.includes('_inv'));

    // Seleccionar acordes aleatoriamente, sin exceder el total disponible
    const howMany = Math.min(basicChords.length, DEFAULT_CHORD_COUNT);
    const selectedChords = basicChords
      .sort(() => Math.random() - 0.5)
      .slice(0, howMany);

    // Crear pares de cartas
    const cards: GameCard[] = [];
    selectedChords.forEach((chord) => {
      // Primera carta del par
      cards.push({
        id: `${chord.id}_1`,
        chord,
        isFlipped: false,
        isMatched: false
      });
      // Segunda carta del par
      cards.push({
        id: `${chord.id}_2`,
        chord,
        isFlipped: false,
        isMatched: false
      });
    });

    // Mezclar las cartas
    const shuffledCards = cards.sort(() => Math.random() - 0.5);

    setGameCards(shuffledCards);
    setFlippedCards([]);
    setAttempts(0);
    setGameWon(false);
    setCurrentChord([]);
    setCurrentColor("");
  };

  const handleCardClick = (cardIndex: number) => {
    const card = gameCards[cardIndex];

    if (flippedCards.length === 2 || card.isFlipped || card.isMatched) {
      return; // No hacer nada si ya hay 2 cartas volteadas o la carta ya está volteada/emparejada
    }

    const newFlippedCards = [...flippedCards, cardIndex];
    setFlippedCards(newFlippedCards);

    // Mostrar el acorde en el piano y establecer el color de fondo
    setCurrentChord(card.chord.chord);
    
    const baseNoteForColor = simplifyNoteName(card.chord.chord[0]);
    const newColor = getChordColor(
      baseNoteForColor,
      card.chord.quality,
      card.chord.chord
    );
    setCurrentColor(newColor);

    // Si es la segunda carta volteada, verificar coincidencia
    if (newFlippedCards.length === 2) {
      setAttempts(prev => prev + 1);
      
      const firstCard = gameCards[newFlippedCards[0]];
      const secondCard = gameCards[newFlippedCards[1]];

      if (firstCard.chord.id === secondCard.chord.id) {
        // Coincidencia encontrada
        setTimeout(() => {
          setGameCards(prev => prev.map((card, index) => 
            newFlippedCards.includes(index) 
              ? { ...card, isMatched: true }
              : card
          ));
          setFlippedCards([]);
          
          // Verificar si el juego ha terminado
          const updatedCards = gameCards.map((card, index) => 
            newFlippedCards.includes(index) 
              ? { ...card, isMatched: true }
              : card
          );
          if (updatedCards.every(card => card.isMatched)) {
            setGameWon(true);
          }
        }, 500);
      } else {
        // No hay coincidencia, voltear de nuevo después de 1 segundo
        setTimeout(() => {
          setFlippedCards([]);
          setCurrentChord([]);
          setCurrentColor("");
        }, 1000);
      }
    }
  };

  return (
    <>
      <div className="piano-container" style={{ background: currentColor }}>
        <PianoBase
          highlightOnThePiano={currentChord}
        />
      </div>

      <div className="game-info">
        <h2>Memory Game - Acordes de Piano</h2>
        <p>Intentos: {attempts}</p>
        {gameWon && <p className="win-message">¡Felicidades! Has completado el juego.</p>}
        <button onClick={initializeGame} className="new-game-button">
          Nuevo Juego
        </button>
      </div>

      <MemoryBoard
        gameMode={{
          gameCards,
          flippedCards,
          onCardClick: handleCardClick
        }}
        showNotes={true}
      />
    </>
  );
}