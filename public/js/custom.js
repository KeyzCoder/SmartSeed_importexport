// Add these functions at the top level
window.onCaptchaComplete = function() {
    document.getElementById('captcha-error').textContent = '';
};

window.onCaptchaExpired = function() {
    document.getElementById('captcha-error').textContent = 'Captcha expired. Please verify again.';
};

// Make this a global function so it can be called from onclick
window.editCrop = function(cropId) {
    if (!cropId) {
        console.error('No crop ID provided');
        return;
    }

    console.log('Editing crop with ID:', cropId);

    $('#viewFarmerModal').modal('hide');
    
    fetch(`/api/crops/${cropId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(crop => {
            console.log('Crop data:', crop);
            
            $('#editCropId').val(cropId);
            $('#editCropType').val(crop.crop_type);
            $('#editBagsReceived').val(crop.bags_received);
            $('#editDateReceived').val(crop.date_received);
            
            $('#editCropModal').modal('show');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading crop details: ' + error.message);
        });
};

// Make this a global function so it can be called from onclick
window.deleteCrop = function(farmerId) {
    // Fix variable name in validation (was using both farmerId and farmer_id)
    if (!farmerId) {
        console.error('Invalid farmer ID:', farmerId);
        alert('Cannot delete crop: Invalid farmer ID');
        return;
    }

    console.log('Attempting to delete crop for farmer ID:', farmerId);

    if (confirm('Are you sure you want to delete this crop record?')) {
        fetch(`/api/crops/${farmerId}`, {  // Changed from /api/farmers/${farmerId}/crops
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Crop deleted successfully');
                $('#viewFarmerModal').modal('hide');
                // Refresh the DataTable
                $('#dataTable').DataTable().ajax.reload();
            } else {
                throw new Error(data.error || 'Failed to delete crop');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting crop: ' + error.message);
        });
    }
};

// Global Authentication Check
document.addEventListener("DOMContentLoaded", function () {
    const publicPages = ["login.html", "index.html"]; // Pages that don't require authentication
    const currentPage = window.location.pathname.split("/").pop(); // Get the current page name

    // If the user is not logged in and the page is not public, redirect to login
    const token = localStorage.getItem("token");
    if (!token && !publicPages.includes(currentPage)) {
        window.location.href = "login.html"; // Redirect to login page
    }
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("custom.js loaded!"); // Debugging check

    // Show/Hide Password
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");

    if (togglePassword) {
        togglePassword.addEventListener("click", function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                togglePassword.innerHTML = '<i class="fas fa-eye-slash" style="font-size: 0.8em;"></i>'; // Change icon
            } else {
                passwordInput.type = "password";
                togglePassword.innerHTML = '<i class="fas fa-eye" style="font-size: 0.8em;"></i>'; // Change icon
            }
        });
    }

    // Handle Login Form Submission
    const loginForm = document.getElementById("login-form");
    const errorDisplay = document.getElementById("login-error");

    // Update the login form handler in custom.js
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            
            let email = document.getElementById("email").value;
            let password = document.getElementById("password").value;
            const captchaResponse = grecaptcha.getResponse();
            const errorDisplay = document.getElementById("login-error");
            const captchaError = document.getElementById("captcha-error");

            // Clear previous errors
            errorDisplay.textContent = "";
            captchaError.textContent = "";

            // Validate captcha - Remove the comment block to enable validation
            if (!captchaResponse) {
                captchaError.textContent = "Please complete the captcha";
                return;
            }

            try {
                const submitBtn = document.querySelector('#login-form button[type="submit"]');
                submitBtn.innerHTML = 'Logging in...';
                submitBtn.disabled = true;

                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        captchaResponse: captchaResponse // Add captcha response to the request
                    })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                console.error("Login error:", error);
                errorDisplay.textContent = "Error connecting to server. Please try again.";
                grecaptcha.reset();
            } finally {
                const submitBtn = document.querySelector('#login-form button[type="submit"]');
                submitBtn.innerHTML = 'Login';
                submitBtn.disabled = false;
            }
        });
    }

    // Guest Login Button
    const guestBtn = document.getElementById("guest-btn");
    if (guestBtn) {
        guestBtn.addEventListener("click", function () {
            window.location.href = "/guest.html"; // Redirect directly to dashboard
        });
    }

    // Add any other custom functionality here that's not related to login
});

// Initialize DataTables
document.addEventListener("DOMContentLoaded", function() {
    // Check if we're on the farmers page and jQuery is loaded
    if (document.getElementById('dataTable') && typeof jQuery !== 'undefined') {
        try {
            const farmersTable = $('#dataTable').DataTable({
                processing: true,
                responsive: true,
                order: [[0, 'asc']],
                pageLength: 10,
                lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
                ajax: {
                    url: '/api/farmers',
                    dataSrc: '',
                    error: function(xhr, error, thrown) {
                        console.error('Ajax error:', error);
                        console.error('Server response:', xhr.responseText);
                    }
                },
                columns: [
                    { data: 'farmer_id' },
                    { data: 'first_name' },
                    { data: 'last_name' },
                    { data: 'middle_name' },
                    { data: 'extension_name' },
                    { data: 'address' },
                    { data: 'contact_number' },
                    { data: 'crop_type' },
                    { data: 'farm_size' },
                    {
                        data: null,
                        orderable: false,
                        className: 'text-center',
                        render: function(data, type, row) {
                            return `
                                <div class="btn-group" role="group">
                                    <button class="btn btn-primary btn-sm edit-btn mr-1" data-id="${row.farmer_id}" title="Edit Farmer">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-info btn-sm view-btn" data-id="${row.farmer_id}" title="View Details">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            });

            // Add event handlers
            if (farmersTable) {
                // Add Farmer Button
                $('#addFarmerBtn').click(function() {
                    $('#addFarmerModal').modal('show');
                });

                // Save Farmer Button
                $('#saveFarmerBtn').click(function() {
                    // ... save farmer logic ...
                });

                // Edit Button
                $('#dataTable').on('click', '.edit-btn', function() {
                    const farmerId = $(this).data('id');
                    fetch(`/api/farmers/${farmerId}`)
                        .then(response => response.json())
                        .then(farmer => {
                            // Populate edit form
                            $('#editFarmerId').val(farmer.farmer_id);
                            $('#editFirstName').val(farmer.first_name);
                            $('#editLastName').val(farmer.last_name);
                            $('#editMiddleName').val(farmer.middle_name || '');
                            $('#editExtensionName').val(farmer.extension_name || '');
                            $('#editAddress').val(farmer.address);
                            $('#editContactNumber').val(farmer.contact_number);
                            $('#editCropType').val(farmer.crop_type);
                            $('#editFarmSize').val(farmer.farm_size);
                            
                            // Show edit modal
                            $('#editFarmerModal').modal('show');
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error loading farmer details');
                        });
                });

                // Delete Button
                $('#dataTable').on('click', '.delete-btn', function() {
                    // ... delete logic ...
                });

                // Handle View Button Click
                $('#dataTable').on('click', '.view-btn', function() {
                    currentFarmerId = $(this).data('id');
                    const farmerId = $(this).data('id');
                    const viewBtn = $(this);
                    
                    // Show loading state
                    viewBtn.prop('disabled', true)
                        .html('<i class="fas fa-spinner fa-spin"></i>');

                    // Fetch both farmer details and crops data
                    Promise.all([
                        fetch(`/api/farmers/${farmerId}`).then(res => res.json()),
                        fetch(`/api/farmers/${farmerId}/crops`).then(res => res.json())
                    ])
                    .then(([farmer, crops]) => {
                        // Update farmer details
                        const farmerDetails = `
                            <div class="farmer-details mb-4 p-3 border rounded shadow-sm bg-light">
                                
                                <p><strong>Name:</strong> ${farmer.first_name} ${farmer.middle_name || ''} ${farmer.last_name} ${farmer.extension_name || ''}</p>
                                <p><strong>Address:</strong> ${farmer.address}</p>
                                <p><strong>Contact:</strong> ${farmer.contact_number}</p>
                                <p><strong>Crop Type:</strong> ${farmer.crop_type}</p>
                                <p><strong>Farm Size:</strong> ${farmer.farm_size} hectares</p>
                            </div>
                            <div class="crops-details p-3 border rounded shadow-sm bg-light mt-3">
                                <h6 class="font-weight-bold text-success">Crops History</h6>
                                <div class="table-responsive">
                                    <table class="table table-bordered table-sm table-striped">
                                        <thead class="thead-dark">
                                            <tr>
                                                <th>Crop Type</th>
                                                <th>Bags Received</th>
                                                <th>Date Received</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        ${crops.length ? crops.map(crop => {
                                            return `
                                                <tr>
                                                    <td>${crop.crop_type}</td>
                                                    <td>${crop.bags_received}</td>
                                                    <td>${new Date(crop.date_received).toLocaleDateString()}</td>
                                                </tr>
                                            `;
                                        }).join('') : `
                                            <tr>
                                                <td colspan="3" class="text-center text-muted">No crops data available</td>
                                            </tr>
                                        `}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;

                        // Update modal content
                        $('#viewFarmerModal')
                            .find('.modal-body')
                            .html(farmerDetails);

                        // Show the modal
                        $('#viewFarmerModal').modal('show');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error loading farmer details');
                    })
                    .finally(() => {
                        // Reset button state
                        viewBtn.prop('disabled', false)
                            .html('<i class="fas fa-eye"></i> View');
                    });
                });

                // Handle Update Farmer Button Click
                $('#updateFarmerBtn').click(function() {
                    try {
                        const farmerId = $('#editFarmerId').val();
                        const editForm = document.getElementById('editFarmerForm');
                        
                        // Check if form exists
                        if (!editForm) {
                            throw new Error('Edit form not found');
                        }

                        const formData = {
                            first_name: $('#editFirstName').val()?.trim() || '',
                            last_name: $('#editLastName').val()?.trim() || '',
                            middle_name: $('#editMiddleName').val()?.trim() || '',
                            extension_name: $('#editExtensionName').val()?.trim() || '',
                            address: $('#editAddress').val()?.trim() || '',
                            contact_number: $('#editContactNumber').val()?.trim() || '',
                            crop_type: $('#editCropType').val() || '',
                            farm_size: $('#editFarmSize').val() ? parseFloat($('#editFarmSize').val()) : 0
                        };

                        // Validate form data
                        if (!formData.first_name || !formData.last_name || !formData.address || 
                            !formData.contact_number || !formData.crop_type || !formData.farm_size) {
                            alert('Please fill in all required fields');
                            return;
                        }

                        // Show loading state
                        const updateBtn = $(this);
                        updateBtn.prop('disabled', true)
                            .html('<i class="fas fa-spinner fa-spin"></i> Updating...');

                        // Send update request
                        fetch(`/api/farmers/${farmerId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(formData)
                        })
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                $('#editFarmerModal').modal('hide');
                                $('#dataTable').DataTable().ajax.reload();
                                alert('Farmer updated successfully');
                            } else {
                                throw new Error(data.error || 'Update failed');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error updating farmer: ' + error.message);
                        })
                        .finally(() => {
                            updateBtn.prop('disabled', false).html('Update Farmer');
                        });
                    } catch (error) {
                        console.error('Error in update handler:', error);
                        alert('An error occurred while updating the farmer');
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing DataTable:', error);
        }
    }
});

// Add this with your other document.ready functions
$(document).ready(function() {
    // ... existing code ...

    // Print Data Button Handler
    $('#printDataBtn').click(function() {
        // Get all farmer data from DataTable
        const tableData = $('#dataTable').DataTable().data().toArray();
        
        // Create print window content
        let printContent = `
            <html>
            <head>
                <title>Farmers Data - Smart Seed</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 1rem;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f4f4f4; 
                        font-weight: bold;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px;
                    }
                    .logo { 
                        max-width: 100px; 
                        height: auto;
                    }
                    .date-generated {
                        text-align: right;
                        margin-bottom: 20px;
                        font-size: 0.9em;
                    }
                    @media print {
                        .no-print { display: none; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/img/smartseed_logo.jpg" alt="Smart Seed Logo" class="logo">
                    <h1>Smart Seed - Farmers Data</h1>
                    <h3>Farmers Registration Report</h3>
                </div>
                <div class="date-generated">
                    Generated on: ${new Date().toLocaleString()}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Farmer ID</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Contact</th>
                            <th>Crop Type</th>
                            <th>Farm Size</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add table data
        tableData.forEach(farmer => {
            const fullName = [
                farmer.first_name,
                farmer.middle_name,
                farmer.last_name,
                farmer.extension_name
            ].filter(Boolean).join(' ');

            printContent += `
                <tr>
                    <td>${farmer.farmer_id}</td>
                    <td>${fullName}</td>
                    <td>${farmer.address}</td>
                    <td>${farmer.contact_number}</td>
                    <td>${farmer.crop_type}</td>
                    <td>${farmer.farm_size} hectares</td>
                </tr>
            `;
        });

        // Close the HTML structure
        printContent += `
                    </tbody>
                </table>
                <div class="footer">
                    <p><strong>Total Farmers:</strong> ${tableData.length}</p>
                </div>
            </body>
            </html>
        `;

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Add print button to the new window
        const printButton = printWindow.document.createElement('button');
        printButton.innerHTML = 'Print Report';
        printButton.className = 'no-print';
        printButton.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px; background: #4e73df; color: white; border: none; border-radius: 4px; cursor: pointer;';
        printButton.onclick = function() {
            printButton.style.display = 'none';
            printWindow.print();
            printButton.style.display = 'block';
        };
        printWindow.document.body.appendChild(printButton);
    });

    // Add Crops Button Handler
    $('#addCropsBtn, #addCropDataBtn').click(function() {
        // Store the current farmer ID in the modal
        $('#cropsFarmerId').val(currentFarmerId);
        
        // Reset the form
        $('#addCropsForm')[0].reset();
        
        // Hide the view modal and show the add crops modal
        $('#viewFarmerModal').modal('hide');
        $('#addCropsModal').modal('show');
    });

    // Save Crops Button Handler
    $('#saveCropsBtn').click(function() {
        const formData = {
            farmer_id: $('#cropsFarmerId').val(),
            crop_type: $('#cropsType').val(),
            bags_received: $('#bagsReceived').val(),
            date_received: $('#dateReceived').val()
        };

        // Validate form data
        if (!formData.crop_type || !formData.bags_received || !formData.date_received) {
            alert('Please fill in all required fields');
            return;
        }

        // Show loading state
        const saveBtn = $(this);
        saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

        // Send the data to the server
        fetch('/api/crops', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Close the add crops modal
                $('#addCropsModal').modal('hide');
                
                // Refresh the crops view
                refreshFarmerView(currentFarmerId);
                
                alert('Crops added successfully');
            } else {
                throw new Error(data.error || 'Failed to add crops');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding crops: ' + error.message);
        })
        .finally(() => {
            saveBtn.prop('disabled', false).html('Save Crops');
        });
    });
});

// Add this function to refresh the farmer view after adding crops
function refreshFarmerView(farmerId) {
    if (!farmerId) return;

    Promise.all([
        fetch(`/api/farmers/${farmerId}`).then(res => res.json()),
        fetch(`/api/farmers/${farmerId}/crops`).then(res => res.json())
    ])
    .then(([farmer, crops]) => {
        const farmerDetails = `
            <div class="farmer-details mb-4 p-3 border rounded shadow-sm bg-light">
                <p><strong>Name:</strong> ${farmer.first_name} ${farmer.middle_name || ''} ${farmer.last_name} ${farmer.extension_name || ''}</p>
                <p><strong>Address:</strong> ${farmer.address}</p>
                <p><strong>Contact:</strong> ${farmer.contact_number}</p>
                <p><strong>Crop Type:</strong> ${farmer.crop_type}</p>
                <p><strong>Farm Size:</strong> ${farmer.farm_size} hectares</p>
            </div>
            <div class="crops-details p-3 border rounded shadow-sm bg-light mt-3">
                <h6 class="font-weight-bold text-success">Crops History</h6>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm table-striped">
                        <thead class="thead-dark">
                            <tr>
                                <th>Crop Type</th>
                                <th>Bags Received</th>
                                <th>Date Received</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${crops.length ? crops.map(crop => `
                            <tr>
                                <td>${crop.crop_type}</td>
                                <td>${crop.bags_received}</td>
                                <td>${new Date(crop.date_received).toLocaleDateString()}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="3" class="text-center text-muted">No crops data available</td>
                            </tr>
                        `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Update modal content
        $('#viewFarmerModal')
            .find('.modal-body')
            .html(farmerDetails);

        // Show the modal
        $('#viewFarmerModal').modal('show');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error refreshing farmer details');
    });
}

// Add this to your document.ready function
$(document).ready(function() {
    // Initialize Yield History Chart
    const yieldCtx = document.getElementById('yieldHistoryChart').getContext('2d');
    const yieldHistoryChart = new Chart(yieldCtx, {
        type: 'bar', // Changed from 'line' to 'bar'
        data: {
            labels: [], // Will be populated with years
            datasets: [] // Will be populated with province data
        },
        options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 25,
                    bottom: 0
                }
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: { 
                        maxTicksLimit: 7,
                        autoSkip: false
                    },
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                }],
                yAxes: [{
                    ticks: {
                        maxTicksLimit: 5,
                        padding: 10,
                        callback: function(value) {
                            return value.toFixed(2) + ' mt';
                        },
                        beginAtZero: true
                    },
                    gridLines: {
                        color: "rgb(234, 236, 244)",
                        zeroLineColor: "rgb(234, 236, 244)",
                        drawBorder: false,
                        borderDash: [2],
                        zeroLineBorderDash: [2]
                    }
                }]
            },
            legend: {
                display: true,
                position: 'bottom'
            },
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                titleMarginBottom: 10,
                titleFontColor: '#6e707e',
                titleFontSize: 14,
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: true,
                intersect: true,
                mode: 'index',
                caretPadding: 10,
                callbacks: {
                    label: function(tooltipItem, chart) {
                        const datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
                        return `${datasetLabel}: ${tooltipItem.yLabel.toFixed(2)} mt`;
                    }
                }
            }
        }
    });

    // Function to fetch and update yield history data
    function updateYieldHistory() {
        fetch('/api/yield-history')
            .then(response => response.json())
            .then(data => {
                const colors = {
                    'Cagayan': { irrigated: 'rgba(78, 115, 223, 0.8)', rainfed: 'rgba(28, 200, 138, 0.8)' },
                    'Isabela': { irrigated: 'rgba(54, 185, 204, 0.8)', rainfed: 'rgba(246, 194, 62, 0.8)' },
                    'Nueva Vizcaya': { irrigated: 'rgba(231, 74, 59, 0.8)', rainfed: 'rgba(133, 135, 150, 0.8)' },
                    'Quirino': { irrigated: 'rgba(246, 194, 62, 0.8)', rainfed: 'rgba(231, 74, 59, 0.8)' },
                    'Batanes': { irrigated: 'rgba(28, 200, 138, 0.8)', rainfed: 'rgba(78, 115, 223, 0.8)' }
                };

                // Clear existing datasets
                yieldHistoryChart.data.labels = data.years;
                yieldHistoryChart.data.datasets = [];

                // Add datasets for each province
                Object.entries(data.provinces).forEach(([province, ecosystems]) => {
                    // Add irrigated dataset
                    yieldHistoryChart.data.datasets.push({
                        label: `${province} - Irrigated`,
                        backgroundColor: colors[province].irrigated,
                        borderColor: colors[province].irrigated,
                        borderWidth: 1,
                        data: ecosystems.irrigated
                    });

                    // Add rainfed dataset
                    yieldHistoryChart.data.datasets.push({
                        label: `${province} - Rainfed`,
                        backgroundColor: colors[province].rainfed,
                        borderColor: colors[province].rainfed,
                        borderWidth: 1,
                        data: ecosystems.rainfed
                    });
                });

                yieldHistoryChart.update();
            })
            .catch(error => {
                console.error('Error fetching yield history:', error);
            });
    }

    // Initial load of yield history
    updateYieldHistory();
});

// Add this inside your document.ready function, after the yieldHistoryChart initialization
$(document).ready(function() {
    // ... existing yieldHistoryChart code ...

    // Initialize Total Production Chart
    const totalCtx = document.getElementById('totalProductionChart').getContext('2d');
    const totalProductionChart = new Chart(totalCtx, {
        type: 'line',
        data: {
            labels: [], // Will be populated with years
            datasets: [{
                label: 'Total Production',
                borderColor: "rgba(78, 115, 223, 1)",
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderWidth: 3,
                pointRadius: 3,
                pointBackgroundColor: "rgba(78, 115, 223, 1)",
                pointBorderColor: "rgba(78, 115, 223, 1)",
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                pointHitRadius: 10,
                data: []
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 25,
                    bottom: 0
                }
            },
            scales: {
                xAxes: [{
                    time: {
                        unit: 'year'
                    },
                    gridLines: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxTicksLimit: 7
                    }
                }],
                yAxes: [{
                    ticks: {
                        maxTicksLimit: 5,
                        padding: 10,
                        callback: function(value) {
                            return value.toFixed(2) + ' mt';
                        },
                        beginAtZero: true
                    },
                    gridLines: {
                        color: "rgb(234, 236, 244)",
                        zeroLineColor: "rgb(234, 236, 244)",
                        drawBorder: false,
                        borderDash: [2],
                        zeroLineBorderDash: [2]
                    }
                }]
            },
            legend: {
                display: true,
                position: 'bottom'
            },
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                titleMarginBottom: 10,
                titleFontColor: '#6e707e',
                titleFontSize: 14,
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                intersect: false,
                mode: 'index',
                caretPadding: 10,
                callbacks: {
                    label: function(tooltipItem, chart) {
                        return 'Total Production: ' + tooltipItem.yLabel.toFixed(2) + ' mt';
                    }
                }
            }
        }
    });

    // Update the updateYieldHistory function to populate both charts
    function updateYieldHistory() {
        fetch('/api/yield-history')
            .then(response => response.json())
            .then(data => {
                // Update existing yield history chart
                // ... existing code ...

                // Calculate total production per year
                const totalProduction = data.years.map((year, index) => {
                    let total = 0;
                    Object.values(data.provinces).forEach(province => {
                        total += (province.irrigated[index] || 0) + (province.rainfed[index] || 0);
                    });
                    return total;
                });

                // Update total production chart
                totalProductionChart.data.labels = data.years;
                totalProductionChart.data.datasets[0].data = totalProduction;
                totalProductionChart.update();
            })
            .catch(error => {
                console.error('Error fetching yield history:', error);
            });
    }

    // Initial load of yield history
    updateYieldHistory();
});
