// Add these functions at the top level
window.onCaptchaComplete = function() {
    document.getElementById('captcha-error').textContent = '';
};

window.onCaptchaExpired = function() {
    document.getElementById('captcha-error').textContent = 'Captcha expired. Please verify again.';
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
                                                <th>Predicted Yield</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${crops.length ? crops.map(crop => `
                                                <tr>
                                                    <td>${crop.crop_type}</td>
                                                    <td>${crop.bags_received}</td>
                                                    <td>${new Date(crop.date_received).toLocaleDateString()}</td>
                                                    <td>${crop.predicted_yield || 'N/A'}</td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="4" class="text-center text-muted">No crops data available</td>
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
