# 📄 PlagiScan - Plagiarism Checker

> A simple, elegant desktop application that helps you compare two documents for plagiarism. Built with Electron and designed for easy use.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📄 Three Ways to Load Content** | Upload files (PDF, DOCX, TXT), paste URLs, or paste text directly |
| **🔍 Smart Comparison** | Word-by-word analysis, phrase matching, percentage-based similarity score |
| **💾 History & Management** | Save scans with custom names, view past scans, delete, export as JSON |
| **🎨 Professional Design** | Clean navy blue theme, responsive, distraction-free |

---

## 🚀 Installation

### Option 1: Download EXE (Recommended for Users)

1. Download `PlagiScan Setup.exe` from the releases page
2. Run the installer
3. Follow the wizard
4. Launch from desktop shortcut or Start Menu

> **No installation needed:** Download `PlagiScan.exe` (portable version) and double-click to run.

### Option 2: Run from Source (For Developers)

```bash
# Clone the repository
git clone https://github.com/SadiqDev-stack/plagiscan.git

# Navigate to project
cd plagiscan

# Install dependencies
npm install

# Run the app
npm start
```

---

## 🛠️ Building Your Own EXE

| Command | Output |
|---------|--------|
| `npm run build:portable` | Single EXE (no install needed) |
| `npm run build:installer` | Setup installer with shortcuts |
| `npm run build` | Both portable + installer |

**Output:** Check the `dist` folder for your EXE files.

---

## 📁 Project Structure

```
plagiscan/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── menu.js              # Native menu bar
├── index.html           # Main UI
├── renderer.js          # App logic
├── package.json         # Dependencies & scripts
├── icon.ico             # App icon
├── logo.png             # App logo
├── .gitignore           # Git ignore file
└── README.md            # This file
```

---

## 💻 How It Works

1. **Load Content:**
   - Upload a file (PDF, DOCX, TXT)
   - Paste a URL to fetch content
   - Paste text directly

2. **Compare:**
   - Click "Compare Documents"
   - The app analyzes both documents
   - Word similarity and phrase matching

3. **Results:**
   - Similarity percentage
   - Word count for each document
   - Common words with frequency
   - Visual word cloud

4. **Save:**
   - Name your scan
   - Save to history
   - Access anytime

---

## 🧪 Test URLs

Try these sample URLs to test the online content extraction:

```
https://en.wikipedia.org/wiki/Plagiarism
https://en.wikipedia.org/wiki/Artificial_intelligence
https://www.gutenberg.org/files/1342/1342-h/1342-h.htm
https://www.poetryfoundation.org/poems/44885/the-raven
```

---

## 📋 Requirements

| For Users | For Developers |
|-----------|----------------|
| Windows 7, 8, 10, or 11 | Node.js (v16 or higher) |
| No additional software needed | npm or yarn |
| - | Git (optional) |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with "Cannot create symbolic link" | Run as Administrator |
| Icon not showing in EXE | Create proper 256x256 `icon.ico` |
| PDF extraction fails | Ensure internet connection for CDN libraries |
| App not opening | Run `npm install electron` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Sadiq**
- GitHub: [@SadiqDev-stack](https://github.com/SadiqDev-stack)

---

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Desktop framework
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF text extraction
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX extraction
- [Electron Builder](https://www.electron.build/) - Building EXE files

---

## 📞 Support

If you encounter any issues, please open an issue on GitHub or contact the author.

---

## 🎯 Roadmap

- [ ] Dark mode support
- [ ] Export results as PDF
- [ ] Batch file comparison
- [ ] More file format support
- [ ] Cloud sync for history
- [ ] AI-powered analysis

---

**Made with ❤️ for the plagiarism detection community**