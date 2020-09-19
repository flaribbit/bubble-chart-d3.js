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
    setInterval(() => {
        currentTime = data.time[i];
        bubbles = data[currentTime].map(e => {
            return {
                time: currentTime,
                name: e.name,
                value: Math.sqrt(Number(e.value)) / 10,
                x: random(0, 1280),
                y: random(0, 720),
                color: data.color[e.name],
            }
        });
        update(bubbles);
        draw(bubbles);
        i++;
    }, 1000);
}

function draw(bubbles) {
    var svg = d3.select("svg");
    var update = svg.selectAll("g").data(bubbles, d => d.name);
    var exit = update.exit();
    var enter = update.enter()
        .append("g")
        .attr("class", "bubble");
    //气泡开始
    enter.append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => d.color)
        .transition()
        .duration(1000)
        .attr("r", d => d.value);
    //文字标题
    enter.append("text")
        .attr("class", "name")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .text(d => d.name);
    //值
    enter.append("text")
        .attr("class", "value")
        .attr("x", d => d.x)
        .attr("y", d => d.y + 10)
        .transition()
        .duration(1000)
        .tween("text", function (d) {
            var i = d3.interpolate(0, d.value);
            return t => this.textContent = i(t).toFixed(3);
        });

    update.select("circle")
        .transition()
        .duration(1000)
        .attr("r", d => d.value);
    update.select(".value")
        .transition()
        .duration(1000)
        .tween("text", function (d) {
            var i = d3.interpolate(this.textContent, d.value);
            return t => this.textContent = i(t).toFixed(3);
        });

    exit.select("circle")
        .transition()
        .duration(1000)
        .attr("r", 0);
    exit.select(".value")
        .transition()
        .duration(1000)
        .tween("text", function () {
            var i = d3.interpolate(this.textContent, 0);
            return t => this.textContent = i(t).toFixed(3);
        });
    exit
        .transition()
        .duration(1100)
        .remove();
}

function update(bubbles) {
    var svg = d3.select("svg");
}
