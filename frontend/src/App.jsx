import React, { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  model: 'iPhone 13',
  serial: 'ABC123456789',
  salt: 'demo-salt',
  serviceName: 'RefurbChain Demo Service',
  status: 'clean',
  diagnostics: {
    batteryHealth: 86,
    rootCheck: 'not_rooted',
    stolenCheck: 'clear',
    screen: 'minor scratches'
  }
};

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [created, setCreated] = useState(null);
  const [report, setReport] = useState(null);
  const route = window.location.pathname;
  const reportIdFromRoute = useMemo(() => {
    const parts = route.split('/').filter(Boolean);
    return parts[0] === 'verify' ? parts[1] : null;
  }, [route]);

  useEffect(() => {
    if (reportIdFromRoute) {
      fetch(`http://localhost:3001/reports/${reportIdFromRoute}`)
        .then(r => r.json())
        .then(setReport)
        .catch(console.error);
    }
  }, [reportIdFromRoute]);

  const submit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3001/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    setCreated(data);
  };

  if (reportIdFromRoute) {
    return (
      <div className="page">
        <div className="card">
          <h1>Паспорт устройства</h1>
          {!report ? <p>Загрузка...</p> : (
            <>
              <p><strong>Модель:</strong> {report.record.model}</p>
              <p><strong>Статус:</strong> {report.record.status}</p>
              <p><strong>Сервис:</strong> {report.record.serviceName}</p>
              <p><strong>Батарея:</strong> {report.record.diagnostics.batteryHealth}%</p>
              <p><strong>Root/Jailbreak:</strong> {report.record.diagnostics.rootCheck}</p>
              <p><strong>Кража:</strong> {report.record.diagnostics.stolenCheck}</p>
              <p><strong>Экран:</strong> {report.record.diagnostics.screen}</p>
              <p><strong>Хэш отчёта:</strong> <code>{report.record.reportHash}</code></p>
              <p><strong>Надёжный сервис:</strong> {String(report.trusted)}</p>
              <p><strong>TX:</strong> <code>{report.record.txHash}</code></p>
              <a href="/">Назад</a>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page two-col">
      <form className="card" onSubmit={submit}>
        <h1>RefurbChain Admin</h1>
        <label>Модель<input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></label>
        <label>Серийный номер<input value={form.serial} onChange={e => setForm({ ...form, serial: e.target.value })} /></label>
        <label>Salt<input value={form.salt} onChange={e => setForm({ ...form, salt: e.target.value })} /></label>
        <label>Сервис<input value={form.serviceName} onChange={e => setForm({ ...form, serviceName: e.target.value })} /></label>
        <label>Статус
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="clean">clean</option>
            <option value="warning">warning</option>
            <option value="blacklisted">blacklisted</option>
          </select>
        </label>
        <label>Battery health<input type="number" value={form.diagnostics.batteryHealth} onChange={e => setForm({ ...form, diagnostics: { ...form.diagnostics, batteryHealth: Number(e.target.value) } })} /></label>
        <label>Root check<input value={form.diagnostics.rootCheck} onChange={e => setForm({ ...form, diagnostics: { ...form.diagnostics, rootCheck: e.target.value } })} /></label>
        <label>Stolen check<input value={form.diagnostics.stolenCheck} onChange={e => setForm({ ...form, diagnostics: { ...form.diagnostics, stolenCheck: e.target.value } })} /></label>
        <label>Screen<input value={form.diagnostics.screen} onChange={e => setForm({ ...form, diagnostics: { ...form.diagnostics, screen: e.target.value } })} /></label>
        <button type="submit">Создать паспорт</button>
      </form>
      <div className="card">
        <h2>Результат</h2>
        {!created ? <p>После создания появятся reportId, QR и ссылка проверки.</p> : (
          <>
            <p><strong>Report ID:</strong> {created.reportId}</p>
            <p><strong>Device hash:</strong> <code>{created.deviceHash}</code></p>
            <p><strong>Report hash:</strong> <code>{created.reportHash}</code></p>
            <p><strong>TX:</strong> <code>{created.txHash}</code></p>
            <p><a href={created.verifyUrl} target="_blank" rel="noreferrer">Открыть страницу проверки</a></p>
            <img src={created.qrDataUrl} alt="QR" />
          </>
        )}
      </div>
    </div>
  );
}
