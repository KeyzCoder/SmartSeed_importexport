document.addEventListener("DOMContentLoaded", function() {
    // Initialize all DOM elements
    const dataTable = document.querySelector("#dataTable tbody");
    const farmerDetails = document.getElementById("farmerDetails");
    const addFarmerBtn = document.getElementById("addFarmerBtn");
    const addFarmerModal = document.getElementById("addFarmerModal");
    const saveFarmerBtn = document.getElementById("saveFarmerBtn");
    const addFarmerForm = document.getElementById("addFarmerForm");
    const logoutBtn = document.getElementById("logout-btn");
    const sidebarToggle = document.getElementById("sidebarToggle");
    
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            try {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const captchaResponse = grecaptcha.getResponse();

                // Clear previous errors
                document.getElementById('captcha-error').textContent = '';
                document.getElementById('password-error').textContent = '';

                // Validate captcha
                if (!captchaResponse) {
                    document.getElementById('captcha-error').textContent = 'Please complete the captcha';
                    return;
                }

                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    window.location.href = '/dashboard.html';
                } else {
                    document.getElementById('password-error').textContent = data.error || 'Login failed';
                }
            } catch (error) {
                console.error('Login error:', error);
                document.getElementById('password-error').textContent = 'An error occurred during login';
            }
        });
    } else {
        console.log("Login form not found. Skipping login-related code.");
    }

    // Add Farmer Modal functionality
    if (addFarmerBtn && addFarmerModal) {
        addFarmerBtn.addEventListener("click", function() {
            $('#addFarmerModal').modal('show');
        });
    }

    // Save Farmer functionality
    if (saveFarmerBtn) {
        // Remove any existing event listeners
        saveFarmerBtn.replaceWith(saveFarmerBtn.cloneNode(true));
        // Get the new button reference
        const newSaveFarmerBtn = document.getElementById("saveFarmerBtn");
        
        // Add single event listener
        newSaveFarmerBtn.addEventListener("click", async function() {
            // Disable button to prevent double submission
            newSaveFarmerBtn.disabled = true;
            
            try {
                // Form validation
                const formInputs = ["firstName", "lastName", "address", "contactNumber", "cropType", "farmSize"];
                const missingFields = formInputs.filter(id => !document.getElementById(id).value);
                
                if (missingFields.length > 0) {
                    alert('Please fill in all required fields');
                    newSaveFarmerBtn.disabled = false;
                    return;
                }

                // Get all form values
                const formData = {
                    first_name: document.getElementById("firstName").value,
                    last_name: document.getElementById("lastName").value,
                    middle_name: document.getElementById("middleName").value || null,
                    extension_name: document.getElementById("extensionName").value || null,
                    address: document.getElementById("address").value,
                    contact_number: document.getElementById("contactNumber").value,
                    crop_type: document.getElementById("cropType").value,
                    farm_size: parseFloat(document.getElementById("farmSize").value)
                };

                // Update the fetch URL to use the correct API endpoint
                const response = await fetch('/api/farmers', {  // Changed from '/farmers' to '/api/farmers'
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    alert('Farmer added successfully!');
                    $('#addFarmerModal').modal('hide');
                    addFarmerForm.reset();
                    // Refresh the DataTable instead of page reload
                    if ($.fn.DataTable.isDataTable('#dataTable')) {
                        $('#dataTable').DataTable().ajax.reload();
                    } else {
                        window.location.reload();
                    }
                } else {
                    throw new Error(result.message || 'Error adding farmer');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(`Error adding farmer: ${error.message}`);
            } finally {
                // Re-enable button
                newSaveFarmerBtn.disabled = false;
            }
        });
    }

    // Dashboard data fetching
    function updateDashboardStats(data) {
        const totalFarmers = document.getElementById('totalFarmers');
        const totalFarmSize = document.getElementById('totalFarmSize');
        const motherSeeds = document.getElementById('motherSeeds');

        if (totalFarmers) totalFarmers.textContent = data.length || 0;
        
        if (totalFarmSize) {
            const totalSize = data.reduce((sum, farmer) => 
                sum + (parseFloat(farmer.farm_size) || 0), 0);
            totalFarmSize.textContent = totalSize.toFixed(2) + ' hectares';
        }
        
        if (motherSeeds) {
            const totalBags = data.reduce((sum, farmer) => 
                sum + (parseInt(farmer.total_bags_received) || 0), 0);
            motherSeeds.textContent = totalBags + ' bags';
        }
    }

    // Fetch farmers data once and use it for both table and dashboard
    if (dataTable || document.getElementById('totalFarmers')) {
        fetch("/api/farmers")
            .then(response => response.json())
            .then(data => {
                // Update dashboard stats
                updateDashboardStats(data);

                // Update farmers table if it exists
                if (dataTable) {
                    dataTable.innerHTML = ""; // Clear existing rows
                    
                    // Create a Set to track unique farmer IDs
                    const processedFarmerIds = new Set();
                    
                    data.forEach(farmer => {
                        // Skip if we've already processed this farmer
                        if (processedFarmerIds.has(farmer.farmer_id)) {
                            return;
                        }
                        
                        processedFarmerIds.add(farmer.farmer_id);
                        
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${farmer.farmer_id}</td>
                            <td>${farmer.first_name}</td>
                            <td>${farmer.last_name}</td>
                            <td>${farmer.middle_name || "-"}</td>
                            <td>${farmer.extension_name || "-"}</td>
                            <td>${farmer.address}</td>
                            <td>${farmer.contact_number}</td>
                            <td>${farmer.crop_type || "-"}</td>
                            <td>${farmer.farm_size} hectares</td>
                            <td>
                                <button class="btn btn-primary btn-sm edit-btn">Edit</button>
                                <button class="btn btn-secondary btn-sm view-crops-btn">View Crops</button>
                            </td>
                        `;
                        // Add click event listener to display farmer details and crops
                        row.addEventListener("click", function () {
                            // Highlight the selected row
                            document.querySelectorAll("#dataTable tbody tr").forEach(r => r.classList.remove("highlighted"));
                            row.classList.add("highlighted");

                            // Display farmer details
                            farmerDetails.style.display = "block";
                            const farmerIdElem = document.getElementById("farmerId");
                            const farmerNameElem = document.getElementById("farmerName");
                            const farmerAddressElem = document.getElementById("farmerAddress");
                            const farmerContactElem = document.getElementById("farmerContact");
                            const farmerCropElem = document.getElementById("farmerCrop");
                            const farmerFarmSizeElem = document.getElementById("farmerFarmSize");
                            const cropsContainer = document.getElementById("farmerCropsContainer");
                            farmerIdElem.textContent = farmer.farmer_id;
                            farmerNameElem.textContent = `${farmer.first_name} ${farmer.last_name}`;
                            farmerAddressElem.textContent = farmer.address;
                            farmerContactElem.textContent = farmer.contact_number;
                            farmerCropElem.textContent = farmer.crop_type || "-";
                            farmerFarmSizeElem.textContent = `${farmer.farm_size} hectares`;

                            // Fetch and display crops data
                            fetch(`/farmers/farmer_crops/${farmer.farmer_id}`)
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`);
                                    }
                                    return response.json();
                                })
                                .then(cropsData => {
                                    displayFarmerCrops(cropsData, farmer.farmer_id);
                                })
                                .catch(error => {
                                    console.error("No data", error);
                                    const cropsTableBody = document.getElementById("cropsList");
                                    if (cropsTableBody) {
                                        cropsTableBody.innerHTML = `
                                            <tr>
                                                <td colspan="4" class="text-center">No A data for Farmer ID: ${farmer.farmer_id}</td>
                                            </tr>
                                        `;
                                    }
                                });
                        });

                        // Add edit button click handler
                        row.querySelector('.edit-btn').addEventListener('click', function() {
                            populateEditModal(farmer);
                            $('#editFarmerModal').modal('show');
                        });

                        dataTable.appendChild(row);
                    });
                }
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                const elements = ['totalFarmers', 'totalFarmSize', 'motherSeeds'];
                elements.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = 'Error loading data';
                });
            });
    }

    if (document.getElementById('totalFarmers')) {
        fetch('/api/dashboard/stats')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                document.getElementById('totalFarmers').textContent = data.totalFarmers || '0';
                document.getElementById('totalFarmSize').textContent = `${data.totalFarmSize || '0'} hectares`;
                document.getElementById('motherSeeds').textContent = `${data.totalMotherSeeds || '0'} bags`;
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Replace the existing crop breakdown fetch code
    if (document.getElementById('cropTypeBreakdown')) {
        fetch('/api/dashboard/crop-breakdown')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(result => {
                if (result.success && result.data.length > 0) {
                    const container = document.getElementById('cropTypeBreakdown');
                    
                    // Group data by location
                    const groupedData = result.data.reduce((acc, item) => {
                        if (!acc[item.address]) {
                            acc[item.address] = {
                                'NSIC Rc 216 (Tubigan 17)': 0,
                                'NSIC Rc 160': 0,
                                'NSIC Rc 300 (Tubigan 24)': 0,
                                'NSIC Rc 222 (Tubigan 18)': 0
                            };
                        }
                        acc[item.address][item.crop_type] = item.count;
                        return acc;
                    }, {});

                    // Clear loading spinner
                    container.innerHTML = '';

                    // Create location sections
                    Object.entries(groupedData).forEach(([location, crops]) => {
                        const locationDiv = document.createElement('div');
                        locationDiv.className = 'location-item';
                        
                        const locationContent = `
                            <div class="location-header">
                                <i class="fas fa-map-marker-alt mr-2"></i>${location}
                            </div>
                            <div class="crop-list">
                                <div class="crop-item">
                                    <span class="crop-name rc216">NSIC Rc 216 (Tubigan 17)</span>
                                    <span class="crop-count">${crops['NSIC Rc 216 (Tubigan 17)'] || 0}</span>
                                </div>
                                <div class="crop-item">
                                    <span class="crop-name rc160">NSIC Rc 160</span>
                                    <span class="crop-count">${crops['NSIC Rc 160'] || 0}</span>
                                </div>
                                <div class="crop-item">
                                    <span class="crop-name rc300">NSIC Rc 300 (Tubigan 24)</span>
                                    <span class="crop-count">${crops['NSIC Rc 300 (Tubigan 24)'] || 0}</span>
                                </div>
                                <div class="crop-item">
                                    <span class="crop-name rc222">NSIC Rc 222 (Tubigan 18)</span>
                                    <span class="crop-count">${crops['NSIC Rc 222 (Tubigan 18)'] || 0}</span>
                                </div>
                            </div>
                        `;
                        
                        locationDiv.innerHTML = locationContent;
                        container.appendChild(locationDiv);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching crop breakdown:', error);
                const container = document.getElementById('cropTypeBreakdown');
                container.innerHTML = `
                    <div class="text-center text-danger p-3">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        Error loading data
                    </div>
                `;
            });
    }

    // Add this after your existing dashboard stats fetch code
    function initMotherSeedsPieChart() {
        const ctx = document.getElementById('motherSeedsPieChart');
        if (!ctx) return;

        console.log('Initializing mother seeds pie chart...');

        fetch('/api/dashboard/mother-seeds-distribution')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(result => {
                console.log('Received data:', result);

                const data = result.data;

                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'NSIC Rc 216 (Tubigan 17)',
                            'NSIC Rc 160',
                            'NSIC Rc 300 (Tubigan 24)',
                            'NSIC Rc 222 (Tubigan 18)'
                        ],
                        datasets: [{
                            data: [
                                data.rc216 || 0,
                                data.rc160 || 0,
                                data.rc300 || 0,
                                data.rc222 || 0
                            ],
                            backgroundColor: [
                                '#4e73df',
                                '#1cc88a',
                                '#36b9cc',
                                '#f6c23e'
                            ],
                            hoverBackgroundColor: [
                                '#2e59d9',
                                '#17a673',
                                '#2c9faf',
                                '#f4b619'
                            ],
                            hoverBorderColor: "rgba(234, 236, 244, 1)"
                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        tooltips: {
                            backgroundColor: "rgb(255,255,255)",
                            bodyFontColor: "#858796",
                            borderColor: '#dddfeb',
                            borderWidth: 1,
                            xPadding: 15,
                            yPadding: 15,
                            displayColors: false,
                            caretPadding: 10,
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    const dataset = data.datasets[tooltipItem.datasetIndex];
                                    const value = dataset.data[tooltipItem.index];
                                    return `${data.labels[tooltipItem.index]}: ${value} farmers`;
                                }
                            }
                        },
                        legend: {
                            display: false
                        },
                        cutoutPercentage: 80
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching mother seeds distribution:', error);
                ctx.parentElement.innerHTML = `
                    <div class="text-center text-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        Error loading chart data
                    </div>
                `;
            });
    }

    // Call the function when the document is loaded
    if (document.getElementById('motherSeedsPieChart')) {
        initMotherSeedsPieChart();
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            localStorage.removeItem("token");
            window.location.href = "login.html";
        });
    }

    // Sidebar toggle functionality
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function() {
            document.getElementById("accordionSidebar").classList.toggle("toggled");
        });
    }

    // Function to display farmer crops data
    function displayFarmerCrops(cropsData, farmerId) {
        const cropsTableBody = document.getElementById("cropsList");
        const cropsForFarmer = document.getElementById("cropsForFarmer");
        const cropsFarmerIdSpan = document.querySelector("#cropsForFarmer .card-header h6 span");
    
        if (!cropsTableBody || !cropsForFarmer) {
            console.error("Required elements not found in the DOM");
            return;
        }
    
        // Show the crops container
        cropsForFarmer.style.display = "block";
    
        // Update the Farmer ID in the header
        if (cropsFarmerIdSpan) {
            cropsFarmerIdSpan.textContent = farmerId;
        }
    
        // Clear existing rows in the table body
        cropsTableBody.innerHTML = "";
    
        if (cropsData && cropsData.length > 0) {
            // Populate the table with crops data
            cropsTableBody.innerHTML = `${cropsData.length ? cropsData.map(crop => `
                <tr data-crop-id="${crop.id}">
                    <td>${crop.crop_type}</td>
                    <td>${crop.bags_received}</td>
                    <td>${new Date(crop.date_received).toLocaleDateString()}</td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="3" class="text-center text-muted">No crops data available</td>
                </tr>
            `}`;
        } else {
            // If no crops data is available, display a message in the table
            cropsTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">No crops data available for this farmer.</td>
                </tr>
            `;
        }
    }

    // Edit Farmer functionality
    function populateEditModal(farmer) {
        document.getElementById('editFarmerId').value = farmer.farmer_id;
        document.getElementById('editFirstName').value = farmer.first_name;
        document.getElementById('editLastName').value = farmer.last_name;
        document.getElementById('editMiddleName').value = farmer.middle_name || '';
        document.getElementById('editExtensionName').value = farmer.extension_name || '';
        document.getElementById('editAddress').value = farmer.address;
        document.getElementById('editContactNumber').value = farmer.contact_number;
        document.getElementById('editCropType').value = farmer.crop_type;
        document.getElementById('editFarmSize').value = farmer.farm_size;
    }

    // Update Farmer functionality
    const updateFarmerBtn = document.getElementById('updateFarmerBtn');
    if (updateFarmerBtn) {
        // Remove any existing event listeners by cloning the button
        updateFarmerBtn.replaceWith(updateFarmerBtn.cloneNode(true));
        
        // Get the new button reference
        const newUpdateFarmerBtn = document.getElementById('updateFarmerBtn');
        
        newUpdateFarmerBtn.addEventListener('click', async function() {
            try {
                // Form validation
                const formInputs = ["editFirstName", "editLastName", "editAddress", "editContactNumber", "editCropType", "editFarmSize"];
                const missingFields = formInputs.filter(id => !document.getElementById(id).value);
                
                if (missingFields.length > 0) {
                    alert('Please fill in all required fields');
                    return;
                }

                const farmerId = document.getElementById('editFarmerId').value;
                const formData = {
                    first_name: document.getElementById('editFirstName').value.trim(),
                    last_name: document.getElementById('editLastName').value.trim(),
                    middle_name: document.getElementById('editMiddleName').value.trim() || null,
                    extension_name: document.getElementById('editExtensionName').value.trim() || null,
                    address: document.getElementById('editAddress').value.trim(),
                    contact_number: document.getElementById('editContactNumber').value.trim(),
                    crop_type: document.getElementById('editCropType').value,
                    farm_size: parseFloat(document.getElementById('editFarmSize').value)
                };

                // Disable update button while processing
                newUpdateFarmerBtn.disabled = true;

                const response = await fetch(`/farmers/${farmerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }
                
                if (result.success) {
                    alert('Farmer updated successfully!');
                    $('#editFarmerModal').modal('hide');
                    window.location.reload();
                } else {
                    throw new Error(result.message || 'Error updating farmer');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(`Error updating farmer: ${error.message}`);
            } finally {
                // Re-enable update button
                newUpdateFarmerBtn.disabled = false;
            }
        });
    }
});

// Add this after your existing code

// Yield calculator functionality
document.addEventListener('DOMContentLoaded', function() {
    const yieldCalculatorForm = document.getElementById('yieldCalculatorForm');
    if (!yieldCalculatorForm) return;

    const yieldRates = {
        rc216: {
            irrigated: {
                transplanted: 6000,
                direct: 5700
            },
            rainfed: {
                transplanted: 0,
                direct: 0
            }
        },
        rc160: {
            irrigated: {
                transplanted: 6100,
                direct: 6100
            },
            rainfed: {
                transplanted: 4750,
                direct: 4750
            }
        },
        rc300: {
            irrigated: {
                transplanted: 6400,
                direct: 6400
            },
            rainfed: {
                transplanted: 0,
                direct: 0
            }
        },
        rc222: {
            irrigated: {
                transplanted: 6100,
                direct: 6100
            },
            rainfed: {
                transplanted: 4750,
                direct: 4750
            }
        }
    };

    // Update form based on selections
    document.getElementById('cropVariety').addEventListener('change', updateFormOptions);
    document.getElementById('farmingMethod').addEventListener('change', updateFormOptions);

    function updateFormOptions() {
        const variety = document.getElementById('cropVariety').value;
        const farmingMethod = document.getElementById('farmingMethod').value;
        const plantingMethodSelect = document.getElementById('plantingMethod');

        if (variety && farmingMethod) {
            // Disable rainfed option for varieties that don't support it
            if ((variety === 'rc216' || variety === 'rc300') && farmingMethod === 'rainfed') {
                document.getElementById('farmingMethod').value = 'irrigated';
                alert('This variety is not recommended for rainfed conditions.');
            }
        }
    }

    // Handle form submission
    yieldCalculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const variety = document.getElementById('cropVariety').value;
        const farmingMethod = document.getElementById('farmingMethod').value;
        const plantingMethod = document.getElementById('plantingMethod').value;
        const landArea = parseFloat(document.getElementById('landArea').value);

        if (!variety || !farmingMethod || !landArea) {
            alert('Please fill in all required fields');
            return;
        }

        // Calculate yield
        const yieldRate = yieldRates[variety][farmingMethod][plantingMethod];
        const totalYield = yieldRate * landArea;

        // Display result
        const resultDiv = document.getElementById('yieldResult');
        const estimateText = document.getElementById('yieldEstimate');
        
        if (yieldRate === 0) {
            estimateText.innerHTML = `
                <strong class="text-danger">Not Recommended</strong><br>
                This variety is not recommended for ${farmingMethod} conditions.
            `;
        } else {
            estimateText.innerHTML = `
                <strong>Total Estimated Yield:</strong> ${totalYield.toLocaleString()} kg<br>
                <strong>Yield Rate:</strong> ${yieldRate.toLocaleString()} kg/hectare<br>
                <strong>Land Area:</strong> ${landArea} hectare(s)
            `;
        }
        
        resultDiv.style.display = 'block';
    });
});

