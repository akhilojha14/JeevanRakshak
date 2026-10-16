
const call112 = document.getElementById("call112");
const locateBtn = document.getElementById("locateBtn");
const hospitalBtn = document.getElementById("hospitalBtn");
const alertBtn = document.getElementById("alertBtn");
const emergencyForm = document.getElementById("emergencyForm");
const locationResult = document.getElementById("locationResult");
const messageOutput = document.getElementById("messageOutput");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");

let currentLocation = null;
let emergencyMessage = "";

// Open the phone's emergency dialer after confirmation.
call112.addEventListener("click", () => {
  if (confirm("Open your phone dialer to call India's emergency number 112?")) {
    window.location.href = "tel:112";
  }
});

// Safely display text and links in the location panel.
function showLocationStatus(message, mapUrl = "") {
  locationResult.replaceChildren();
  locationResult.append(document.createTextNode(message));

  if (mapUrl) {
    locationResult.append(document.createTextNode(" "));

    const link = document.createElement("a");
    link.href = mapUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open map";
    locationResult.appendChild(link);
  }
}

// Get the user's actual location only after they request it.
function getLocation() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        resolve(currentLocation);
      },
      error => {
        const messages = {
          1: "Location permission denied. Allow it in browser settings.",
          2: "Your location is currently unavailable.",
          3: "Location request timed out. Please try again."
        };

        reject(new Error(messages[error.code] || "Could not get your location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000
      }
    );
  });
}

locateBtn.addEventListener("click", async () => {
  locateBtn.disabled = true;
  locateBtn.textContent = "Finding location...";

  showLocationStatus("Requesting location permission...");

  try {
    const location = await getLocation();

    const mapUrl =
      `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    showLocationStatus(
      `Latitude: ${location.latitude.toFixed(5)}, Longitude: ${location.longitude.toFixed(5)}.`,
      mapUrl
    );

    locateBtn.textContent = "Refresh Location";
  } catch (error) {
    showLocationStatus(error.message);
    locateBtn.textContent = "Try Again";
  } finally {
    locateBtn.disabled = false;
  }
});

// Search Google Maps for nearby hospitals.
hospitalBtn.addEventListener("click", async () => {
  hospitalBtn.disabled = true;
  hospitalBtn.textContent = "Opening map...";

  try {
    let url = "https://www.google.com/maps/search/hospitals/";

    if (currentLocation) {
      const { latitude, longitude } = currentLocation;
      url =
        `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    alert("Please open Google Maps and search for nearby hospitals.");
  } finally {
    hospitalBtn.disabled = false;
    hospitalBtn.textContent = "Find Hospitals";
  }
});

// Build a message for the user to review and send.
function buildEmergencyMessage() {
  const name = document.getElementById("personName").value.trim();
  const type = document.getElementById("emergencyType").value;
  const details = document.getElementById("details").value.trim();

  let message = "EMERGENCY ASSISTANCE REQUEST\n";
  message += `Emergency: ${type}\n`;

  if (name) {
    message += `Name: ${name}\n`;
  }

  if (details) {
    message += `Details: ${details}\n`;
  }

  if (currentLocation) {
    const { latitude, longitude } = currentLocation;
    message +=
      `Location: https://www.google.com/maps?q=${latitude},${longitude}\n`;
  } else {
    message += "Location: Not available. Please share your location separately.\n";
  }

  message +=
    "Please contact me and help me reach the appropriate emergency services.";

  return message;
}

function displayMessage() {
  emergencyMessage = buildEmergencyMessage();
  messageOutput.textContent = emergencyMessage;
  copyBtn.disabled = false;
  shareBtn.disabled = false;
}

emergencyForm.addEventListener("submit", event => {
  event.preventDefault();
  displayMessage();
});

alertBtn.addEventListener("click", () => {
  displayMessage();
  document.getElementById("messageOutput").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

// Copy the generated message.
copyBtn.addEventListener("click", async () => {
  if (!emergencyMessage) return;

  try {
    await navigator.clipboard.writeText(emergencyMessage);
    copyBtn.textContent = "Copied!";
  } catch {
    // Fallback for browsers without clipboard permission.
    const textarea = document.createElement("textarea");
    textarea.value = emergencyMessage;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    copyBtn.textContent = copied ? "Copied!" : "Select and copy manually";
  }

  setTimeout(() => {
    copyBtn.textContent = "Copy Message";
  }, 2000);
});

// Use the device's share sheet if supported.
shareBtn.addEventListener("click", async () => {
  if (!emergencyMessage) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Emergency Assistance Request",
        text: emergencyMessage
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Sharing was unavailable. Please copy the message instead.");
      }
    }
  } else {
    alert("Your browser does not support direct sharing. Use Copy Message.");
  }
});

const accidentForm = document.getElementById("accidentForm");
const accidentPhoto = document.getElementById("accidentPhoto");
const photoPreview = document.getElementById("photoPreview");
const analysisStatus = document.getElementById("analysisStatus");
const analysisResult = document.getElementById("analysisResult");
const analyzeButton = document.getElementById("analyzeButton");

accidentPhoto.addEventListener("change", () => {
  const file = accidentPhoto.files[0];

  analysisResult.textContent = "";

  if (!file) {
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    return;
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    analysisStatus.textContent = "Please select a JPG, PNG, or WEBP image.";
    accidentPhoto.value = "";
    photoPreview.hidden = true;
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    analysisStatus.textContent = "Image must be smaller than 5 MB.";
    accidentPhoto.value = "";
    photoPreview.hidden = true;
    return;
  }

  photoPreview.src = URL.createObjectURL(file);
  photoPreview.hidden = false;
  analysisStatus.textContent = "";
});

accidentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = accidentPhoto.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);

  analyzeButton.disabled = true;
  analysisStatus.textContent = "AI is analyzing the image...";
  analysisResult.textContent = "";

  try {
    const response = await fetch("/api/analyze-accident", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Analysis failed.");
    }

    const heading = document.createElement("h3");
    heading.textContent = "Preliminary AI Assessment";

    const result = document.createElement("p");
    result.textContent = data.analysis;

    const disclaimer = document.createElement("p");
    disclaimer.textContent = data.disclaimer;

    analysisResult.append(heading, result, disclaimer);
    analysisStatus.textContent = "Analysis complete.";
  } catch (error) {
    analysisStatus.textContent = error.message;
  } finally {
    analyzeButton.disabled = false;
  }
});
