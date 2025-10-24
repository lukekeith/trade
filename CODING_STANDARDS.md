# Coding Standards - Trade Platform

## SCSS/CSS Standards

### BEM Naming Convention

We follow **BEM (Block Element Modifier)** methodology with PascalCase for blocks.

#### Structure
```
.BlockName                  // Block (component)
.BlockName__element         // Element (child)
.BlockName__element--modifier // Modifier (variant/state)
```

#### Widget Naming
All widgets must use the `Widget` prefix and follow these **mandatory requirements**:
```scss
.WidgetWatchlist           // Watchlist widget block
.WidgetChart               // Chart widget block
.WidgetTrends              // Trends widget block
```

**Widget Header Requirements:**
Every widget MUST have a header with the following specifications:
- Class name: `WidgetName__Header`
- Height: `40px`
- Background color: `#202023` (mandatory for consistency)
- Border bottom: `1px solid $border`
- Padding: `0 12px`
- Contains an `<h2>` element with the widget title

**Example:**
```scss
.WidgetName {
  &__Header {
    height: 40px;
    padding: 0 12px;
    background: #202023;  // MANDATORY
    border-bottom: 1px solid $border;

    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: $foreground;
    }
  }
}
```

#### Examples

**Good ✅**
```scss
.WidgetWatchlist {
  // Block styles

  &__Header {
    // Header element
  }

  &__Symbol {
    // Symbol row element

    &--selected {
      // Selected modifier
    }
  }

  &__SymbolName {
    // Symbol name element
  }

  &__SymbolPrice {
    // Symbol price element

    &--positive {
      // Positive price modifier
    }

    &--negative {
      // Negative price modifier
    }
  }
}
```

**Bad ❌**
```scss
.trends-panel {           // Wrong: kebab-case, not descriptive
  .symbol-row {           // Wrong: kebab-case, not BEM
    .price-change {       // Wrong: not following BEM structure
      &.positive { }      // Wrong: modifier should use --
    }
  }
}
```

#### React Component Class Names

```tsx
// Block
<div className="WidgetWatchlist">

  {/* Element */}
  <div className="WidgetWatchlist__Header">
    <h2>Watchlist</h2>
  </div>

  {/* Element with modifier */}
  <div className={`WidgetWatchlist__Symbol ${isSelected ? 'WidgetWatchlist__Symbol--selected' : ''}`}>

    {/* Nested elements */}
    <span className="WidgetWatchlist__SymbolName">{symbol}</span>
    <span className={`WidgetWatchlist__SymbolPrice WidgetWatchlist__SymbolPrice--${isPositive ? 'positive' : 'negative'}`}>
      ${price}
    </span>
  </div>
</div>
```

### SCSS File Organization

```scss
@use './variables' as *;
@use './mixins' as *;

// 1. Block styles
.WidgetName {
  // Layout properties first
  display: flex;
  flex-direction: column;

  // Box model
  padding: $spacing-md;
  margin: 0;

  // Visual
  background: $surface;
  border: 1px solid $border;

  // Typography
  font-size: $font-md;
  color: $foreground;

  // 2. Element styles (nested with &__)
  &__Element {
    // Element styles
  }

  // 3. Modifiers (nested with &--)
  &--modifier {
    // Modifier styles
  }

  // 4. State classes
  &:hover { }
  &:focus { }
  &.is-active { }
}
```

### Flexbox Standards

- Use `flex: 1` for elements that should grow to fill space
- Use `flex: 0 0 auto` or just rely on content width for fixed-width elements
- Always specify `flex-direction` explicitly when not using default row

```scss
.WidgetWatchlist__Symbol {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $spacing-md;

  &Name {
    flex: 1;  // Takes up all available space
  }

  &Price {
    flex: 0 0 auto;  // Fixed to content width
  }

  &Change {
    flex: 0 0 auto;  // Fixed to content width
  }
}
```

### Variable Usage

Always use SCSS variables from `_variables.scss`:

```scss
// Spacing
padding: $spacing-sm;   // ✅
padding: 8px;           // ❌

// Colors
color: $foreground;     // ✅
color: #e1e7ef;         // ❌

// Fonts
font-size: $font-md;    // ✅
font-size: 1rem;        // ❌ (unless intentional override)
```

### Root Font Size

Base font size is set to `14px` in `App.scss`:
```scss
html {
  font-size: 14px;  // 1rem = 14px
}
```

### Icon Usage (Lucide React)

All icons MUST use **Lucide React** library. Never use text-based symbols (×, +, ▲, ▼, ↑, ↓).

**Installation:**
```bash
npm install lucide-react
```

**Usage:**
```tsx
import { Plus, X, ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react';

// In component:
<Plus size={16} />           // Standard size for buttons
<ArrowUpRight size={14} />   // Smaller for inline indicators
<Settings size={20} />       // Larger for prominent actions
```

**Common Icons:**
- `Plus`, `X` - Add/close buttons
- `ArrowUpRight`, `ArrowDownRight` - Price trends
- `ChevronUp`, `ChevronDown` - Dropdowns
- `Settings` - Configuration
- `TrendingUp`, `TrendingDown` - Chart trends
- `DollarSign` - Financial indicators

**Good ✅**
```tsx
<button className="WidgetWatchlist__AddButton">
  <Plus size={16} />
</button>

<span className="WidgetWatchlist__SymbolChange--positive">
  <ArrowUpRight size={14} /> 2.5%
</span>
```

**Bad ❌**
```tsx
<button className="WidgetWatchlist__AddButton">
  +  {/* Never use text symbols */}
</button>

<span>▲ 2.5%</span>  {/* Never use Unicode arrows */}
```

## TypeScript/React Standards

### Component Organization

```tsx
import { observer } from 'mobx-react-lite';
import { Application } from '../stores/Application';
import '../styles/WidgetName.scss';

export const WidgetName = observer(() => {
  // 1. State and refs
  const [localState, setLocalState] = useState();

  // 2. Computed values from store
  const data = Application.store.data;

  // 3. Event handlers
  const handleClick = () => { };

  // 4. Render
  return (
    <div className="WidgetName">
      {/* Content */}
    </div>
  );
});
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `TrendsPanel.tsx`)
- Styles: `PascalCase.scss` (e.g., `TrendsPanel.scss`)
- Stores: `PascalCase.ts` (e.g., `SymbolsStore.ts`)
- Services: `kebab-case.service.ts` (e.g., `websocket.service.ts`)

## Git Commit Standards

Use conventional commits:
```
feat: add forex symbol support
fix: correct chart auto-scaling on symbol change
refactor: migrate to BEM naming convention
style: update button hover states
docs: add coding standards document
```

## Code Review Checklist

Before submitting code:

### General
- [ ] BEM naming convention followed for all CSS classes
- [ ] SCSS variables used instead of hardcoded values (except widget header background `#202023`)
- [ ] Components are MobX observers if they access store data
- [ ] TypeScript types are properly defined
- [ ] No console.logs in production code (use proper logging)
- [ ] Flexbox layout is properly structured
- [ ] Responsive design considered

### Widget-Specific
- [ ] Widget class name uses `Widget` prefix (e.g., `.WidgetName`)
- [ ] Widget has `WidgetName__Header` element
- [ ] Header background is `#202023` (mandatory)
- [ ] Header height is `40px`
- [ ] Header contains `<h2>` element with widget title
- [ ] All icons use Lucide React (no text symbols like ×, +, ▲, ▼)
- [ ] Icon sizes are appropriate (16px for buttons, 14px for indicators)
- [ ] Widget is wrapped in `observer()` for MobX reactivity
