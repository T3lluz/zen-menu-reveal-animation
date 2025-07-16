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
  settings.forEach(setting => {
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
      input.addEventListener('change', () => setSettingValue(setting.property, input.checked));
    } else if (setting.type === 'text') {
      input = document.createElement('input');
      input.type = 'text';
      input.id = setting.property;
      input.value = getSettingValue(setting.property, setting.defaultValue);
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