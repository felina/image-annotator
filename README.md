# Penguinator

## Intro

Penguinator is a jQuery plugin for annotating images. It provides controls for drawing shapes over images based on a set of input instructions, and exporting these drawn shapes.

## Install

`bower install --save penguinator`

## Use

```js
$('selector').annotator({
    src: 'cat.jpg', // Required
    height: 300, // Optional, defaults to 200
    width: 500, // Optional, defaults to 200
    // Required
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

## License

MIT

(c) Team Heisenberg 2013-2014
