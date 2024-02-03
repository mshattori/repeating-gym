document.addEventListener('DOMContentLoaded', function() {
    fetch('index.json')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('index-table').getElementsByTagName('tbody')[0];
        data.forEach(record => {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            const displayName = record.replace(/-/g, ' ').split('.')[0];
            cell.textContent = displayName;
            row.addEventListener('click', () => {
                window.location.href = `app.html?file=${encodeURIComponent(record)}`;
            });
        });
    })
    .catch(error => console.error('Error loading the document list:', error));
});
