# Capstone Trial: Fault Injection System (FIS) - SaaS Platform

This project implements a scalable, cloud-agnostic Fault Injection System (FIS) for chaos engineering in modular monolithic software. Inspired by Chaos Monkey, it provides a SaaS orchestrator and distributed agents for automated fault injection and resilience testing.

## Architecture

### **Experiment Orchestrator (SaaS)**
- **Location**: Hosted on cloud (e.g., AWS, GCP)
- **Role**: Defines experiments, coordinates agents, aggregates results
- **Tech**: Node.js + WebSockets for real-time communication
- **APIs**: REST for experiment management, WS for agent communication

### **Agent**
- **Location**: Runs on user's VM/machine (outbound-only traffic)
- **Role**: Executes faults locally, collects metrics, streams results
- **Tech**: Node.js + WebSockets for orchestrator connection
- **Security**: Key-pair authentication, JWT tokens

### **Communication**
- **Persistent Connection**: WebSockets for real-time experiment execution
- **Fallback**: Polling mechanism (configurable)
- **Security**: TLS/SSL, JWT authentication

## Components

- **Orchestrator**: `orchestrator/` - SaaS server
- **Agent**: `agent/` - Local fault executor
- **Chaos Engine**: `chaos/` - Custom fault injection scripts

## Fault Types

- **Memory Stress**: Custom Node.js script allocates memory buffers
- **Network Latency**: Pauses container to simulate outages
- **DB I/O Stress**: Custom script performs disk operations
- **Kill Processes**: Terminates app/DB processes
- **Pause Containers**: Pauses Docker containers

## Setup & Usage

### **1. Run Orchestrator (SaaS)**
```bash
cd orchestrator
npm install
npm start  # Runs on port 8080 (WS: 8081)
```

### **2. Install Agent on VM**
```bash
cd agent
npm install
npm start  # Registers and connects to orchestrator
```

### **3. Create Experiment**
```bash
curl -X POST http://localhost:8080/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Memory Test",
    "faults": [
      {"type": "memory", "duration": 10}
    ]
  }'
```

### **4. Assign to Agent**
```bash
curl -X POST http://localhost:8080/experiments/{exp-id}/assign/{agent-id}
```

## Scaling Considerations

- **Orchestrator**: Use load balancer, Redis for state, DB for persistence
- **Agents**: Stateless, auto-register, support 1000s of concurrent agents
- **Metrics**: Integrate Prometheus/Grafana for observability
- **Security**: OAuth, rate limiting, audit logs
- **Rollback**: Automatic fault reversal, VM snapshots for safety

## Deployment

- **Docker**: Containerize orchestrator/agent
- **Kubernetes**: Deploy orchestrator as service, agents as DaemonSets
- **Cloud**: Orchestrator on EKS/GKE, agents on user infra

This FIS enables enterprise-grade chaos engineering, scalable to thousands of VMs with real-time monitoring and automated remediation suggestions.