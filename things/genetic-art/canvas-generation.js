class Header extends React.Component {
  render() {
    return (
      <div>
        <p>Generation {this.props.generation}</p>
        <p>Select which 4 you'd like to propogate into the next round.</p>
      </div>
    );
  }
};

class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.seedChange = this.seedChange.bind(this);
    this.nextNum = this.nextNum.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  nextNum(min, max) {
    if (min == max) { return min; }
    let s = this.props.seed;

    let neededDigits = (max - min).toString().length;
    let result = s.substr(this.currentPos, neededDigits);
    let randomOffsetAtReset = 0;
    let howManyMoreWeNeeded = 0;

    if (result.length < neededDigits) {
      // Oops, we hit the end of the string. Go back to 0 and grab some more
      let howManyMoreWeNeed = neededDigits - result.length;
      result += s.substr(0, howManyMoreWeNeed);
    }

    this.currentPos += neededDigits;
    if (this.currentPos >= s.length) {
      this.resets += 1;
      if (this.resets >= s.length) { this.resets = 0; }
      this.currentPos = howManyMoreWeNeeded + this.resets;
    }

    let clamped = (parseInt(result) % (max - min)) + min;

    return clamped;
  }

  generate(ctx, height, width) {
    let nn = this.nextNum;  // we use the crap out of it. Keep things short
    ctx.clearRect(0, 0, width, height);

    // now... based on all the numbers, render some lines/etc...
    let paths = nn(2, 20);

    let maxElementsPerStroke = nn(1, 6);
    
    let maxRadius = nn(1, this.props.width);

    for (let i = 0; i < paths; i++) {

      ctx.beginPath();

      let pathElements = nn(1, maxElementsPerStroke);
      for (let j = 0; j < pathElements; j++) {
        let nextMovement = nn(0, 5);

        if (nextMovement == 0) {
          // moveTo
          ctx.moveTo(nn(0, this.props.width), nn(0, this.props.height));
        } else if (nextMovement == 1) {
          // lineTo
          ctx.lineTo(nn(0, this.props.width), nn(0, this.props.height));
        } else if (nextMovement == 2) {
          // quadraticCurveTo
          ctx.quadraticCurveTo(nn(0, this.props.width), nn(0, this.props.height), nn(0, this.props.width), nn(0, this.props.height));
        } else if (nextMovement == 3) {
          // bezierCurveTo
          ctx.bezierCurveTo(nn(0, this.props.width), nn(0, this.props.height), nn(0, this.props.width), nn(0, this.props.height), nn(0, this.props.width), nn(0, this.props.height));
        } else if (nextMovement == 4) {
          // arcTo
          ctx.arcTo(nn(0, this.props.width), nn(0, this.props.height), nn(0, this.props.width), nn(0, this.props.height), maxRadius)
        } else {
          // arc
          let radius = nn(0, maxRadius);
          let sAng = nn(0, 2000) / 1000;
          let eAng = nn(0, 2000) / 1000;
          ctx.arc(nn(0, this.props.width), nn(0, this.props.height), radius, sAng, eAng);
        }
      }
      if (nn(1, 3) == 1) {
        ctx.strokeStyle = "rgb(" + nn(0, 256) + "," + nn(0, 256) + "," + nn(0, 256) + ")";
        ctx.stroke();
      } else {
        if (nn(1, 3) == 1) {
          ctx.fillStyle = "rgb(" + nn(0, 256) + "," + nn(0, 256) + "," + nn(0, 256) + ")";
        } else {
          let grad = ctx.createLinearGradient(nn(0, this.props.width), nn(0, this.props.height), nn(0, this.props.width), nn(0, this.props.height));
          let c1 = "rgb(" + nn(0, 256) + ", " + nn(0, 256) + ", " + nn(0, 256) + ")";
          let c2 = "rgb(" + nn(0, 256) + ", " + nn(0, 256) + ", " + nn(0, 256) + ")";
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);
          ctx.fillStyle = grad
        }
        ctx.fill();
      }
    }
  }

  componentDidMount() {
    this.regenerate();
  }

  componentDidUpdate() {
    this.regenerate();
  }

  regenerate() {
    let el = document.getElementById("canvas" + this.props.index);
    let ctx = el.getContext("2d");
    ctx.clearRect(0, 0, this.props.width, this.props.height);

    this.currentPos = 0;
    this.resets  = 0;

    this.generate(ctx, el.width, el.height);
  }

  seedChange(evt) {
    this.props.seedChange(this.props.index, evt.target.value);
  }

  onClick(evt) {
    this.props.onClick(this.props.index);
  }

  render() {
    let style = {border: "solid 1px"};
    if (this.props.winners.indexOf(this.props.index) >= 0) {
      style = {border: "solid 2px blue"};
    }
    return (
      <div className="graph">
        <canvas style={style} id={"canvas" + this.props.index} width="1280" height="800" onClick={this.onClick}></canvas><br />
        <input key={this.props.index} value={this.props.seed} onChange={this.seedChange}></input>
      </div>
    );
  }
}

class Graphs extends React.Component {
  render() {
    let graphs = [];
    for (let i = 0 ; i < this.props.seeds.length ; i++) {
      graphs.push(
        <Graph key={i} index={i} width={1280} height={800} winners={this.props.winners} seed={this.props.seeds[i]} seedChange={this.props.seedChange} onClick={this.props.onClick} />
      );
    }

    return (
      <div>
        { graphs }
      </div>
    );
  }
};

class App extends React.Component {
  constructor(props) {
    super(props);

    let seeds = [];
    for (let i = 0 ; i < 12 ; i++) {
      let seed = (Math.random().toString().split(".")[1] + Math.random().toString().split(".")[1]).slice(0, 20); // get a whole lot of random to guarantee 20 digits
      seeds.push(seed);
    }
    this.state = {generation: 0, seeds: seeds, winners: []};

    this.seedChange = this.seedChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.nextGen = this.nextGen.bind(this);
  }

  nextGen(winningSeeds) {
    let nextGen = [];
    for (let i = 0 ; i < winningSeeds.length ; i++) {
      for (let j = 0 ; j < winningSeeds.length ; j++) {
        if (i != j) {
          nextGen.push(this.mutate(this.beget(this.state.seeds[winningSeeds[i]], this.state.seeds[winningSeeds[j]])));
        }
      }
    }
    this.setState({seeds: nextGen, generation: this.state.generation+1, winners: []});

    window.scrollTo(0, 0);
  }

  seedChange(index, newVal) {
    let newSeeds = [];
    for (let i = 0 ; i < this.state.seeds.length ; i++) {
      if (i == index) {
        newSeeds.push(newVal);
      } else {
        newSeeds.push(this.state.seeds[i]);
      }
    }

    this.setState({seeds: newSeeds});
  }

  onClick(seedIndex) {
    let winnerIndex = this.state.winners.indexOf(seedIndex);
    let winners = this.state.winners.slice(0);
    if (winnerIndex >= 0) {
      winners.splice(winnerIndex, 1);
    } else {
      winners.push(seedIndex);
    }

    this.setState({winners: winners}, function() {
      if (this.state.winners.length == 4) {
        this.nextGen(this.state.winners);
      }
    });

  }

  beget(s1, s2) {
    let result = "";
    for (let i = 0 ; i < s1.length ; i++) {
      if (Math.random() > 0.5) {
        result += s1[i];
      } else {
        result += s2[i];
      }
    }
    return result;
  }

  mutate(seed) {
    let result = "";
    for (let i = 0 ; i < seed.length ; i++) {
      if (Math.random() > 0.1) {
        result += seed[i];
      } else {
        result += Math.random().toString()[5];
      }
    }
    return result;
  }

  render() {
    return (
      <div>
        <Header generation={this.state.generation} />
        <Graphs seeds={this.state.seeds} winners={this.state.winners} seedChange={this.seedChange} onClick={this.onClick} />
      </div>
    );
  }
};

ReactDOM.render(
  <App />,
  document.getElementById('container')
);
