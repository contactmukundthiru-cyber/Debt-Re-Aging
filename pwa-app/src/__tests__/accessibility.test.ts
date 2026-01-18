/**
 * Accessibility utilities tests
 */

import {
  generateId,
  resetIdCounter,
  getAriaLabel,
  getExpandableProps,
  getTabProps,
  getTabPanelProps,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  handleArrowNavigation,
  getErrorProps,
  getLoadingProps,
  getContrastRatio,
  meetsContrastRequirement,
  prefersReducedMotion,
  getAnimationDuration,
  createFocusTrap,
  announce,
  announceError,
  cleanupAnnounce,
} from '../utils/accessibility';

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  // =========================================================================
  // ARIA Utilities
  // =========================================================================
  describe('generateId', () => {
    it('generates unique IDs with default prefix', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBe('aria-1');
      expect(id2).toBe('aria-2');
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with custom prefix', () => {
      const id = generateId('dialog');
      expect(id).toBe('dialog-1');
    });

    it('resets counter correctly', () => {
      generateId();
      generateId();
      resetIdCounter();
      const id = generateId();
      expect(id).toBe('aria-1');
    });
  });

  describe('getAriaLabel', () => {
    it('returns aria-label prop', () => {
      const props = getAriaLabel('Close dialog');
      expect(props).toEqual({
        'aria-label': 'Close dialog',
      });
    });

    it('includes aria-describedby when provided', () => {
      const props = getAriaLabel('Submit form', 'form-errors');
      expect(props).toEqual({
        'aria-label': 'Submit form',
        'aria-describedby': 'form-errors',
      });
    });
  });

  describe('getExpandableProps', () => {
    it('returns correct props when expanded', () => {
      const props = getExpandableProps(true, 'content-1');
      expect(props).toEqual({
        'aria-expanded': true,
        'aria-controls': 'content-1',
      });
    });

    it('returns correct props when collapsed', () => {
      const props = getExpandableProps(false, 'content-1');
      expect(props).toEqual({
        'aria-expanded': false,
        'aria-controls': 'content-1',
      });
    });
  });

  describe('getTabProps', () => {
    it('returns correct props for selected tab', () => {
      const props = getTabProps(true, 'tab-1', 'panel-1');
      expect(props).toEqual({
        role: 'tab',
        id: 'tab-1',
        'aria-selected': true,
        'aria-controls': 'panel-1',
        tabIndex: 0,
      });
    });

    it('returns correct props for unselected tab', () => {
      const props = getTabProps(false, 'tab-2', 'panel-2');
      expect(props).toEqual({
        role: 'tab',
        id: 'tab-2',
        'aria-selected': false,
        'aria-controls': 'panel-2',
        tabIndex: -1,
      });
    });
  });

  describe('getTabPanelProps', () => {
    it('returns correct tabpanel props', () => {
      const props = getTabPanelProps('tab-1', 'panel-1');
      expect(props).toEqual({
        role: 'tabpanel',
        id: 'panel-1',
        'aria-labelledby': 'tab-1',
      });
    });
  });

  // =========================================================================
  // Focus Management
  // =========================================================================
  describe('Focus Management', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    describe('getFocusableElements', () => {
      it('finds all focusable elements', () => {
        container.innerHTML = `
          <button>Button</button>
          <a href="#">Link</a>
          <input type="text" />
          <select><option>Option</option></select>
          <textarea></textarea>
          <div tabindex="0">Div with tabindex</div>
        `;

        const elements = getFocusableElements(container);
        expect(elements).toHaveLength(6);
      });

      it('excludes disabled elements', () => {
        container.innerHTML = `
          <button>Active Button</button>
          <button disabled>Disabled Button</button>
          <input type="text" />
          <input type="text" disabled />
        `;

        const elements = getFocusableElements(container);
        expect(elements).toHaveLength(2);
      });

      it('excludes hidden elements', () => {
        container.innerHTML = `
          <button>Visible Button</button>
          <button style="display: none">Hidden Button</button>
          <button style="visibility: hidden">Invisible Button</button>
        `;

        const elements = getFocusableElements(container);
        expect(elements).toHaveLength(1);
      });

      it('excludes elements with tabindex=-1', () => {
        container.innerHTML = `
          <button>Normal Button</button>
          <button tabindex="-1">Not in tab order</button>
        `;

        const elements = getFocusableElements(container);
        expect(elements).toHaveLength(1);
      });
    });

    describe('getFirstFocusable', () => {
      it('returns first focusable element', () => {
        container.innerHTML = `
          <div>Text</div>
          <button id="first">First</button>
          <button id="second">Second</button>
        `;

        const first = getFirstFocusable(container);
        expect(first?.id).toBe('first');
      });

      it('returns null when no focusable elements', () => {
        container.innerHTML = `<div>No focusable elements</div>`;
        const first = getFirstFocusable(container);
        expect(first).toBeNull();
      });
    });

    describe('getLastFocusable', () => {
      it('returns last focusable element', () => {
        container.innerHTML = `
          <button id="first">First</button>
          <button id="second">Second</button>
          <div>Text</div>
        `;

        const last = getLastFocusable(container);
        expect(last?.id).toBe('second');
      });

      it('returns null when no focusable elements', () => {
        container.innerHTML = `<div>No focusable elements</div>`;
        const last = getLastFocusable(container);
        expect(last).toBeNull();
      });
    });
  });

  // =========================================================================
  // Keyboard Navigation
  // =========================================================================
  describe('handleArrowNavigation', () => {
    let items: HTMLElement[];

    beforeEach(() => {
      items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ];
      items.forEach((item, i) => {
        item.id = `item-${i}`;
        item.focus = jest.fn();
      });
    });

    it('navigates down with ArrowDown', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const newIndex = handleArrowNavigation(event, items, 0);
      expect(newIndex).toBe(1);
    });

    it('navigates up with ArrowUp', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const newIndex = handleArrowNavigation(event, items, 1);
      expect(newIndex).toBe(0);
    });

    it('wraps from last to first with ArrowDown', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const newIndex = handleArrowNavigation(event, items, 2, { wrap: true });
      expect(newIndex).toBe(0);
    });

    it('wraps from first to last with ArrowUp', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const newIndex = handleArrowNavigation(event, items, 0, { wrap: true });
      expect(newIndex).toBe(2);
    });

    it('does not wrap when wrap is false', () => {
      const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const newIndexDown = handleArrowNavigation(eventDown, items, 2, { wrap: false });
      expect(newIndexDown).toBe(2);

      const eventUp = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const newIndexUp = handleArrowNavigation(eventUp, items, 0, { wrap: false });
      expect(newIndexUp).toBe(0);
    });

    it('navigates to first with Home', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      const newIndex = handleArrowNavigation(event, items, 2);
      expect(newIndex).toBe(0);
    });

    it('navigates to last with End', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      const newIndex = handleArrowNavigation(event, items, 0);
      expect(newIndex).toBe(2);
    });

    it('handles horizontal navigation with ArrowLeft/Right', () => {
      const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const newIndexRight = handleArrowNavigation(eventRight, items, 0, { horizontal: true });
      expect(newIndexRight).toBe(1);

      const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const newIndexLeft = handleArrowNavigation(eventLeft, items, 1, { horizontal: true });
      expect(newIndexLeft).toBe(0);
    });
  });

  // =========================================================================
  // Form Accessibility
  // =========================================================================
  describe('getErrorProps', () => {
    it('returns correct props when error exists', () => {
      const props = getErrorProps('name-error', true, 'Name is required');
      expect(props.input).toEqual({
        'aria-invalid': true,
        'aria-describedby': 'name-error',
      });
      expect(props.error).toEqual({
        id: 'name-error',
        role: 'alert',
        'aria-live': 'polite',
      });
    });

    it('returns correct props when no error', () => {
      const props = getErrorProps('name-error', false);
      expect(props.input).toEqual({
        'aria-invalid': false,
        'aria-describedby': '',
      });
    });
  });

  describe('getLoadingProps', () => {
    it('returns correct props when loading', () => {
      const props = getLoadingProps(true, 'Saving...');
      expect(props).toEqual({
        'aria-busy': true,
        'aria-describedby': 'loading-status',
      });
    });

    it('returns correct props when not loading', () => {
      const props = getLoadingProps(false);
      expect(props).toEqual({
        'aria-busy': false,
        'aria-describedby': '',
      });
    });
  });

  // =========================================================================
  // Color Contrast
  // =========================================================================
  describe('getContrastRatio', () => {
    it('calculates contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0); // Maximum contrast
    });

    it('calculates contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#336699', '#336699');
      expect(ratio).toBeCloseTo(1, 0); // Same color = no contrast
    });

    it('returns 1 for invalid colors', () => {
      const ratio = getContrastRatio('invalid', 'color');
      expect(ratio).toBe(1);
    });
  });

  describe('meetsContrastRequirement', () => {
    it('black on white meets AA for normal text', () => {
      expect(meetsContrastRequirement('#000000', '#ffffff', 'AA', false)).toBe(true);
    });

    it('black on white meets AAA for normal text', () => {
      expect(meetsContrastRequirement('#000000', '#ffffff', 'AAA', false)).toBe(true);
    });

    it('light gray on white fails AA for normal text', () => {
      expect(meetsContrastRequirement('#999999', '#ffffff', 'AA', false)).toBe(false);
    });

    it('medium gray on white passes AA for large text', () => {
      // Large text only needs 3:1 ratio
      expect(meetsContrastRequirement('#767676', '#ffffff', 'AA', true)).toBe(true);
    });
  });

  // =========================================================================
  // Reduced Motion
  // =========================================================================
  describe('prefersReducedMotion', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('returns false when no preference', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      expect(prefersReducedMotion()).toBe(false);
    });

    it('returns true when prefers reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('getAnimationDuration', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('returns normal duration when motion is allowed', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      expect(getAnimationDuration(300)).toBe(300);
    });

    it('returns 0 when reduced motion is preferred', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      expect(getAnimationDuration(300)).toBe(0);
    });
  });

  describe('Focus Trap', () => {
    let container: HTMLElement;
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      button1 = document.createElement('button');
      button1.id = 'btn1';
      button2 = document.createElement('button');
      button2.id = 'btn2';
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('activates and deactivates correctly', () => {
      const { activate, deactivate } = createFocusTrap(container);
      activate();
      expect(document.activeElement).toBe(button1);
      deactivate();
    });
  });

  describe('Screen Reader Announcements', () => {
    afterEach(() => {
      cleanupAnnounce();
    });

    it('creates announcement element and announces message', (done) => {
      announce('Test message');
      // Wait for requestAnimationFrame
      setTimeout(() => {
        const el = document.querySelector('[role="status"]');
        expect(el).toBeTruthy();
        expect(el?.textContent).toBe('Test message');
        done();
      }, 50);
    });

    it('announces error message', (done) => {
      announceError('Error message');
      setTimeout(() => {
        const el = document.querySelector('[role="status"]');
        expect(el?.getAttribute('aria-live')).toBe('assertive');
        expect(el?.textContent).toBe('Error message');
        done();
      }, 50);
    });
  });
});
