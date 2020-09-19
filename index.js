inputFile.onchange = function () {
    var reader = new FileReader();
    reader.readAsText(this.files[0], config.encoding);
    reader.onload = function () {
        var data = d3.csvParse(this.result);
        visual(groupData(data));
        // try {
        //     visual(groupData(data, "time"));
        // } catch (error) {
        //     alert(error);
        // }
    }
    this.hidden = true;
}

function groupData(list) {
    var grouped = { time: [], color: {} };
    var i = 0;
    list.forEach(e => {
        if (!grouped[e.time]) {
            grouped[e.time] = [];
            grouped.time.push(e.time);
        }
        grouped[e.time].push(e);
        if (!grouped.color[e.name]) {
            grouped.color[e.name] = colors[i % colors.length];
            i++;
        }
    });
    return grouped;
}

function random(a, b) {
    return a + (b - a) * Math.random();
}

function visual(data) {
    var bubbles;
    var currentTime;
    console.log(data);
    var i = 0;
    setTimeout(() => {
        currentTime = data.time[i];
        bubbles = data[currentTime].map(e => {
            return {
                time: currentTime,
                name: e.name,
                value: Number(e.value) / 10000,
                x: random(0, 1280),
                y: random(0, 720),
                color: data.color[e.name],
            }
        });
        update(bubbles);
        draw(bubbles);
        i++;
    }, 10);
}

function draw(bubbles) {
    var svg = d3.select("svg");
    var update = svg.selectAll("circle").data(bubbles, d => d.name);
    var enter = update.enter();
    var exit = update.exit();
    enter
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => d.color)
        .transition()
        .duration(1000)
        .attr("r", d => d.value);
    enter.append("text")
        .attr("class", "name")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .text(d => d.name)
}

function update(bubbles) {
    var svg = d3.select("svg");
}
