let transitionTable = {};
let createdNodes = 0;

let selectedNode = null;

let isAltPressed = false;

let lastStorage = null;

let needUpdate = false;

/**
 * 
 * 0 : Mode ajout de noeud + déplacement des noeuds
 * 1 : Mode ajout de liens entre les différents noeuds
 * 2 : Suppression de noeuds
 * 
 */
let mode = 0;

/**
 * 0 : Placement libre
 * 1 : Placement Grille (nearest 10th)
 */
let display = 0;

/**
 * Nom du fichier qui sera utilisé pour le download
 */
let fileName = "export";

function setup() {
    lastStorage = localStorage.getItem("lastStorage");

    if(lastStorage !== null) {
        transitionTable = JSON.parse(localStorage.getItem(`${lastStorage}`));
        createdNodes    = Object.keys(transitionTable).length;
        
        localParams     = JSON.parse(localStorage.getItem("params"));

        if(localParams !== null) {
            display         = parseInt(localParams.display);
            fileName        = localParams.fileName;
            mode            = parseInt(localParams.mode);
            selectedNode    = localParams.selectedNode;
        }
    }

    createCanvas(windowWidth, windowHeight);

    extractionButton = createButton('Extract');
    extractionButton.position(5, 10);
    extractionButton.mousePressed(extractTransitionTable);

    inputNameFile = createInput('').attribute('placeholder', fileName);
    inputNameFile.position(75, 10);
    inputNameFile.size(100);
    inputNameFile.input(inputNameFileChange);

    downloadButton = createButton('Download');
    downloadButton.position(190, 10);
    downloadButton.mousePressed(downloadObjectAsJson);
}
  
function draw() {
    background(250);
    textSize(15);

    drawText();

    // Displaying the elements + Writing the instruction table
    let nbLine = 1;
    for (const [k1, elt] of Object.entries(transitionTable)) {
        fill(elt.geometry.g_color);
        if(elt.start) {
            circle(elt.geometry.g_x, elt.geometry.g_y, elt.geometry.g_length + 5);
        }
        
        if(`${k1}` === selectedNode) {
            fill('#ff4444');
        }
        circle(elt.geometry.g_x, elt.geometry.g_y, elt.geometry.g_length);
        fill('black');
        text(`${k1}`, elt.geometry.g_x - 10, elt.geometry.g_y + 5);

        if(Object.keys(elt.action).length === 0) {continue;}
        nbLine = drawLinesAndCurves(k1, elt, nbLine);
    }

    if(needUpdate) {
        needUpdate = false;
        noLoop();
    }
}

function drawLinesAndCurves(k1, elt, nbLine) {
    for (const [key, action] of Object.entries(elt.action)) {
        const a_elt = transitionTable[key];

        text(`${k1}`,       5,      110 + (nbLine * 20));
        text(action.read,   55,     110 + (nbLine * 20));
        text(action.write,  105,    110 + (nbLine * 20));
        text(key,           155,    110 + (nbLine * 20));
        text(action.move,   205,    110 + (nbLine * 20));
        
        if(`${k1}` !== key) {
            drawTransition(
                elt.geometry.g_x,   elt.geometry.g_y,   elt.geometry.g_length / 2,
                a_elt.geometry.g_x, a_elt.geometry.g_y, a_elt.geometry.g_length / 2,
                `${action.read}/${action.write}/${action.move}`
            );
        } else {
            noFill();
            beginShape();                
            curveVertex(elt.geometry.g_keypoints[0].x, elt.geometry.g_keypoints[0].y);
            curveVertex(elt.geometry.g_keypoints[1].x, elt.geometry.g_keypoints[1].y);
            curveVertex(elt.geometry.g_keypoints[2].x, elt.geometry.g_keypoints[2].y);
            curveVertex(elt.geometry.g_keypoints[3].x, elt.geometry.g_keypoints[3].y);
            curveVertex(elt.geometry.g_keypoints[0].x, elt.geometry.g_keypoints[0].y);
            curveVertex(elt.geometry.g_keypoints[1].x, elt.geometry.g_keypoints[1].y);
            curveVertex(elt.geometry.g_keypoints[2].x, elt.geometry.g_keypoints[2].y);
            endShape();
            
            fill('black');
            text('0/1/L', elt.geometry.g_keypoints[2].x - 15, elt.geometry.g_keypoints[2].y - 5);
        }
        
        nbLine++;
    }

    return nbLine;
}

function drawText() {
    text(`There is ${Object.keys(transitionTable).length} nodes`, 5,50);
    text(`The node ${selectedNode} is selected`,5,70);

    text(`X: ${mouseX}, Y: ${mouseY}`,5,90);

    text(`Node`     ,5,110);
    text(`Read`     ,55,110);
    text(`Write`    ,105,110);
    text(`Target`   ,155,110);
    text(`Move`     ,205,110);
    line(255,0,255,window.innerHeight);

    text(`a: Creation`, 5, window.innerHeight - 200);
    text(`e: Edit`, 85, window.innerHeight - 200);
    text(`x: Delete`, 135, window.innerHeight - 200);

    text(`g: Snap ${display===0?'free': 'grid'}`, 5, window.innerHeight - 175);
    text(`alt+s: Saving`, 100, window.innerHeight - 175);

    let txt_mode;
    switch(mode) {
        case 0:
            txt_mode = "Ajout";
        break;
        case 1:
            txt_mode = "Edition";
            break;
        case 2:
            txt_mode = "Suppression";
            break;
        default:
    }
    text(`Mode ${txt_mode}`, 5, window.innerHeight - 100);
    text(`${isLooping()?'':'No'} Looping`, 5, window.innerHeight - 50); 
}

function drawTransition(x1, y1, r1, x2, y2, r2, instruction) {
    let point1 = null;
    let point2 = null;

    let v1 = createVector(x1, y1);
    let v2 = createVector(x2, y2);

    let c1 = createVector(x1, y1);
    let c2 = createVector(x2, y2);

    const inter1 = intersectLineCircle(v1, v2, c1, r1);
    for (let i = 0; i < inter1.length; i++) {
        const elt = inter1[i];
        if(inBetween(v1, v2, createVector(elt.x, elt.y))) {
            point1 = createVector(elt.x, elt.y);
            break;
        }
    }
    
    const inter2 = intersectLineCircle(v1, v2, c2, r2);
    for (let i = 0; i < inter2.length; i++) {
        const elt = inter2[i];
        if(inBetween(v1, v2, createVector(elt.x, elt.y))) {
            point2 = createVector(elt.x, elt.y);
            break;
        }
    }

    line(
        point1.x, point1.y,
        point2.x, point2.y,
    );

    drawTriangle(point1, point2);
    drawInstruction(point1, point2, instruction);

    needUpdate = true;
    loop();
}

// draw an arrow for a vector at a given base position
function drawTriangle(base, vec) {
    push();
    const offset = 10;
    var angle = atan2(base.y - vec.y, base.x - vec.x); //gets the angle of the line
    translate(vec.x, vec.y); //translates to the destination vertex
    rotate(angle-HALF_PI); //rotates the arrow point
    triangle(-offset*0.5, offset, offset*0.5, offset, 0, -offset/2); //draws the arrow point as a triangle
    pop();
}

function drawInstruction(base, vec, instruction) {
    push();

    var angle = atan2(base.y - vec.y, base.x - vec.x);
    translate((base.x + vec.x) / 2, (base.y + vec.y) / 2);
    rotate(angle-PI);
    text(instruction, 0, -5)

    pop();
}

function intersectLineCircle(p1, p2, cpt, r) {

    let sign = function(x) { return x < 0.0 ? -1 : 1; };

    let x1 = p1.copy().sub(cpt);
    let x2 = p2.copy().sub(cpt);

    let dv = x2.copy().sub(x1)
    let dr = dv.mag();
    let D = x1.x*x2.y - x2.x*x1.y;

    // evaluate if there is an intersection
    let di = r*r*dr*dr - D*D;
    if (di < 0.0) {
        return [];
    }
   
    let t = sqrt(di);

    ip = [];
    ip.push( new p5.Vector(D*dv.y + sign(dv.y)*dv.x * t, -D*dv.x + abs(dv.y) * t).div(dr*dr).add(cpt) );
    if (di > 0.0) {
        ip.push( new p5.Vector(D*dv.y - sign(dv.y)*dv.x * t, -D*dv.x - abs(dv.y) * t).div(dr*dr).add(cpt) ); 
    }
    return ip;
}

function inBetween(p1, p2, px) {

    let v = p2.copy().sub(p1);
    let d = v.mag();
    v = v.normalize();

    let vx = px.copy().sub(p1);
    let dx = v.dot(vx);
    
    return dx >= 0 && dx <= d;
}

function addTransition(x, y) {
    // transitionTable[`q${Object.keys(transitionTable).length}`] = {
    transitionTable[`q${createdNodes}`] = {
        start: Object.keys(transitionTable).length === 0,
        end: false,
        action: {},
        geometry: {
            g_x: x,
            g_y: y,
            g_length: 50,
            g_color: "#ffffff",
            g_keypoints: [
                createVector(x, y - 25),
                createVector(x - 25, y - 50),
                createVector(x, y - 75),
                createVector(x + 25, y - 50),
            ]
        }
    }
    createdNodes++;
}

function mouseClicked() {
    if(mouseX <= 350) {return;}
    if(mouseY <= 50) {return;}
    const key = verificationIntersection(mouseX, mouseY);
    if(key !== null) {
        if(mode === 2) // Mode Suppression
        {
            suppressionNoeudDeep(key);
        }
        if(selectedNode !== null && mode === 1) // Mode Edition
        {
            transitionTable[selectedNode].action[key] = {
                read:   new Date()&1,
                write:  new Date()&1,
                move:   (new Date()&1)?'L':'R',
            }
        }
        selectedNode = key;
    } else {
        if(selectedNode === null && mode === 0) {
            addTransition(mouseX, mouseY);
        }
        selectedNode = null;
    }

    needUpdate = true;
    loop();
}

function mouseDragged() {
    loop();
    const key = verificationIntersection(mouseX, mouseY);
    if(mode === 0 && key !== null && selectedNode !== null && key === selectedNode) {
        if(display === 1) {
            mouseX = Math.ceil(mouseX / 10) * 10;
            mouseY = Math.ceil(mouseY / 10) * 10;
        }

        let snappingPoints = [null, null];
        for (const [snappingKey, obj] of Object.entries(transitionTable)) {
            if(snappingKey === selectedNode) {continue;}
            
            const stateOrientation = getOrientation(mouseX, mouseY, obj);

            switch(stateOrientation) {
                case 0:
                    obj.geometry.g_color = '#ffffff';
                    break;
                case 1:
                    if(snappingPoints[0] === null) {
                        snappingPoints[0] = snappingKey;
                    } else if(
                        getDistance(mouseX, mouseY, obj.geometry.g_x, obj.geometry.g_y) <
                        getDistance(mouseX, mouseY, transitionTable[snappingPoints[0]].geometry.g_x, transitionTable[snappingPoints[0]].geometry.g_y)
                    ) {
                        snappingPoints[0] = snappingKey;
                    }
                    // obj.geometry.g_color = '#00ff00';
                    break;
                case 2:
                    if(snappingPoints[1] === null) {
                        snappingPoints[1] = snappingKey;
                    } else if(
                        getDistance(mouseX, mouseY, obj.geometry.g_x, obj.geometry.g_y) <
                        getDistance(mouseX, mouseY, transitionTable[snappingPoints[1]].geometry.g_x, transitionTable[snappingPoints[1]].geometry.g_y)
                    ) {
                        snappingPoints[1] = snappingKey;
                    }
                    // obj.geometry.g_color = '#0000ff';
                    break;
                case 3:
                    // obj.geometry.g_color = '#00ffff';
                    break;
            }  
        }

        console.log(snappingPoints);

        if(snappingPoints[0] !== null) {
            transitionTable[snappingPoints[0]].geometry.g_color = '#00ff00';
        }
        if(snappingPoints[1] !== null) {
            transitionTable[snappingPoints[1]].geometry.g_color = '#0000ff';
        }

        // normal detection
        transitionTable[key].geometry.g_x = mouseX>350?mouseX:350;
        transitionTable[key].geometry.g_y = mouseY;
        transitionTable[key].geometry.g_keypoints = [];
        transitionTable[key].geometry.g_keypoints = [
            createVector(mouseX, mouseY - 25),
            createVector(mouseX - 25, mouseY - 50),
            createVector(mouseX, mouseY - 75),
            createVector(mouseX + 25, mouseY - 50),
        ];
    }
}

function getOrientation(mX, mY, obj) {
    let orientation = 0;
    // Test on X
    if(
        (
            mX - 25 >= obj.geometry.g_x - 25 &&
            mX - 25 <= obj.geometry.g_x + 25
        ) ||
        (
            mX + 25 >= obj.geometry.g_x - 25 &&
            mX + 25 <= obj.geometry.g_x + 25
        )
    ) {
        orientation = 1;
    }

    // Test on Y
    if(
        (
            mY - 25 >= obj.geometry.g_y - 25 &&
            mY - 25 <= obj.geometry.g_y + 25
        ) ||
        (
            mY + 25 >= obj.geometry.g_y - 25 &&
            mY + 25 <= obj.geometry.g_y + 25
        )
    ) {
        orientation = orientation + 2;
    }

    return orientation;
}

function getDistance(mX, mY, oX, oY) {
    return Math.sqrt((mX-oX)**2 +(mY-oY)**2);
}

function mouseReleased() {
    noLoop();
}

function keyPressed() {
    console.log(keyCode);
    if (keyCode === 65) // Addition mode
    {
        mode = 0;
        selectedNode = null;
    } else if (keyCode === 69) // Edition mode
    {
        mode = 1;
        selectedNode = null;
    } else if (keyCode === 88) // Suppression mode
    { 
        mode = 2;
        selectedNode = null;
    } else if(keyCode === 71) {
        display = (display+1)%2;
    } else if(keyCode === ALT)
    {
        isAltPressed = true;
    } else if(keyCode === 83 && isAltPressed) {
        console.log('saving');
        saveAction();
    }

    needUpdate = true;
    loop();
}

function keyReleased() {
    if(keyCode === ALT) {
        isAltPressed = false;
    }
}

function suppressionNoeudDeep(key) {
    delete transitionTable[key];
    for (const [k1, obj] of Object.entries(transitionTable)) {
        for (const [k2, action] of Object.entries(obj.action)) {
            if(k2 === key) {
                delete transitionTable[k1].action[k2];
            }
        }
    }
}

/**
 * Prepare the string of instructions that will be displayed on the popup 
 */
function extractTransitionTable() {
    console.log(transitionTable);

    states = [];
    for (let i = 0; i < Object.keys(transitionTable).length; i++) {
        const elt = transitionTable[`q${i}`];
        if(Object.keys(elt.action).length === 0) {continue;}
        for (const [key, action] of Object.entries(elt.action)) {
            let line = " ";
            if(`q${i}`.length === 2) {
                line += `q${i}    `;
            } else {
                line += `q${i}   `;
            }
            line += `${action.read}      ${action.write}       `
            if(key.length === 2) {
                line += `${key}    `;
            } else {
                line += `${key}   `;
            }
            line+=`${action.move}`;
            states.push(line);
        }
    }

    var html = 'Node  Read  Write  Target  Move\n';
    html +=    '-------------------------------\n';
    html += states.join('\n');
    openPopup(html, 'Transition Table');
}

/**
 * Function generating the popup of the extracted set of instructions
 * @param {string} content String of every instructions
 * @param {string} title String of the window title
 */
function openPopup(content, title) {
    var w = window.open('', title, 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no');

    var html = "<html><head>";
    html += "<link href='style.css' rel='stylesheet' type='text/css' />";
    html += "<title>" + title + "</title></head><body>";
    html += "<pre><code>";

    html += content;

    html += "</code></pre></body></html>";
    w.document.write(html);
    w.document.close();
}

function downloadObjectAsJson(){
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transitionTable));
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${fileName}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

/**
 * Loop through every nodes to check if the clickEvent is not inside one of each
 * @param {number} x mouseX event
 * @param {number} y mouseY event
 * @returns number
 */
function verificationIntersection(x, y) {
    for (const [key, value] of Object.entries(transitionTable)) {
        if(check_a_point(x, y, value.geometry.g_x, value.geometry.g_y, value.geometry.g_length)) {return key;}
    }
    return null;
}

/**
 * Detect if the coordinates are inside a circle ie a node
 * @param {number} a mouseX
 * @param {number} b mouseY
 * @param {number} x circleX
 * @param {number} y circleY
 * @param {number} r circleLength
 * @returns boolean
 */
function check_a_point(a, b, x, y, r) {
    var dist_points = (a - x) * (a - x) + (b - y) * (b - y);
    r *= r;
    if (dist_points < r) {
        return true;
    }
    return false;
}

function saveAction() {
    if(lastStorage === null) {
        if(Object.keys(transitionTable).length !== 0) {
            if(localStorage.getItem(lastStorage) !== JSON.stringify(transitionTable)) {
                const savedDate = getSaveDate(new Date);
                localStorage.setItem(`${savedDate}`, JSON.stringify(transitionTable));
                let params = {
                    display: display,
                    fileName: fileName,
                    mode: mode,
                    selectedNode: selectedNode,
                };

                localStorage.setItem("params", JSON.stringify(params));

                localStorage.setItem('lastStorage', `${savedDate}`);
                lastStorage = savedDate;
            } else {
                console.log('Same as last entity');
            }
        } else {
            console.log('Saving on empty');
        }
    } else {
        if(localStorage.getItem(lastStorage) !== JSON.stringify(transitionTable)) {
            const savedDate = getSaveDate(new Date);
            localStorage.setItem(`${savedDate}`, JSON.stringify(transitionTable));
            
            let params = {
                fileName: fileName,
                display: display,
                mode: mode,
                selectedNode: selectedNode,
            };

            localStorage.setItem("params", JSON.stringify(params));
            
            localStorage.setItem('lastStorage', `${savedDate}`);
            lastStorage = savedDate;
        } else {
            console.log('Same as last entity');
        }
    }
}

function inputNameFileChange() {
    console.log(`File name : ${this.value()}`);
    fileName = this.value();
}

function getSaveDate(date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join('_')
    );
}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}