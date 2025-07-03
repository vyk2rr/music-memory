import type { tChordWithName } from "../../PianoBase/PianoBase.types";
import { getChordColor, simplifyNoteName } from "./MemoryBoard.utils";
import "./MemoryBoard.css";

export type GameCard = {
  id: string;
  chord: tChordWithName;
  isFlipped: boolean;
  isMatched: boolean;
};

type GameMode = {
  gameCards: GameCard[];
  flippedCards: number[];
  onCardClick: (cardIndex: number) => void;
};

interface tMemoryBoardProps {
  gameMode?: GameMode; // Nuevo prop para el modo juego
  showNotes?: boolean;
}

export default function MemoryBoard({
  gameMode, // Nuevo prop para el modo juego
  showNotes = true,
}: tMemoryBoardProps) {
  if (gameMode) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '20px' }}>
        {gameMode.gameCards.map((card, index) => {
          const isFlipped = gameMode.flippedCards.includes(index) || card.isMatched;
          
          // Obtener el color del acorde cuando está volteada
          let cardColor = '#333'; // Color por defecto cuando está boca abajo
          if (isFlipped) {
            const baseNoteForColor = simplifyNoteName(card.chord.chord[0]);
            cardColor = getChordColor(
              baseNoteForColor,
              card.chord.quality,
              card.chord.chord
            );
          }
          
          return (
            <button
              key={card.id}
              onClick={() => gameMode.onCardClick(index)}
              style={{
                height: '80px',
                background: isFlipped ? cardColor : '#333',
                color: isFlipped ? '#fff' : '#333',
                border: '2px solid #666',
                borderRadius: '8px',
                cursor: card.isMatched ? 'default' : 'pointer',
                opacity: card.isMatched ? 0.7 : 1,
                fontWeight: 'bold',
                textShadow: isFlipped ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              {isFlipped ? card.chord.name : '?'}
              {showNotes ? <div className="chord-notes">{card.chord.displayNotes}</div> : ''}
            </button>
          );
        })}
      </div>
    );
  }
}