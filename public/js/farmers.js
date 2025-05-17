// Farmers page specific JavaScript
$(document).ready(function() {
    // ===== EXPORT DATA FUNCTIONALITY =====
    $("#exportDataBtn").click(function() {
        // Show loading spinner
        const loadingSpinner = $('<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>');
        const $this = $(this);
        $this.prop('disabled', true).html(loadingSpinner).append(' Exporting...');
        
        // Fetch farmers data
        fetch('/api/farmers')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch data');
                return response.json();
            })
            .then(data => {
                if (!data || data.length === 0) {
                    toastr.warning('No data to export');
                    return;
                }

                // Convert data to CSV format
                const headers = [
                    'First Name',
                    'Last Name', 
                    'Middle Name', 
                    'Extension Name', 
                    'Address', 
                    'Contact Number', 
                    'Crop Type', 
                    'Farm Size'
                ];
                
                const csvRows = [headers.join(',')];
                
                data.forEach(farmer => {
                    const values = [
                        `"${(farmer.first_name || '').replace(/"/g, '""')}"`,
                        `"${(farmer.last_name || '').replace(/"/g, '""')}"`,
                        `"${(farmer.middle_name || '').replace(/"/g, '""')}"`,
                        `"${(farmer.extension_name || '').replace(/"/g, '""')}"`,
                        `"${(farmer.address || '').replace(/"/g, '""')}"`,
                        `"${(farmer.contact_number || '').replace(/"/g, '""')}"`,
                        `"${(farmer.crop_type || '').replace(/"/g, '""')}"`,
                        farmer.farm_size || 0
                    ];
                    csvRows.push(values.join(','));
                });
                
                // Create CSV content
                const csvContent = csvRows.join('\n');
                
                // Create download link
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                // Set download attributes
                const date = new Date().toISOString().slice(0, 10);
                link.href = url;
                link.download = `SmartSeed_Farmers_${date}.csv`;
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                
                // Cleanup
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // Show success message
                toastr.success('Farmers data exported successfully!');
            })
            .catch(error => {
                console.error('Export error:', error);
                toastr.error('Failed to export data. Please try again.');
            })
            .finally(() => {
                // Restore button
                $this.prop('disabled', false).html('<i class="fas fa-file-export"></i> Export Data');
            });
    });

    // ===== IMPORT DATA FUNCTIONALITY =====
    $("#importDataBtn").click(function() {
        $("#importDataModal").modal('show');
    });
    
    // Add template download link to import modal
    $("#downloadTemplate").on("click", function(e) {
        e.preventDefault();
        
        // Create template CSV content
        const templateHeaders = ["First Name", "Last Name", "Middle Name", "Extension Name", "Address", "Contact Number", "Crop Type", "Farm Size"];
        const sampleData = [
            ["John", "Doe", "Smith", "Jr", "Alicia, Isabela", "09123456789", "NSIC Rc 216 (Tubigan 17)", "2.5"],
            ["Jane", "Smith", "Brown", "", "Burgos, Isabela", "09987654321", "NSIC Rc 160", "1.75"],
            ["Robert", "Johnson", "Lee", "Sr", "Santiago City, Isabela", "09123456789", "NSIC Rc 300 (Tubigan 24)", "3.2"]
        ];
        
        // Convert to CSV format
        const csvContent = 
            templateHeaders.join(',') + '\n' + 
            sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "farmers_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toastr.info('Template downloaded. Fill it out and import when ready.');
    });
    
    // Update file label when file is selected
    $("#csvFile").on("change", function() {
        const fileName = $(this).val().split("\\").pop();
        $(this).siblings(".custom-file-label").addClass("selected").html(fileName || "Choose file");
        
        // Reset preview
        $("#importPreview").hide();
        $("#previewHeader").empty();
        $("#previewBody").empty();
        $("#confirmImportBtn").prop('disabled', true);
        
        if (!fileName) return;
        
        // Read and parse CSV file
        const file = this.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csvData = e.target.result;
                const lines = csvData.split(/\r?\n/).filter(line => line.trim());
                
                if (!lines.length) {
                    toastr.warning('CSV file is empty');
                    return;
                }
                
                // Parse headers
                const headers = parseCSVLine(lines[0]);
                
                // Validate headers
                const expectedHeaders = [
                    'First Name', 
                    'Last Name', 
                    'Middle Name', 
                    'Extension Name', 
                    'Address', 
                    'Contact Number', 
                    'Crop Type', 
                    'Farm Size'
                ];
                
                const headersMatch = expectedHeaders.every(expected => 
                    headers.some(actual => 
                        actual.toLowerCase() === expected.toLowerCase()
                    )
                );
                
                if (!headersMatch) {
                    toastr.error('CSV headers do not match the expected format');
                    return;
                }
                
                // Create preview table header
                const headerRow = $('<tr>');
                headers.forEach(header => {
                    headerRow.append($('<th>').text(header));
                });
                $("#previewHeader").append(headerRow);
                
                // Parse and display preview rows
                const previewRowCount = Math.min(lines.length - 1, 5); // Show up to 5 rows
                for (let i = 1; i <= previewRowCount; i++) {
                    if (!lines[i]) continue;
                    
                    const row = parseCSVLine(lines[i]);
                    const tableRow = $('<tr>');
                    
                    row.forEach(cell => {
                        tableRow.append($('<td>').text(cell));
                    });
                    
                    $("#previewBody").append(tableRow);
                }
                
                // Update UI
                $("#importPreview").show();
                $("#confirmImportBtn").prop('disabled', false);
                
            } catch (error) {
                console.error('CSV parsing error:', error);
                toastr.error('Failed to parse CSV file. Please check the format.');
            }
        };
        
        reader.readAsText(file);
    });
    
    // Handle import confirmation
    $("#confirmImportBtn").click(function() {
        const file = document.getElementById('csvFile').files[0];
        if (!file) {
            toastr.warning('Please select a CSV file');
            return;
        }
        
        // Show loading
        const $btn = $(this);
        const originalText = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Parse CSV
            const csvData = e.target.result;
            const lines = csvData.split(/\r?\n/).filter(line => line.trim());
            
            if (lines.length <= 1) {
                toastr.warning('No data to import');
                $btn.prop('disabled', false).html(originalText);
                return;
            }
            
            const headers = parseCSVLine(lines[0]);
            
            // Parse data rows
            const farmers = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                // Parse CSV line
                const row = parseCSVLine(lines[i]);
                
                // Map columns to farmer object
                const farmer = {
                    first_name: row[headers.findIndex(h => h.toLowerCase() === 'first name')] || '',
                    last_name: row[headers.findIndex(h => h.toLowerCase() === 'last name')] || '',
                    middle_name: row[headers.findIndex(h => h.toLowerCase() === 'middle name')] || '',
                    extension_name: row[headers.findIndex(h => h.toLowerCase() === 'extension name')] || '',
                    address: row[headers.findIndex(h => h.toLowerCase() === 'address')] || '',
                    contact_number: row[headers.findIndex(h => h.toLowerCase() === 'contact number')] || '',
                    crop_type: row[headers.findIndex(h => h.toLowerCase() === 'crop type')] || '',
                    farm_size: parseFloat(row[headers.findIndex(h => h.toLowerCase() === 'farm size')]) || 0
                };
                
                // Validate required fields
                if (!farmer.first_name || !farmer.last_name || !farmer.address || !farmer.crop_type) {
                    continue; // Skip invalid entries
                }
                
                farmers.push(farmer);
            }
            
            if (!farmers.length) {
                toastr.warning('No valid farmers data found');
                $btn.prop('disabled', false).html(originalText);
                return;
            }
            
            // Send to server
            fetch('/api/farmers/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ farmers })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    toastr.success(`Successfully imported ${result.imported} farmer(s)`);
                    $("#importDataModal").modal('hide');
                    
                    // Refresh table
                    if ($.fn.DataTable.isDataTable('#dataTable')) {
                        $('#dataTable').DataTable().ajax.reload();
                    } else {
                        window.location.reload();
                    }
                } else {
                    throw new Error(result.error || 'Import failed');
                }
            })
            .catch(error => {
                console.error('Import error:', error);
                toastr.error(`Import failed: ${error.message}`);
            })
            .finally(() => {
                $btn.prop('disabled', false).html(originalText);
                // Reset file input
                $("#csvFile").val('');
                $("#csvFile").siblings(".custom-file-label").removeClass("selected").html("Choose file");
                $("#importPreview").hide();
            });
        };
        
        reader.readAsText(file);
    });
    
    // ===== CSV PARSING HELPER FUNCTION =====
    function parseCSVLine(text) {
        const result = [];
        let startValueIdx = 0;
        let insideQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                // End of field found
                let value = text.substring(startValueIdx, i);
                // Remove quotes
                value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
                result.push(value);
                startValueIdx = i + 1;
            }
        }
        
        // Push the last value
        if (startValueIdx < text.length) {
            let value = text.substring(startValueIdx);
            // Remove quotes
            value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
            result.push(value);
        }
        
        return result;
    }
});