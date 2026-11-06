const nodes = [
  { id: "A", name: "校門", x: 82, y: 112, labelY: 153 },
  { id: "B", name: "圖書館", x: 292, y: 68, labelY: 109 },
  { id: "C", name: "餐廳", x: 232, y: 218, labelY: 259 },
  { id: "D", name: "系館", x: 460, y: 158, labelY: 199 },
  { id: "E", name: "宿舍", x: 408, y: 322, labelY: 363 },
  { id: "F", name: "體育館", x: 622, y: 282, labelY: 323 },
];

const edges = [
  { from: "A", to: "B", weight: 4, labelX: 185, labelY: 77 },
  { from: "A", to: "C", weight: 2, labelX: 145, labelY: 176 },
  { from: "B", to: "C", weight: 1, labelX: 272, labelY: 135 },
  { from: "B", to: "D", weight: 5, labelX: 382, labelY: 99 },
  { from: "C", to: "D", weight: 8, labelX: 348, labelY: 191 },
  { from: "C", to: "E", weight: 10, labelX: 309, labelY: 280 },
  { from: "D", to: "E", weight: 2, labelX: 451, labelY: 247 },
  { from: "D", to: "F", weight: 6, labelX: 552, labelY: 207 },
  { from: "E", to: "F", weight: 3, labelX: 522, labelY: 315 },
].sort((a, b) => a.weight - b.weight);

const groupColors = ["#6886e8", "#38ad85", "#dc9a49", "#a477d1", "#e27683", "#4b9fc0"];
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const edgeLayer = document.querySelector("#edge-layer");
const nodeLayer = document.querySelector("#node-layer");
const edgeList = document.querySelector("#edge-list");
const parentArray = document.querySelector("#parent-array");
const groupsList = document.querySelector("#groups-list");
const description = document.querySelector("#step-description");
const componentCount = document.querySelector("#component-count");
const totalWeight = document.querySelector("#total-weight");
const stepCount = document.querySelector("#step-count");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const prevButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const playButton = document.querySelector("#play-button");
const resetButton = document.querySelector("#reset-button");

function createUnionFind() {
  return {
    parent: nodes.map((node) => node.id),
    rank: nodes.map(() => 0),
  };
}

function findRoot(parent, nodeId) {
  let index = nodes.findIndex((node) => node.id === nodeId);
  while (parent[index] !== nodes[index].id) {
    index = nodes.findIndex((node) => node.id === parent[index]);
  }
  return index;
}

function buildSteps() {
  const { parent, rank } = createUnionFind();
  const steps = [];
  let acceptedCount = 0;
  let weight = 0;

  for (const edge of edges) {
    const fromRoot = findRoot(parent, edge.from);
    const toRoot = findRoot(parent, edge.to);
    const accepted = fromRoot !== toRoot;

    if (accepted) {
      if (rank[fromRoot] < rank[toRoot]) {
        parent[fromRoot] = nodes[toRoot].id;
      } else {
        parent[toRoot] = nodes[fromRoot].id;
        if (rank[fromRoot] === rank[toRoot]) rank[fromRoot] += 1;
      }
      acceptedCount += 1;
      weight += edge.weight;
    }

    steps.push({
      edge,
      result: accepted ? "accepted" : "rejected",
      parent: [...parent],
      weight,
    });

    if (acceptedCount === nodes.length - 1) break;
  }

  return steps;
}

const steps = buildSteps();
let currentStep = 0;
let autoplayTimer = null;

function renderGraph() {
  edgeLayer.innerHTML = edges.map((edge, index) => `
    <g class="edge-group" data-edge-index="${index}">
      <line
        class="edge-line"
        x1="${nodeById.get(edge.from).x}"
        y1="${nodeById.get(edge.from).y}"
        x2="${nodeById.get(edge.to).x}"
        y2="${nodeById.get(edge.to).y}"
      ></line>
      <g class="weight-group">
        <rect
          class="weight-label-bg"
          x="${edge.labelX - 15}"
          y="${edge.labelY - 11}"
          width="30"
          height="22"
          rx="7"
        ></rect>
        <text class="weight-label" x="${edge.labelX}" y="${edge.labelY}">${edge.weight}</text>
      </g>
    </g>
  `).join("");

  nodeLayer.innerHTML = nodes.map((node, index) => `
    <g class="node-group" data-node-id="${node.id}">
      <circle class="node-halo" cx="${node.x}" cy="${node.y}" r="23"></circle>
      <circle
        class="node-circle"
        cx="${node.x}"
        cy="${node.y}"
        r="17"
        fill="${groupColors[index]}"
      ></circle>
      <text class="node-code" x="${node.x}" y="${node.y}">${node.id}</text>
      <text class="node-name" x="${node.x}" y="${node.labelY}">${node.name}</text>
    </g>
  `).join("");
}

function renderEdgeList() {
  edgeList.innerHTML = edges.map((edge, index) => `
    <li class="edge-row" data-edge-index="${index}">
      <span class="edge-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="edge-name">${edge.from} — ${edge.to}</span>
      <span class="edge-weight">${edge.weight}</span>
    </li>
  `).join("");
}

function getGroups(parent) {
  const groups = new Map();
  nodes.forEach((node, index) => {
    const rootIndex = findRoot(parent, node.id);
    const rootId = nodes[rootIndex].id;
    if (!groups.has(rootId)) groups.set(rootId, []);
    groups.get(rootId).push(node.id);
  });
  return groups;
}

function renderState() {
  const step = currentStep > 0 ? steps[currentStep - 1] : null;
  const parent = step ? step.parent : nodes.map((node) => node.id);
  const groups = getGroups(parent);

  parentArray.innerHTML = nodes.map((node, index) => `
    <div class="parent-cell">
      <span>${node.id}</span>
      <strong>${parent[index]}</strong>
    </div>
  `).join("");

  groupsList.innerHTML = [...groups.entries()].map(([rootId, members]) => {
    const colorIndex = nodes.findIndex((node) => node.id === rootId);
    return `
      <span class="group-chip" style="--group-color: ${groupColors[colorIndex]}">
        <i class="group-dot"></i>${members.join(", ")}
      </span>
    `;
  }).join("");

  componentCount.textContent = `${groups.size} 個集合`;
  totalWeight.textContent = step ? String(step.weight) : "0";
  description.textContent = getStepDescription(step);

  nodes.forEach((node) => {
    const rootIndex = findRoot(parent, node.id);
    const color = groupColors[rootIndex];
    const nodeGroup = nodeLayer.querySelector(`[data-node-id="${node.id}"]`);
    nodeGroup.querySelector(".node-circle").setAttribute("fill", color);
    nodeGroup.querySelector(".node-halo").setAttribute("stroke", `${color}55`);
  });
}

function getStepDescription(step) {
  if (!step) return "按下「下一步」，從權重最小的邊開始檢查。";
  const { edge, result } = step;
  if (result === "accepted") {
    return `邊 ${edge.from}–${edge.to} 權重為 ${edge.weight}，兩端尚未連通，未成環，加入 MST。`;
  }
  return `邊 ${edge.from}–${edge.to} 權重為 ${edge.weight}，兩端已在同一組，會形成迴圈，跳過。`;
}

function renderStep() {
  const activeStep = currentStep > 0 ? steps[currentStep - 1] : null;
  const activeEdgeIndex = activeStep ? edges.indexOf(activeStep.edge) : -1;

  document.querySelectorAll(".edge-group").forEach((group, index) => {
    const line = group.querySelector(".edge-line");
    const label = group.querySelector(".weight-group");
    const row = edgeList.querySelector(`[data-edge-index="${index}"]`);
    line.classList.remove("is-current", "is-accepted", "is-rejected");
    label.classList.remove("is-current", "is-accepted", "is-rejected");
    row.classList.remove("is-current", "is-accepted", "is-rejected");

    const processedStep = steps.find((candidate) => candidate.edge === edges[index]);
    if (processedStep && steps.indexOf(processedStep) < currentStep) {
      line.classList.add(`is-${processedStep.result}`);
      label.classList.add(`is-${processedStep.result}`);
      row.classList.add(`is-${processedStep.result}`);
    }

    if (index === activeEdgeIndex) {
      line.classList.remove("is-accepted", "is-rejected");
      label.classList.remove("is-accepted", "is-rejected");
      row.classList.remove("is-accepted", "is-rejected");
      line.classList.add(activeStep.result === "accepted" ? "is-accepted" : "is-rejected");
      label.classList.add(activeStep.result === "accepted" ? "is-accepted" : "is-rejected");
      row.classList.add(currentStep === steps.length ? `is-${activeStep.result}` : "is-current");
    }
  });

  stepCount.textContent = `${currentStep} / ${steps.length}`;
  progressTrack.setAttribute("aria-valuemax", String(steps.length));
  progressTrack.setAttribute("aria-valuenow", String(currentStep));
  progressFill.style.width = `${(currentStep / steps.length) * 100}%`;
  prevButton.disabled = currentStep === 0;
  nextButton.disabled = currentStep === steps.length;
  renderState();
}

function stopAutoplay() {
  if (autoplayTimer !== null) {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  playButton.innerHTML = '<span aria-hidden="true">▶</span> 自動播放';
  playButton.setAttribute("aria-pressed", "false");
}

function goToStep(step) {
  currentStep = Math.max(0, Math.min(steps.length, step));
  renderStep();
  if (currentStep === steps.length) stopAutoplay();
}

function toggleAutoplay() {
  if (autoplayTimer !== null) {
    stopAutoplay();
    return;
  }
  if (currentStep === steps.length) goToStep(0);
  playButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> 暫停播放';
  playButton.setAttribute("aria-pressed", "true");
  autoplayTimer = window.setInterval(() => goToStep(currentStep + 1), 1200);
}

prevButton.addEventListener("click", () => {
  stopAutoplay();
  goToStep(currentStep - 1);
});

nextButton.addEventListener("click", () => {
  stopAutoplay();
  goToStep(currentStep + 1);
});

playButton.addEventListener("click", toggleAutoplay);

resetButton.addEventListener("click", () => {
  stopAutoplay();
  goToStep(0);
});

renderGraph();
renderEdgeList();
renderStep();
