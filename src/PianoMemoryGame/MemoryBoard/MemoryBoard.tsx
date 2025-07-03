import type { tChordWithName } from "../../PianoBase/PianoBase.types";
import "./MemoryBoard.css";

export type GameCard = {
  id: string;
  chord: tChordWithName;
  color: string;
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
  gameMode,
  showNotes = true,
}: tMemoryBoardProps) {
  if (gameMode) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '20px' }}>
        {gameMode.gameCards.map((card, index) => {
          const isFlipped = gameMode.flippedCards.includes(index) || card.isMatched;
          
          // Usa el color pre-calculado. Si no está volteada, el CSS se encarga del fondo.
          const cardColor = card.color;

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
              style={{ '--card-background': cardColor } as React.CSSProperties}
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