const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const notesDir = path.join(__dirname, 'notes');

fs.mkdirSync(notesDir, { recursive: true });

app.use('/downloads', express.static(notesDir));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

app.get('/api/notes', (req, res) => {
  fs.readdir(notesDir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read notes folder.' });
    }

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const filePath = path.join(notesDir, entry.name);
        const stat = fs.statSync(filePath);
        const extension = path.extname(entry.name).replace('.', '').toUpperCase();

        return {
          name: entry.name,
          type: extension || 'FILE',
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
          url: `/downloads/${encodeURIComponent(entry.name)}`,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ count: files.length, files });
  });
});

app.listen(PORT, () => {
  console.log(`Portfolio app running at http://localhost:${PORT}`);
});
