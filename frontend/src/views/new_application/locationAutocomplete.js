/**
 * locationAutocomplete.js
 * Adds a debounced dropdown autocomplete using the Open-Meteo Geocoding API.
 */

// Shared active dropdown portal for locations
let _activeDropdown = null;

function getOrCreateDropdownPortal() {
  if (!_activeDropdown) {
    _activeDropdown = document.createElement('div');
    _activeDropdown.className = 'location-dropdown tech-tag-dropdown'; // Reuse dropdown base styles
    _activeDropdown.style.display = 'none';
    document.body.appendChild(_activeDropdown);
  }
  return _activeDropdown;
}

function removeDropdownPortal() {
  if (_activeDropdown) {
    _activeDropdown.remove();
    _activeDropdown = null;
  }
}

/**
 * Normalizes a result object into a canonical string.
 */
function formatLocation(item) {
  const parts = [item.name];
  if (item.admin1 && item.admin1 !== item.name) {
    parts.push(item.admin1);
  }
  if (item.country) {
    parts.push(item.country);
  } else if (item.country_code) {
    parts.push(item.country_code);
  }
  return parts.join(', ');
}

/**
 * Escapes HTML characters for security.
 */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function initLocationAutocomplete(inputId) {
  const textInput = document.getElementById(inputId);
  if (!textInput) return;

  const dropdown = getOrCreateDropdownPortal();
  let debounceTimeout = null;
  let currentResults = [];

  function positionDropdown() {
    const rect = textInput.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
  }

  async function fetchLocations(query) {
    if (!query) {
      dropdown.style.display = 'none';
      return;
    }

    try {
      // The API doesn't require authentication/keys for public client-side use
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      currentResults = data.results || [];
      renderDropdown(currentResults, query);
    } catch (err) {
      console.error('Error fetching locations:', err);
      dropdown.style.display = 'none';
    }
  }

  function renderDropdown(results, query) {
    if (results.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    let html = '';
    results.forEach((item, index) => {
      const primaryParts = [item.name];
      if (item.admin1 && item.admin1 !== item.name) {
        primaryParts.push(item.admin1);
      }
      const primaryText = primaryParts.join(', ');

      const highlightedPrimary = escHtml(primaryText).replace(
        new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
        '<mark>$1</mark>'
      );
      
      const secondaryText = item.country || item.country_code || '';

      html += `<div class="tech-tag-option location-option ${index === 0 ? 'highlighted' : ''}" data-index="${index}" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 0.5rem 0.75rem; line-height: 1.2;">
                 <span style="font-weight: 500; font-size: 0.9rem;">${highlightedPrimary}</span>
                 ${secondaryText ? `<span style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${escHtml(secondaryText)}</span>` : ''}
               </div>`;
    });

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
    positionDropdown();

    // Attach click listeners
    dropdown.querySelectorAll('.location-option').forEach(opt => {
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectItem(parseInt(opt.dataset.index, 10));
      });
    });
  }

  function selectItem(index) {
    const item = currentResults[index];
    if (item) {
      textInput.value = formatLocation(item);
    }
    dropdown.style.display = 'none';
    textInput.focus();
  }

  function navigateDropdown(dir) {
    const opts = [...dropdown.querySelectorAll('.location-option')];
    if (!opts.length) return;
    const cur = dropdown.querySelector('.location-option.highlighted');
    let idx = cur ? opts.indexOf(cur) + dir : (dir === 1 ? 0 : opts.length - 1);
    idx = (idx + opts.length) % opts.length;
    opts.forEach(o => o.classList.remove('highlighted'));
    opts[idx].classList.add('highlighted');
    opts[idx].scrollIntoView({ block: 'nearest' });
  }

  // --- Event Listeners ---

  textInput.addEventListener('input', () => {
    const q = textInput.value.trim();
    if (debounceTimeout) clearTimeout(debounceTimeout);

    if (!q) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimeout = setTimeout(() => {
      fetchLocations(q);
    }, 300);
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (dropdown.style.display === 'block') {
        e.preventDefault();
        const highlighted = dropdown.querySelector('.location-option.highlighted');
        if (highlighted) {
          selectItem(parseInt(highlighted.dataset.index, 10));
        } else if (currentResults.length > 0) {
          selectItem(0);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateDropdown(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateDropdown(-1);
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  textInput.addEventListener('focus', () => {
    const q = textInput.value.trim();
    if (q && currentResults.length > 0) {
      dropdown.style.display = 'block';
      positionDropdown();
    } else if (q) {
      // Re-trigger fetch if focused and has value but no results
      fetchLocations(q);
    }
  });

  const handleScroll = () => {
    if (dropdown.style.display === 'block') {
      const rect = textInput.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        dropdown.style.display = 'none';
      } else {
        positionDropdown();
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  window.addEventListener('resize', positionDropdown, { passive: true });

  function handleOutsideClick(e) {
    if (textInput !== e.target && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
  document.addEventListener('click', handleOutsideClick);

  // Clean up
  const observer = new MutationObserver(() => {
    if (!document.body.contains(textInput)) {
      removeDropdownPortal();
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', positionDropdown);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
