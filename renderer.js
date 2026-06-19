// PlagiScan - Complete Renderer Logic
let file1Content = '';
let file2Content = '';
let currentResult = null;
let history = [];
let scanIdCounter = 0;

// Load history from localStorage
function loadHistory() {
  try {
    const saved = localStorage.getItem('plagiscan_history');
    if (saved) {
      history = JSON.parse(saved);
      scanIdCounter = history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 0;
      renderHistory();
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
}

// Save history to localStorage
function saveHistory() {
  try {
    localStorage.setItem('plagiscan_history', JSON.stringify(history));
    renderHistory();
    updateHistoryCount();
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

function updateHistoryCount() {
  document.getElementById('historyCount').textContent = history.length;
}

// Toast notification
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// File handlers
document.getElementById('file1').addEventListener('change', (e) => handleFile(e, 1));
document.getElementById('file2').addEventListener('change', (e) => handleFile(e, 2));

// Drag and drop
['drop1', 'drop2'].forEach((id, index) => {
  const box = document.getElementById(id);
  const num = index + 1;

  box.addEventListener('dragover', (e) => {
    e.preventDefault();
    box.classList.add('dragover');
  });

  box.addEventListener('dragleave', () => {
    box.classList.remove('dragover');
  });

  box.addEventListener('drop', (e) => {
    e.preventDefault();
    box.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = document.getElementById(`file${num}`);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change'));
    }
  });
});

function handleFile(e, num) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const nameDisplay = document.getElementById(`file${num}-name`);
  const sizeDisplay = document.getElementById(`file${num}-size`);
  const box = document.getElementById(`drop${num}`);

  // Show file info
  nameDisplay.textContent = `📎 ${file.name}`;
  sizeDisplay.textContent = `${(file.size / 1024).toFixed(1)} KB`;
  box.classList.add('has-file');

  reader.onload = (event) => {
    if (num === 1) {
      file1Content = event.target.result;
    } else {
      file2Content = event.target.result;
    }

    if (file1Content && file2Content) {
      document.getElementById('compareBtn').disabled = false;
      showToast(`✅ File ${num} loaded successfully`, 'success');
    }
  };

  reader.onerror = () => {
    showToast('❌ Error reading file', 'error');
  };

  reader.readAsText(file);
}

// URL Extraction
async function fetchUrlContent() {
  const urlInput = document.getElementById('urlInput');
  const url = urlInput.value.trim();
  
  if (!url) {
    showToast('⚠️ Please enter a URL', 'warning');
    return;
  }

  const btn = document.getElementById('fetchUrlBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Loading...';

  try {
    // Using a CORS proxy to fetch content
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch URL');
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract text content
    const text = doc.body.textContent || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length < 100) {
      showToast('⚠️ Could not extract enough content from URL', 'warning');
      btn.disabled = false;
      btn.textContent = '📥 Extract';
      return;
    }

    // Store in file1
    file1Content = cleanText;
    document.getElementById('file1-name').textContent = `🌐 ${url.replace(/^https?:\/\//, '').slice(0, 30)}...`;
    document.getElementById('file1-size').textContent = `${(cleanText.length / 1024).toFixed(1)} KB`;
    document.getElementById('drop1').classList.add('has-file');

    showToast('✅ URL content extracted successfully!', 'success');
    
    if (file1Content && file2Content) {
      document.getElementById('compareBtn').disabled = false;
    }
  } catch (error) {
    showToast('❌ Error fetching URL: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Extract';
  }
}

// Comparison algorithm
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const clean1 = text1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const clean2 = text2.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  const words1 = clean1.split(/\s+/).filter(w => w.length > 2);
  const words2 = clean2.split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let common = 0;
  for (let word of set1) {
    if (set2.has(word)) common++;
  }

  const total = set1.size + set2.size;
  const wordSimilarity = total > 0 ? (common * 2 / total * 100) : 0;

  // Phrase similarity
  let phraseMatches = 0;
  let totalPhrases = 0;
  const phraseLen = 3;
  
  for (let i = 0; i < Math.min(words1.length - phraseLen + 1, 100); i++) {
    const phrase = words1.slice(i, i + phraseLen).join(' ');
    if (words2.join(' ').includes(phrase)) {
      phraseMatches++;
    }
    totalPhrases++;
  }

  const phraseSimilarity = totalPhrases > 0 ? (phraseMatches / totalPhrases * 100) : 0;
  return wordSimilarity * 0.7 + phraseSimilarity * 0.3;
}

function findCommonWords(words1, words2, limit = 15) {
  const freq1 = {};
  const freq2 = {};
  
  words1.forEach(w => freq1[w] = (freq1[w] || 0) + 1);
  words2.forEach(w => freq2[w] = (freq2[w] || 0) + 1);

  const common = [];
  for (let word in freq1) {
    if (freq2[word]) {
      common.push({ word, count: Math.min(freq1[word], freq2[word]) });
    }
  }

  common.sort((a, b) => b.count - a.count);
  return common.slice(0, limit);
}

// Compare button
document.getElementById('compareBtn').addEventListener('click', () => {
  const btn = document.getElementById('compareBtn');
  const resultSection = document.getElementById('resultSection');

  btn.classList.add('scanning');
  btn.disabled = true;
  resultSection.classList.remove('show');

  setTimeout(() => {
    const similarity = calculateSimilarity(file1Content, file2Content);
    const percentage = Math.min(similarity, 100).toFixed(1);

    const clean1 = file1Content.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const clean2 = file2Content.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words1 = clean1.split(/\s+/).filter(w => w.length > 2);
    const words2 = clean2.split(/\s+/).filter(w => w.length > 2);

    // Store result
    currentResult = {
      score: parseFloat(percentage),
      words1: words1.length,
      words2: words2.length,
      commonWords: findCommonWords(words1, words2),
      text1: file1Content,
      text2: file2Content,
      doc1Name: document.getElementById('file1-name').textContent || 'Document 1',
      doc2Name: document.getElementById('file2-name').textContent || 'Document 2'
    };

    // Update UI
    const scoreNumber = document.getElementById('scoreNumber');
    const scoreStatus = document.getElementById('scoreStatus');
    const resultCard = document.getElementById('resultCard');

    scoreNumber.textContent = `${percentage}%`;
    document.getElementById('doc1Stats').textContent = `${words1.length} words`;
    document.getElementById('doc2Stats').textContent = `${words2.length} words`;
    document.getElementById('commonCount').textContent = currentResult.commonWords.length;
    document.getElementById('uniqueCount').textContent = new Set([...words1, ...words2]).size;

    // Status and styling
    resultCard.className = 'result-card';
    if (percentage > 70) {
      resultCard.classList.add('high');
      scoreStatus.textContent = '🚨 High Similarity - Plagiarism Possible!';
      scoreStatus.style.color = '#fc8181';
    } else if (percentage > 40) {
      resultCard.classList.add('medium');
      scoreStatus.textContent = '⚠️ Moderate Similarity - Review Recommended';
      scoreStatus.style.color = '#ed8936';
    } else {
      resultCard.classList.add('low');
      scoreStatus.textContent = '✅ Low Similarity - Original Content';
      scoreStatus.style.color = '#48bb78';
    }

    // Word cloud
    const cloud = document.getElementById('wordCloud');
    cloud.innerHTML = '<strong style="font-size:14px;color:#a0aec0;">Common Words: </strong>';
    currentResult.commonWords.slice(0, 12).forEach((item, index) => {
      const tag = document.createElement('span');
      const level = Math.min(Math.floor(item.count / 2) + 1, 4);
      tag.className = `word-tag level-${level}`;
      tag.textContent = `${item.word} (${item.count})`;
      cloud.appendChild(tag);
    });

    if (currentResult.commonWords.length === 0) {
      cloud.innerHTML = '<span style="color:#a0aec0;">No significant common words found</span>';
    }

    resultSection.classList.add('show');
    btn.classList.remove('scanning');
    btn.disabled = false;

    showToast('✅ Comparison complete!', 'success');
  }, 1000);
});

// Save Modal
function openSaveModal() {
  if (!currentResult) {
    showToast('⚠️ No scan result to save', 'warning');
    return;
  }
  document.getElementById('saveModal').classList.add('show');
  document.getElementById('scanNameInput').value = `Scan ${history.length + 1}`;
  document.getElementById('scanNameInput').focus();
  document.getElementById('scanNameInput').select();
}

function closeSaveModal() {
  document.getElementById('saveModal').classList.remove('show');
}

function confirmSave() {
  const name = document.getElementById('scanNameInput').value.trim() || `Scan ${history.length + 1}`;
  
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
    text2: currentResult.text2
  };

  history.unshift(scan);
  saveHistory();
  closeSaveModal();
  showToast(`💾 Scan "${name}" saved!`, 'success');
}

function renderHistory() {
  const container = document.getElementById('historyList');
  
  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">🔍</div>
        <p>No scans saved yet</p>
        <p style="font-size:12px;margin-top:5px;">Run a comparison and save it here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(scan => {
    const level = scan.score > 70 ? 'high' : scan.score > 40 ? 'medium' : 'low';
    const date = new Date(scan.date);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `
      <div class="history-item ${level}" onclick="viewScan(${scan.id})">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="h-name">${escapeHtml(scan.name)}</span>
          <span class="h-score" style="color:${scan.score > 70 ? '#fc8181' : scan.score > 40 ? '#ed8936' : '#48bb78'}">
            ${scan.score.toFixed(1)}%
          </span>
        </div>
        <div class="h-date">📄 ${escapeHtml(scan.doc1Name)} vs ${escapeHtml(scan.doc2Name)}</div>
        <div class="h-date">📅 ${dateStr}</div>
        <button class="h-delete" onclick="event.stopPropagation(); deleteScan(${scan.id})" title="Delete scan">✕</button>
      </div>
    `;
  }).join('');

  updateHistoryCount();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function viewScan(id) {
  const scan = history.find(h => h.id === id);
  if (!scan) return;

  // Restore the scan results
  currentResult = {
    score: scan.score,
    words1: scan.words1,
    words2: scan.words2,
    commonWords: scan.commonWords,
    text1: scan.text1,
    text2: scan.text2,
    doc1Name: scan.doc1Name,
    doc2Name: scan.doc2Name
  };

  // Update UI
  const scoreNumber = document.getElementById('scoreNumber');
  const resultCard = document.getElementById('resultCard');
  const resultSection = document.getElementById('resultSection');

  scoreNumber.textContent = `${scan.score.toFixed(1)}%`;
  document.getElementById('doc1Stats').textContent = `${scan.words1} words`;
  document.getElementById('doc2Stats').textContent = `${scan.words2} words`;
  document.getElementById('commonCount').textContent = scan.commonWords.length;
  document.getElementById('uniqueCount').textContent = '—';

  const scoreStatus = document.getElementById('scoreStatus');
  resultCard.className = 'result-card';
  if (scan.score > 70) {
    resultCard.classList.add('high');
    scoreStatus.textContent = '🚨 High Similarity - Plagiarism Possible!';
    scoreStatus.style.color = '#fc8181';
  } else if (scan.score > 40) {
    resultCard.classList.add('medium');
    scoreStatus.textContent = '⚠️ Moderate Similarity - Review Recommended';
    scoreStatus.style.color = '#ed8936';
  } else {
    resultCard.classList.add('low');
    scoreStatus.textContent = '✅ Low Similarity - Original Content';
    scoreStatus.style.color = '#48bb78';
  }

  const cloud = document.getElementById('wordCloud');
  cloud.innerHTML = '<strong style="font-size:14px;color:#a0aec0;">Common Words: </strong>';
  scan.commonWords.slice(0, 12).forEach((item, index) => {
    const tag = document.createElement('span');
    const level = Math.min(Math.floor(item.count / 2) + 1, 4);
    tag.className = `word-tag level-${level}`;
    tag.textContent = `${item.word} (${item.count})`;
    cloud.appendChild(tag);
  });

  resultSection.classList.add('show');
  showToast(`📋 Loaded scan: "${scan.name}"`, 'success');
}

function deleteScan(id) {
  if (!confirm('Delete this scan?')) return;
  history = history.filter(h => h.id !== id);
  saveHistory();
  showToast('🗑️ Scan deleted', 'warning');
}

function clearHistory() {
  if (history.length === 0) {
    showToast('No history to clear', 'warning');
    return;
  }
  if (!confirm('Delete ALL scan history?')) return;
  history = [];
  saveHistory();
  showToast('🗑️ All history cleared', 'warning');
}

function exportHistory() {
  if (history.length === 0) {
    showToast('No history to export', 'warning');
    return;
  }

  const data = {
    exported: new Date().toISOString(),
    totalScans: history.length,
    scans: history.map(h => ({
      name: h.name,
      date: h.date,
      score: h.score,
      doc1Name: h.doc1Name,
      doc2Name: h.doc2Name
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plagiscan_history_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 History exported!', 'success');
}

// Enter key for URL input
document.getElementById('urlInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    fetchUrlContent();
  }
});

// Initialize
loadHistory();