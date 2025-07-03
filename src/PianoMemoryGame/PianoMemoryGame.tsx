import { useState, useEffect, useCallback, useRef } from "react";
import PianoBase from "../PianoBase/PianoBase";
import MemoryBoard, { type GameCard } from "./MemoryBoard/MemoryBoard";
import type { tChord, tChordWithName } from "../PianoBase/PianoBase.types";
import { generateChordsForNote, getChordColor, simplifyNoteName } from "./MemoryBoard/MemoryBoard.utils";
import "./PianoMemoryGame.css";
import * as Tone from "tone";

const DEFAULT_CHORD_COUNT = 15;

export default function PianoMemoryGame() {
  const [currentChord, setCurrentChord] = useState<tChord>([]);
  const [currentColor, setCurrentColor] = useState<string>("");
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<number>(0);
  const [gameWon, setGameWon] = useState<boolean>(false);

  const synthRef = useRef<any>(null);
  const reverbRef = useRef<any>(null);

  // Inicializar el juego
  useEffect(() => {
    initializeGame();
  }, []);

  // Limpiar los recursos de Tone.js al desmontar el componente
  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      reverbRef.current?.dispose();
    };
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
      // Calcular el color una sola vez por par de acordes
      const baseNoteForColor = simplifyNoteName(chord.chord[0]);
      const cardColor = getChordColor(
        baseNoteForColor,
        chord.quality,
        chord.chord
      );

      // Primera carta del par
      cards.push({
        id: `${chord.id}_1`,
        chord,
        color: cardColor,
        isFlipped: false,
        isMatched: false
      });
      // Segunda carta del par
      cards.push({
        id: `${chord.id}_2`,
        chord,
        color: cardColor,
        isFlipped: false,
        isMatched: false
      });
    });

    // Mezclar las cartas y reiniciar el estado del juego
    const shuffledCards = cards.sort(() => Math.random() - 0.5);
    setGameCards(shuffledCards);
    setFlippedCards([]);
    setAttempts(0);
    setGameWon(false);
    setCurrentChord([]);
    setCurrentColor("");
  };

  const canFlipCard = (cardIndex: number): boolean => {
    const card = gameCards[cardIndex];
    // No se puede voltear si ya hay 2 cartas, o si la carta actual ya está emparejada o volteada.
    if (flippedCards.length >= 2 || card.isMatched || flippedCards.includes(cardIndex)) {
      return false;
    }
    return true;
  };

  const handleCardClick = (cardIndex: number) => {
    const card = gameCards[cardIndex];

    setCurrentChord([]);

    // Asegurarse de que el cambio de acorde ocurra después de un renderizado
    // por si se da click rápido en varias cartas.
    setTimeout(() => {
      setCurrentChord(card.chord.chord);
    }, 0);

    if (!canFlipCard(cardIndex)) {
      return;
    }

    // Continúa con la lógica normal del juego (voltear, verificar, etc.).
    const newFlippedCards = [...flippedCards, cardIndex];
    setFlippedCards(newFlippedCards);

    // Establecer el color de fondo
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

  const createDelicateSynth = useCallback(() => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.15,
        decay: 0.2,
        sustain: 0.2,
        release: 1.8
      }
    });
    const reverb = new Tone.Reverb({
      decay: 2.5,
      preDelay: 0.01,
      wet: 0.4
    }).toDestination();
    synth.connect(reverb);

    synthRef.current = synth;
    reverbRef.current = reverb;

    return synth;
  }, []);

  return (
    <>
      <div 
        className="piano-container" 
        style={{ '--piano-background': currentColor } as React.CSSProperties}
      >
        <PianoBase
          highlightOnThePiano={currentChord}
          createSynth={createDelicateSynth}
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