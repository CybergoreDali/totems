let state = {
  canvasSize: [1200, 750],
  userPositions: {},
  userText: "",
  chatHistory: [],
  usersNearby: false,
  showChat: false,
  totemList: {},
  playerWasPlaced: false
};

let assets = {
  bgMap: {},
  totems: {
    bird: {},
    monkey: {}
  }
};

function preload() {
  assets.bgMap = loadImage("./map.png");
  assets.totems.bird = loadImage("./totems/Vogel.png");
  assets.totems.monkey = loadImage("./totems/Affe.png");
}

function setup() {
  createCanvas(state.canvasSize[0], state.canvasSize[1]);
}

var socket = io();

socket.on("recieve totemList", totemList => {
  state.totemList = totemList;
});

socket.on("chat message", msg => {
  state.showChat = true;
  state.chatHistory.push(msg);
});
socket.on("position update", newPositions => {
  state.userPositions = newPositions;
});

const mouseInside = (pos, dim) =>
  mouseX > pos[0] &&
  mouseX < pos[0] + dim[0] &&
  mouseY > pos[1] &&
  mouseY < pos[1] + dim[1];

function mousePressed(fxn) {
  let nearbyPos = [700, 20];
  let nearbyDim = [200, 50];

  if (mouseX > state.canvasSize[0] || mouseY > state.canvasSize[1]) return;

  if (state.usersNearby && mouseInside(nearbyPos, nearbyDim)) {
    state.showChat = true;
    return;
  }

  if (!state.playerWasPlaced) {
    socket.emit("get totem", socket.io.engine.id);
    state.playerWasPlaced = true;
  }

  state.userPositions[socket.io.engine.id] = [mouseX, mouseY];
  socket.emit("position update", state.userPositions);
}

function keyPressed() {
  const ownId = socket.io.engine.id;
  if (key.length === 1) {
    state.userText += key;
  }

  if (keyCode === 13) {
    console.log("message sent");
    socket.emit("chat message", { id: ownId, msg: state.userText });
    state.userText = "";
  }
}

function calculateDistances() {
  const ownId = socket.io.engine.id;
  let myPostion = state.userPositions[ownId];
  if (!myPostion) return;

  let distances = {};
  for (let positionKey in state.userPositions) {
    if (positionKey === ownId) continue;
    let comparePosition = state.userPositions[positionKey];
    let a = myPostion[0] - comparePosition[0];
    let b = myPostion[1] - comparePosition[1];
    let c = Math.sqrt(a * a + b * b);
    distances[positionKey] = c;
  }
  return distances;
}

function findNearbyUsers(distances) {
  let nearbyUsers = [];
  for (let userId in distances) {
    if (distances[userId] < 190) {
      nearbyUsers.push(userId);
    }
  }
  return nearbyUsers;
}

function showNearbyUsers(nearbyUserIds) {
  const ownId = socket.io.engine.id;

  let position = [700, 20];
  let dismensions = [200, 50];
  let i = 0;
  for (let userId of nearbyUserIds) {
    i += 1;
    fill(255);
    rect(position[0], position[1], dismensions[0], dismensions[1]);
    fill(0);
    text("another user", position[0] + 20, position[1] + i * 25);
  }
}

function drawChat(chatHistory) {
  const ownId = socket.io.engine.id;

  fill(255, 255, 255, 190);
  rect(600, 600, 350, 100, 5);

  let i = 0;
  let displayedLines = chatHistory.slice(-5);
  for (let message of displayedLines) {
    const name = message.id === ownId ? "me" : "other User";
    i += 1;
    fill(0);
    text(`${name}: ${message.msg}`, 600 + 10, 610 + i * 18);
  }
}

function drawTextInput() {
  fill(255);
  rect(600, 700, 350, 25, 5);
  fill(0);
  text(state.userText, 610, 715);
}

function drawUser(userId) {
  // let userIndex = state.userPositions.indexOf(user);
  const userPosition = state.userPositions[userId];
  const totemName = state.totemList[userId];
  const totem = assets.totems[totemName];

  // fill(0 * 100);
  if (totem) {
    image(totem, userPosition[0], userPosition[1], 100, 100);
  }
  // rect(userPosition[0], userPosition[1], 10, 10);
}

function draw() {
  clear();
  image(assets.bgMap, 0, 0, state.canvasSize[0], state.canvasSize[1]);

  for (let userId in state.userPositions) {
    drawUser(userId);
  }

  fill(255);

  let distances = calculateDistances();
  let nearbyUserIds = findNearbyUsers(distances);

  showNearbyUsers(nearbyUserIds);

  // if (calculateDistances() < 100) {
  // }

  if (nearbyUserIds.length > 0) {
    state.usersNearby = true;
  } else {
    usersNearby = false;
    showChat = false;
  }

  if (state.showChat) {
    drawTextInput(state.userText);
    drawChat(state.chatHistory);
  }
}
