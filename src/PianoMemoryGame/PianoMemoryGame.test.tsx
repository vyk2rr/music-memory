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
  return jest.fn(({ gameMode }) => (
    <div data-testid="memory-board">
      {gameMode.gameCards.map((card: any, index: number) => {
        const isFlipped = card.isFlipped || card.isMatched || gameMode.flippedCards.includes(index);
        return (
          <button
            key={card.id}
            data-testid={`card-${index}`}
            onClick={() => gameMode.onCardClick(index)}
          >
            {isFlipped ? card.chord.name : '?'}
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
    // y un array vacío para las demás. Así controlamos el pool de acordes.
    mockedGenerateChords.mockImplementation((note) => {
      if (note === 'C') {
        return mockChords;
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    randomSpy.mockRestore(); // Restaurar el mock de Math.random
  });

  it('debería inicializar y renderizar el juego correctamente', () => {
    render(<PianoMemoryGame />);
    expect(screen.getByText('Memory Game - Acordes de Piano')).toBeInTheDocument();
    expect(screen.getByText('Intentos: 0')).toBeInTheDocument();
    
    // Verificar que las 10 cartas están boca abajo
    const cardButtons = screen.getAllByRole('button', { name: '?' });
    expect(cardButtons.length).toBe(10);
  });

  it('debería manejar una coincidencia correcta entre dos cartas', async () => {
    render(<PianoMemoryGame />);
    // Con Math.random mockeado, las dos primeras cartas son un par.
    fireEvent.click(screen.getByTestId('card-0'));
    fireEvent.click(screen.getByTestId('card-1'));

    expect(screen.getByText('Intentos: 1')).toBeInTheDocument();
    
    act(() => { jest.runAllTimers(); });

    // // Esperamos a que el resaltado del piano desaparezca
    // await waitFor(() => {
    //   expect(screen.queryByTestId('highlighted-chord')).not.toBeInTheDocument();
    // });

    // Verificamos por separado que las cartas emparejadas siguen mostrando su nombre
    expect(screen.getAllByText('Cmaj').length).toBe(2);
  });

  it('debería manejar una coincidencia incorrecta y voltear las cartas de nuevo', async () => {
    render(<PianoMemoryGame />);
    // Con el mock, la carta 0 (Cmaj) y la 2 (Dmin) no son un par.
    fireEvent.click(screen.getByTestId('card-0'));
    fireEvent.click(screen.getByTestId('card-2'));

    expect(screen.getByText('Intentos: 1')).toBeInTheDocument();
    
    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(screen.queryByTestId('highlighted-chord')).not.toBeInTheDocument();
      // Las cartas deben volver a estar boca abajo, por lo que su texto no debe encontrarse.
      expect(screen.queryByText('Cmaj')).not.toBeInTheDocument();
      expect(screen.queryByText('Dmin')).not.toBeInTheDocument();
    });
  });

  it('debería mostrar el mensaje de victoria cuando todas las cartas coinciden', async () => {
    render(<PianoMemoryGame />);

    // Emparejar todas las cartas de forma predecible (0 con 1, 2 con 3, etc.)
    for (let i = 0; i < 10; i += 2) {
      fireEvent.click(screen.getByTestId(`card-${i}`));
      fireEvent.click(screen.getByTestId(`card-${i + 1}`));
      act(() => { jest.runAllTimers(); });
    }

    await waitFor(() => {
      expect(screen.getByText(/¡Felicidades!/)).toBeInTheDocument();
    });
  });

  it('debería reiniciar el juego al hacer clic en "Nuevo Juego"', () => {
    render(<PianoMemoryGame />);
    fireEvent.click(screen.getByTestId('card-0'));

    const newGameButton = screen.getByRole('button', { name: /Nuevo Juego/i });
    fireEvent.click(newGameButton);

    expect(screen.getByText('Intentos: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('highlighted-chord')).not.toBeInTheDocument();
    // Se llama 7 veces en el render inicial y 7 al reiniciar.
    expect(mockedGenerateChords).toHaveBeenCalledTimes(14);
  });
});