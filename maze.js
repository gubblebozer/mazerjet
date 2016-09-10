var mwid, mhgt;
var compute_seconds = 5;
var fr_base = 5; // base frameRate
var fr_high = 30; // high frameRate, during maze draw
var lnwid = 2;
var w = 24;
var cells;
var c = { x: 0, y: 0 };
var stack = [];
var stack_num = 0;
var cpw = 39;
var cellsz = 0;
var maze_computed = false;
var is_print = true;
var stack_max = 0;
var stack_max_p = { x: 0, y: 0 };
var edge_max = 0;
var edge_max_p = { x: 0, y: 0 };
var cells_per_frame = -1;
var cpw_slider;
var seed;
var btn_seed_submit;
var btn_new_maze;
var btn_hide_controls;
var controls = false;
var recompute_tmo = 250;
var recompute_at = 0;
var control_p = { x: 40, y: 40 };
var advanced = false;
var release_latch = false;
var refresh = false;

function maze_init()
{
    var x, y;

    cells = new Array(mwid);

    for (x = 0; x < mwid; x++) {
	cells[x] = new Array(mhgt);
	for (y = 0; y < mhgt; y++) {
	    cells[x][y] = false;
	}
    }

    c = { x: 0, y: 0 };
    stack_max = 0;
    stack_max_p = { x: 0, y: 0 };
    edge_max = 0;
    edge_max_p = { x: 0, y: 0 };
    stack = [];
    stack_num = 0;
}

function setup_controls()
{
    cpw_slider = createSlider(5, 199, cpw);
    cpw_slider.position(control_p.x + 10, control_p.y + 10);
    cpw_slider.style('width', '230px');

    btn_new_maze = createButton('different maze');
    btn_new_maze.position(control_p.x + 10, control_p.y + 90);
    btn_new_maze.mousePressed(seed_randomize);

    btn_hide_controls = createButton('hide controls');
    btn_hide_controls.position(control_p.x + 10, control_p.y + 130);
    btn_hide_controls.mousePressed(hide_controls);

    if (advanced) {
        seed_input = createInput(seed);
        seed_input.position(10, 50);
        seed_input.style('width', '160px');
        
        btn_seed_submit = createButton('seed');
        btn_seed_submit.position(175, 50);
        btn_seed_submit.mousePressed(seed_set);
    }
    
    controls = true;
}

function seed_set()
{
    var tst = parseInt(seed_input.value());
    if (tst != NaN) {
	seed = tst;
	if (!recompute_at) {
	    recompute_at = millis() + recompute_tmo;
	}
    }
}

function seed_randomize()
{
    seed = random(2147483648);
    if (!recompute_at) {
	recompute_at = millis() + recompute_tmo;
    }
}

function hide_controls()
{
    controls_down();
    release_latch = true;
}

function controls_up()
{
    if (!controls) {
        btn_new_maze.show();
        btn_hide_controls.show();
        cpw_slider.show();
	controls = true;
    }
    refresh = true;
}

function controls_down()
{
    if (controls) {
        btn_new_maze.hide();
        btn_hide_controls.hide();
        cpw_slider.hide();
	controls = false;
    }
    refresh = true;
}

function setup_int()
{
    // leave two border cells, and make sure the maze is odd
    // 10 width, but must be odd
    // bb mm mm mm mm mm mm mm bb

    // bb mm mm mm bb: mwid = 3

    // bb bb bb bb bb bb bb
    // bb xx xx xx xx xx bb
    // bb xx xx xx xx xx bb
    // bb xx xx mm xx xx bb

    frameRate(fr_high);
    createCanvas(windowWidth, windowHeight);
    randomSeed(seed);
    cellsz = int(width / cpw);
    mwid = int(width / cellsz) - 2;
    mhgt = int(height / cellsz) - 2;
    if (mwid % 2 == 0) {
	mwid--;
    }
    if (mhgt % 2 == 0) {
	mhgt--;
    }
    maze_init();
    cells[c.x][c.y] = true;

    cells_per_frame = Math.ceil(((mwid * mhgt) / compute_seconds) / fr_high);
    maze_computed = false;
    refresh = true;
    draw_maze_background();
}

function setup()
{
    seed = (hour() * 3600) + (minute() * 60) + second();
    strokeWeight(1);
    setup_int();
    setup_controls();
}

// Return coordinates of the upper left corner of the specified cell.
//
// (leave a one-cell border around outside)
function cell_coords(p)
{
    return { x: (p.x * cellsz) + cellsz, y: (p.y * cellsz) + cellsz };
}

function draw_cell(p, force)
{
    if (force || cells[p.x][p.y]) {
	if (is_print) {
	    stroke(0xff);
	    fill(0xff);
	}
	else {
	    stroke(0);
	    fill(0);
	}
	strokeWeight(cellsz / 2);

	var pc = cell_coords(p);
	
	rect(pc.x, pc.y, cellsz, cellsz);
    }
}

function draw_arrow(p, from)
{
    var ul = cell_coords(p);
    var K = (cellsz / 2);
    var ctr = { x: ul.x + K, y: ul.y + K };
    
    if (!is_print) {
	stroke(0xff);
	fill(0xff);
    }
    else {
	stroke(0);
	fill(0);
    }
    
    strokeWeight(cellsz / 4);
    var endx = ctr.x - (K * from.x);
    var endy = ctr.y - (K * from.y);
    line(ctr.x + (K * from.x), ctr.y + (K * from.y), ctr.x, ctr.y);
    strokeWeight(1);
    if (from.x < 0 || from.x > 0) {
 	triangle(ctr.x, ctr.y - (cellsz / 3),
 		 ctr.x, ctr.y + (cellsz / 3),
 		 endx, endy);
     }
     else if (from.y < 0 || from.y > 0) {
 	triangle(ctr.x - (cellsz / 3), ctr.y,
 		 ctr.x + (cellsz / 3), ctr.y,
 		 endx, endy);
     }
}

function maze_next()
{
    var choices = [];
    if (c.x - 2 >= 0 && !cells[c.x - 2][c.y    ]) {
	choices.push({ x: -1, y:  0 });
    }
    if (c.y - 2 >= 0 && !cells[c.x    ][c.y - 2]) {
	choices.push({ x:  0, y: -1 });
    }
    if (c.x + 2 < mwid && !cells[c.x + 2][c.y    ]) {
	choices.push({ x:  1, y:  0 });
    }
    if (c.y + 2 < mhgt && !cells[c.x    ][c.y + 2]) {
	choices.push({ x:  0, y:  1 });
    }
    
    // All neighbors visited?
    if (choices.length == 0) {
	// if stack is not empty
	// Pop a cell from the stack
	// Make it the current cell
	if (stack.length > 0) {

	    // compute greatest distance from origin
	    if (stack.length > stack_max) {
		stack_max = stack.length;
		stack_max_p = { x: c.x, y: c.y };
	    }
	    
	    if (c.x == 0 || c.x == mwid - 1 || c.y == 0 || c.y == mhgt - 1) {
		// greatest distance from origin on the exterior wall
		if (stack.length > edge_max) {
		    edge_max = stack.length;
		    edge_max_p = { x: c.x, y: c.y };
		}
	    }

	    c = stack.pop();
	}
	else {
	    maze_computed = true;
            frameRate(fr_base);
            controls_up();
	}
    }
    else {
	// Choose randomly one of the unvisited neighbours
	// Push the current cell to the stack
	// Remove the wall between the current cell and the chosen cell
	// Make the chosen cell the current cell and mark it as visited

	// choose random neighbor
	var t = int(floor(random(choices.length)));

	// push current cell onto stack
	stack.push({x: c.x, y: c.y});

	// remove wall
	c.x = c.x + choices[t].x;
	c.y = c.y + choices[t].y;
	cells[c.x][c.y] = true;
	draw_cell(c, false);
	//print("x: " + c.x + ", y: " + c.y)

	// walk through wall
	c.x = c.x + choices[t].x;
	c.y = c.y + choices[t].y;
	cells[c.x][c.y] = true;
	draw_cell(c, false);
	//print("x: " + c.x + ", y: " + c.y)
    }

    return maze_computed;
}


function draw_maze_background()
{
    // clear canvas
    stroke(0xff);
    fill(0xff);
    rect(0, 0, windowWidth, windowHeight);

    // fill with proper outer maze color
    if (is_print) {
	stroke(0);
	fill(0);
    }
    else {
	stroke(0xff);
	fill(0xff);
    }
    rect(0, 0, 
	 ((mwid + 2) * cellsz), 
	 ((mhgt + 2) * cellsz));

    // draw first cell
    draw_cell({x: 0, y: 0}, false);
}

function draw_control_backdrop()
{
    // translucent backdrop for controls
    strokeWeight(1);
    stroke(0x20, 0x20, 0xc0, 0xb0);
    fill(0x20, 0x20, 0xc0, 0xb0);
    
    if (advanced) {
	rect(control_p.x, control_p.y, 600, 270);
    }
    else {
	rect(control_p.x, control_p.y, 600, 180);
    }
    
    noStroke();
    
    fill(0xff);
    textSize(16);
    text(cpw, 300, control_p.y + 25);
    
    textSize(20);
    text("Move the slider to change the", 350, control_p.y + 25);
    text("maze difficulty.  Left is easier.", 350, control_p.y + 45);
    text("Right is harder.", 350, control_p.y + 65);
    
    text("Generate a different maze.", 350, control_p.y + 105);
    
    text("Hide these controls so you can", 350, control_p.y + 145);
    text("print out the maze.", 350, control_p.y + 165);
}

function draw_maze() 
{
    draw_maze_background();

    var x, y;

    for (x = 0; x < mwid; x++) {
	for (y = 0; y < mhgt; y++) {
	    draw_cell({x: x, y: y}, false);
	}
    }
    
    draw_cell({x: 0, y: 0}, false);

    if (maze_computed) {

	if (edge_max_p.x == 0) {
	    draw_cell({ x: -1, y: edge_max_p.y }, true);
	    draw_arrow( { x: -1, y: edge_max_p.y }, { x: 1, y: 0 });
	}
	else if (edge_max_p.x == mwid - 1) {
	    draw_cell({ x: mwid, y: edge_max_p.y }, true);
	    draw_arrow( { x: mwid, y: edge_max_p.y }, { x: -1, y: 0 });
	}
	else if (edge_max_p.y == 0) {
	    draw_cell({ x: edge_max_p.x, y: -1 }, true);
	    draw_arrow({ x: edge_max_p.x, y: -1 }, { x: 0, y: 1 });
	}
	else {
	    draw_cell({ x: edge_max_p.x, y: mhgt }, true);
	    draw_arrow({ x: edge_max_p.x, y: mhgt }, { x: 0, y: -1 });
	}
	
	// draw starting arrow, cutout cell
	if (cells[1][0]) {
	    draw_cell({ x: -1, y: 0 }, true);
	    draw_arrow( { x: -1, y: 0 }, { x: -1, y: 0} );
	}
	else {
	    draw_cell({ x: 0, y: -1 }, true);
	    draw_arrow( { x: 0, y: -1 }, { x: 0, y: -1} );
	}
    }

    if (controls) {
        draw_control_backdrop();
    }
}

function draw_maze_area(x1, y1, x2, y2) 
{
    // fill in with proper outer maze color
    if (is_print) {
	stroke(0);
	fill(0);
    }
    else {
	stroke(0xff);
	fill(0xff);
    }
    rect(x1, y1, x2, y2);

    // redraw overlapping cells
    var ax1 = floor(x1 / cellsz) - 1;
    if (ax1 < 0) { ax1 = 0; }
    var ay1 = floor(y1 / cellsz) - 1;
    if (ay1 < 0) { ay1 = 0; }
    var ax2 = ceil((x1 + x2) / cellsz) + 1;
    if (ax2 > mwid) { ax2 = mwid; }
    var ay2 = ceil((y1 + y2) / cellsz) + 1;
    if (ay2 > mhgt) { ay2 = mhgt; }

    print("ax1: " + ax1 + ", ay1: " + ay1 + ", ax2: " + ax2 + ", ay2: " + ay2);

    var x, y;

    for (x = ax1; x < ax2; x++) {
	for (y = ay1; y < ay2; y++) {
	    draw_cell({x: x, y: y}, false);
	}
    }
    
    draw_cell({x: 0, y: 0}, false);
}

function windowResized()
{
    if (!recompute_at) {
	recompute_at = millis() + recompute_tmo;
    }
}

function mousePressed()
{
    if (!release_latch && !controls) {
        controls_up();
    }
}

function mouseReleased()
{
    if (release_latch) {
        release_latch = false;
    }
}

function draw() 
{
    if (controls) {
	new_cpw = cpw_slider.value();
	if (new_cpw != cpw) {
	    cpw = new_cpw;
	    if (!recompute_at) {
		recompute_at = millis() + recompute_tmo;
	    }
	}
    }

    if (recompute_at && millis() >= recompute_at && !mouseIsPressed) {
	setup_int();
	recompute_at = 0;
    }

    var budget = cells_per_frame;
    while (!mouseIsPressed && !maze_computed && budget--) {
        maze_next();
    }

    if (refresh) {
        draw_maze();
        refresh = false;
    }
    else if (!mouseIsPressed && !maze_computed && controls) {
        // redraw controls
        if (advanced) {
            draw_maze_area(control_p.x, control_p.y, 600, 270);
        }
        else {
	    draw_maze_area(control_p.x, control_p.y, 600, 180);
        }
        draw_control_backdrop();
    }
}
