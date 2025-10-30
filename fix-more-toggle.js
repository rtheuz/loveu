/**
 * fix-more-toggle.js
 * Implements an accessible, animated toggle for the gallery "Ver Mais" button.
 * 
 * Features:
 * - Toggles aria-expanded on #moreBtn and aria-hidden on #extraContent
 * - Smoothly animates height using scrollHeight measurement
 * - Updates button label between "💌 Ver Mais" and "💌 Ver Menos"
 * - Plays clickSound if available
 * - Defensive coding: checks elements exist, safe to run multiple times
 */

(function() {
  'use strict';

  // Check if already initialized to prevent multiple executions
  if (window.moreToggleInitialized) {
    return;
  }
  window.moreToggleInitialized = true;

  // Get DOM elements
  const moreBtn = document.getElementById('moreBtn');
  const extraContent = document.getElementById('extraContent');

  // Defensive check: ensure elements exist
  if (!moreBtn || !extraContent) {
    console.warn('fix-more-toggle.js: Required elements not found');
    return;
  }

  // Get clickSound if available
  const clickSound = window.clickSound;

  // Initialize state
  let isOpen = false;

  /**
   * Toggle the extra content with smooth height animation
   */
  function toggleExtraContent() {
    // Play click sound if available
    if (clickSound) {
      try {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {
          // Silently handle autoplay restrictions
        });
      } catch (e) {
        // Ignore errors
      }
    }

    if (isOpen) {
      // Close: animate from current height to 0
      const currentHeight = extraContent.scrollHeight;
      extraContent.style.height = currentHeight + 'px';
      
      // Force reflow to ensure the transition works
      extraContent.offsetHeight;
      
      extraContent.style.height = '0';
      extraContent.style.opacity = '0';
      
      // Update ARIA attributes
      moreBtn.setAttribute('aria-expanded', 'false');
      extraContent.setAttribute('aria-hidden', 'true');
      
      // Update button label
      moreBtn.textContent = '💌 Ver Mais';
      
      isOpen = false;
    } else {
      // Open: animate from 0 to scrollHeight
      const targetHeight = extraContent.scrollHeight;
      extraContent.style.height = '0';
      
      // Force reflow
      extraContent.offsetHeight;
      
      extraContent.style.height = targetHeight + 'px';
      extraContent.style.opacity = '1';
      
      // Update ARIA attributes
      moreBtn.setAttribute('aria-expanded', 'true');
      extraContent.setAttribute('aria-hidden', 'false');
      
      // Update button label
      moreBtn.textContent = '💌 Ver Menos';
      
      isOpen = true;
      
      // After transition completes, set height to auto for responsive behavior
      const handleTransitionEnd = function() {
        if (isOpen) {
          extraContent.style.height = 'auto';
        }
        extraContent.removeEventListener('transitionend', handleTransitionEnd);
      };
      extraContent.addEventListener('transitionend', handleTransitionEnd);
    }
  }

  // Attach click handler
  moreBtn.addEventListener('click', toggleExtraContent);

  // Ensure initial state is correct
  extraContent.style.height = '0';
  extraContent.style.opacity = '0';
  moreBtn.setAttribute('aria-expanded', 'false');
  extraContent.setAttribute('aria-hidden', 'true');

})();
