/**
 * Game Components Integration Tests
 * Tests game-related components with proper mocking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock NextUI components
const Button = ({ onClick, isDisabled, children, 'data-testid': testId, ...props }: any) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    data-testid={testId}
    {...props}
  >
    {children}
  </button>
);

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
}));

// Test Components
const GameButton = ({ onClick, children, disabled = false }: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <Button onClick={onClick} isDisabled={disabled} data-testid="game-button">
    {children}
  </Button>
);

const GameCard = ({ title, description, type }: {
  title: string;
  description: string;
  type: string;
}) => (
  <div data-testid="game-card" className="game-card">
    <h3>{title}</h3>
    <p>{description}</p>
    <span className="game-type">{type}</span>
  </div>
);

const GameList = ({ games, onGameSelect }: {
  games: Array<{id: string; title: string; description: string; type: string}>;
  onGameSelect: (id: string) => void;
}) => (
  <div data-testid="game-list">
    {games.map(game => (
      <div key={game.id} onClick={() => onGameSelect(game.id)}>
        <GameCard
          title={game.title}
          description={game.description}
          type={game.type}
        />
      </div>
    ))}
  </div>
);

describe('Game Components Integration', () => {
  describe('GameButton Component', () => {
    it('should render button with text', () => {
      render(<GameButton>Create Game</GameButton>);
      
      const button = screen.getByTestId('game-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Create Game');
    });

    it('should handle click events', async () => {
      const mockClick = jest.fn();
      render(<GameButton onClick={mockClick}>Click Me</GameButton>);
      
      const button = screen.getByTestId('game-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should be disabled when disabled prop is true', () => {
      render(<GameButton disabled>Disabled Button</GameButton>);
      
      const button = screen.getByTestId('game-button');
      expect(button).toBeDisabled();
    });
  });

  describe('GameCard Component', () => {
    const mockGame = {
      title: 'Test Game',
      description: 'A test game for testing',
      type: 'platformer',
    };

    it('should render game information', () => {
      render(<GameCard {...mockGame} />);
      
      expect(screen.getByText('Test Game')).toBeInTheDocument();
      expect(screen.getByText('A test game for testing')).toBeInTheDocument();
      expect(screen.getByText('platformer')).toBeInTheDocument();
    });

    it('should have proper structure', () => {
      render(<GameCard {...mockGame} />);
      
      const gameCard = screen.getByTestId('game-card');
      expect(gameCard).toHaveClass('game-card');
    });
  });

  describe('GameList Component', () => {
    const mockGames = [
      {
        id: '1',
        title: 'Platformer Game',
        description: 'A fun platformer',
        type: 'platformer',
      },
      {
        id: '2',
        title: 'Puzzle Game',
        description: 'A challenging puzzle',
        type: 'puzzle',
      },
    ];

    it('should render list of games', () => {
      const mockSelect = jest.fn();
      render(<GameList games={mockGames} onGameSelect={mockSelect} />);
      
      expect(screen.getByText('Platformer Game')).toBeInTheDocument();
      expect(screen.getByText('Puzzle Game')).toBeInTheDocument();
    });

    it('should handle game selection', async () => {
      const mockSelect = jest.fn();
      render(<GameList games={mockGames} onGameSelect={mockSelect} />);
      
      const firstGame = screen.getByText('Platformer Game').closest('div');
      if (firstGame) {
        fireEvent.click(firstGame);
        
        await waitFor(() => {
          expect(mockSelect).toHaveBeenCalledWith('1');
        });
      }
    });

    it('should render empty list when no games', () => {
      const mockSelect = jest.fn();
      render(<GameList games={[]} onGameSelect={mockSelect} />);
      
      const gameList = screen.getByTestId('game-list');
      expect(gameList).toBeInTheDocument();
      expect(gameList.children).toHaveLength(0);
    });
  });

  describe('Game Component Interactions', () => {
    it('should handle complex interaction flow', async () => {
      const mockGames = [
        {
          id: '1',
          title: 'Test Game',
          description: 'Test description',
          type: 'adventure',
        },
      ];

      const mockSelect = jest.fn();
      const mockCreate = jest.fn();

      render(
        <div>
          <GameButton onClick={mockCreate}>Create New Game</GameButton>
          <GameList games={mockGames} onGameSelect={mockSelect} />
        </div>
      );

      // Test create button
      const createButton = screen.getByText('Create New Game');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });

      // Test game selection
      const gameCard = screen.getByText('Test Game').closest('div');
      if (gameCard) {
        fireEvent.click(gameCard);
        
        await waitFor(() => {
          expect(mockSelect).toHaveBeenCalledWith('1');
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      // This should not crash
      render(<GameCard title="" description="" type="" />);
      
      const gameCard = screen.getByTestId('game-card');
      expect(gameCard).toBeInTheDocument();
    });

    it('should handle empty game list gracefully', () => {
      const mockSelect = jest.fn();
      render(<GameList games={[]} onGameSelect={mockSelect} />);
      
      const gameList = screen.getByTestId('game-list');
      expect(gameList).toBeInTheDocument();
    });
  });
});