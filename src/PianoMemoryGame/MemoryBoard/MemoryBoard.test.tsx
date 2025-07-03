/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent } from '@testing-library/react';
import MemoryBoard from './MemoryBoard';
import type { tChordWithName } from '../../PianoBase/PianoBase.types';

// Mock de datos para las pruebas (actualizado con la propiedad 'color')
const mockGameCards = [
  {
    id: 'C4_maj_1',
    chord: { id: 'C4_maj', name: 'Cmaj', chord: ['C4', 'E4', 'G4'], displayNotes: 'C E G', quality: 'maj', rootNote: 'C' } as tChordWithName,
    color: 'hsl(0, 70%, 50%)', // Añadido color de ejemplo
    isFlipped: true,
    isMatched: false,
  },
  {
    id: 'C4_maj_2',
    chord: { id: 'C4_maj', name: 'Cmaj', chord: ['C4', 'E4', 'G4'], displayNotes: 'C E G', quality: 'maj', rootNote: 'C' } as tChordWithName,
    color: 'hsl(0, 70%, 50%)', // Añadido color de ejemplo
    isFlipped: false,
    isMatched: false,
  },
];

describe('MemoryBoard', () => {
  it("adds the 'flipped' class when a card is flipped", () => {
    const gameMode = {
      gameCards: mockGameCards,
      onCardClick: jest.fn(),
      flippedCards: [0],
      attempts: 0,
      gameWon: false,
    };

    render(
      <MemoryBoard gameMode={gameMode} showNotes={true} />
    );

    const cardButton = screen.getByTestId("card-C4_maj_1");
    expect(cardButton.className).toContain("flipped");
    expect(cardButton.className).toContain("chord-button");
    
    const otherCard = screen.getByTestId("card-C4_maj_2");
    expect(otherCard.className).not.toContain("flipped");
  });

  it('calls onCardClick when a card is clicked', () => {
    const onCardClick = jest.fn();
    const gameMode = {
      gameCards: [mockGameCards[0]], // Solo una carta para simplificar
      onCardClick: onCardClick,
      flippedCards: [],
      attempts: 0,
      gameWon: false,
    };

    render(
      <MemoryBoard gameMode={gameMode} showNotes={true} />
    );

    const cardButton = screen.getByTestId("card-C4_maj_1");
    fireEvent.click(cardButton);
    expect(onCardClick).toHaveBeenCalledWith(0);
  });
});