/**
 * GameGen UI Component Types
 * 
 * TypeScript type definitions for UI components, props, and styling
 * in the GameGen pixel art game creation platform using HeroUI.
 */

import { SVGProps, ReactNode, ComponentType, MouseEvent, KeyboardEvent, FocusEvent, CSSProperties } from 'react';

/**
 * Base icon props extending SVG props
 */
export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

/**
 * Theme and styling types
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'red';

/**
 * Component size variants
 */
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component color variants aligned with HeroUI
 */
export type ComponentColor = 
  | 'default'
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger';

/**
 * Button variants
 */
export type ButtonVariant = 
  | 'solid' 
  | 'bordered' 
  | 'light' 
  | 'flat' 
  | 'faded' 
  | 'shadow' 
  | 'ghost';

/**
 * Input variants
 */
export type InputVariant = 
  | 'flat' 
  | 'bordered' 
  | 'underlined' 
  | 'faded';

/**
 * Layout and spacing types
 */
export type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'full';

/**
 * Loading state types
 */
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  error?: string | null;
}

/**
 * Modal and dialog types
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  placement?: 'auto' | 'top' | 'center' | 'bottom';
  backdrop?: 'transparent' | 'opaque' | 'blur';
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

/**
 * Form field props
 */
export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

/**
 * Navigation and menu types
 */
export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ComponentType<IconSvgProps>;
  badge?: string | number;
  isDisabled?: boolean;
  children?: NavigationItem[];
}

/**
 * Breadcrumb types
 */
export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
  isCurrentPage?: boolean;
  icon?: ComponentType<IconSvgProps>;
}

/**
 * Table and data display types
 */
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string | number;
  align?: 'start' | 'center' | 'end';
  render?: (item: T, columnKey: string) => ReactNode;
  className?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyContent?: ReactNode;
  loadingContent?: ReactNode;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  sortDescriptor?: {
    column: string;
    direction: 'ascending' | 'descending';
  };
  onSortChange?: (descriptor: { column: string; direction: 'ascending' | 'descending' }) => void;
  className?: string;
  itemClassName?: string;
}

/**
 * Card component types
 */
export interface CardProps {
  children: ReactNode;
  className?: string;
  isPressable?: boolean;
  isHoverable?: boolean;
  isBlurred?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  radius?: Radius;
  padding?: Spacing;
  header?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
}

/**
 * Game-specific UI component types
 */
export interface GameCardProps {
  game: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    game_type: string;
    status: string;
    play_count?: number;
    like_count?: number;
    created_at: string;
    tags?: string[];
  };
  onPlay?: (gameId: string) => void;
  onEdit?: (gameId: string) => void;
  onLike?: (gameId: string) => void;
  onShare?: (gameId: string) => void;
  showActions?: boolean;
  isCompact?: boolean;
  className?: string;
}

export interface AssetCardProps {
  asset: {
    id: string;
    name: string;
    description?: string;
    file_url: string;
    asset_type: string;
    download_count?: number;
    like_count?: number;
    tags?: string[];
    license_type?: string;
  };
  onDownload?: (assetId: string) => void;
  onLike?: (assetId: string) => void;
  onPreview?: (assetId: string) => void;
  showActions?: boolean;
  previewSize?: ComponentSize;
  className?: string;
}

/**
 * Editor component types
 */
export interface EditorPanelProps {
  title: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  tools?: Array<{
    icon: ComponentType<IconSvgProps>;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
  }>;
  className?: string;
  children: ReactNode;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'javascript' | 'typescript' | 'json';
  theme?: 'light' | 'dark' | 'high-contrast';
  fontSize?: number;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  minimap?: boolean;
  readOnly?: boolean;
  className?: string;
  onSave?: (value: string) => void;
}

/**
 * Asset library component types
 */
export interface AssetLibraryProps {
  assets: Array<{
    id: string;
    name: string;
    file_url: string;
    asset_type: string;
    category?: string;
    tags?: string[];
  }>;
  onAssetSelect: (assetId: string) => void;
  selectedAssets?: string[];
  filterByType?: string[];
  searchQuery?: string;
  onSearch?: (query: string) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * File upload component types
 */
export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFilesSelected: (files: File[]) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  dragAndDrop?: boolean;
  showPreview?: boolean;
  previewSize?: ComponentSize;
  className?: string;
  children?: ReactNode;
}

/**
 * Progress and status indicators
 */
export interface ProgressProps {
  value: number;
  maxValue?: number;
  label?: string;
  showValueLabel?: boolean;
  color?: ComponentColor;
  size?: ComponentSize;
  isIndeterminate?: boolean;
  className?: string;
}

export interface StatusBadgeProps {
  status: string;
  variant?: 'dot' | 'solid' | 'bordered';
  size?: ComponentSize;
  className?: string;
}

/**
 * Search and filter components
 */
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  className?: string;
}

export interface FilterChipProps {
  label: string;
  value: string;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  count?: number;
  color?: ComponentColor;
  variant?: 'solid' | 'bordered' | 'flat';
  className?: string;
}

/**
 * Layout component types
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export interface SidebarProps {
  items: NavigationItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  currentPath?: string;
  className?: string;
}

export interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}

/**
 * Game engine integration types
 */
export interface ToxoidEngineProps {
  gameConfig: any;
  onGameStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
  width?: number;
  height?: number;
  className?: string;
  debug?: boolean;
  autoStart?: boolean;
}

/**
 * AI generation UI types
 */
export interface AIGenerationPanelProps {
  onGenerate: (prompt: string, type: string, options: any) => void;
  isGenerating?: boolean;
  generationProgress?: number;
  lastGeneration?: {
    id: string;
    type: string;
    prompt: string;
    result_url?: string;
    status: string;
  };
  creditsRemaining?: number;
  className?: string;
}

/**
 * Responsive design types
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveValue<T> {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

/**
 * Animation and transition types
 */
export interface AnimationProps {
  animation?: 'none' | 'fade' | 'slide' | 'scale' | 'bounce';
  duration?: number;
  delay?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

/**
 * Accessibility types
 */
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

/**
 * Event handler types
 */
export interface EventHandlers {
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onHover?: (isHovering: boolean) => void;
}

/**
 * Common component props interface
 */
export interface CommonComponentProps extends AccessibilityProps, EventHandlers {
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Context types for UI state management
 */
export interface UIContextState {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  sidebarCollapsed: boolean;
  isCompactMode: boolean;
  fontSize: ComponentSize;
  animations: boolean;
  reducedMotion: boolean;
}

export interface UIContextActions {
  setTheme: (theme: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleSidebar: () => void;
  setCompactMode: (compact: boolean) => void;
  setFontSize: (size: ComponentSize) => void;
  toggleAnimations: () => void;
}

export interface UIContext extends UIContextState, UIContextActions {}

/**
 * Component state types
 */
export interface ComponentState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Utility types for component development
 */
export type PropsWithClassName<P = {}> = P & { className?: string };
export type PropsWithChildren<P = {}> = P & { children: ReactNode };
export type PropsWithOptionalChildren<P = {}> = P & { children?: ReactNode };

// Type guards and utility functions
export const isValidSize = (size: any): size is ComponentSize => {
  return ['sm', 'md', 'lg', 'xl'].includes(size);
};

export const isValidColor = (color: any): color is ComponentColor => {
  return ['default', 'primary', 'secondary', 'success', 'warning', 'danger'].includes(color);
};

export const combineClassNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getResponsiveValue = <T>(
  value: T | ResponsiveValue<T>,
  breakpoint: Breakpoint = 'sm'
): T => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const responsiveValue = value as ResponsiveValue<T>;
    return responsiveValue[breakpoint] ?? responsiveValue.base ?? (value as T);
  }
  return value as T;
};