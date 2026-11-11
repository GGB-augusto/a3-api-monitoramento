const companyForm = document.querySelector('#company-form');
const companyInput = document.querySelector('#company-id');
const createForm = document.querySelector('#create-form');
const editForm = document.querySelector('#edit-form');
const editDialog = document.querySelector('#edit-dialog');
const notice = document.querySelector('#notice');
const historyBody = document.querySelector('#history-body');
const emptyState = document.querySelector('#empty-state');
const chart = document.querySelector('#chart');
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
let records = [];
let editingPeriod = '';
let loadRequestId = 0;

function formatNumber(value) {
  return numberFormat.format(value);
}

function formatPeriod(period) {
  const [year, month] = period.split('-').map(Number);
  return monthFormat.format(new Date(Date.UTC(year, month - 1, 1))).replace('.', '');
}

function showNotice(message = '', kind = '') {
  notice.textContent = message;
  notice.className = `notice${kind ? ` ${kind}` : ''}`;
}

function showFeedback(element, message = '', kind = '') {
  element.textContent = message;
  element.className = `form-feedback${kind ? ` ${kind}` : ''}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    throw new Error(message || `A API respondeu com erro (${response.status}).`);
  }
  return body;
}

function selectedCompany() {
  return companyInput.value.trim();
}

function displayMetric(valueId, variationId, current, variation) {
  document.querySelector(valueId).innerHTML = `${formatNumber(current)} <small>${valueId === '#co2-value' ? 't' : valueId === '#energy-value' ? 'kWh' : 'kg'}</small>`;
  const variationElement = document.querySelector(variationId);
  if (variation === null) {
    variationElement.textContent = 'Sem base de comparação';
    variationElement.className = 'metric-period neutral';
    return;
  }
  const improving = variation <= 0;
  variationElement.textContent = `${variation > 0 ? '+' : ''}${formatNumber(variation)}%`;
  variationElement.className = `metric-period ${improving ? 'positive' : 'negative'}`;
}

function renderMetrics(indicators) {
  displayMetric('#co2-value', '#co2-change', indicators.emissoesToneladasCO2.atual, indicators.emissoesToneladasCO2.variacaoPercentual);
  displayMetric('#energy-value', '#energy-change', indicators.consumoEnergiaKwh.atual, indicators.consumoEnergiaKwh.variacaoPercentual);
  displayMetric('#waste-value', '#waste-change', indicators.residuosKg.atual, indicators.residuosKg.variacaoPercentual);
}

function renderChart() {
  chart.replaceChildren();
  if (records.length === 0) return;
  const values = records.slice(-8);
  const max = Math.max(...values.map((record) => record.emissoesToneladasCO2), 1);

  for (const [index, record] of values.entries()) {
    const item = document.createElement('div');
    item.className = `chart-item${index === values.length - 1 ? ' current' : ''}`;
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${Math.max((record.emissoesToneladasCO2 / max) * 100, 4)}%`;
    bar.title = `${formatNumber(record.emissoesToneladasCO2)} t de CO₂`;
    const value = document.createElement('span');
    value.className = 'chart-value';
    value.textContent = formatNumber(record.emissoesToneladasCO2);
    const label = document.createElement('span');
    label.className = 'chart-label';
    label.textContent = formatPeriod(record.periodo);
    item.append(value, bar, label);
    chart.append(item);
  }
}

function actionButton(label, className, period, accessibleLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.period = period;
  button.setAttribute('aria-label', `${accessibleLabel} ${formatPeriod(period)}`);
  button.textContent = label;
  return button;
}

function renderHistory() {
  historyBody.replaceChildren();
  document.querySelector('#record-count').textContent = `${records.length} ${records.length === 1 ? 'período' : 'períodos'}`;
  emptyState.hidden = records.length > 0;
  document.querySelector('#chart-wrap').hidden = records.length === 0;

  for (const record of [...records].reverse()) {
    const row = document.createElement('tr');
    const period = document.createElement('td');
    period.className = 'period-cell';
    period.textContent = formatPeriod(record.periodo);
    const emissions = document.createElement('td');
    emissions.innerHTML = `<span class="emissions-dot"></span>${formatNumber(record.emissoesToneladasCO2)} <small>t</small>`;
    const energy = document.createElement('td');
    energy.textContent = `${formatNumber(record.consumoEnergiaKwh)} kWh`;
    const waste = document.createElement('td');
    waste.textContent = `${formatNumber(record.residuosKg)} kg`;
    const actions = document.createElement('td');
    actions.className = 'row-actions';
    actions.append(
      actionButton('Editar', 'action-button edit-action', record.periodo, 'Editar'),
      actionButton('Excluir', 'action-button delete-action', record.periodo, 'Excluir'),
    );
    row.append(period, emissions, energy, waste, actions);
    historyBody.append(row);
  }
  renderChart();
}

function resetMetrics() {
  for (const [valueId, variationId] of [['#co2-value', '#co2-change'], ['#energy-value', '#energy-change'], ['#waste-value', '#waste-change']]) {
    document.querySelector(valueId).innerHTML = '— <small></small>';
    const element = document.querySelector(variationId);
    element.textContent = 'Aguardando dados';
    element.className = 'metric-period neutral';
  }
}

async function loadCompany() {
  const companyId = selectedCompany();
  if (!companyId) {
    showNotice('Informe o identificador da empresa para carregar os dados.', 'error');
    return;
  }

  const requestId = ++loadRequestId;
  showNotice('Carregando dados da empresa…');
  records = [];
  renderHistory();
  resetMetrics();
  try {
    const data = await apiRequest(`/sustentabilidade/${encodeURIComponent(companyId)}`);
    if (requestId !== loadRequestId || companyId !== selectedCompany()) return;
    records = data;
    renderHistory();
    if (records.length >= 2) {
      const indicators = await apiRequest(`/sustentabilidade/${encodeURIComponent(companyId)}/indicadores`);
      if (requestId !== loadRequestId || companyId !== selectedCompany()) return;
      renderMetrics(indicators);
      showNotice(`Dados de ${companyId} atualizados.`, 'success');
    } else if (records.length === 1) {
      showNotice('Registro carregado. Adicione mais um mês para comparar os indicadores.', 'success');
    } else {
      showNotice('Nenhum registro encontrado. Cadastre os dados do primeiro mês.');
    }
    localStorage.setItem('verde-metrica-company', companyId);
  } catch (error) {
    if (requestId === loadRequestId && companyId === selectedCompany()) {
      showNotice(`Não foi possível carregar os dados: ${error.message}`, 'error');
    }
  }
}

function numericValue(formData, name) {
  const value = Number(formData.get(name));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Informe valores numéricos válidos, iguais ou maiores que zero.');
  }
  return value;
}

function metricsFromForm(formData) {
  return {
    emissoesToneladasCO2: numericValue(formData, 'emissoesToneladasCO2'),
    consumoEnergiaKwh: numericValue(formData, 'consumoEnergiaKwh'),
    residuosKg: numericValue(formData, 'residuosKg'),
  };
}

companyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadCompany();
});

createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = document.querySelector('#form-feedback');
  if (!selectedCompany()) {
    showFeedback(feedback, 'Selecione uma empresa antes de salvar.', 'error');
    return;
  }

  const submitButton = createForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showFeedback(feedback, '');
  try {
    const formData = new FormData(createForm);
    await apiRequest('/sustentabilidade', {
      method: 'POST',
      body: JSON.stringify({
        empresaId: selectedCompany(),
        periodo: formData.get('periodo'),
        ...metricsFromForm(formData),
      }),
    });
    createForm.reset();
    document.querySelector('#period').value = new Date().toISOString().slice(0, 7);
    showFeedback(feedback, 'Registro salvo com sucesso.', 'success');
    await loadCompany();
  } catch (error) {
    showFeedback(feedback, error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

historyBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-period]');
  if (!button) return;
  const record = records.find((item) => item.periodo === button.dataset.period);
  if (!record) return;

  if (button.classList.contains('edit-action')) {
    editingPeriod = record.periodo;
    document.querySelector('#edit-period-label').textContent = formatPeriod(record.periodo);
    editForm.elements.emissoesToneladasCO2.value = record.emissoesToneladasCO2;
    editForm.elements.consumoEnergiaKwh.value = record.consumoEnergiaKwh;
    editForm.elements.residuosKg.value = record.residuosKg;
    showFeedback(document.querySelector('#edit-feedback'), '');
    editDialog.showModal();
    return;
  }

  if (!window.confirm(`Excluir o registro de ${formatPeriod(record.periodo)}? Esta ação não pode ser desfeita.`)) return;
  button.disabled = true;
  try {
    await apiRequest(`/sustentabilidade/${encodeURIComponent(selectedCompany())}/${encodeURIComponent(record.periodo)}`, { method: 'DELETE' });
    showNotice('Registro excluído.', 'success');
    await loadCompany();
  } catch (error) {
    showNotice(`Não foi possível excluir o registro: ${error.message}`, 'error');
    button.disabled = false;
  }
});

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = document.querySelector('#edit-feedback');
  const submitButton = editForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await apiRequest(`/sustentabilidade/${encodeURIComponent(selectedCompany())}/${encodeURIComponent(editingPeriod)}`, {
      method: 'PUT',
      body: JSON.stringify(metricsFromForm(new FormData(editForm))),
    });
    editDialog.close();
    showNotice('Registro atualizado com sucesso.', 'success');
    await loadCompany();
  } catch (error) {
    showFeedback(feedback, error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('#close-dialog').addEventListener('click', () => editDialog.close());
editDialog.addEventListener('click', (event) => {
  if (event.target === editDialog) editDialog.close();
});

companyInput.value = localStorage.getItem('verde-metrica-company') || 'empresa01';
document.querySelector('#period').value = new Date().toISOString().slice(0, 7);
loadCompany();
