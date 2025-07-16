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
  // Render settings in order, but always render the custom icon toggle first
  const sortedSettings = [
    ...settings.filter(s => s.property === 'zen-menu-reveal-custom-icon.enable-custom-icon'),
    ...settings.filter(s => s.property !== 'zen-menu-reveal-custom-icon.enable-custom-icon')
  ];
  sortedSettings.forEach(setting => {
    // Improved conditional display logic
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
        // Re-render to update conditional fields
        renderSettings(settings);
      });
    } else if (setting.type === 'text' || setting.type === 'string') {
      input = document.createElement('input');
      input.type = 'text';
      input.id = setting.property;
      input.value = getSettingValue(setting.property, setting.defaultValue);
      if (setting.placeholder) input.placeholder = setting.placeholder;
      // SVG validation for custom icon URL
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
    } else if (setting.type === 'select') {
      input = document.createElement('select');
      input.id = setting.property;
      setting.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
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

document.getElementById('save-btn').addEventListener('click', () => {
  alert('Settings saved! (Reload extension to apply)');
});

loadPreferences().then(renderSettings); 