const sensorSecs = 60;
const sensorMilisecs = sensorSecs * 1000;
const updateInterval = sensorMilisecs / 3;
const receiverId = "rB";
const stdDataSize = 10;
document.getElementById("stdDataSize").innerHTML = `${stdDataSize} valores`;
var update = setInterval(updateData, updateInterval);
var showAlert = true;
var senderId = document.getElementsByName("senderId")[0];
var chartType = document.getElementsByName("chartType")[0];
var status = document.getElementById("status");
var figures = document.getElementsByClassName("highcharts-figure");
var footer = document.getElementById("footer");
var rangeDiv = document.getElementById("rangeDiv");
var range = document.getElementsByName("range")[0];
var datesDiv = document.getElementById("datesDiv");
var start = document.getElementsByName("start")[0];
var end = document.getElementsByName("end")[0];
var infoDiv = document.getElementById("infoDiv");
var smooth = document.getElementById("smooth");
var sensorData = document.getElementById("sensorData");
var chartGauge = Highcharts.chart("chartGauge", {
    chart: {
        type: "solidgauge",
        backgroundColor: "powderBlue",
        borderRadius: "10px"
    },
    title: {
        text: "Nível",
        margin: 0
    },
    series: [
        {
            name: "Nível",
            data: [0],
            dataLabels: {
                format: '<strong style="font-size:25px;stroke-width:0">{y} %'
            }
        }
    ],
    plotOptions: {
        solidgauge: {
            dataLabels: {
                borderWidth: 0
            }
        }
    },
    pane: {
        size: "150%",
        center: ["50%", "85%"],
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor: "whiteSmoke",
            innerRadius: "60%",
            outerRadius: "100%",
            shape: "arc"
        }
    },
    yAxis: {
        min: 0,
        max: 100,
        stops: [
            [0.3, "#DF5353"],
            [0.5, "#DDDF0D"],
            [0.9, "#55BF3B"]
        ],
        tickAmount: 0,
        minorTickInterval: 5,
        labels: {
            y: 20,
            distance: -50,
            style: {
                fontSize: "1rem"
            }
        }
    }
});
var chartGraph = Highcharts.chart("chartGraph", {
    chart: {
        type: "spline",
        backgroundColor: "whiteSmoke",
        borderRadius: "10px"
    },
    title: {
        text: "Nível",
        margin: 0
    },
    series: [
        {
            name: "Nível",
            data: [],
            showInLegend: false,
            marker: {
                enabled: false
            }
        }
    ],
    plotOptions: {
        series: {
            color: "royalBlue",
            cursor: "cell"
        }
    },
    xAxis: {
        type: "datetime",
        title: {
            text: "Horário"
        },
        dateTimeLabelFormats: {
            second: "%H:%M:%S"
        }
    },
    yAxis: {
        title: {
            text: "Nível (%)"
        },
        max: 105,
        min: 50
    }
});
updateData();

function updateForm(changedInput) {
    showAlert = true;
    clearInterval(update);
    hideSelected(senderId);
    hideSelected(chartType);
    switch (changedInput) {
        case "chartType":
            figures[0].hidden = !figures[0].hidden;
            figures[1].hidden = !figures[0].hidden;
            footer.hidden = figures[1].hidden;
            break;
        case "range":
            rangeDiv.insertAdjacentElement("afterend", datesDiv);
            start.value = "";
            end.value = "";
            break;
        case "date":
            datesDiv.insertAdjacentElement("afterend", rangeDiv);
            if (start.value != "" && end.value != "") {
                compareDates();
            }
            range.value = "";
            break;
        case "smooth":
            if (Number.isNaN(parseInt(smooth.value))) {
                smooth.value = 0;
            }
            smooth.value = parseInt(Math.max(0, smooth.value));
            smooth.value = Math.min(10, smooth.value);
            break;
        default:
            break;
    }
    hideSelected(range);
    updateData();
    update = setInterval(updateData, updateInterval);
}

function hideSelected(select) {
    options = select.getElementsByTagName("option");
    for (var i = 0; i < options.length; i++) {
        options[i].hidden = options[i].selected;
        if (options[i].value == "") {
            options[i].hidden = true;
        }
    }
}

function compareDates() {
    var dateStart = new Date(start.value);
    var dateEnd = new Date(end.value);
    if (dateStart > dateEnd) {
        dateStart = start.value;
        start.value = end.value;
        end.value = dateStart;
    }
}

function updateData() {
    var xhr = new XMLHttpRequest();
    var param = "senderId=" + senderId.value;
    param += "&receiverId=" + receiverId;
    switch (chartType.value) {
        case "gauge":
            xhr.open("POST", "https://iot.mep.eng.br/lineaGauge.php", true);
            xhr.setRequestHeader(
                "Content-Type",
                "application/x-www-form-urlencoded"
            );
            xhr.onreadystatechange = function () {
                if (
                    this.readyState === XMLHttpRequest.DONE &&
                    this.status === 200
                ) {
                    updateGauge(this.responseText.split("/"));
                }
            };
            break;
        case "graph":
            param += "&range=" + range.value;
            param += "&start=" + start.value;
            param += "&end=" + end.value;
            param += "&stdDataSize=" + stdDataSize;
            xhr.open("POST", "https://iot.mep.eng.br/lineaGraph.php", true);
            xhr.setRequestHeader(
                "Content-Type",
                "application/x-www-form-urlencoded"
            );
            xhr.onreadystatechange = function () {
                if (
                    this.readyState === XMLHttpRequest.DONE &&
                    this.status === 200
                ) {
                    updateGraph(this.responseText.split("/"));
                }
            };
            break;
        default:
            break;
    }
    xhr.send(param);
    return;
}

function updateGauge(data) {
    if (checkConnection(data.splice(-1), 0)) {
        checkConnection(data.slice(-1), 1);
    }
    if (data[0] != "") {
        data = JSON.parse(data);
        chartGauge.series[0].points[0].update(data[1]);
    } else {
        if (showAlert) {
            alert("Não há dados para o sensor selecionado!");
            showAlert = false;
        }
        chartGauge.series[0].points[0].update(0);
    }
    chartGauge.redraw();
}

function updateGraph(data) {
    if (checkConnection(data.splice(-1), 0)) {
        checkConnection(data.splice(-1), 1);
    }
    if (data.length != 0) {
        for (var i = 0; i < data.length; i++) {
            data[i] = JSON.parse(data[i]);
        }
        if (data.length > 1) {
            if (data[0][0] > data[1][0]) {
                data.reverse();
            }
        }
        chartGraph.series[0].setData(smoothData(data), false);
    } else {
        if (showAlert) {
            alert("Não há dados para o periodo selecionado!");
            showAlert = false;
        }
        chartGraph.series[0].setData([], false);
    }
    countData(data.length);
    chartGraph.redraw();
}

function checkConnection(lastData, index) {
    var time = [11400000, 11100000];
    var msg = ["Sistema desconectado!", "Sensor desconectado!"];
    if (lastData[0] != "") {
        lastData = JSON.parse(lastData);
        if (lastData[0] >= Date.now() - time[index]) {
            document.getElementById("status").innerHTML = "";
            return true;
        }
    }
    document.getElementById("status").innerHTML = msg[index];
    return false;
}

function smoothData(data) {
    var smoothValue = Math.min(Math.round(data.length / 2) - 1, smooth.value);
    var lastIndex = data.length - 1;
    var smoothedData = data.slice();
    for (var i = 0; i < data.length; i++) {
        if (i < smoothValue) {
            smoothedData[i][1] = smoothPoint(data, smoothedData[i][1], i, i);
        } else if (i > lastIndex - smoothValue) {
            smoothedData[i][1] = smoothPoint(
                data,
                smoothedData[i][1],
                i,
                lastIndex - i
            );
        } else {
            smoothedData[i][1] = smoothPoint(
                data,
                smoothedData[i][1],
                i,
                smoothValue
            );
        }
    }
    return smoothedData;
}

function smoothPoint(data, pointValue, index, smoothValue) {
    for (var j = smoothValue; j > 0; j--) {
        pointValue += data[index - j][1] + data[index + j][1];
    }
    pointValue /= 2 * smoothValue + 1;
    pointValue = parseFloat(pointValue.toFixed(2));
    return pointValue;
}

function countData(dataLength) {
    var expectedLength;
    if (range.value == "0") {
        expectedLength = stdDataSize;
    } else if (range.value != "") {
        expectedLength = Math.round(range.value / sensorSecs);
    } else if (start.value != "") {
        var dateStart = new Date(start.value);
        if (end.value != "") {
            var dateEnd = new Date(end.value);
            expectedLength = Math.round((dateEnd - dateStart) / sensorMilisecs);
        } else {
            expectedLength = Math.round(
                (Date.now() - dateStart) / sensorMilisecs
            );
        }
    } else if (end.value != "") {
        var dateEnd = new Date(end.value);
        expectedLength = Math.round((dateEnd - Date.now()) / sensorMilisecs);
    }
    sensorData.innerHTML = "Dados do Sensor: ";
    if (expectedLength < 1) {
        sensorData.innerHTML += `${
            ((100 * dataLength) / 1).toFixed(1) + "%"
        } (${dataLength} / ${0})`;
    } else {
        sensorData.innerHTML += `${
            ((100 * dataLength) / expectedLength).toFixed(1) + "%"
        } (${dataLength} / ${expectedLength})`;
    }
}
