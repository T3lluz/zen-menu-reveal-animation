async function loadPreferences() {
  const resp = await fetch('preferences.json');
  return await resp.json();
}

function getSettingValue(property, defaultValue) {
  const val = localStorage.getItem(property);
  if (val === null || val === undefined) return defaultValue;
  return val;
}

function setSettingValue(property, value) {
  localStorage.setItem(property, value);
}

function isValidSvgUrl(url) {
  if (!url) return false;
  url = url.trim();
  return url.endsWith('.svg') || url.startsWith('data:image/svg+xml');
}

function isShowIfEnabled(setting, currentValues, settings) {
  if (!setting.showIf) return true;
  const dep = setting.showIf;
  // Find the dependency's default value
  const depSetting = settings.find(s => s.property === dep);
  const depDefault = depSetting ? depSetting.defaultValue : false;
  const val = currentValues[dep];
  return val === true || val === 'true' || (val === undefined && (depDefault === true || depDefault === 'true'));
}

function renderSettings(settings) {
  const form = document.getElementById('settings-form');
  form.innerHTML = '';
  // Track current values for conditional display
  const currentValues = {};
  settings.forEach(setting => {
    currentValues[setting.property] = getSettingValue(setting.property, setting.defaultValue);
  });
  // Render settings in the order they appear in preferences.json
  settings.forEach(setting => {
    if (!isShowIfEnabled(setting, currentValues, settings)) {
      return;
    }
    const div = document.createElement('div');
    div.className = 'setting';
    const label = document.createElement('label');
    label.textContent = setting.label;
    label.htmlFor = setting.property;
    div.appendChild(label);
    let input;
    let warning;
    if (setting.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = setting.property;
      input.checked = getSettingValue(setting.property, setting.defaultValue) === 'true' || getSettingValue(setting.property, setting.defaultValue) === true;
      input.addEventListener('change', () => {
        setSettingValue(setting.property, input.checked);
        renderSettings(settings);
      });
    } else if (setting.type === 'text' || setting.type === 'string') {
      input = document.createElement('input');
      input.type = 'text';
      input.id = setting.property;
      input.value = getSettingValue(setting.property, setting.defaultValue);
      if (setting.placeholder) input.placeholder = setting.placeholder;
      if (setting.property === 'zen-menu-reveal-custom-icon.custom-icon-url') {
        warning = document.createElement('div');
        warning.style.color = 'orange';
        warning.style.fontSize = '0.95em';
        warning.style.marginTop = '0.2em';
        const validate = () => {
          if (input.value && !isValidSvgUrl(input.value)) {
            warning.textContent = 'Only SVG URLs or data:image/svg+xml are allowed.';
          } else {
            warning.textContent = '';
          }
        };
        input.addEventListener('input', () => {
          setSettingValue(setting.property, input.value);
          validate();
        });
        validate();
      } else {
        input.addEventListener('input', () => setSettingValue(setting.property, input.value));
      }
    } else if (setting.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.id = setting.property;
      input.value = getSettingValue(setting.property, setting.defaultValue);
      if (setting.min !== undefined) input.min = setting.min;
      if (setting.max !== undefined) input.max = setting.max;
      input.addEventListener('input', () => setSettingValue(setting.property, input.value));
    } else if (setting.type === 'dropdown') {
      input = document.createElement('select');
      input.id = setting.property;
      if (setting.placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = setting.placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = getSettingValue(setting.property, setting.defaultValue) === '';
        input.appendChild(placeholderOption);
      }
      (setting.options || []).forEach(opt => {
        const option = document.createElement('option');
        if (typeof opt === 'object') {
          option.value = opt.value;
          option.textContent = opt.label;
        } else {
          option.value = opt;
          option.textContent = opt;
        }
        input.appendChild(option);
      });
      input.value = getSettingValue(setting.property, setting.defaultValue);
      input.addEventListener('change', () => setSettingValue(setting.property, input.value));
    }
    div.appendChild(input);
    if (warning) div.appendChild(warning);
    form.appendChild(div);
  });
}

function getIconSizePx() {
  let val = getSettingValue('zen-menu-reveal-custom-icon.icon-size', '16px');
  if (typeof val === 'string' && val.endsWith('px')) {
    val = val.replace('px', '');
  }
  const px = parseInt(val, 10);
  if (isNaN(px) || px < 12 || px > 20) return 16;
  return px;
}

function getCustomIconUrl() {
  let val = getSettingValue('zen-menu-reveal-custom-icon.custom-icon-url', '');
  if (!val) return '';
  return val;
}

function updateCustomIconCssVars() {
  // Set CSS variables for live preview (for options.html or Sine live preview)
  const url = getSettingValue('zen-menu-reveal-custom-icon.custom-icon-url', '');
  const size = getSettingValue('zen-menu-reveal-custom-icon.icon-size', '16px');
  if (url && url.startsWith('url(')) {
    document.documentElement.style.setProperty('--zen-custom-icon-url', url);
  } else {
    document.documentElement.style.removeProperty('--zen-custom-icon-url');
  }
  if (size && /^\d+(px)?$/.test(size)) {
    document.documentElement.style.setProperty('--zen-custom-icon-size', size.replace(/[^\d]/g, '') + 'px');
  } else {
    document.documentElement.style.removeProperty('--zen-custom-icon-size');
  }
}

// Patch input listeners to update CSS vars
function patchLiveCssVars(settings) {
  settings.forEach(setting => {
    const input = document.getElementById(setting.property);
    if (!input) return;
    if (setting.property === 'zen-menu-reveal-custom-icon.custom-icon-url' || setting.property === 'zen-menu-reveal-custom-icon.icon-size') {
      input.addEventListener('input', updateCustomIconCssVars);
    }
  });
}

document.getElementById('save-btn').addEventListener('click', () => {
  alert('Settings saved! (Reload extension to apply)');
});

loadPreferences().then(settings => {
  renderSettings(settings);
  patchLiveCssVars(settings);
  updateCustomIconCssVars();
}); 