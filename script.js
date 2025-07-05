let nsnData = [];
let filteredData = [];

// Handle tab switching
function showTab(tabId, event) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((section) => section.classList.remove("active"));

  const buttons = document.querySelectorAll(".tabs button");
  buttons.forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  if (event && event.target) {
    event.target.classList.add("active");
  }
}

// IP Subnet Calculator
function calculateSubnet() {
  const input = document.getElementById('ipInput').value.trim();
  const output = document.getElementById('ipOutput');

  const [ip, cidr] = input.split('/');
  const ipParts = ip.split('.').map(Number);
  const maskBits = parseInt(cidr);

  if (ipParts.length !== 4 || isNaN(maskBits) || maskBits < 0 || maskBits > 32) {
    output.textContent = 'Invalid IP/CIDR format. Example: 192.168.1.0/24';
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

  const toIP = (int) => [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');

  output.textContent = `
Subnet Mask: ${maskParts.join('.')}
Network Address: ${toIP(network)}
Broadcast Address: ${toIP(broadcast)}
Usable Range: ${toIP(network + 1)} – ${toIP(broadcast - 1)}
  `;
}

// Load and display NSNs
function loadNSNs() {
  fetch('nsn-data.json')
    .then(res => res.json())
    .then(data => {
      nsnData = data.filter(entry =>
        typeof entry.nsn === 'string' &&
        entry.item &&
        entry.item.toLowerCase() !== '30level' &&
        entry.item.toLowerCase() !== 'nomenclature' &&
        entry.nsn.toUpperCase() !== 'NSN'
      );
      filteredData = nsnData;
      displayNSNs(filteredData);
    })
    .catch(err => {
      document.getElementById('nsnList').innerHTML = 'Error loading NSN data.';
      console.error(err);
    });
}

// Display NSNs
function displayNSNs(data) {
  const listContainer = document.getElementById('nsnList');
  listContainer.innerHTML = '';

  data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'nsn-item';
    div.innerHTML = `
      <div class="item-name"><strong>${entry.item}</strong></div>
      <div class="item-nsn"><code>${entry.nsn}</code></div>
      <button class="copy-btn" onclick="copyToClipboard('${entry.nsn}')">Copy NSN</button>
    `;
    listContainer.appendChild(div);
  });
}

// Filter NSNs
function filterNSNs() {
  const query = document.getElementById('nsnSearch').value.toLowerCase();
  const results = nsnData.filter(entry =>
    entry.item.toLowerCase().includes(query) ||
    entry.nsn.toLowerCase().includes(query)
  );
  filteredData = results;
  displayNSNs(results);
}

// Copy NSN to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied: ${text}`);
  });
}

// Export visible NSNs to CSV
function downloadCSV() {
  const csvRows = ['Item,NSN'];
  filteredData.forEach(entry => {
    const row = `"${entry.item.replace(/"/g, '""')}","${entry.nsn}"`;
    csvRows.push(row);
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'nsn-export.csv';
  a.click();
}
// Real-Time Compass
function initCompass() {
  const needle = document.getElementById('compass-needle');
  const reading = document.getElementById('compass-reading');

  if (!window.DeviceOrientationEvent) {
    reading.textContent = "Compass not supported on this device.";
    return;
  }

  window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  window.addEventListener('deviceorientation', handleOrientation, true);

  function handleOrientation(event) {
    let heading = event.alpha;

    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.webkitCompassHeading;
    }

    if (heading !== null && !isNaN(heading)) {
      needle.style.transform = `rotate(${heading}deg)`;
      reading.textContent = `Heading: ${Math.round(heading)}°`;
    } else {
      reading.textContent = "Unable to read compass heading.";
    }
  }
}

// Activate compass only when 25U tab is selected
document.querySelector("button[onclick*='25U']").addEventListener("click", () => {
  initCompass();
});


// Init on load
document.addEventListener('DOMContentLoaded', loadNSNs);
