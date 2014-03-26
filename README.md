# Penguinator

## Intro

Penguinator is a jQuery plugin for annotating images. It provides controls for drawing shapes over images based on a set of input instructions, and exporting these drawn shapes.

## Install

`bower install --save penguinator`

## Usage

```js
$('selector').annotator({
    src: 'cat.jpg', // Optional, placeholder displayed by default
    height: 300, // Optional, defaults to 200
    width: 500, // Optional, defaults to 200
    
    // Optional, defaults to "Annotating: Image"
    features: [
        {
            name: "tail",
            required: false,
            shape: "poly"
        },
        {
            name: "eyes",
            required: true,
            shape: "rect"
        }
    ]
});
```

## Annotating

### Moving around

You can zoom in and out of the image with the '+' and '-' buttons, and move the image by selecting the pan tool ('Pan' button) and clicking and dragging anywhere in the editing area.

### Making annotations

You add annotations to the image using the annotation tool ('Annotate' button). Chose the type of shape you'd like to draw and the feature you'd like to annotate from the drop-down menus, and click anywhere in the editing area to start adding points. If you're drawing a Polygon, double-click to place the last point.

### Changing annotations

Using the edit tool ('Edit' button), you can select existing annotations and make changes to them. This includes moving points, and adding points to a polygon (left click), deleting points (right click, if the shape is not a polygon it will be deleted), and deleting the annotation entirely ('X' button)

## License

MIT

(c) Team Heisenberg 2013-2014
