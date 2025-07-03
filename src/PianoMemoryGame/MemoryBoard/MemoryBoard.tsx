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
              className={
                `chord-button` +
                (isFlipped ? ' flipped' : '') +
                (card.isMatched ? ' matched' : '')
              }
              data-testid={`card-${card.id}`}
              style={isFlipped ? { background: cardColor } : undefined}
              aria-label={`Card ${index} ${isFlipped ? 'flipped' : 'unflipped'}`}
            >
              <span className="flip-inner">
                <span className="flip-front">?</span>
                <span className="flip-back">
                  {card.chord.name}
                  {showNotes && <div className="chord-notes">{card.chord.displayNotes}</div>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }
}