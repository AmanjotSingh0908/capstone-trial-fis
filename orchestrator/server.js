const express = require('express');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const WS_PORT = 8081;
const JWT_SECRET = 'your-secret-key'; // In production, use env var

// In-memory storage (use DB for scaling)
let agents = {};
let experiments = {};

// WebSocket server for agents
const wss = new WebSocket.Server({ port: WS_PORT });
wss.on('connection', (ws, req) => {
  const token = req.url.split('?token=')[1];
  if (!token) {
    ws.close();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      ws.close();
      return;
    }

    const agentId = decoded.agentId;
    agents[agentId].ws = ws;

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      handleAgentMessage(agentId, data);
    });

    ws.on('close', () => {
      delete agents[agentId].ws;
    });
  });
});

// API for agents to register
app.post('/register', (req, res) => {
  const { publicKey } = req.body;
  const agentId = uuidv4();
  const token = jwt.sign({ agentId }, JWT_SECRET);

  agents[agentId] = { publicKey, status: 'registered' };

  res.json({ agentId, token });
});

// API to create experiment
app.post('/experiments', (req, res) => {
  const experiment = { id: uuidv4(), ...req.body, status: 'pending' };
  experiments[experiment.id] = experiment;
  res.json(experiment);
});

// API to list agents
app.get('/agents', (req, res) => {
  res.json(Object.keys(agents));
});

// API to get experiment results
app.get('/experiments/:id', (req, res) => {
  const { id } = req.params;
  if (!experiments[id]) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(experiments[id]);
});

// API to assign experiment to agent
app.post('/experiments/:id/assign/:agentId', (req, res) => {
  const { id, agentId } = req.params;
  if (!experiments[id] || !agents[agentId]) {
    return res.status(404).json({ error: 'Not found' });
  }

  experiments[id].agentId = agentId;
  experiments[id].status = 'assigned';

  // Send to agent
  if (agents[agentId].ws) {
    agents[agentId].ws.send(JSON.stringify({ type: 'experiment', experiment: experiments[id] }));
  }

  res.json({ message: 'Assigned' });
});

// Handle messages from agents
function handleAgentMessage(agentId, data) {
  if (data.type === 'experiment_result') {
    experiments[data.experimentId].results = data.results;
    experiments[data.experimentId].status = 'completed';
    console.log(`Experiment ${data.experimentId} completed by agent ${agentId}`);
  }
}

app.listen(PORT, () => {
  console.log(`Orchestrator running on port ${PORT}, WS on ${WS_PORT}`);
});