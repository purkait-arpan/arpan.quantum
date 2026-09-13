let allNotes = [];

async function fetchNotes() {
  const tableBody = document.getElementById('notes-table-body');

  if (!tableBody) return;

  try {
    const response = await fetch('/api/notes');
    const data = await response.json();

    if (!response.ok || !data.files || data.files.length === 0) {
      allNotes = [];
      tableBody.innerHTML = '<tr><td colspan="3"><div class="empty-state">No notes uploaded yet. Check back later!</div></td></tr>';
      return;
    }

    allNotes = data.files;
    renderNotes(allNotes);
  } catch (error) {
    allNotes = [];
    tableBody.innerHTML = '<tr><td colspan="5"><div class="empty-state">Unable to load notes right now. Please try again.</div></td></tr>';
  }
}

function renderNotes(notes) {
  const tableBody = document.getElementById('notes-table-body');
  if (!tableBody) return;

  if (!notes || notes.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3"><div class="empty-state">No notes match your search.</div></td></tr>';
    return;
  }

  tableBody.innerHTML = notes
    .map(
      (file) => `
        <tr>
          <td class="note-file">${file.name}</td>
          <td>${formatBytes(file.size)}</td>
          <td><a class="download-link" href="${file.url}" download>Download</a></td>
        </tr>
      `
    )
    .join('');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const searchInput = document.getElementById('notes-search');
if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const filtered = allNotes.filter((file) => file.name.toLowerCase().includes(query));
    renderNotes(filtered);
  });
}

const refreshButton = document.getElementById('refresh-notes');
if (refreshButton) {
  refreshButton.addEventListener('click', fetchNotes);
}

fetchNotes();
