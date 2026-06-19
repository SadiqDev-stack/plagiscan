// ===== PlagiScan - Renderer Logic =====
let file1Content = "";
let file2Content = "";
let currentResult = null;
let history = [];
let scanIdCounter = 0;
let pendingDocTarget = 1; // For modals
const minContent = 10;

const isElectron = typeof window.electronAPI !== "undefined";

// ===== Configure PDF.js =====
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// ===== Splash Screen =====
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash");
    splash.classList.add("hide");
    document.getElementById("app").classList.add("ready");
    loadHistory();
    if (isElectron) setupElectronListeners();
  }, 1400);
});

// ===== Setup Electron Listeners =====
function setupElectronListeners() {
  window.electronAPI.onNewScan(() => {
    resetApp();
    showToast("New scan ready", "success");
  });
  window.electronAPI.onExportHistory(() => {
    exportHistory();
  });
  window.electronAPI.onToast((message, type) => {
    showToast(message, type);
  });
  window.electronAPI.onShowAbout(() => {
    showToast("PlagiScan v1.0", "info", 5000);
  });
}

// ===== Reset App =====
function resetApp() {
  file1Content = "";
  file2Content = "";
  document.getElementById("file1-name").textContent = "";
  document.getElementById("file1-size").textContent = "";
  document.getElementById("file2-name").textContent = "";
  document.getElementById("file2-size").textContent = "";
  document.getElementById("docBadge1").textContent = "Empty";
  document.getElementById("docBadge2").textContent = "Empty";
  document.getElementById("docBadge1").className = "badge";
  document.getElementById("docBadge2").className = "badge";
  document.getElementById("docBox1").classList.remove("has-content");
  document.getElementById("docBox2").classList.remove("has-content");
  document.getElementById("fileInfo1").style.display = "none";
  document.getElementById("fileInfo2").style.display = "none";
  document.getElementById("preview1").classList.remove("visible");
  document.getElementById("preview2").classList.remove("visible");
  document.getElementById("compareBtn").disabled = true;
  document.getElementById("resultSection").classList.remove("visible");
}
let toastTimeout = null;

function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");

  // Clear any pending timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  // Update toast
  toast.textContent = message;
  toast.className = "toast " + type;
  toast.classList.add("show");

  // Set new timeout
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    toastTimeout = null;
  }, duration);
}

// ===== Set Document Content =====
function setDocumentContent(num, content, source) {
  if (num === 1) {
    file1Content = content;
    const nameDisplay = document.getElementById("file1-name");
    const sizeDisplay = document.getElementById("file1-size");
    const badge = document.getElementById("docBadge1");
    const preview = document.getElementById("preview1");
    const previewText = document.getElementById("previewText1");
    const previewCount = document.getElementById("previewCount1");

    nameDisplay.textContent = source || "Content loaded";
    sizeDisplay.textContent = `${content.length} characters`;
    document.getElementById("fileInfo1").style.display = "block";
    badge.textContent = `${content.length} chars`;
    badge.className = "badge loaded";
    document.getElementById("docBox1").classList.add("has-content");

    // Preview
    const previewContent =
      content.slice(0, 300) + (content.length > 300 ? "..." : "");
    previewText.textContent = previewContent;
    previewCount.textContent = `${content.length} characters`;
    preview.classList.add("visible");
  } else {
    file2Content = content;
    const nameDisplay = document.getElementById("file2-name");
    const sizeDisplay = document.getElementById("file2-size");
    const badge = document.getElementById("docBadge2");
    const preview = document.getElementById("preview2");
    const previewText = document.getElementById("previewText2");
    const previewCount = document.getElementById("previewCount2");

    nameDisplay.textContent = source || "Content loaded";
    sizeDisplay.textContent = `${content.length} characters`;
    document.getElementById("fileInfo2").style.display = "block";
    badge.textContent = `${content.length} chars`;
    badge.className = "badge loaded";
    document.getElementById("docBox2").classList.add("has-content");

    const previewContent =
      content.slice(0, 300) + (content.length > 300 ? "..." : "");
    previewText.textContent = previewContent;
    previewCount.textContent = `${content.length} characters`;
    preview.classList.add("visible");
  }

  if (file1Content && file2Content) {
    document.getElementById("compareBtn").disabled = false;
  }
}

// ===== File Upload =====
document
  .getElementById("file1")
  .addEventListener("change", (e) => handleFile(e, 1));
document
  .getElementById("file2")
  .addEventListener("change", (e) => handleFile(e, 2));

document.getElementById("drop1").addEventListener("click", () => {
  document.getElementById("file1").click();
});
document.getElementById("drop2").addEventListener("click", () => {
  document.getElementById("file2").click();
});

// Drag and drop
["drop1", "drop2"].forEach((id, index) => {
  const box = document.getElementById(id);
  const num = index + 1;
  box.addEventListener("dragover", (e) => {
    e.preventDefault();
    box.classList.add("dragover");
  });
  box.addEventListener("dragleave", () => {
    box.classList.remove("dragover");
  });
  box.addEventListener("drop", (e) => {
    e.preventDefault();
    box.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = document.getElementById(`file${num}`);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    }
  });
});

async function handleFile(e, num) {
  const file = e.target.files[0];
  if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();

  try {
    let text = "";
    if (extension === "txt") text = await readFileAsText(file);
    else if (extension === "pdf") text = await extractPDFText(file);
    else if (extension === "docx") text = await extractDOCXText(file);
    else {
      showToast("Use TXT, PDF, or DOCX files", "error");
      return;
    }

    if (text && text.trim().length > 0) {
      setDocumentContent(num, text, `📎 ${file.name}`);
      showToast(`Loaded ${text.length} characters`, "success", 2000);
    } else {
      showToast("No text found in file", "error");
    }
  } catch (error) {
    showToast(`Error: ${error.message}`, "error");
    console.error(error);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// ===== PDF Extraction =====
async function extractPDFText(file) {
  try {
    if (typeof pdfjsLib === "undefined")
      throw new Error("PDF library not loaded");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
    }
    if (!fullText.trim()) throw new Error("No text found in PDF");
    return fullText;
  } catch (error) {
    throw new Error(`PDF: ${error.message}`);
  }
}

// ===== DOCX Extraction =====
async function extractDOCXText(file) {
  try {
    if (typeof mammoth === "undefined")
      throw new Error("DOCX library not loaded");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result.value || !result.value.trim())
      throw new Error("No text found in DOCX");
    return result.value;
  } catch (error) {
    throw new Error(`DOCX: ${error.message}`);
  }
}

// ===== URL Modal =====
function openUrlModal(num) {
  pendingDocTarget = num;
  document.getElementById("urlModalDocName").textContent =
    `Document ${String.fromCharCode(64 + num)}`;
  document.getElementById("urlModalInput").value = "";
  document.getElementById("urlModal").classList.add("visible");
  setTimeout(() => document.getElementById("urlModalInput").focus(), 100);
}

function closeUrlModal() {
  document.getElementById("urlModal").classList.remove("visible");
}

async function confirmUrlFetch() {
  const input = document.getElementById("urlModalInput");
  const url = input.value.trim();
  if (!url) {
    showToast("Please enter a URL", "warning");
    return;
  }

  const btn = document.querySelector("#urlModal .btn-confirm");
  btn.disabled = true;
  btn.textContent = "⏳ Loading...";

  try {
    let html;
    if (isElectron) {
      html = await window.electronAPI.fetchUrl(url);
    } else {
      const response = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch URL");
      html = await response.text();
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc
      .querySelectorAll("script, style, noscript")
      .forEach((el) => el.remove());
    const text = doc.body.textContent || "";
    const cleanText = text.replace(/\s+/g, " ").trim();

    if (cleanText.length < 100) {
      showToast("Could not extract enough content", "warning");
      btn.disabled = false;
      btn.textContent = "📥 Fetch";
      return;
    }

    setDocumentContent(
      pendingDocTarget,
      cleanText,
      `🌐 ${url.replace(/^https?:\/\//, "").slice(0, 40)}`,
    );
    showToast(
      `URL content extracted (${cleanText.length} chars)`,
      "success",
      2000,
    );
    closeUrlModal();
  } catch (error) {
    showToast("Error: " + error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "📥 Fetch";
  }
}

document.getElementById("urlModalInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") confirmUrlFetch();
});

// ===== Paste Modal =====
function openPasteModal(num) {
  pendingDocTarget = num;
  document.getElementById("pasteModalDocName").textContent =
    `Document ${String.fromCharCode(64 + num)}`;
  document.getElementById("pasteModalInput").value = "";
  document.getElementById("pasteModal").classList.add("visible");
  setTimeout(() => document.getElementById("pasteModalInput").focus(), 100);
}

function closePasteModal() {
  document.getElementById("pasteModal").classList.remove("visible");
}

function confirmPaste() {
  const input = document.getElementById("pasteModalInput");
  const text = input.value.trim();
  if (!text) {
    showToast("Please paste some text", "warning");
    return;
  }
  if (text.length < minContent) {
    showToast("Text too short (minimum 50 characters)", "warning");
    return;
  }

  setDocumentContent(pendingDocTarget, text, "📝 Pasted text");
  showToast(`Text loaded (${text.length} chars)`, "success", 2000);
  closePasteModal();
}

// ===== View Content Modal =====
function viewContent(num) {
  const content = num === 1 ? file1Content : file2Content;
  const docName = `Document ${String.fromCharCode(64 + num)}`;
  if (!content) {
    showToast("No content to view", "warning");
    return;
  }

  document.getElementById("contentModalDocName").textContent = docName;
  document.getElementById("contentModalChars").textContent = content.length;
  document.getElementById("contentModalText").value = content;
  document.getElementById("contentModal").classList.add("visible");
}

function closeContentModal() {
  document.getElementById("contentModal").classList.remove("visible");
}

// ===== Comparison =====
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const clean1 = text1.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const clean2 = text2.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words1 = clean1.split(/\s+/).filter((w) => w.length > 2);
  const words2 = clean2.split(/\s+/).filter((w) => w.length > 2);
  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let common = 0;
  for (let word of set1) if (set2.has(word)) common++;
  const total = set1.size + set2.size;
  const wordSimilarity = total > 0 ? ((common * 2) / total) * 100 : 0;

  let phraseMatches = 0;
  let totalPhrases = 0;
  for (let i = 0; i < Math.min(words1.length - 3 + 1, 100); i++) {
    const phrase = words1.slice(i, i + 3).join(" ");
    if (words2.join(" ").includes(phrase)) phraseMatches++;
    totalPhrases++;
  }
  const phraseSimilarity =
    totalPhrases > 0 ? (phraseMatches / totalPhrases) * 100 : 0;
  return wordSimilarity * 0.7 + phraseSimilarity * 0.3;
}

function findCommonWords(words1, words2, limit = 15) {
  const freq1 = {},
    freq2 = {};
  words1.forEach((w) => (freq1[w] = (freq1[w] || 0) + 1));
  words2.forEach((w) => (freq2[w] = (freq2[w] || 0) + 1));
  const common = [];
  for (let word in freq1)
    if (freq2[word])
      common.push({ word, count: Math.min(freq1[word], freq2[word]) });
  common.sort((a, b) => b.count - a.count);
  return common.slice(0, limit);
}

// ===== Compare =====
document.getElementById("compareBtn").addEventListener("click", () => {
  const btn = document.getElementById("compareBtn");
  const resultSection = document.getElementById("resultSection");
  btn.classList.add("scanning");
  btn.disabled = true;
  resultSection.classList.remove("visible");

  setTimeout(() => {
    const similarity = calculateSimilarity(file1Content, file2Content);
    const percentage = Math.min(similarity, 100).toFixed(1);

    const clean1 = file1Content.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const clean2 = file2Content.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const words1 = clean1.split(/\s+/).filter((w) => w.length > 2);
    const words2 = clean2.split(/\s+/).filter((w) => w.length > 2);

    currentResult = {
      score: parseFloat(percentage),
      words1: words1.length,
      words2: words2.length,
      commonWords: findCommonWords(words1, words2),
      text1: file1Content,
      text2: file2Content,
      doc1Name:
        document.getElementById("file1-name").textContent || "Document A",
      doc2Name:
        document.getElementById("file2-name").textContent || "Document B",
    };

    document.getElementById("scoreNumber").textContent = `${percentage}%`;
    document.getElementById("doc1Stats").textContent = `${words1.length} words`;
    document.getElementById("doc2Stats").textContent = `${words2.length} words`;
    document.getElementById("commonCount").textContent =
      currentResult.commonWords.length;
    document.getElementById("uniqueCount").textContent = new Set([
      ...words1,
      ...words2,
    ]).size;

    const statusEl = document.getElementById("scoreStatus");
    const p = parseFloat(percentage);
    if (p > 70) {
      statusEl.className = "score-status high";
      statusEl.textContent = "High Similarity";
    } else if (p > 40) {
      statusEl.className = "score-status medium";
      statusEl.textContent = "Moderate Similarity";
    } else {
      statusEl.className = "score-status low";
      statusEl.textContent = "Low Similarity";
    }

    const cloud = document.getElementById("wordCloud");
    cloud.innerHTML = '<span class="title">Common Words</span>';
    currentResult.commonWords.slice(0, 12).forEach((item) => {
      const tag = document.createElement("span");
      const level = Math.min(Math.floor(item.count / 2) + 1, 4);
      tag.className = `word-tag level-${level}`;
      tag.textContent = `${item.word} (${item.count})`;
      cloud.appendChild(tag);
    });
    if (currentResult.commonWords.length === 0) {
      cloud.innerHTML =
        '<span class="title">Common Words</span><span style="color:var(--gray-500);font-size:14px;">No significant common words found</span>';
    }

    resultSection.classList.add("visible");
    btn.classList.remove("scanning");
    btn.disabled = false;
    showToast("Comparison complete", "success");
  }, 800);
});

// ===== Save Modal =====
function openSaveModal() {
  if (!currentResult) {
    showToast("No scan result to save", "warning");
    return;
  }
  document.getElementById("saveModal").classList.add("visible");
  document.getElementById("scanNameInput").value = `Scan ${history.length + 1}`;
  document.getElementById("scanNameInput").focus();
  document.getElementById("scanNameInput").select();
}

function closeSaveModal() {
  document.getElementById("saveModal").classList.remove("visible");
}

function confirmSave() {
  const name =
    document.getElementById("scanNameInput").value.trim() ||
    `Scan ${history.length + 1}`;
  const scan = {
    id: scanIdCounter++,
    name: name,
    date: new Date().toISOString(),
    score: currentResult.score,
    words1: currentResult.words1,
    words2: currentResult.words2,
    commonWords: currentResult.commonWords,
    doc1Name: currentResult.doc1Name,
    doc2Name: currentResult.doc2Name,
    text1: currentResult.text1,
    text2: currentResult.text2,
  };
  history.unshift(scan);
  saveHistory();
  closeSaveModal();
  showToast(`Scan "${name}" saved`, "success");
}

// ===== History =====
async function loadHistory() {
  try {
    if (isElectron) history = await window.electronAPI.loadHistory();
    else {
      const saved = localStorage.getItem("plagiscan_history");
      history = saved ? JSON.parse(saved) : [];
    }
    scanIdCounter =
      history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 0;
    renderHistory();
  } catch (e) {
    history = [];
  }
}

async function saveHistory() {
  try {
    if (isElectron) await window.electronAPI.saveHistory(history);
    else localStorage.setItem("plagiscan_history", JSON.stringify(history));
    renderHistory();
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

function renderHistory() {
  const container = document.getElementById("historyList");
  document.getElementById("historyBadge").textContent = history.length;
  document.getElementById("historyBadge2").textContent = history.length;

  if (history.length === 0) {
    container.innerHTML =
      '<div class="history-empty"><p>No scans saved yet</p></div>';
    return;
  }

  container.innerHTML = history
    .map((scan) => {
      const level =
        scan.score > 70 ? "high" : scan.score > 40 ? "medium" : "low";
      const date = new Date(scan.date);
      const dateStr =
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `
      <div class="history-item" onclick="viewScan(${scan.id})">
        <div class="info">
          <div class="name">${escapeHtml(scan.name)}</div>
          <div class="meta">${escapeHtml(scan.doc1Name)} vs ${escapeHtml(scan.doc2Name)} · ${dateStr}</div>
        </div>
        <div class="score ${level}">${scan.score.toFixed(1)}%</div>
        <button class="delete-btn" onclick="event.stopPropagation(); deleteScan(${scan.id})">✕</button>
      </div>
    `;
    })
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function openHistoryModal() {
  const list = document.getElementById("historyModalList");
  if (history.length === 0) {
    list.innerHTML =
      '<div style="text-align:center;padding:32px 0;color:var(--gray-500);">No scans saved yet</div>';
  } else {
    list.innerHTML = history
      .map((scan) => {
        const level =
          scan.score > 70 ? "high" : scan.score > 40 ? "medium" : "low";
        const date = new Date(scan.date);
        const dateStr =
          date.toLocaleDateString() +
          " " +
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `
        <div style="background:var(--gray-100);border-radius:var(--radius);padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"
             onclick="viewScan(${scan.id}); closeHistoryModal();">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;color:var(--navy-900);font-size:14px;">${escapeHtml(scan.name)}</div>
            <div style="font-size:12px;color:var(--gray-500);">${escapeHtml(scan.doc1Name)} vs ${escapeHtml(scan.doc2Name)} · ${dateStr}</div>
          </div>
          <div style="font-size:18px;font-weight:700;color:${scan.score > 70 ? "#e53e3e" : scan.score > 40 ? "#dd6b20" : "#38a169"};flex-shrink:0;margin-left:12px;">
            ${scan.score.toFixed(1)}%
          </div>
          <button onclick="event.stopPropagation(); deleteScan(${scan.id});" style="background:transparent;border:none;color:var(--gray-300);cursor:pointer;padding:4px 8px;border-radius:4px;font-size:14px;">✕</button>
        </div>
      `;
      })
      .join("");
  }
  document.getElementById("historyModal").classList.add("visible");
}

function closeHistoryModal() {
  document.getElementById("historyModal").classList.remove("visible");
}

function viewScan(id) {
  const scan = history.find((h) => h.id === id);
  if (!scan) return;
  currentResult = scan;
  document.getElementById("scoreNumber").textContent =
    `${scan.score.toFixed(1)}%`;
  document.getElementById("doc1Stats").textContent = `${scan.words1} words`;
  document.getElementById("doc2Stats").textContent = `${scan.words2} words`;
  document.getElementById("commonCount").textContent = scan.commonWords.length;
  document.getElementById("uniqueCount").textContent = "—";
  const statusEl = document.getElementById("scoreStatus");
  if (scan.score > 70) {
    statusEl.className = "score-status high";
    statusEl.textContent = "High Similarity";
  } else if (scan.score > 40) {
    statusEl.className = "score-status medium";
    statusEl.textContent = "Moderate Similarity";
  } else {
    statusEl.className = "score-status low";
    statusEl.textContent = "Low Similarity";
  }
  const cloud = document.getElementById("wordCloud");
  cloud.innerHTML = '<span class="title">Common Words</span>';
  scan.commonWords.slice(0, 12).forEach((item) => {
    const tag = document.createElement("span");
    const level = Math.min(Math.floor(item.count / 2) + 1, 4);
    tag.className = `word-tag level-${level}`;
    tag.textContent = `${item.word} (${item.count})`;
    cloud.appendChild(tag);
  });
  document.getElementById("resultSection").classList.add("visible");
  showToast(`Loaded scan: "${scan.name}"`, "success");
}

function deleteScan(id) {
  if (!confirm("Delete this scan?")) return;
  history = history.filter((h) => h.id !== id);
  saveHistory();
  showToast("Scan deleted", "warning");
}

function clearHistory() {
  if (history.length === 0) {
    showToast("No history to clear", "warning");
    return;
  }
  if (!confirm("Delete all scan history?")) return;
  history = [];
  saveHistory();
  closeHistoryModal();
  showToast("All history cleared", "warning");
}

// ===== Export =====
async function exportHistory() {
  if (history.length === 0) {
    showToast("No history to export", "warning");
    return;
  }
  const data = {
    exported: new Date().toISOString(),
    totalScans: history.length,
    scans: history.map((h) => ({
      name: h.name,
      date: h.date,
      score: h.score,
      doc1Name: h.doc1Name,
      doc2Name: h.doc2Name,
    })),
  };
  if (isElectron) {
    try {
      const result = await window.electronAPI.exportData(data);
      if (result.success) showToast("History exported!", "success");
      else if (!result.cancelled) showToast("Export failed", "error");
    } catch (error) {
      showToast("Export failed: " + error.message, "error");
    }
  } else {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plagiscan_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("History exported", "success");
  }
}
