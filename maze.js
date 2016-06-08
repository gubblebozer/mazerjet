var mwid, mhgt;
var lnwid = 2;
var w = 24;
var cells;
var c = { x: 0, y: 0 };
var stack = [];
var stack_num = 0;
var done = false;
var cpw = 80;
var cellsz = 0;
var maze_drawn = false;
var is_print = true;
var stack_max = 0;
var stack_max_p = { x: 0, y: 0 };
var edge_max = 0;
var edge_max_p = { x: 0, y: 0 };

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
}

function setup()
{
    createCanvas(windowWidth, windowHeight);
    strokeWeight(1);

    // leave two border cells, and make sure the maze is odd
    // 10 width, but must be odd
    // bb mm mm mm mm mm mm mm bb

    // bb mm mm mm bb: mwid = 3

    // bb bb bb bb bb bb bb
    // bb xx xx xx xx xx bb
    // bb xx xx xx xx xx bb
    // bb xx xx mm xx xx bb

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
	    stroke(0xff, 0, 0);
	    fill(0xff, 0, 0);
	    strokeWeight(1);
	    var end = cell_coords(stack_max_p);
	    ellipse(end.x + (cellsz / 2), end.y + (cellsz / 2), cellsz/2, cellsz/2);
	    
// 	    stroke(0xb0, 0, 0xff);
// 	    fill(0xb0, 0, 0xff);
// 	    end = cell_coords(edge_max_p);
// 	    ellipse(end.x + (cellsz / 2), end.y + (cellsz / 2), cellsz/2, cellsz/2);
	    
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

	    done = true;
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

    return done;
}

function draw_maze() 
{
    var x, y;

    // bb mm bb
    // blue border:
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

    // white maze backdrop
    if (is_print) {
	stroke(0);
	fill(0);
    }
    else {
	stroke(0xff);
	fill(0xff);
    }
    rect(cellsz, cellsz, 
	 (mwid * cellsz), 
	 (mhgt * cellsz));

    for (x = 0; x < mwid; x++) {
	for (y = 0; y < mhgt; y++) {
	    draw_cell({x: x, y: y}, false);
	}
    }
    
    draw_cell({x: 0, y: 0}, false);
}

function draw() 
{
    if (done) {
	noLoop();
	return;
    }

    if (!maze_drawn) {
	draw_maze();
	maze_drawn = true;
	return;
    }

     var budget;

     for (budget = 0; budget < 32; budget++) {
 	if (maze_next()) {
	    noLoop();
 	    break;
 	}
     }
}
