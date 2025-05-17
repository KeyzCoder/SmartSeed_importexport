document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard stats for guest view
    function updateDashboardStats() {
        fetch('/api/dashboard/guest')
            .then(response => response.json())
            .then(data => {
                document.getElementById('totalFarmers').textContent = data.totalFarmers || '0';
                document.getElementById('totalFarmSize').textContent = `${data.totalFarmSize || '0'} hectares`;
                document.getElementById('motherSeeds').textContent = `${data.totalMotherSeeds || '0'} bags`;
            })
            .catch(error => {
                console.error('Error fetching dashboard data:', error);
                ['totalFarmers', 'totalFarmSize', 'motherSeeds'].forEach(id => {
                    document.getElementById(id).textContent = 'N/A';
                });
            });
    }

    // Initialize Mother Seeds Distribution Chart
    function initMotherSeedsPieChart() {
        const ctx = document.getElementById('motherSeedsPieChart');
        if (!ctx) return;

        fetch('/api/dashboard/mother-seeds-distribution')
            .then(response => response.json())
            .then(result => {
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
                            ]
                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        tooltips: {
                            backgroundColor: "rgb(255,255,255)",
                            bodyFontColor: "#858796",
                            borderColor: '#dddfeb',
                            borderWidth: 1,
                            displayColors: false,
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    const value = data.datasets[0].data[tooltipItem.index];
                                    const label = data.labels[tooltipItem.index];
                                    return `${label}: ${value} farmers`;
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Initialize Yield History Chart
    function initYieldHistoryChart() {
        const ctx = document.getElementById('yieldHistoryChart');
        if (!ctx) return;

        const yieldHistoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        gridLines: { display: false },
                        ticks: { maxTicksLimit: 7 }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: value => value.toFixed(2) + ' mt'
                        }
                    }]
                },
                tooltips: {
                    backgroundColor: "rgb(255,255,255)",
                    bodyFontColor: "#858796",
                    titleFontColor: "#6e707e",
                    borderColor: '#dddfeb',
                    borderWidth: 1,
                    displayColors: true,
                    mode: 'index',
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return `${data.datasets[tooltipItem.datasetIndex].label}: ${tooltipItem.yLabel.toFixed(2)} mt`;
                        }
                    }
                }
            }
        });

        // Fetch and update yield history data
        fetch('/api/yield-history')
            .then(response => response.json())
            .then(data => updateYieldChart(yieldHistoryChart, data))
            .catch(error => console.error('Error:', error));
    }

    // Yield Calculator functionality
    const yieldCalculatorForm = document.getElementById('yieldCalculatorForm');
    if (yieldCalculatorForm) {
        const yieldRates = {
            rc216: {
                irrigated: { transplanted: 6000, direct: 5700 },
                rainfed: { transplanted: 0, direct: 0 }
            },
            rc160: {
                irrigated: { transplanted: 6100, direct: 6100 },
                rainfed: { transplanted: 4750, direct: 4750 }
            },
            rc300: {
                irrigated: { transplanted: 6400, direct: 6400 },
                rainfed: { transplanted: 0, direct: 0 }
            },
            rc222: {
                irrigated: { transplanted: 6100, direct: 6100 },
                rainfed: { transplanted: 4750, direct: 4750 }
            }
        };

        yieldCalculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateYield(yieldRates);
        });

        // Form field change handlers
        ['cropVariety', 'farmingMethod'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                validateVarietyAndMethod(yieldRates);
            });
        });
    }

    // Initialize all components
    updateDashboardStats();
    initMotherSeedsPieChart();
    initYieldHistoryChart();

    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('sidebar-toggled');
            document.querySelector('.sidebar').classList.toggle('toggled');
        });
    }
});

// Helper Functions
function calculateYield(yieldRates) {
    const variety = document.getElementById('cropVariety').value;
    const farmingMethod = document.getElementById('farmingMethod').value;
    const plantingMethod = document.getElementById('plantingMethod').value;
    const landArea = parseFloat(document.getElementById('landArea').value);

    if (!variety || !farmingMethod || !landArea) {
        alert('Please fill in all required fields');
        return;
    }

    const yieldRate = yieldRates[variety][farmingMethod][plantingMethod];
    const totalYield = yieldRate * landArea;

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
}

function validateVarietyAndMethod(yieldRates) {
    const variety = document.getElementById('cropVariety').value;
    const farmingMethod = document.getElementById('farmingMethod').value;

    if (variety && farmingMethod) {
        if ((variety === 'rc216' || variety === 'rc300') && farmingMethod === 'rainfed') {
            document.getElementById('farmingMethod').value = 'irrigated';
            alert('This variety is not recommended for rainfed conditions.');
        }
    }
}