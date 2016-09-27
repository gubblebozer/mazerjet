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
var stack_max = 0;
var stack_max_p = { x: 0, y: 0 };
var edge_max = 0;
var edge_max_p = { x: 0, y: 0 };
var cells_per_frame = -1;
var cpw_slider;
var seed;
var btn_new_maze;
var btn_hide_controls;
var sel_layout;
var controls = false;
var recompute_tmo = 250;
var recompute_at = 0;
var control_p = { x: 40, y: 40 };
var release_latch = false;
var layout = 'letter';  // { letter, a4, display } - XXX: letter must be first
var view_width;
var view_height;
var buffer;

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

    sel_layout = createSelect();
    sel_layout.position(control_p.x + 10, control_p.y + 130);
    sel_layout.option('print: letter');
    sel_layout.option('print: A4');
    sel_layout.option('display');
    sel_layout.changed(layout_changed);
    
    btn_hide_controls = createButton('hide controls');
    btn_hide_controls.position(control_p.x + 10, control_p.y + 170);
    btn_hide_controls.mousePressed(hide_controls);

    controls = true;
}

function seed_randomize()
{
    seed = random(2147483648);
    recompute();
}

function hide_controls()
{
    controls_down();
    release_latch = true;
}

function layout_changed()
{
    var val = sel_layout.value();
    switch (val) {
    case 'display':
        layout = 'display';
        break;
    case 'print: letter':
        layout = 'letter';
        break;
    case 'print: A4':
        layout = 'a4';
        break;
    }
    recompute();
}

function controls_up()
{
    if (!controls) {
        btn_new_maze.show();
        btn_hide_controls.show();
        cpw_slider.show();
        sel_layout.show();
	controls = true;
    }
}

function controls_down()
{
    if (controls) {
        btn_new_maze.hide();
        btn_hide_controls.hide();
        cpw_slider.hide();
        sel_layout.hide();
	controls = false;
    }
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

    switch (layout) {
    case 'display':
        view_width = windowWidth;
        view_height = windowHeight;
        break;
    case 'letter':
        wid = windowWidth - 20; // fudge
        view_width = wid; // fudge
        view_height = floor((wid / 8.5) * 11.0);
        break;
    case 'a4':
        wid = windowWidth - 20;
        view_width = wid;
        view_height = floor((wid / 210.0) * 297.0);
        break;
    }
    frameRate(fr_high);
    createCanvas(view_width, view_height);
    buffer = createGraphics(width, height);
    buffer.strokeWeight(1);
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
    draw_maze_background();
}

function setup()
{
    seed = (hour() * 3600) + (minute() * 60) + second();
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
	buffer.stroke(0xff);
	buffer.fill(0xff);
	buffer.strokeWeight(cellsz / 2);

	var pc = cell_coords(p);
	
	buffer.rect(pc.x, pc.y, cellsz, cellsz);
    }
}

function draw_arrow(p, from)
{
    var ul = cell_coords(p);
    var K = (cellsz / 2);
    var ctr = { x: ul.x + K, y: ul.y + K };
    
    buffer.stroke(0);
    buffer.fill(0);
    buffer.strokeWeight(cellsz / 4);
    var endx = ctr.x - (K * from.x);
    var endy = ctr.y - (K * from.y);
    buffer.line(ctr.x + (K * from.x), ctr.y + (K * from.y), ctr.x, ctr.y);
    buffer.strokeWeight(1);
    if (from.x < 0 || from.x > 0) {
 	buffer.triangle(ctr.x, ctr.y - (cellsz / 3),
 		        ctr.x, ctr.y + (cellsz / 3),
 		        endx, endy);
     }
     else if (from.y < 0 || from.y > 0) {
 	 buffer.triangle(ctr.x - (cellsz / 3), ctr.y,
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
            draw_ends();
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
    buffer.stroke(0xff);
    buffer.fill(0xff);
    buffer.rect(0, 0, view_width, view_height);

    // fill with proper outer maze color
    buffer.stroke(0);
    buffer.fill(0);
    buffer.rect(0, 0, 
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
    rect(control_p.x, control_p.y, 650, 220);
    
    noStroke();
    
    fill(0xff);
    textSize(16);
    text(cpw, 300, control_p.y + 25);
    
    textSize(20);
    text("Move the slider to change the", 350, control_p.y + 25);
    text("maze difficulty.  Left is easier.", 350, control_p.y + 45);
    text("Right is harder.", 350, control_p.y + 65);
    
    text("Generate a different maze.", 350, control_p.y + 105);

    text("Fill the screen or fill a printed page.", 350, control_p.y + 145);
    
    text("Hide these controls so you can", 350, control_p.y + 185);
    text("print out the maze.", 350, control_p.y + 205);
}

function draw_ends()
{
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

function recompute()
{
    if (!recompute_at) {
	recompute_at = millis() + recompute_tmo;
    }
}

function windowResized()
{
    recompute();
}

function mousePressed()
{
    if (!release_latch) {
        if (!controls) {
            controls_up();
        }
        else if (controls) {
            if (mouseX < control_p.x ||
                mouseY < control_p.y ||
                mouseX > control_p.x + 650 ||
                mouseY > control_p.y + 220) {
                controls_down();
            }
        }
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
            recompute();
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

    image(buffer, 0, 0);

    if (controls) {
        draw_control_backdrop();
    }
}
