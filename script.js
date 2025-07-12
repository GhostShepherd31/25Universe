// ==============================
// GLOBAL VARIABLES
// ==============================
let nsnData = [];
let filteredData = [];

// ==============================
// TAB SWITCHING
// ==============================
function showTab(tabId, event) {
  document.querySelectorAll(".tab-content").forEach((section) =>
    section.classList.remove("active")
  );
  document.querySelectorAll(".tabs button").forEach((btn) =>
    btn.classList.remove("active")
  );
  document.getElementById(tabId).classList.add("active");
  if (event?.target) {
    event.target.classList.add("active");
  }
}

// ==============================
// IPv4 SUBNET CALCULATOR
// ==============================
function calculateSubnet() {
  const input = document.getElementById("ipInput")?.value.trim();
  const output = document.getElementById("ipOutput");
  if (!input || !output) return;

  const [ip, cidr] = input.split("/");
  const ipParts = ip.split(".").map(Number);
  const maskBits = parseInt(cidr);

  if (ipParts.length !== 4 || isNaN(maskBits) || maskBits < 0 || maskBits > 32) {
    output.textContent = "Invalid IP/CIDR format. Example: 192.168.1.0/24";
    return;
  }

  const subnetMask = (0xffffffff << (32 - maskBits)) >>> 0;
  const maskParts = [
    (subnetMask >>> 24) & 255,
    (subnetMask >>> 16) & 255,
    (subnetMask >>> 8) & 255,
    subnetMask & 255,
  ];

  const ipDecimal = ipParts.reduce((acc, octet) => (acc << 8) + octet, 0);
  const network = ipDecimal & subnetMask;
  const broadcast = network | (~subnetMask >>> 0);

  const toIP = (int) =>
    [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(".");

  output.textContent = `
Subnet Mask: ${maskParts.join(".")}
Network Address: ${toIP(network)}
Broadcast Address: ${toIP(broadcast)}
Usable Range: ${toIP(network + 1)} – ${toIP(broadcast - 1)}
  `;
}

// ==============================
// NSN FUNCTIONS
// ==============================
function loadNSNs() {
  if (!document.getElementById("nsnList")) return;
  fetch("nsn-data.json")
    .then((res) => res.json())
    .then((data) => {
      nsnData = data.filter(
        (entry) =>
          typeof entry.nsn === "string" &&
          entry.item &&
          !["30level", "nomenclature"].includes(entry.item.toLowerCase()) &&
          entry.nsn.toUpperCase() !== "NSN"
      );
      filteredData = nsnData;
      displayNSNs(filteredData);
    })
    .catch((err) => {
      document.getElementById("nsnList").innerHTML = "Error loading NSN data.";
      console.error(err);
    });
}

function displayNSNs(data) {
  const listContainer = document.getElementById("nsnList");
  if (!listContainer) return;
  listContainer.innerHTML = "";
  data.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "nsn-item";
    div.innerHTML = `
      <div class="item-name"><strong>${entry.item}</strong></div>
      <div class="item-nsn"><code>${entry.nsn}</code></div>
      <button class="copy-btn" onclick="copyToClipboard('${entry.nsn}')">Copy NSN</button>
    `;
    listContainer.appendChild(div);
  });
}

function filterNSNs() {
  const query = document.getElementById("nsnSearch")?.value.toLowerCase() || "";
  filteredData = nsnData.filter(
    (entry) =>
      entry.item.toLowerCase().includes(query) ||
      entry.nsn.toLowerCase().includes(query)
  );
  displayNSNs(filteredData);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied: ${text}`);
  });
}

function downloadCSV() {
  const csvRows = ["Item,NSN"];
  filteredData.forEach((entry) => {
    const row = `"${entry.item.replace(/"/g, '""')}","${entry.nsn}"`;
    csvRows.push(row);
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nsn-export.csv";
  a.click();
}

// ==============================
// COMPASS FUNCTIONALITY
// ==============================
function setupCompass() {
  const needle = document.getElementById("needle");
  const degreeDisplay = document.getElementById("degreeDisplay");
  const startBtn = document.getElementById("startBtn");
  if (!needle || !degreeDisplay || !startBtn) return;

  function rotateNeedle(deg) {
    needle.style.transform = `rotate(${deg}deg)`;
    degreeDisplay.textContent = `Heading: ${Math.round(deg)}°`;
  }

  function handleOrientation(event) {
    let heading = event.webkitCompassHeading ?? (360 - event.alpha);
    if (typeof heading === "number" && !isNaN(heading)) {
      rotateNeedle(heading);
    }
  }

  function startCompass() {
    if (DeviceOrientationEvent?.requestPermission) {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, true);
          } else {
            alert("Permission denied.");
          }
        })
        .catch((err) => console.error("Compass error:", err));
    } else {
      window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    }
  }

  startBtn.addEventListener("click", startCompass);
}

// ==============================
// ZULU & LOCAL CLOCK
// ==============================
function setupZuluClock() {
  const zuluDisplay = document.getElementById("time-display-zulu");
  const localDisplay = document.getElementById("time-display-local");
  if (!zuluDisplay || !localDisplay) return;

  function updateTime() {
    const now = new Date();

    // Zulu Time
    const zuluHours = String(now.getUTCHours()).padStart(2, "0");
    const zuluMinutes = String(now.getUTCMinutes()).padStart(2, "0");
    const zuluSeconds = String(now.getUTCSeconds()).padStart(2, "0");
    zuluDisplay.textContent = `${zuluHours}:${zuluMinutes}:${zuluSeconds} Z`;

    // Local Time
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    };
    localDisplay.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
  }

  updateTime();
  setInterval(updateTime, 1000);
}

// ==============================
// SWITCH & ROUTER SIMULATION
// ==============================
function runSimulation() {
  const port = document.getElementById("port")?.value || "";
  const mode = document.getElementById("mode")?.value || "";
  const vlan = parseInt(document.getElementById("vlan")?.value);
  const ip = document.getElementById("ip")?.value || "";
  const subnet = document.getElementById("subnet")?.value || "";
  const gateway = document.getElementById("gateway")?.value || "";
  const resultBox = document.getElementById("result");
  if (!resultBox) return;

  let result = `Switch(config)# interface ${port}\n`;
  result += `Switch(config-if)# switchport mode ${mode}\n`;

  if (mode === "access") {
    result += `Switch(config-if)# switchport access vlan ${vlan}\n`;
  } else if (mode === "trunk") {
    result += `Switch(config-if)# switchport trunk allowed vlan ${vlan}\n`;
  }

  result += `Switch(config-if)# no shutdown\n\n`;
  result += `# Static IP Setup on Host Machine:\n`;
  result += `IP Address: ${ip}\n`;
  result += `Subnet Mask: ${subnet}\n`;
  result += `Default Gateway: ${gateway}\n`;

  if (
    !validateIP(ip) ||
    !validateIP(subnet) ||
    !validateIP(gateway) ||
    isNaN(vlan) ||
    vlan < 1 ||
    vlan > 4094
  ) {
    result += `\n⚠️ Invalid input: Please ensure all fields are correctly filled.`;
  } else {
    result += `\n✅ Configuration looks valid.`;
  }

  resultBox.textContent = result;
}

function validateIP(ip) {
  const parts = ip.split(".");
  return (
    parts.length === 4 &&
    parts.every((p) => {
      const n = Number(p);
      return !isNaN(n) && n >= 0 && n <= 255;
    })
  );
}

// ==============================
// DOM READY
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("nsnList")) loadNSNs();
  if (document.getElementById("needle")) setupCompass();
  if (document.getElementById("time-display-zulu")) setupZuluClock();
});
