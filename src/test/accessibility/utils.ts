/**
 * Utilitários para Testes de Acessibilidade
 *
 * Funções auxiliares para validar padrões de acessibilidade
 */

import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// TYPES
// ============================================================================

interface KeyboardNavigationTest {
  element: HTMLElement;
  expectedFocusOrder: string[];
  skipDisabled?: boolean;
}

interface ScreenReaderTest {
  element: HTMLElement;
  expectedAnnouncements: string[];
  liveRegionType?: 'polite' | 'assertive';
}

interface ContrastTest {
  element: HTMLElement;
  minimumRatio: number;
  level: 'AA' | 'AAA';
}

// ============================================================================
// KEYBOARD NAVIGATION UTILITIES
// ============================================================================

/**
 * Testa navegação por teclado em uma sequência de elementos
 */
export async function testKeyboardNavigation(
  test: KeyboardNavigationTest
): Promise<boolean> {
  const user = userEvent.setup();
  const { element, expectedFocusOrder, skipDisabled = true } = test;

  try {
    // Focar no primeiro elemento
    element.focus();

    for (let i = 0; i < expectedFocusOrder.length; i++) {
      await user.tab();

      const expectedSelector = expectedFocusOrder[i];
      const expectedElement = within(element).getByRole(expectedSelector) ||
                            within(element).getByTestId(expectedSelector) ||
                            within(element).querySelector(expectedSelector);

      if (!expectedElement) {
        console.warn(`Element not found: ${expectedSelector}`);
        continue;
      }

      if (skipDisabled && expectedElement.hasAttribute('disabled')) {
        continue;
      }

      if (document.activeElement !== expectedElement) {
        console.error(
          `Focus order mismatch at step ${i}. Expected: ${expectedSelector}, Got: ${document.activeElement?.tagName}`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Keyboard navigation test failed:', error);
    return false;
  }
}

/**
 * Testa navegação reversa com Shift+Tab
 */
export async function testReverseKeyboardNavigation(
  test: KeyboardNavigationTest
): Promise<boolean> {
  const user = userEvent.setup();
  const { element, expectedFocusOrder } = test;

  try {
    // Começar do último elemento
    const lastSelector = expectedFocusOrder[expectedFocusOrder.length - 1];
    const lastElement = within(element).getByRole(lastSelector) ||
                       within(element).getByTestId(lastSelector) ||
                       within(element).querySelector(lastSelector);

    if (lastElement) {
      lastElement.focus();
    }

    // Navegar em ordem reversa
    for (let i = expectedFocusOrder.length - 2; i >= 0; i--) {
      await user.tab({ shift: true });

      const expectedSelector = expectedFocusOrder[i];
      const expectedElement = within(element).getByRole(expectedSelector) ||
                            within(element).getByTestId(expectedSelector) ||
                            within(element).querySelector(expectedSelector);

      if (expectedElement && document.activeElement !== expectedElement) {
        console.error(
          `Reverse focus order mismatch at step ${i}. Expected: ${expectedSelector}`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Reverse keyboard navigation test failed:', error);
    return false;
  }
}

/**
 * Testa se elemento pode ser ativado por teclado
 */
export async function testKeyboardActivation(
  element: HTMLElement,
  keys: string[] = ['{Enter}', '{Space}']
): Promise<boolean> {
  const user = userEvent.setup();

  try {
    element.focus();

    for (const key of keys) {
      const clickHandler = vi.fn();
      element.addEventListener('click', clickHandler);

      await user.keyboard(key);

      if (clickHandler.mock.calls.length === 0) {
        console.error(`Element not activated by ${key}`);
        return false;
      }

      element.removeEventListener('click', clickHandler);
    }

    return true;
  } catch (error) {
    console.error('Keyboard activation test failed:', error);
    return false;
  }
}

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

/**
 * Verifica se elemento tem atributos ARIA apropriados
 */
export function validateAriaAttributes(
  element: HTMLElement,
  expectedAttributes: Record<string, string>
): boolean {
  try {
    for (const [attribute, expectedValue] of Object.entries(expectedAttributes)) {
      const actualValue = element.getAttribute(attribute);

      if (actualValue !== expectedValue) {
        console.error(
          `ARIA attribute mismatch: ${attribute}. Expected: ${expectedValue}, Got: ${actualValue}`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('ARIA validation failed:', error);
    return false;
  }
}

/**
 * Verifica se elemento tem role semântico apropriado
 */
export function validateSemanticRole(
  element: HTMLElement,
  expectedRole: string
): boolean {
  try {
    const actualRole = element.getAttribute('role') || element.tagName.toLowerCase();

    if (actualRole !== expectedRole) {
      console.error(
        `Semantic role mismatch. Expected: ${expectedRole}, Got: ${actualRole}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Semantic role validation failed:', error);
    return false;
  }
}

/**
 * Verifica se live regions estão configuradas corretamente
 */
export function validateLiveRegions(
  container: HTMLElement,
  expectedRegions: Array<{ selector: string; type: 'polite' | 'assertive' }>
): boolean {
  try {
    for (const region of expectedRegions) {
      const element = container.querySelector(region.selector);

      if (!element) {
        console.error(`Live region not found: ${region.selector}`);
        return false;
      }

      const ariaLive = element.getAttribute('aria-live');

      if (ariaLive !== region.type) {
        console.error(
          `Live region type mismatch for ${region.selector}. Expected: ${region.type}, Got: ${ariaLive}`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Live region validation failed:', error);
    return false;
  }
}

/**
 * Verifica se elementos têm labels acessíveis
 */
export function validateAccessibleLabels(
  elements: HTMLElement[],
  expectedLabels: string[]
): boolean {
  try {
    if (elements.length !== expectedLabels.length) {
      console.error('Number of elements and labels mismatch');
      return false;
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const expectedLabel = expectedLabels[i];

      const accessibleName =
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent ||
        element.getAttribute('title') ||
        element.getAttribute('placeholder');

      if (!accessibleName || !accessibleName.includes(expectedLabel)) {
        console.error(
          `Accessible label mismatch for element ${i}. Expected: ${expectedLabel}, Got: ${accessibleName}`
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Accessible label validation failed:', error);
    return false;
  }
}

// ============================================================================
// FOCUS MANAGEMENT UTILITIES
// ============================================================================

/**
 * Testa se foco é gerenciado corretamente em modais/dialogs
 */
export async function testFocusTrap(
  modalElement: HTMLElement,
  expectedFocusableElements: string[]
): Promise<boolean> {
  const user = userEvent.setup();

  try {
    // Encontrar elementos focáveis
    const focusableElements = expectedFocusableElements
      .map(selector => within(modalElement).queryByRole(selector) ||
                      within(modalElement).querySelector(selector))
      .filter(Boolean) as HTMLElement[];

    if (focusableElements.length === 0) {
      console.error('No focusable elements found in modal');
      return false;
    }

    // Focar no primeiro elemento
    focusableElements[0].focus();

    // Navegar até o último elemento
    for (let i = 1; i < focusableElements.length; i++) {
      await user.tab();

      if (document.activeElement !== focusableElements[i]) {
        console.error(`Focus trap failed at element ${i}`);
        return false;
      }
    }

    // Tentar navegar além do último elemento (deve voltar ao primeiro)
    await user.tab();

    if (document.activeElement !== focusableElements[0]) {
      console.error('Focus trap failed: did not wrap to first element');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Focus trap test failed:', error);
    return false;
  }
}

/**
 * Verifica se foco retorna ao elemento correto após fechar modal
 */
export async function testFocusReturn(
  triggerElement: HTMLElement,
  modalElement: HTMLElement,
  closeAction: () => Promise<void>
): Promise<boolean> {
  try {
    // Focar no elemento que abre o modal
    triggerElement.focus();

    // Aguardar modal abrir e focar nele
    await new Promise(resolve => setTimeout(resolve, 100));

    // Executar ação de fechamento
    await closeAction();

    // Verificar se foco retornou ao elemento original
    await new Promise(resolve => setTimeout(resolve, 100));

    if (document.activeElement !== triggerElement) {
      console.error('Focus did not return to trigger element');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Focus return test failed:', error);
    return false;
  }
}

// ============================================================================
// COLOR CONTRAST UTILITIES
// ============================================================================

/**
 * Calcula contraste entre duas cores
 */
export function calculateContrast(
  foreground: string,
  background: string
): number {
  try {
    // Converter cores para RGB
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) {
      throw new Error('Invalid color format');
    }

    // Calcular luminância relativa
    const fgLuminance = getRelativeLuminance(fgRgb);
    const bgLuminance = getRelativeLuminance(bgRgb);

    // Calcular contraste
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  } catch (error) {
    console.error('Contrast calculation failed:', error);
    return 0;
  }
}

/**
 * Verifica se contraste atende aos padrões WCAG
 */
export function validateContrast(
  contrast: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const requirements = {
    AA: isLargeText ? 3 : 4.5,
    AAA: isLargeText ? 4.5 : 7
  };

  return contrast >= requirements[level];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;

  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Simula leitor de tela para testes
 */
export class MockScreenReader {
  private announcements: string[] = [];
  private isEnabled = true;

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.isEnabled) {
      this.announcements.push(`[${priority}] ${text}`);
    }
  }

  getAnnouncements(): string[] {
    return [...this.announcements];
  }

  clearAnnouncements(): void {
    this.announcements = [];
  }

  getLastAnnouncement(): string | null {
    return this.announcements[this.announcements.length - 1] || null;
  }
}

/**
 * Utilitário para testar responsividade de acessibilidade
 */
export function testResponsiveAccessibility(
  element: HTMLElement,
  viewports: Array<{ width: number; height: number; name: string }>
): boolean {
  try {
    for (const viewport of viewports) {
      // Simular viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: viewport.width
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: viewport.height
      });

      // Disparar evento de resize
      window.dispatchEvent(new Event('resize'));

      // Verificar se elementos ainda são acessíveis
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      for (const focusableElement of focusableElements) {
        const rect = focusableElement.getBoundingClientRect();

        // Verificar se elemento tem tamanho mínimo para touch
        if (viewport.width <= 768) { // Mobile
          if (rect.width < 44 || rect.height < 44) {
            console.error(
              `Element too small for touch in ${viewport.name}: ${rect.width}x${rect.height}`
            );
            return false;
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Responsive accessibility test failed:', error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    calculateContrast, MockScreenReader, testFocusReturn, testFocusTrap, testKeyboardActivation, testKeyboardNavigation, testResponsiveAccessibility, testReverseKeyboardNavigation, validateAccessibleLabels, validateAriaAttributes, validateContrast, validateLiveRegions, validateSemanticRole
};
