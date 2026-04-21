import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'contract-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const signer = await provider.getSigner(config.demoServiceAddress);
const contract = new ethers.Contract(config.contractAddress, config.abi, signer);

const dbPath = path.join(process.cwd(), 'db.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ reports: [] }, null, 2));
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
const toJsonSafe = (value) => JSON.parse(
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
);

const statusMap = { clean: 0, warning: 1, blacklisted: 2 };

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/reports', async (req, res) => {
  try {
    const payload = req.body;
    const serial = String(payload.serial || '').trim();
    if (!serial) return res.status(400).json({ error: 'serial is required' });

    const salt = String(payload.salt || 'demo-salt');
    const deviceHash = ethers.keccak256(ethers.toUtf8Bytes(`${serial}:${salt}`));
    const reportDocument = {
      model: payload.model,
      serialMasked: serial.slice(0, 3) + '***' + serial.slice(-2),
      diagnostics: payload.diagnostics || {},
      status: payload.status || 'clean',
      createdAt: new Date().toISOString(),
      serviceName: payload.serviceName || 'RefurbChain Demo Service'
    };
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(reportDocument)));
    const metadataURI = `local://reports/${reportHash}`;
    const flags = Number(payload.flags || 0);

    const tx = await contract.registerReport(deviceHash, reportHash, statusMap[payload.status || 'clean'], flags, metadataURI);
    const receipt = await tx.wait();
    const reportEvent = receipt.logs.map(log => {
      try { return contract.interface.parseLog(log); } catch { return null; }
    }).find(Boolean);
    const reportId = Number(reportEvent.args.reportId);

    const db = readDb();
    const record = { reportId, deviceHash, reportHash, metadataURI, txHash: receipt.hash, ...reportDocument };
    db.reports.push(record);
    writeDb(db);

    const verifyUrl = `http://localhost:5173/verify/${reportId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    res.json({ reportId, deviceHash, reportHash, txHash: receipt.hash, verifyUrl, qrDataUrl, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/reports/:id', async (req, res) => {
  const reportId = Number(req.params.id);
  const db = readDb();
  const record = db.reports.find(r => r.reportId === reportId);
  if (!record) return res.status(404).json({ error: 'not found' });
  const chainReport = await contract.reportsById(reportId);
  const trusted = await contract.isTrustedService(chainReport.serviceAddress);
  res.json({ record, chainReport: toJsonSafe(chainReport), trusted });
});

app.get('/devices/:deviceHash', async (req, res) => {
  const ids = await contract.getReportIdsByDevice(req.params.deviceHash);
  const db = readDb();
  res.json({ ids: ids.map(x => Number(x)), reports: db.reports.filter(r => r.deviceHash === req.params.deviceHash) });
});

app.listen(3001, () => console.log('Backend on http://localhost:3001'));
