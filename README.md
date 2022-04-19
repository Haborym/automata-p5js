# automata-p5js
A program that can emulate Turing Machine and maybe more

## What is this project ?

This project aims at first to emulate Turing Machine. But in the end it should be able to emulate every automata from the [Automata theory](https://en.wikipedia.org/wiki/Automata_theory).
This program is using the graphic part of the [p5.js](https://p5js.org/) library.

## How does it work ?

### The commands
- Keyboard commands : 
  - A (_Creation mode_) : when clicking on an empty part of the canvas it will place a node on the canvas. When clicking on an existing node you will be able to drag him on the canvas.
  - E (_Edition mode_) : you need to click on a node and then another to form a transition. It can be itslef if needed.
  - X (_Deletion mode_) : clicking on a node will remove it and remove every transitions connect to it.
  - G (_Placement mode_) : by default the placement is free. But when enabled it will snap every nodes to a grid so the placement will be easier and less messier.
  - ALT + S (_Save_) : it will save the state of the canvas into the browser storage. By saving, the state will still be the same after closing the tab and the browser.
- Buttons :
  - Extract : it will open a new window with the exported transition table inside.
  - Download : it will download on the computer the `JSON file` of the state of the canvas. In the future you will be able to import a file to load a specific state on the canvas.