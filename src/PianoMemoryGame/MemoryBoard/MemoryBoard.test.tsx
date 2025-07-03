import { render, screen, fireEvent } from "@testing-library/react";
import MemoryBoard from "./MemoryBoard";
import type { tChordWithName } from "../../PianoBase/PianoBase.types";

const mockChord: tChordWithName = {
  id: "C4_maj",
  name: "Cmaj",
  chord: ["C4", "E4", "G4"],
  displayNotes: "C E G",
  quality: "maj",
  rootNote: "C",
};

describe("MemoryBoard", () => {
  it("adds the 'flipped' class when a card is flipped", () => {
    const gameCards = [
      { id: "C4_maj_1", chord: mockChord, isFlipped: false, isMatched: false },
      { id: "C4_maj_2", chord: mockChord, isFlipped: false, isMatched: false },
    ];
    const flippedCards = [0];
    const onCardClick = jest.fn();

    render(
      <MemoryBoard
        gameMode={{
          gameCards,
          flippedCards,
          onCardClick,
        }}
        showNotes={true}
      />
    );

    const cardButton = screen.getByTestId("card-0");
    expect(cardButton.className).toContain("flipped");
    expect(cardButton.className).toContain("chord-button");
    // The other card should not be flipped
    expect(screen.getByTestId("card-1").className).not.toContain("flipped");
  });

  it("calls onCardClick when a card is clicked", () => {
    const gameCards = [
      { id: "C4_maj_1", chord: mockChord, isFlipped: false, isMatched: false },
    ];
    const flippedCards: number[] = [];
    const onCardClick = jest.fn();

    render(
      <MemoryBoard
        gameMode={{
          gameCards,
          flippedCards,
          onCardClick,
        }}
        showNotes={true}
      />
    );

    const cardButton = screen.getByTestId("card-0");
    fireEvent.click(cardButton);
    expect(onCardClick).toHaveBeenCalledWith(0);
  });
});