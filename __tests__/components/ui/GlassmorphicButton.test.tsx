import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlassmorphicButton, GameGenButtonPresets } from '@/components/ui/GlassmorphicButton';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )),
  },
}));

// Mock HeroUI Button
jest.mock('@heroui/button', () => ({
  Button: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  )),
}));

describe('GlassmorphicButton', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<GlassmorphicButton>Click me</GlassmorphicButton>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('backdrop-blur-md');
    });

    it('renders with custom className', () => {
      render(
        <GlassmorphicButton className="custom-class">
          Test Button
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('renders children correctly', () => {
      render(
        <GlassmorphicButton>
          <span>Custom Content</span>
        </GlassmorphicButton>
      );
      
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('forwards props to Button component', () => {
      render(
        <GlassmorphicButton disabled data-testid="test-button">
          Disabled Button
        </GlassmorphicButton>
      );
      
      const button = screen.getByTestId('test-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('applies glass variant classes (default)', () => {
      render(<GlassmorphicButton variant="glass">Glass Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/30', 'dark:bg-black/30', 'backdrop-blur-md');
    });

    it('applies glass-filled variant classes', () => {
      render(<GlassmorphicButton variant="glass-filled">Filled Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/30', 'dark:bg-black/30', 'backdrop-saturate-150', 'border');
    });

    it('applies glass-bordered variant classes', () => {
      render(<GlassmorphicButton variant="glass-bordered">Bordered Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'border-2');
    });

    it('applies glass-ghost variant classes', () => {
      render(<GlassmorphicButton variant="glass-ghost">Ghost Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('applies gaming variant classes', () => {
      render(<GlassmorphicButton variant="gaming">Gaming Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-purple-500/30', 'to-purple-600/40', 'text-purple-100');
    });

    it('applies accent variant classes', () => {
      render(<GlassmorphicButton variant="accent">Accent Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-cyan-500/30', 'to-purple-500/30', 'text-cyan-100');
    });

    it('applies danger variant classes', () => {
      render(<GlassmorphicButton variant="danger">Danger Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-rose-500/30', 'to-red-500/30', 'text-rose-100');
    });

    it('applies success variant classes', () => {
      render(<GlassmorphicButton variant="success">Success Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-emerald-500/30', 'to-green-500/30', 'text-emerald-100');
    });
  });

  describe('Intensity levels', () => {
    it('applies subtle intensity classes', () => {
      render(<GlassmorphicButton intensity="subtle">Subtle Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/20', 'dark:bg-black/20');
    });

    it('applies medium intensity classes (default)', () => {
      render(<GlassmorphicButton intensity="medium">Medium Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/30', 'dark:bg-black/30');
    });

    it('applies strong intensity classes', () => {
      render(<GlassmorphicButton intensity="strong">Strong Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/40', 'dark:bg-black/40');
    });
  });

  describe('Blur levels', () => {
    it('applies small blur', () => {
      render(<GlassmorphicButton blur="sm">Small Blur</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('backdrop-blur-sm');
    });

    it('applies medium blur (default)', () => {
      render(<GlassmorphicButton blur="md">Medium Blur</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('backdrop-blur-md');
    });

    it('applies large blur', () => {
      render(<GlassmorphicButton blur="lg">Large Blur</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('backdrop-blur-lg');
    });
  });

  describe('Glow effect', () => {
    it('does not apply glow classes by default', () => {
      render(<GlassmorphicButton>No Glow</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('shadow-lg');
    });

    it('applies glow classes when enabled', () => {
      render(<GlassmorphicButton glow>With Glow</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-lg', 'shadow-white/10');
    });

    it('applies variant-specific glow colors', () => {
      render(<GlassmorphicButton variant="gaming" glow>Gaming Glow</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-purple-500/25');
    });
  });

  describe('Animation', () => {
    it('includes ripple effect element', () => {
      render(<GlassmorphicButton>Animated</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      const ripple = button.querySelector('.absolute.inset-0');
      expect(ripple).toBeInTheDocument();
      expect(ripple).toHaveClass('-translate-x-full');
    });

    it('applies transform classes for animation', () => {
      render(<GlassmorphicButton>Animated</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transform', 'hover:scale-105', 'active:scale-95');
    });
  });

  describe('Interaction', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(
        <GlassmorphicButton onClick={handleClick}>
          Clickable
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is accessible via keyboard', async () => {
      const handleClick = jest.fn();
      render(
        <GlassmorphicButton onClick={handleClick}>
          Keyboard Accessible
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state', async () => {
      const handleClick = jest.fn();
      render(
        <GlassmorphicButton onClick={handleClick} disabled>
          Disabled Button
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  describe('Focus management', () => {
    it('applies focus ring classes', () => {
      render(<GlassmorphicButton>Focusable</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-purple-500/50',
        'focus:ring-offset-2'
      );
    });
  });

  describe('GameGenButtonPresets', () => {
    it('contains all expected presets', () => {
      const presetKeys = Object.keys(GameGenButtonPresets);
      expect(presetKeys).toEqual([
        'primary',
        'secondary', 
        'accent',
        'danger',
        'success',
        'ghost',
        'floating'
      ]);
    });

    it('primary preset has correct properties', () => {
      const primary = GameGenButtonPresets.primary;
      expect(primary).toEqual({
        variant: 'gaming',
        intensity: 'medium',
        blur: 'md',
        glow: true,
        animated: true,
      });
    });

    it('secondary preset has correct properties', () => {
      const secondary = GameGenButtonPresets.secondary;
      expect(secondary).toEqual({
        variant: 'glass-bordered',
        intensity: 'subtle',
        blur: 'sm',
        glow: false,
        animated: true,
      });
    });

    it('can apply preset properties to button', () => {
      const preset = GameGenButtonPresets.primary;
      render(
        <GlassmorphicButton {...preset}>
          Preset Button
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-purple-500/30', 'backdrop-blur-md', 'shadow-purple-500/25');
    });
  });

  describe('Edge cases', () => {
    it('handles empty children', () => {
      render(<GlassmorphicButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      render(<GlassmorphicButton>{null}</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles complex children', () => {
      render(
        <GlassmorphicButton>
          <span>Icon</span>
          <span>Text</span>
        </GlassmorphicButton>
      );
      
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('applies className even with other props', () => {
      render(
        <GlassmorphicButton 
          className="custom-class" 
          variant="gaming" 
          intensity="strong"
          blur="lg"
          glow
        >
          Complex Button
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('from-purple-500/30');
      expect(button).toHaveClass('backdrop-blur-lg');
    });
  });

  describe('Accessibility', () => {
    it('maintains button role', () => {
      render(<GlassmorphicButton>Accessible Button</GlassmorphicButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(
        <GlassmorphicButton aria-label="Close dialog">
          ×
        </GlassmorphicButton>
      );
      
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <div>
          <GlassmorphicButton aria-describedby="button-description">
            Help
          </GlassmorphicButton>
          <div id="button-description">This button provides help</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'button-description');
    });
  });
});