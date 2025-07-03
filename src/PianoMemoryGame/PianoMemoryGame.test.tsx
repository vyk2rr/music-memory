/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import PianoMemoryGame from './PianoMemoryGame';
import * as MemoryBoardUtils from './MemoryBoard/MemoryBoard.utils';
import type { tChordWithName } from '../PianoBase/PianoBase.types';

// Mock de los componentes hijos para aislar el componente PianoMemoryGame
jest.mock('../PianoBase/PianoBase', () => {
  return jest.fn(({ highlightOnThePiano }) => (
    <div data-testid="piano-base">
      {highlightOnThePiano && highlightOnThePiano.length > 0 && (
        <div data-testid="highlighted-chord">{highlightOnThePiano.join(',')}</div>
      )}
    </div>
  ));
});

jest.mock('./MemoryBoard/MemoryBoard', () => {
  return jest.fn(({ gameMode, showNotes }) => (
    <div data-testid="memory-board">
      {gameMode.gameCards.map((card: any, index: number) => {
        const isFlipped = card.isFlipped || card.isMatched || gameMode.flippedCards.includes(index);
        return (
          <button
            key={card.id}
            data-testid={`card-${card.id}`}
            onClick={() => gameMode.onCardClick(index)}
            className={
              `chord-button` +
              (isFlipped ? ' flipped' : '') +
              (card.isMatched ? ' matched' : '')
            }
            aria-label={`Card ${index} ${isFlipped ? 'flipped' : 'unflipped'}`}
          >
            <span className="flip-inner">
              <span className="flip-front">?</span>
              <span className="flip-back">
                {isFlipped && (
                  <>
                    {card.chord.name}
                    {showNotes && <div className="chord-notes">{card.chord.displayNotes}</div>}
                  </>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  ));
});

// Mock de la función que genera los acordes para tener un set de datos predecible
jest.mock('./MemoryBoard/MemoryBoard.utils');
const mockedGenerateChords = MemoryBoardUtils.generateChordsForNote as jest.Mock;

// Usar timers falsos para controlar los setTimeout en el juego
jest.useFakeTimers();

describe('PianoMemoryGame', () => {
  const mockChords: tChordWithName[] = [
    { id: 'C4_maj', name: 'Cmaj', chord: ['C4', 'E4', 'G4'], displayNotes: 'C E G', quality: 'maj', rootNote: 'C' },
    { id: 'D4_min', name: 'Dmin', chord: ['D4', 'F4', 'A4'], displayNotes: 'D F A', quality: 'min', rootNote: 'D' },
    { id: 'E4_maj', name: 'Emaj', chord: ['E4', 'G#4', 'B4'], displayNotes: 'E G# B', quality: 'maj', rootNote: 'E' },
    { id: 'F4_maj', name: 'Fmaj', chord: ['F4', 'A4', 'C5'], displayNotes: 'F A C', quality: 'maj', rootNote: 'F' },
    { id: 'G4_maj', name: 'Gmaj', chord: ['G4', 'B4', 'D5'], displayNotes: 'G B D', quality: 'maj', rootNote: 'G' },
  ];

  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock Math.random para hacer el barajado de cartas predecible
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.1);

    // Mock inteligente: devuelve nuestro set de acordes solo para la nota 'C'
    mockedGenerateChords.mockImplementation((note) => {
      if (note === 'C') {
        return mockChords;
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    randomSpy.mockRestore();
  });

  it('debería inicializar y renderizar el juego correctamente', () => {
    render(<PianoMemoryGame />);
    expect(screen.getByText('Memory Game - Acordes de Piano')).toBeInTheDocument();
    expect(screen.getByText('Intentos: 0')).toBeInTheDocument();

    // Verificar que las 10 cartas están boca abajo
    const cardButtons = screen.getAllByRole('button').filter(btn =>
      btn.getAttribute('data-testid')?.startsWith('card-')
    );
    expect(cardButtons.length).toBe(10);
  });

  it('debería manejar una coincidencia correcta entre dos cartas', async () => {
    render(<PianoMemoryGame />);
    fireEvent.click(screen.getByTestId('card-C4_maj_1'));
    fireEvent.click(screen.getByTestId('card-C4_maj_2'));

    expect(screen.getByText('Intentos: 1')).toBeInTheDocument();

    act(() => { jest.runAllTimers(); });

    // Verificamos que las cartas emparejadas siguen mostrando su nombre
    expect(screen.getAllByText('Cmaj').length).toBe(2);
  });

  it('debería manejar una coincidencia incorrecta y voltear las cartas de nuevo', async () => {
    render(<PianoMemoryGame />);
    fireEvent.click(screen.getByTestId('card-C4_maj_1'));
    fireEvent.click(screen.getByTestId('card-D4_min_1'));

    expect(screen.getByText('Intentos: 1')).toBeInTheDocument();

    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(screen.queryByTestId('highlighted-chord')).not.toBeInTheDocument();
      expect(screen.queryAllByText('Cmaj')).toHaveLength(0);
      expect(screen.queryAllByText('Dmin')).toHaveLength(0);
    });
  });

  it('debería mostrar el mensaje de victoria cuando todas las cartas coinciden', async () => {
    render(<PianoMemoryGame />);

    // Emparejar todas las cartas de forma predecible (pares consecutivos)
    const ids = [
      'C4_maj_1', 'C4_maj_2',
      'D4_min_1', 'D4_min_2',
      'E4_maj_1', 'E4_maj_2',
      'F4_maj_1', 'F4_maj_2',
      'G4_maj_1', 'G4_maj_2'
    ];
    for (let i = 0; i < ids.length; i += 2) {
      fireEvent.click(screen.getByTestId(`card-${ids[i]}`));
      fireEvent.click(screen.getByTestId(`card-${ids[i + 1]}`));
      act(() => { jest.runAllTimers(); });
    }

    await waitFor(() => {
      expect(screen.getByText(/¡Felicidades!/)).toBeInTheDocument();
    });
  });

  it('debería reiniciar el juego al hacer clic en "Nuevo Juego"', () => {
    render(<PianoMemoryGame />);
    fireEvent.click(screen.getByTestId('card-C4_maj_1'));

    const newGameButton = screen.getByRole('button', { name: /Nuevo Juego/i });
    fireEvent.click(newGameButton);

    expect(screen.getByText('Intentos: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('highlighted-chord')).not.toBeInTheDocument();
    expect(mockedGenerateChords).toHaveBeenCalledTimes(14);
  });

  it('debería tener la clase "flipped" en la carta correcta después de hacer clic', () => {
    render(<PianoMemoryGame />);

    // Busca los botones por data-testid y verifica la clase
    const card1 = screen.getByTestId('card-C4_maj_1');
    const card2 = screen.getByTestId('card-C4_maj_2');
    fireEvent.click(card1);

    expect(card1.className).toContain("flipped");
    expect(card2.className).not.toContain("flipped");
  });
});