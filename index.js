inputFile.onchange = function () {
    var reader = new FileReader();
    reader.readAsText(this.files[0], config.encoding);
    reader.onload = function () {
        var data = d3.csvParse(this.result);
        try {
            visual(groupBy(data, "time"));
        } catch (error) {
            alert(error);
        }
    }
    this.hidden = true;
}

function visual(data) {
    var bubbles;
    var currentTime;
    var names = [];
    data = [{ time: "", name: "1", value: 0 }];
    data.forEach(e => {
        if (!(e.name in names)) {
            names.push(e.name);
        }
    });
    console.log(names);
    var i = 0;
    setInterval(() => {
        currentTime = data.key[i];
        bubbles = data[currentTime].map(e => {
            return {
                time: currentTime,
                name: e.name,
                x: 0,
                y: 0,
                color: ""
            }
        });
        update(bubbles);
        draw(bubbles);
        i++;
    });
}

function groupBy(list, key) {
    var grouped = { keys: [] };
    list.forEach(e => {
        if (!(e[key] in grouped)) {
            grouped[key] = [];
        }
        grouped[key].push(e);
    });
    return grouped;
}

function draw(bubbles) {
    var svg = d3.select("svg");
}

function update(bubbles) {
    var svg = d3.select("svg");
}
