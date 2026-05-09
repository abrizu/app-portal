/**
 * techTagInput.js
 * Reusable tech-tag autocomplete widget.
 *
 * Usage:
 *   initTechTagInput('technologies')
 *
 * The function finds the <input id="technologies"> already in the DOM,
 * hides it, and inserts a tag-input UI just before it.
 * The hidden input is kept in sync so form serialisation works unchanged.
 */

// ── Category definitions (order matters — first match wins) ─────────────────
const TECH_CATEGORIES = [
  {
    name: 'Languages',
    color: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.45)', text: '#93c5fd' },
    items: [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#',
      'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
      'R', 'MATLAB', 'Julia', 'Perl', 'Bash', 'Shell', 'SQL', 'NoSQL',
      'HTML', 'CSS', 'Sass', 'Less',
    ],
  },
  {
    name: 'Frameworks & Libraries',
    color: { bg: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.45)', text: '#c4b5fd' },
    items: [
      'React', 'Angular', 'Vue', 'Next.js', 'Node.js',
      'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
      '.NET', 'ASP.NET', 'Rails', 'Laravel', 'Svelte', 'Nuxt',
      'Pandas', 'NumPy', 'SciPy', 'scikit-learn',
      'TensorFlow', 'PyTorch', 'Keras', 'OpenCV',
      'PySpark', 'Spark', 'Hadoop', 'Airflow',
    ],
  },
  {
    name: 'Cloud & DevOps',
    color: { bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.45)', text: '#6ee7b7' },
    items: [
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s',
      'Terraform', 'Ansible', 'Jenkins', 'CI/CD', 'Git', 'GitHub', 'GitLab',
      'Linux', 'Unix',
    ],
  },
  {
    name: 'Databases',
    color: { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)', text: '#fcd34d' },
    items: [
      'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis',
      'Elasticsearch', 'DynamoDB', 'BigQuery', 'Snowflake', 'Databricks',
      'Tableau', 'Power BI', 'Looker',
    ],
  },
  {
    name: 'AI & ML',
    color: { bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.45)', text: '#f9a8d4' },
    items: [
      'Machine Learning', 'Deep Learning', 'NLP', 'Natural Language Processing',
      'Computer Vision', 'AI', 'AI/ML', 'LLM', 'Generative AI',
      'Data Science', 'Data Engineering', 'Data Analysis',
    ],
  },
  {
    name: 'Other',
    color: { bg: 'rgba(6,182,212,0.18)', border: 'rgba(6,182,212,0.45)', text: '#67e8f9' },
    items: [
      'REST', 'RESTful', 'GraphQL', 'API', 'Microservices',
      'Agile', 'Scrum', 'Jira',
    ],
  },
];

// Flat list for autocomplete searching
export const KNOWN_TECH_KEYWORDS = TECH_CATEGORIES.flatMap(c => c.items);

// Build a lookup map: lowercase label → color
const _colorMap = new Map();
for (const cat of TECH_CATEGORIES) {
  for (const item of cat.items) {
    _colorMap.set(item.toLowerCase(), cat.color);
  }
}

// Custom (unknown) tech color
const CUSTOM_COLOR = { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#d1d5db' };

function techColor(label) {
  return _colorMap.get(label.toLowerCase()) ?? CUSTOM_COLOR;
}

// Returns a numeric sort key for a label: 0 = Languages, 1 = Frameworks, … custom = 9999
function categoryIndexOf(label) {
  const k = label.toLowerCase();
  const idx = TECH_CATEGORIES.findIndex(cat =>
    cat.items.some(i => i.toLowerCase() === k)
  );
  return idx === -1 ? 9999 : idx;
}

// ── Shared active dropdown portal ─────────────────────────────────────────────
// We append the dropdown to <body> to escape stacking contexts created by
// backdrop-filter on parent form cards.
let _activeDropdown = null;

function getOrCreateDropdownPortal() {
  if (!_activeDropdown) {
    _activeDropdown = document.createElement('div');
    _activeDropdown.className = 'tech-tag-dropdown';
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
 * @param {string} inputId  - id of the existing <input> element to upgrade
 */
export function initTechTagInput(inputId) {
  const hiddenInput = document.getElementById(inputId);
  if (!hiddenInput) return;

  // Parse any pre-existing comma-separated value
  const initialTags = hiddenInput.value
    ? hiddenInput.value.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  hiddenInput.type = 'hidden';

  // ── Build wrapper DOM ──────────────────────────────────────────────────────
  // Outer wrapper (same width as other form fields)
  const wrapper = document.createElement('div');
  wrapper.className = 'tech-tag-wrapper';

  // Row 1: the text input (same height/style as .form-input)
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'form-input tech-tag-text-input';
  textInput.placeholder = 'Search technologies…';
  textInput.autocomplete = 'off';
  textInput.spellcheck = false;

  // Row 2: tag pills area (below the input)
  const tagArea = document.createElement('div');
  tagArea.className = 'tech-tag-area';
  tagArea.style.display = initialTags.length ? 'flex' : 'none';

  wrapper.appendChild(textInput);
  wrapper.appendChild(tagArea);

  // Insert wrapper immediately before the hidden input
  hiddenInput.parentNode.insertBefore(wrapper, hiddenInput);

  // Dropdown (portal — appended to body)
  const dropdown = getOrCreateDropdownPortal();

  // ── State ──────────────────────────────────────────────────────────────────
  const tags = new Set(initialTags.map(t => t.toLowerCase()));
  const tagLabels = {}; // lowercase → display label
  initialTags.forEach(t => { tagLabels[t.toLowerCase()] = t; });

  // Render existing tags (sorted by category)
  rerenderAllTags();
  syncHidden();

  // ── Position helper ────────────────────────────────────────────────────────
  function positionDropdown() {
    const rect = textInput.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
  }

  // ── Dropdown filtering ─────────────────────────────────────────────────────
  textInput.addEventListener('input', () => {
    const q = textInput.value.trim().toLowerCase();
    if (!q) { dropdown.style.display = 'none'; return; }

    const matches = KNOWN_TECH_KEYWORDS.filter(k =>
      k.toLowerCase().includes(q) && !tags.has(k.toLowerCase())
    ).slice(0, 12);

    renderDropdown(matches, q);
    positionDropdown();
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      // Use the highlighted item (now auto-highlighted on render)
      const highlighted = dropdown.querySelector('.tech-tag-option.highlighted');
      if (highlighted) {
        addTag(highlighted.dataset.label);
      } else {
        // Fallback for edge cases where nothing is highlighted
        const raw = textInput.value.trim().replace(/,$/, '');
        if (raw) addTag(raw);
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
    const q = textInput.value.trim().toLowerCase();
    if (q) { positionDropdown(); }
  });

  // Reposition on scroll / resize
  // Using capture: true to catch scroll events from any container (not just window)
  const handleScroll = () => {
    if (dropdown.style.display === 'block') {
      const rect = textInput.getBoundingClientRect();
      // Hide if it scrolls out of view
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        dropdown.style.display = 'none';
      } else {
        positionDropdown();
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  window.addEventListener('resize', positionDropdown, { passive: true });

  // Close dropdown on outside click
  function handleOutsideClick(e) {
    if (!wrapper.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
  document.addEventListener('click', handleOutsideClick);

  // Clean up when the form page is replaced
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrapper)) {
      removeDropdownPortal();
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', positionDropdown);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function renderDropdown(matches, q) {
    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="tech-tag-option tech-tag-add-custom" data-label="${escHtml(textInput.value.trim())}">
          <span class="tech-tag-add-icon">＋</span>
          Add "<strong>${escHtml(textInput.value.trim())}</strong>"
        </div>`;
    } else {
      // Group by category
      const grouped = TECH_CATEGORIES.map(cat => ({
        ...cat,
        matches: matches.filter(m => cat.items.map(i => i.toLowerCase()).includes(m.toLowerCase())),
      })).filter(g => g.matches.length > 0);

      // Custom results not in any category
      const uncategorised = matches.filter(m =>
        !TECH_CATEGORIES.some(c => c.items.map(i => i.toLowerCase()).includes(m.toLowerCase()))
      );

      let html = '';
      for (const group of grouped) {
        html += `<div class="tech-tag-group-label">${group.name}</div>`;
        html += group.matches.map(k => buildOptionHtml(k, q)).join('');
      }
      if (uncategorised.length) {
        html += `<div class="tech-tag-group-label" style="color:#d1d5db;">Custom</div>`;
        html += uncategorised.map(k => buildOptionHtml(k, q)).join('');
      }

      dropdown.innerHTML = html;
    }
    dropdown.style.display = 'block';

    // Auto-highlight the first option so Enter selects it immediately
    const firstOpt = dropdown.querySelector('.tech-tag-option');
    if (firstOpt) {
      firstOpt.classList.add('highlighted');
    }

    dropdown.querySelectorAll('.tech-tag-option').forEach(opt => {
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        addTag(opt.dataset.label);
      });
    });
  }

  function buildOptionHtml(k, q) {
    const c = techColor(k);
    const highlighted = escHtml(k).replace(
      new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
      '<mark>$1</mark>'
    );
    return `<div class="tech-tag-option" data-label="${escHtml(k)}"
              style="--tag-text:${c.text}">
              ${highlighted}
            </div>`;
  }

  function navigateDropdown(dir) {
    const opts = [...dropdown.querySelectorAll('.tech-tag-option')];
    if (!opts.length) return;
    const cur = dropdown.querySelector('.tech-tag-option.highlighted');
    let idx = cur ? opts.indexOf(cur) + dir : (dir === 1 ? 0 : opts.length - 1);
    idx = (idx + opts.length) % opts.length;
    opts.forEach(o => o.classList.remove('highlighted'));
    opts[idx].classList.add('highlighted');
    opts[idx].scrollIntoView({ block: 'nearest' });
  }

  function addTag(label) {
    const key = label.toLowerCase();
    if (!label || tags.has(key)) {
      textInput.value = '';
      dropdown.style.display = 'none';
      return;
    }
    tags.add(key);
    const canonical = KNOWN_TECH_KEYWORDS.find(k => k.toLowerCase() === key) || label;
    tagLabels[key] = canonical;
    rerenderAllTags();
    syncHidden();
    textInput.value = '';
    dropdown.style.display = 'none';
    textInput.focus();
  }

  function removeTag(key) {
    tags.delete(key);
    delete tagLabels[key];
    const el = tagArea.querySelector(`.tech-tag[data-key="${CSS.escape(key)}"]`);
    if (el) el.remove();
    tagArea.style.display = tags.size ? 'flex' : 'none';
    syncHidden();
  }

  function renderTag(label) {
    const key = label.toLowerCase();
    const c = techColor(label);
    const pill = document.createElement('span');
    pill.className = 'tech-tag';
    pill.dataset.key = key;
    pill.style.cssText = `background:${c.bg};border-color:${c.border};color:${c.text};`;
    pill.innerHTML = `${escHtml(label)}<button type="button" class="tech-tag-remove" aria-label="Remove ${escHtml(label)}">×</button>`;
    pill.querySelector('.tech-tag-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeTag(key);
    });
    tagArea.appendChild(pill);
    tagArea.style.display = 'flex';
  }

  // Re-renders all tag pills in category-sorted order.
  function rerenderAllTags() {
    tagArea.innerHTML = '';
    const sorted = [...tags].sort((a, b) => {
      const ia = categoryIndexOf(tagLabels[a] || a);
      const ib = categoryIndexOf(tagLabels[b] || b);
      if (ia !== ib) return ia - ib;
      // Within the same category, sort alphabetically
      return (tagLabels[a] || a).localeCompare(tagLabels[b] || b);
    });
    for (const key of sorted) {
      renderTag(tagLabels[key] || key);
    }
    tagArea.style.display = tags.size ? 'flex' : 'none';
  }

  function syncHidden() {
    // Serialise in the same sorted order as the displayed tags
    const sorted = [...tags].sort((a, b) => {
      const ia = categoryIndexOf(tagLabels[a] || a);
      const ib = categoryIndexOf(tagLabels[b] || b);
      if (ia !== ib) return ia - ib;
      return (tagLabels[a] || a).localeCompare(tagLabels[b] || b);
    });
    hiddenInput.value = sorted.map(k => tagLabels[k] || k).join(', ');
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
