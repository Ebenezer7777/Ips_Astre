let globalHypothesesData;
let globalStudentsData = [];
let barChart, pieChart, divergentChart;

// Chargement des données JSON
function loadJSON(jsonPath, callback) {
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            globalHypothesesData = data;
            callback(data);
        })
        .catch(error => console.error('Erreur lors du chargement du fichier JSON:', error));
}

function createSliders(hypothesesData) {
    const controlsDiv = document.getElementById('hypothesesControls');
    controlsDiv.className = 'sliders-container'; // Classe pour le conteneur principal

    hypothesesData.hypotheses.forEach((hypothesis, index) => {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const label = document.createElement('label');
        label.textContent = `${hypothesis.libelle}: `;

        const sliderValue = document.createElement('span');
        sliderValue.textContent = hypothesis.weight;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.1';
        slider.value = hypothesis.weight;
        slider.dataset.index = index;

        slider.addEventListener('input', function () {
            hypothesesData.hypotheses[this.dataset.index].weight = parseFloat(this.value);
            sliderValue.textContent = this.value;
            updateScoresAndCharts();
        });

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(sliderValue);
        controlsDiv.appendChild(sliderContainer);
    });
}


// Traitement du fichier CSV
function processCSVFile() {
    document.getElementById("evaluateButton").addEventListener("click", function () {
        let fileInput = document.getElementById("csvFileInput");
        let file = fileInput.files[0];

        Papa.parse(file, {
            header: true,
            complete: function (results) {
                globalStudentsData = results.data.map(student => {
                    return {
                        ...student,
                        ...evaluateHypotheses(student, globalHypothesesData)
                    };
                });
                updateScoresAndCharts();
            }
        });
    });
}

// Évaluation des hypothèses
function evaluateHypotheses(student, hypothesesData) {
    let ipsScore = 0,
        astreScore = 0;
    hypothesesData.hypotheses.forEach(hypothesis => {
        let studentAnswer = student[hypothesis.question];
        if (hypothesis.filiere === 'IPS' && hypothesis.choices.includes(studentAnswer)) {
            ipsScore += hypothesis.weight;
        } else if (hypothesis.filiere === 'ASTRE' && hypothesis.choices.includes(studentAnswer)) {
            astreScore += hypothesis.weight;
        }
    });
    return {
        ipsScore,
        astreScore
    };
}

// Mise à jour des scores, du tableau et des graphiques
function updateScoresAndCharts() {
    globalStudentsData.forEach(student => {
        const scores = evaluateHypotheses(student, globalHypothesesData);
        student.ipsScore = scores.ipsScore;
        student.astreScore = scores.astreScore;
    });

    updateTable(globalStudentsData);
    updateBarChart(globalStudentsData);
    updatePieChart(globalStudentsData);
    updateDivergentChart(globalStudentsData);
}

function updateTable(studentsData) {
    const resultsBody = document.getElementById("resultsBody");
    resultsBody.innerHTML = ''; // Effacer les anciennes lignes

    studentsData.forEach(student => {
        let row = resultsBody.insertRow();
        row.insertCell(0).textContent = student["Quel est ton numéro étudiant ? (eXXXXXX, iXXXXXX ...)"];
        row.insertCell(1).textContent = student.ipsScore.toFixed(2);
        row.insertCell(2).textContent = student.astreScore.toFixed(2);

        // Ajouter la prédiction de la filière
        const predictedFiliere = student.ipsScore > student.astreScore ? "IPS" : "ASTRE";
        row.insertCell(3).textContent = predictedFiliere;
    });
}



function updateBarChart(studentsData) {
    const ctxBar = document.getElementById('studentsChart').getContext('2d');
    const labels = studentsData.map(data => data["Quel est ton numéro étudiant ? (eXXXXXX, iXXXXXX ...)"]);
    const ipsScores = studentsData.map(data => data.ipsScore);
    const astreScores = studentsData.map(data => data.astreScore);

    const barChartData = {
        labels: labels,
        datasets: [{
            label: 'Score IPS',
            data: ipsScores,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }, {
            label: 'Score ASTRE',
            data: astreScores,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    if (barChart) {
        barChart.data = barChartData;
        barChart.update();
    } else {
        barChart = new Chart(ctxBar, {
            type: 'bar',
            data: barChartData,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function updatePieChart(studentsData) {
    const ctxPie = document.getElementById('percentageChart').getContext('2d');
    const totalStudents = studentsData.length;
    const totalIps = studentsData.reduce((acc, data) => acc + (data.ipsScore >= data.astreScore ? 1 : 0), 0);
    const totalAstre = totalStudents - totalIps;

    const pieChartData = {
        labels: ['IPS', 'ASTRE'],
        datasets: [{
            data: [totalIps, totalAstre],
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1
        }]
    };

    if (pieChart) {
        pieChart.data = pieChartData;
        pieChart.update();
    } else {
        pieChart = new Chart(ctxPie, {
            type: 'pie',
            data: pieChartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Répartition IPS vs ASTRE',
                        fontSize: 12
                    }
                }
            }
        });
    }
}

function updateDivergentChart(studentsData) {
    const ctxDivergent = document.getElementById('divergentChart').getContext('2d');
    const labels = studentsData.map(data => data["Quel est ton numéro étudiant ? (eXXXXXX, iXXXXXX ...)"]);
    const ipsScores = studentsData.map(data => data.ipsScore);
    const astreScores = studentsData.map(data => -data.astreScore); // Scores ASTRE en négatif pour le diagramme divergent

    const divergentChartData = {
        labels: labels,
        datasets: [{
            label: 'Score IPS',
            data: ipsScores,
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }, {
            label: 'Score ASTRE',
            data: astreScores,
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
    };

    if (divergentChart) {
        divergentChart.data = divergentChartData;
        divergentChart.update();
    } else {
        divergentChart = new Chart(ctxDivergent, {
                type: 'bar',
                data: divergentChartData,
                options: {
                    indexAxis: 'y',
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                callback: function (value) {
                                    return Math.abs(value);
                                }
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
    }
}


// Démarrage du processus
loadJSON('hypotheses.json', createSliders);
processCSVFile();