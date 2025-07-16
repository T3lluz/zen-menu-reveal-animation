async function loadPreferences() {
  const resp = await fetch('preferences.json');
  return await resp.json();
}

function getSettingValue(property, defaultValue) {
  return localStorage.getItem(property) ?? defaultValue;
}

function setSettingValue(property, value) {
  localStorage.setItem(property, value);
}

function renderSettings(settings) {
  const form = document.getElementById('settings-form');
  form.innerHTML = '';
  // Track current values for conditional display
  const currentValues = {};
  settings.forEach(setting => {
    currentValues[setting.property] = getSettingValue(setting.property, setting.defaultValue);
  });
  settings.forEach(setting => {
    // Conditional display logic
    if (setting.showIf) {
      const dep = setting.showIf;
      if (!(currentValues[dep] === true || currentValues[dep] === 'true')) {
        return; // Skip rendering if dependency not met
      }
    }
    const div = document.createElement('div');
    div.className = 'setting';
    const label = document.createElement('label');
    label.textContent = setting.label;
    label.htmlFor = setting.property;
    div.appendChild(label);
    let input;
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
    form.appendChild(div);
  });
}

document.getElementById('save-btn').addEventListener('click', () => {
  alert('Settings saved! (Reload extension to apply)');
});

loadPreferences().then(renderSettings); 