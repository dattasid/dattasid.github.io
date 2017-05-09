define("RNG", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RNG {
        constructor(seed) {
            this.seed = seed;
        }
        next(min, max) {
            max = max || 0;
            min = min || 0;
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233280;
            return min + rnd * (max - min);
        }
        // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
        nextInt(min, max) {
            return Math.round(this.next(min, max));
        }
        nextDouble() {
            return this.next(0, 1);
        }
        pick(collection) {
            return collection[this.nextInt(0, collection.length - 1)];
        }
        shuffle(arr) {
            for (let i = 0; i < arr.length; i++) {
                let j = this.nextInt(0, arr.length - 1);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
    }
    exports.RNG = RNG;
});
define("mycolor", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Color {
        normalize() {
            this.red = Math.max(0, Math.min(1, this.red));
            this.green = Math.max(0, Math.min(1, this.green));
            this.blue = Math.max(0, Math.min(1, this.blue));
        }
        static to2bHex(val) {
            let s = ("0" + Math.round(val * 255).toString(16).toUpperCase());
            return s.substr(s.length - 2);
        }
        toHex() {
            this.normalize();
            return "#" + Color.to2bHex(this.red) + Color.to2bHex(this.green) + Color.to2bHex(this.blue);
        }
    }
    exports.Color = Color;
    function hsbToRGB(hue, saturation, value) {
        hue -= Math.floor(hue);
        hue *= 360;
        hue %= 360;
        saturation = Math.min(Math.max(0, saturation), 1);
        value = Math.min(1, Math.max(0, value));
        //            alpha = Math.min(1, Math.max(0, this.alpha));
        let rgb = new Color();
        var i;
        var f, p, q, t;
        if (saturation === 0) {
            // achromatic (grey)
            rgb.red = value;
            rgb.green = value;
            rgb.blue = value;
            //        rgb.alpha = this.alpha;
            return rgb;
        }
        var h = hue / 60; // sector 0 to 5
        i = Math.floor(h);
        f = h - i; // factorial part of h
        p = value * (1 - saturation);
        q = value * (1 - saturation * f);
        t = value * (1 - saturation * (1 - f));
        switch (i) {
            case 0:
                rgb.red = value;
                rgb.green = t;
                rgb.blue = p;
                break;
            case 1:
                rgb.red = q;
                rgb.green = value;
                rgb.blue = p;
                break;
            case 2:
                rgb.red = p;
                rgb.green = value;
                rgb.blue = t;
                break;
            case 3:
                rgb.red = p;
                rgb.green = q;
                rgb.blue = value;
                break;
            case 4:
                rgb.red = t;
                rgb.green = p;
                rgb.blue = value;
                break;
            default:
                rgb.red = value;
                rgb.green = p;
                rgb.blue = q;
                break;
        }
        //            rgb.alpha = this.alpha;
        return rgb;
    }
    exports.hsbToRGB = hsbToRGB;
});
define("geom-utils", ["require", "exports", "RNG"], function (require, exports, RNG_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SequenceType;
    (function (SequenceType) {
        SequenceType[SequenceType["ONE_SIDE_REG"] = 0] = "ONE_SIDE_REG";
        SequenceType[SequenceType["BOTH_SIDE_REG"] = 1] = "BOTH_SIDE_REG";
        SequenceType[SequenceType["ONE_SIDE_RAND"] = 2] = "ONE_SIDE_RAND";
        SequenceType[SequenceType["BOTH_SIDE_RAND"] = 3] = "BOTH_SIDE_RAND";
    })(SequenceType = exports.SequenceType || (exports.SequenceType = {}));
    ;
    class Sequence {
        constructor(type, amp, startSide = false, rand = new RNG_1.RNG(Math.random() * 9778576)) {
            this.type = type;
            this.amplitude = amp;
            this.curSide = startSide;
            this.rand = rand;
        }
        switchSide() {
            this.curSide = !this.curSide;
        }
        isRandom() {
            return (this.type == SequenceType.ONE_SIDE_RAND)
                || (this.type == SequenceType.BOTH_SIDE_RAND);
        }
        next() {
            let val = this.amplitude;
            if (this.curSide)
                val = -val;
            switch (this.type) {
                case SequenceType.ONE_SIDE_REG:
                    return val;
                case SequenceType.BOTH_SIDE_REG:
                    this.curSide = !this.curSide;
                    return val;
                case SequenceType.ONE_SIDE_RAND:
                    return val * this.rand.nextDouble();
                case SequenceType.BOTH_SIDE_RAND:
                    this.curSide = !this.curSide;
                    return val * this.rand.nextDouble();
            }
        }
    }
    exports.Sequence = Sequence;
});
define("cityscape-1", ["require", "exports", "RNG", "mycolor", "geom-utils"], function (require, exports, RNG_2, mycolor_1, geom_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Stop {
        constructor(offset, col, opacity = undefined) {
            this.opacity = undefined;
            this.offset = offset;
            this.col = col;
            this.opacity = opacity;
        }
        toSVG() {
            return "<stop stop-color=\"" + this.col + "\""
                + ((this.opacity != undefined) ? " stop-opacity=\"" + this.opacity + "\"" : "")
                + " offset=\"" + this.offset + "\"/>";
        }
    }
    class Grad {
        constructor() {
            this.stops = [];
            this.isUserSpace = false;
            this.nm = "unnamed";
        }
        addStop(offset, col, opacity = undefined) {
            this.stops.push(new Stop(offset, col, opacity));
        }
    }
    class LinearGradient extends Grad {
        constructor(x1, y1, x2, y2) {
            super();
            this.nm = "LG" + LinearGradient.id;
            LinearGradient.id++;
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        copy() {
            let lg = new LinearGradient(this.x1, this.y1, this.x2, this.y2);
            lg.stops = this.stops;
            lg.isUserSpace = this.isUserSpace;
            return lg;
        }
        static resetId() {
            LinearGradient.id = 0;
        }
        toSVG() {
            return "<linearGradient id=\"" + this.nm + "\" x1=\"" + this.x1 + "\" x2=\"" + this.x2
                + "\" y1=\"" + this.y1 + "\" y2=\"" + this.y2 + "\"" + (this.isUserSpace ? " gradientUnits=\"userSpaceOnUse\"" : "") + ">\n"
                + this.stops.map(x => x.toSVG()).join("\n")
                + "\n</linearGradient>";
        }
    }
    LinearGradient.id = 1;
    class Shape {
        constructor() {
            this.cls = undefined;
            this.trans = "";
            this.fill = undefined;
            this.filter = undefined;
            this.opacity = undefined;
            this.refName = undefined;
            this.nm = "SHP" + Shape.id;
            Shape.id++;
        }
        static resetId() {
            Shape.id = 0;
        }
        toSVGSub() {
            let isFillGrad = (this.fill instanceof Grad);
            return (this.nm != null ? (" id=\"" + this.nm + "\"") : "")
                + (this.cls ? (" class=\"" + this.cls + "\"") : "")
                + (this.trans.length > 0 ? (" transform=\"" + this.trans + "\"") : "")
                + (this.fill ? (" fill=\"" +
                    (isFillGrad ? "url(#" + this.fill.nm + ")" : this.fill)
                    + "\"") : "")
                + (this.filter ? (" filter=\"url(#" + this.filter + ")\"") : "")
                + (this.opacity ? (" fill-opacity=\"" + this.opacity + "\"") : "")
                + (this.strokeColor ? (" stroke=\"" + this.strokeColor + "\"") : "")
                + (this.strokeWidth ? (" stroke-width=\"" + this.strokeWidth + "\"") : "")
                + (this.opacity && this.strokeColor ? (" stroke-opacity=\"" + this.opacity + "\"") : "")
                + (this.clip ? (" clip-path=\"url(#" + this.clip.nm + ")\"") : "");
        }
        setClip(shp) {
            if (shp == null) {
                this.clip = undefined;
                return;
            }
            this.clip = new Clip(shp);
        }
        collectDefs(clips, shrefs, grads) {
            if (this.clip) {
                clips[this.nm] = this.clip;
                shrefs[this.clip.ref.nm] = this.clip.ref;
            }
            if (this.fill instanceof Grad) {
                grads[this.fill.nm] = this.fill;
            }
            if (this.strokeColor instanceof Grad) {
                grads[this.strokeColor.nm] = this.strokeColor;
            }
        }
        translate(x, y = undefined) {
            this.trans += "translate(" + x + " " + (y ? y : "") + ") ";
        }
        rotate(a, x = undefined, y = undefined) {
            this.trans += "rotate(" + a + " " + (x ? x : "") + " " + (x ? y : "") + ") ";
        }
        scale(x, y = undefined) {
            this.trans += "scale(" + x + " " + (y ? y : "") + ") ";
        }
    }
    Shape.id = 1;
    class Clip {
        constructor(ref) {
            this.nm = "CC" + Clip.id1;
            Clip.id1++;
            this.ref = ref;
        }
        toSVG() {
            let rf = new ShapeRef(this.ref);
            rf.nm = null;
            let s = "";
            s += "<clipPath id=\"" + this.nm + "\">\n";
            let cren = [];
            Clip.collectChildren(this.ref, cren);
            cren.forEach(c => { rf.ref = c; s += rf.toSVG(); });
            s += "\n</clipPath>\n";
            return s;
        }
        // Ugly colution to flatten groups for clipping
        static collectChildren(s, names) {
            if (s instanceof SVGGroup) {
                s.children.forEach(c => this.collectChildren(c, names));
            }
            else
                names.push(s);
        }
    }
    Clip.id1 = 1;
    class SVGGroup extends Shape {
        constructor() {
            super();
            this.children = [];
        }
        add(child) {
            this.children.push(child);
        }
        collectDefs(clips, shrefs, grads) {
            super.collectDefs(clips, shrefs, grads);
            // TODO: for grads!!!
            //if (fill)
            this.children.forEach(x => x.collectDefs(clips, shrefs, grads));
        }
        toSVG() {
            let s = "<g " + this.toSVGSub() + ">\n";
            this.children.forEach(element => {
                s += element.toSVG() + "\n";
            });
            s += "</g>";
            return s;
        }
    }
    class SVGRoot extends SVGGroup {
        constructor() {
            super();
        }
        toSVG() {
            let clips = {};
            let shrefs = {};
            let grads = {};
            this.collectDefs(clips, shrefs, grads);
            let s = "";
            s += "<defs>\n";
            if (this.defExtra)
                s += this.defExtra + "\n";
            if (Object.keys(grads).length > 0) {
                Object.keys(grads).forEach(nm => { s += grads[nm].toSVG() + "\n"; console.log("CALLED " + nm); });
            }
            if (Object.keys(shrefs).length > 0) {
                Object.keys(shrefs).forEach(nm => { s += shrefs[nm].toSVG() + "\n"; /*console.log("CALLED "+nm);*/ });
            }
            s += "\n";
            if (Object.keys(clips).length > 0) {
                Object.keys(clips).forEach(nm => {
                    s += clips[nm].toSVG() + "\n";
                });
            }
            // TODO!!! grads
            s += "</defs>\n";
            s += super.toSVG();
            return s;
        }
    }
    class ShapeRef extends Shape {
        constructor(ref) {
            super();
            this.ref = ref;
        }
        collectDefs(clips, shrefs, grads) {
            super.collectDefs(clips, shrefs, grads);
            shrefs[this.ref.nm] = this.ref;
        }
        toSVG() {
            // x="" y=""
            return "<use xlink:href=\"#" + this.ref.nm + "\"" + this.toSVGSub() + "/>";
        }
    }
    class Rect extends Shape {
        constructor(x = 0, y = 0, w = 0, h = 0, cls = undefined) {
            super();
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            if (cls && cls.length > 0)
                this.cls = cls;
        }
        toSVG() {
            return "<rect x=\"" + this.x + "\" y=\"" + this.y + "\" width=\"" + this.w + "\" height=\"" + this.h + "\" " +
                this.toSVGSub()
                + " />";
        }
        toQuad() {
            return new Quad(this.x, this.y, this.x + this.w, this.y, this.x + this.w, this.y + this.h, this.x, this.y + this.h);
        }
    }
    class Circle extends Shape {
        constructor(cx = 0, cy = 0, r = 0, cls = undefined) {
            super();
            this.cx = cx;
            this.cy = cy;
            this.r = r;
            if (cls && cls.length > 0)
                this.cls = cls;
        }
        toSVG() {
            return "<circle cx=\"" + this.cx + "\" cy=\"" + this.cy + "\" r=\"" + this.r + "\" " +
                this.toSVGSub()
                + " />";
        }
    }
    class CPoly extends Shape {
        constructor() {
            super();
            this.closed = true;
            this.x = [];
            this.y = [];
        }
        add(x, y) {
            this.x.push(x);
            this.y.push(y);
        }
        toSVG() {
            if (this.x.length == 0)
                return "";
            let s = "<path d=\"";
            s += "M " + this.x[0] + "," + this.y[0] + " ";
            for (let i = 1; i < this.x.length; i++) {
                s += "L " + this.x[i] + "," + this.y[i] + " ";
            }
            if (this.closed)
                s += "Z";
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        }
        static makeRegPoly(n, cx = 0, cy = 0, r = 1, rotDeg = -90) {
            let ret = new CPoly();
            let ang = Math.PI * 2 / n;
            let alpha = rotDeg * Math.PI / 180;
            for (let i = 0; i < n; i++) {
                ret.add(cx + r * Math.cos(ang * i + alpha), cy + r * Math.sin(ang * i + alpha));
            }
            return ret;
        }
    }
    class LineSegs extends Shape {
        constructor() {
            super();
            this.closed = true;
            this.x1 = [];
            this.y1 = [];
            this.x2 = [];
            this.y2 = [];
        }
        add(x1, y1, x2, y2) {
            this.x1.push(x1);
            this.y1.push(y1);
            this.x2.push(x2);
            this.y2.push(y2);
        }
        toSVG() {
            if (this.x1.length == 0)
                return "";
            let s = "<path d=\"";
            for (let i = 0; i < this.x1.length; i++) {
                s += "M" + this.x1[i] + "," + this.y1[i] +
                    "L" + this.x2[i] + "," + this.y2[i] + " ";
            }
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        }
    }
    let rand = new RNG_2.RNG(Math.random() * 99999999);
    function reDraw() {
        let svgml = "<defs>\n \
        <linearGradient id=\"lg1\" x1=\"0\" x2=\"0\" y1=\"0\" y2=\"1\"> \n\
            <stop stop-color=\"#aab0ff\" stop-opacity=\"1\" offset=\"0%\"/> \n\
            <stop stop-color=\"#0a101f\" offset=\"100%\"/> \n\
        </linearGradient> \n\
        </defs> \n\
        <!--rect x=\"0\" y=\"0\" width=\"800\" height=\"800\" fill=\"url(#lg1)\" /-->";
        let mainHue = rand.nextDouble();
        //console.log(mainHue);
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                let t1 = CPoly.makeRegPoly(3 + rand.nextInt(0, 1) + rand.nextInt(0, 1));
                t1.cls = "xy";
                let special1 = (rand.nextDouble() > .9);
                let special2 = (rand.nextDouble() > .9);
                t1.fill = mycolor_1.hsbToRGB(
                //i*.01 + j*.1,
                mainHue + rand.nextDouble() * .05 - .025
                    + (special1 ? .333 : 0)
                    + (special2 ? .333 : 0), .6, .8).toHex();
                t1.opacity = .1 + rand.nextDouble() * .3
                    + ((special1 || special2) ? .2 : 0) + ((special1 && special2) ? .5 : 0);
                let x = rand.nextDouble() * 600 + 100;
                let y = rand.nextDouble() * 600 + 100;
                //t1.translate(40+80*i, 40+80*j);
                t1.translate(x, y);
                //t1.rotate(25*i+35*j);
                t1.rotate(rand.nextDouble() * 360);
                t1.scale(20 + rand.nextDouble() * 20
                    + ((special1 || special2) ? rand.nextDouble() * 30 : 0)
                    + ((special1 && special2) ? rand.nextDouble() * 70 : 0));
                svgml += t1.toSVG();
            }
        }
        const R = 10;
        //let g:A[][] = new Array(R).fill(new Array(R).fill(null));
        //allocate(g, 0, 0, R, R);
        document.getElementById("canvas").innerHTML = svgml;
        //document.write("abc");
        console.log(document.getElementById("canvas"));
    }
    class A {
    }
    function allocate(arr, x, y, w, h) {
    }
    function reDrawRects1() {
        let svgml = "";
        let defs = "<defs>\n\
    <filter id=\"f1\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\">\n\
      <feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"20\" />\n\
    </filter>\n";
        //svgml += "<g filter=\"url(#f1)\">\n";
        let mainHue = rand.nextDouble();
        //console.log(mainHue);
        let HUE_VAR = rand.nextDouble() * .7;
        for (let i = 0; i < 50; i++) {
            let t1 = new Rect(rand.nextInt(0, 19) * 40, rand.nextInt(0, 19) * 40, rand.nextInt(0, 6) * 40, rand.nextInt(0, 6) * 40);
            let special1 = (rand.nextDouble() > .9);
            let special2 = (rand.nextDouble() > .9);
            // t1.fill = hsbToRGB(
            //     //i*.01 + j*.1,
            //     mainHue + rand.nextDouble() * .05 - .025
            //         +(special1?.333:0)
            //         +(special2?.333:0)
            //         ,
            //     .6, .8
            // ).toHex();
            let lg;
            let lgChoice = rand.nextInt(0, 3);
            switch (lgChoice) {
                case 0:
                    lg = new LinearGradient(0, 0, 1, 0);
                    break;
                case 1:
                    lg = new LinearGradient(0, 0, 0, 1);
                    break;
                case 2:
                    lg = new LinearGradient(1, 0, 0, 0);
                    break;
                case 3:
                    lg = new LinearGradient(0, 1, 0, 0);
                    break;
            }
            lg.addStop(0, mycolor_1.hsbToRGB(mainHue + rand.nextDouble() * HUE_VAR - HUE_VAR / 2, .6, .8).toHex(), 1);
            lg.addStop(100, mycolor_1.hsbToRGB(mainHue + rand.nextDouble() * HUE_VAR - HUE_VAR / 2, .6, .8).toHex(), 0);
            defs += lg.toSVG();
            t1.fill = "url(#" + lg.nm + ")";
            //t1.opacity = .1 + rand.nextDouble() * .3
            //    +((special1||special2)?.2:0)+((special1&&special2)?.5:0);
            //t1.opacity = .1;
            //t1.filter = "f1";
            svgml += t1.toSVG();
        }
        //svgml += "</g>\n";
        svgml = defs + "</defs>\n" + svgml;
        document.getElementById("canvas").innerHTML = svgml;
        console.log(document.getElementById("canvas"));
    }
    let V32 = Math.sqrt(3) / 2;
    function isox(x, y) {
        return x + y * .5;
    }
    function isoy(x, y) {
        return y * V32;
    }
    function reDrawTri1() {
        let svgml = "";
        let defs = "<defs>\n";
        let mainHue = rand.nextDouble();
        //console.log(mainHue);
        let HUE_VAR = rand.nextDouble() * .7;
        let SCALE = 60;
        for (let i = 0; i < 60; i++) {
            let x = rand.nextInt(0, 29) - 10;
            let y = rand.nextInt(0, 39);
            x *= 40;
            y *= 40;
            let sz = rand.nextInt(1, 10) * 40;
            let t1 = new CPoly();
            t1.add(isox(x, y), isoy(x, y));
            if (rand.nextInt(0, 1)) {
                t1.add(isox(x, y + sz), isoy(x, y + sz)); //Pointed side down
            }
            else {
                t1.add(isox(x + sz, y - sz), isoy(x + sz, y - sz)); //pointed side up
            }
            t1.add(isox(x + sz, y), isoy(x + sz, y));
            let special1 = (rand.nextDouble() > .9);
            let special2 = (rand.nextDouble() > .9);
            // t1.fill = hsbToRGB(
            //     //i*.01 + j*.1,
            //     mainHue + rand.nextDouble() * .05 - .025
            //         +(special1?.333:0)
            //         +(special2?.333:0)
            //         ,
            //     .6, .8
            // ).toHex();
            let lg;
            let lgChoice = rand.nextInt(0, 2);
            // TODO!! gradient for pointing down triangle
            switch (lgChoice) {
                case 0:
                    lg = new LinearGradient(.25, .63, 1, 1);
                    break;
                case 1:
                    lg = new LinearGradient(.75, .63, 0, 1);
                    break;
                case 2:
                    lg = new LinearGradient(.5, 1, .5, 0);
                    break;
            }
            lg.addStop(0, mycolor_1.hsbToRGB(mainHue + rand.nextDouble() * HUE_VAR - HUE_VAR / 2, .6, .8).toHex(), .7);
            let col2 = mycolor_1.hsbToRGB(mainHue + rand.nextDouble() * HUE_VAR - HUE_VAR / 2, .6, .8).toHex();
            //lg.addStop(.3, col2, .2);
            lg.addStop(.6, col2, 0);
            defs += lg.toSVG();
            t1.fill = "url(#" + lg.nm + ")";
            //t1.opacity = .1 + rand.nextDouble() * .3
            //    +((special1||special2)?.2:0)+((special1&&special2)?.5:0);
            //t1.opacity = .1;
            //t1.filter = "f1";
            svgml += t1.toSVG();
        }
        //svgml += "</g>\n";
        svgml = defs + "</defs>\n" + svgml;
        document.getElementById("canvas").innerHTML = svgml;
        //console.log(document.getElementById("canvas"));
        //console.log(svgml);
    }
    function reDrawRectLines() {
        let svgml = "";
        let defs = "<defs>\n";
        //svgml += "<g filter=\"url(#f1)\">\n";
        let mainHue = rand.nextDouble();
        //console.log(mainHue);
        let HUE_VAR = rand.nextDouble() * .7;
        class Ln {
        }
        let W = 40;
        let grid = new Array(W);
        for (let x = 0; x < W; x++) {
            grid[x] = new Array(W);
            for (let y = 0; y < W; y++) {
                grid[x][y] = [];
            }
        }
        var Dir;
        (function (Dir) {
            Dir[Dir["UP"] = 0] = "UP";
            Dir[Dir["DOWN"] = 1] = "DOWN";
            Dir[Dir["LEFT"] = 2] = "LEFT";
            Dir[Dir["RIGHT"] = 3] = "RIGHT";
        })(Dir || (Dir = {}));
        for (let i = 0; i < 5; i++) {
            var x, y, dir;
            switch (rand.nextInt(0, 1)) {
                case 0:
                    x = rand.nextInt(0, W - 1);
                    y = rand.nextInt(0, 1) * (W - 1);
                    dir = (y == 0) ? Dir.DOWN : Dir.UP;
                    break;
                case 1:
                    x = rand.nextInt(0, 1) * (W - 1);
                    y = rand.nextInt(0, W - 1);
                    dir = (x == 0) ? Dir.RIGHT : Dir.LEFT;
                    break;
            }
            let bendlen = W / 3 + rand.nextInt(0, W / 3 - 1);
            let len = 0;
            let thisLine = new Ln();
            thisLine.col = mycolor_1.hsbToRGB(mainHue + rand.nextDouble() * HUE_VAR - HUE_VAR / 2, .6, .8).toHex();
            let stlen = 0;
            while (true) {
                grid[x][y].push(thisLine);
                switch (dir) {
                    case Dir.UP:
                        y--;
                        break;
                    case Dir.DOWN:
                        y++;
                        break;
                    case Dir.LEFT:
                        x--;
                        break;
                    case Dir.RIGHT:
                        x++;
                        break;
                }
                if (x < 0 || y < 0 || x >= W || y >= W)
                    break;
                stlen++;
                len++;
                if (stlen > bendlen) {
                    switch (dir) {
                        case Dir.UP:
                        case Dir.DOWN:
                            dir = rand.nextInt(0, 1) ? Dir.LEFT : Dir.RIGHT;
                            break;
                        case Dir.RIGHT:
                        case Dir.LEFT:
                            dir = rand.nextInt(0, 1) ? Dir.UP : Dir.DOWN;
                            break;
                    }
                    stlen = 0;
                }
                if (len > W * 4)
                    break;
            }
        }
        let SCL = 400 / W;
        for (let x = 0; x < W; x++)
            for (let y = 0; y < W; y++) {
                if (grid[x][y].length == 0)
                    continue;
                let ch = grid[x][y][rand.nextInt(0, grid[x][y].length - 1)];
                let t1 = new Rect(x * SCL, y * SCL, SCL, SCL);
                t1.fill = ch.col;
                svgml += t1.toSVG() + "\n";
            }
        //svgml += "</g>\n";
        svgml = defs + "</defs>\n" + svgml;
        document.getElementById("canvas").innerHTML = svgml;
        //console.log(document.getElementById("canvas"));
        //console.log(svgml);
        // NOTES:
        // Plan: Random winding lines, the lines will go over and under each other
        // Not implemented: Cancel line on hitting self.
        // Problem: Lines look too disorganized and bad. Lines can overlap in a straight segment.
    }
    function reDrawRectPatterns() {
        class Pat {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.w = 0;
                this.h = 0;
                this.repx = 0;
                this.repy = 0;
                this.nrep = 0;
            }
            static createRand(rand, W, mainHue, hueVar) {
                let p = new Pat();
                p.w = rand.nextInt(1, W / 6);
                p.h = rand.nextInt(1, W / 6);
                p.x = rand.nextInt(0, W - 1);
                p.y = rand.nextInt(0, W - 1);
                p.nrep = rand.nextInt(0, 20);
                let choice = rand.nextInt(0, 1);
                switch (choice) {
                    case 0:
                        p.repx = Math.round(p.w * 1.5 + rand.nextInt(0, 2 * p.w - 1));
                        break;
                    case 1:
                        p.repy = Math.round(p.h * 1.5 + rand.nextInt(0, 2 * p.h - 1));
                        break;
                    case 2:
                        p.repx = Math.round(p.w * 1.5 + rand.nextInt(0, 2 * p.w - 1));
                        p.repy = Math.round(p.h * 1.5 + rand.nextInt(0, 2 * p.h - 1));
                        break;
                }
                p.col = mycolor_1.hsbToRGB(mainHue + rand.nextDouble() * hueVar - hueVar / 2, .6, .8).toHex();
                return p;
            }
            toSVG(scale) {
                let s = "";
                for (let i = 0; i < this.nrep; i++) {
                    let r = new Rect((this.x + this.repx * i) * scale, (this.y + this.repy * i) * scale, this.w * scale, this.h * scale);
                    r.fill = this.col;
                    s += r.toSVG() + "\n";
                }
                return s;
            }
        }
        let mainHue = rand.nextDouble(), hueVar = .1 + rand.nextDouble() * .5;
        let svgml = "";
        let back = new Rect(0, 0, 800, 800);
        back.fill = mycolor_1.hsbToRGB(mainHue + .5, .5, .2).toHex();
        svgml += back.toSVG() + "\n";
        let W = rand.pick([20, 40, 80, 160]);
        for (let i = 0; i < 10; i++) {
            let p = Pat.createRand(rand, W, mainHue, hueVar);
            svgml += p.toSVG(800 / W);
            //console.log("---"+svgml);
        }
        document.getElementById("canvas").innerHTML = svgml;
    }
    function reDrawCity() {
        let back = new Rect(0, 0, 800, 800);
        let r = new SVGRoot();
        let gr = new SVGGroup();
        for (let i = 0; i < 10; i++) {
            let x = 100 + 10 * i;
            let y = 700 - 50 * i;
            let w = 300 - 20 * i;
            let h = 200 - 10 * i;
            gr.add(new Rect(x, y, w, h));
        }
        let rf1 = new ShapeRef(gr);
        rf1.fill = "blue";
        r.add(rf1);
        let win = new LineSegs();
        for (let i = 800; i > 0; i -= 5) {
            win.add(0, i, 800, i);
        }
        win.strokeColor = "red";
        win.strokeWidth = 1.5;
        win.setClip(gr);
        r.add(win);
        let rf2 = new ShapeRef(gr);
        rf2.fill = "none";
        rf2.strokeColor = "blue";
        rf2.strokeWidth = 5;
        r.add(rf2);
        let svgml = r.toSVG();
        document.getElementById("canvas").innerHTML = svgml;
        // console.log(svgml);
    }
    function moveScale(p, dx, dy, sx = 1, sy = 1) {
        //let p2:CPoly = Object.assign({}, p);
        // Properties are not copied.
        let p2 = new CPoly();
        for (let i = 0; i < p.x.length; i++) {
            p2.add(dx + sx * p.x[i], dy + sy * p.y[i]);
        }
        return p2;
    }
    function LineLen(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    class Quad {
        constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.x3 = x3;
            this.y3 = y3;
            this.x4 = x4;
            this.y4 = y4;
        }
        toPoly() {
            let p = new CPoly();
            p.add(this.x1, this.y1);
            p.add(this.x2, this.y2);
            p.add(this.x3, this.y3);
            p.add(this.x4, this.y4);
            return p;
        }
        // Get avg x axis len, y axis len
        getAvgLens() {
            return [
                (LineLen(this.x1, this.y1, this.x2, this.y2) +
                    LineLen(this.x3, this.y3, this.x4, this.y4)) / 2,
                (LineLen(this.x2, this.y2, this.x3, this.y3) +
                    LineLen(this.x4, this.y4, this.x1, this.y1)) / 2
            ];
        }
        getAtCoords(alpha, beta) {
            let alpha1 = 1 - alpha;
            let beta1 = 1 - beta;
            return [
                (this.x1 * alpha1 + this.x2 * alpha) * beta1 + (this.x3 * alpha + this.x4 * alpha1) * beta,
                (this.y1 * alpha1 + this.y2 * alpha) * beta1 + (this.y3 * alpha + this.y4 * alpha1) * beta
            ];
        }
        makeWindowsGrid(quads, div_x, div_y, cov_x = .5, cov_y = .5, chance_big = 0, max_big_x = 1, max_big_y = 1, darkChance = 0) {
            // console.log("DC "+darkChance);
            div_x = div_x || 1;
            div_y = div_y || 1;
            let idiv = 1 / div_x;
            //window Coverage to wall coverage 
            cov_x = 1 - cov_x;
            cov_y = 1 - cov_y;
            let filled = new Array(div_x).fill(null).map(() => new Array(div_y).fill(false));
            for (let i = 0; i < div_x; i++) {
                let i2 = (i + cov_x / 2) / div_x;
                let i3 = (i + 1 - cov_x / 2) / div_x;
                // let var1 = idiv * rand.nextDouble()*.9;
                // let var2 = idiv * rand.nextDouble()*.9;
                for (let j = 0; j < div_y; j++) {
                    if (filled[i][j])
                        continue;
                    if (darkChance > 0 && rand.nextDouble() > darkChance) {
                        continue; // filled[i][j] dont matter
                    }
                    // TODO: BUG!!! Check if antire area is free
                    // current results look nice, so can ignore for now
                    let szx = 1, szy = 1;
                    if (chance_big > 0 && rand.nextDouble() > chance_big) {
                        szx = rand.nextInt(1, max_big_x);
                        szy = rand.nextInt(1, max_big_y);
                        szx = Math.min(szx, div_x - i);
                        szy = Math.min(szy, div_y - j);
                    }
                    //console.log("--- "+i+" "+j+" / "+szx+" "+szy);
                    for (let k1 = i; k1 < i + szx; k1++)
                        for (let k2 = j; k2 < j + szy; k2++)
                            filled[k1][k2] = true;
                    let i4 = i3 + (szx - 1) / div_x;
                    let j2 = (j + cov_y / 2) / div_y;
                    let j3 = (j + 1 - cov_y / 2 + szy - 1) / div_y;
                    let [x1, y1] = this.getAtCoords(i2, j2);
                    let [x2, y2] = this.getAtCoords(i4, j2);
                    let [x3, y3] = this.getAtCoords(i4, j3);
                    let [x4, y4] = this.getAtCoords(i2, j3);
                    quads.push(new Quad(x1, y1, x2, y2, x3, y3, x4, y4));
                }
            }
        }
        static subDiv(x1, y1, x2, y2, x3, y3, x4, y4, segs, divs_x, divs_y) {
            let dx1 = x2 - x1;
            let dy1 = y2 - y1;
            let dx2 = x3 - x4;
            let dy2 = y3 - y4;
            let idiv = 1 / divs_x;
            for (let i = 0; i < divs_x; i++) {
                let i2 = (i + .5) / divs_x;
                let var1 = idiv * rand.nextDouble() * .9;
                let var2 = idiv * rand.nextDouble() * .9;
                segs.add(x1 + dx1 * (i2 + var1), y1 + dy1 * (i2 + var1), x4 + dx2 * (i2 + var2), y4 + dy2 * (i2 + var2));
            }
        }
    }
    // Building plan
    class BPlan {
        static createRand() {
            let b = new BPlan();
            b.divx = 2 + rand.nextInt(1, 7); //per 100
            b.divy = 2 + rand.nextInt(1, 7); //per 100
            b.covx = .4 + rand.nextDouble() * .4;
            b.covy = .4 + rand.nextDouble() * .4;
            b.bigChance = rand.nextInt(0, 1) * (.2 + rand.nextDouble() * .5);
            b.bigSizeX = rand.pick([2, 2, 2, 3, 3, 4]);
            b.bigSizeY = rand.pick([1, 1, 2, 3, 3, 4]);
            b.darkChance = rand.pick([0, 1, 1]) * (.2 + rand.nextDouble() * .5);
            return b;
        }
    }
    function makePolyWithWindows(cx, cy, r, N, bplan, winColor, angle = ((N % 2 == 0) ? -(180 / N) - 90 : -90)) {
        let g1 = new SVGGroup();
        g1.fill = winColor;
        let reg = CPoly.makeRegPoly(N, cx, cy, r, angle);
        if (winColor)
            reg.fill = "black";
        g1.add(reg);
        if (!winColor)
            return g1;
        let regInset = CPoly.makeRegPoly(N, cx, cy, r * .95, angle);
        let ll = LineLen(regInset.x[0], regInset.y[0], regInset.x[1], regInset.y[1]);
        for (let i = 0; i < N; i++) {
            let j = (i + 1) % N;
            let q = new Quad(cx, cy, regInset.x[i], regInset.y[i], regInset.x[j], regInset.y[j], cx, cy);
            let quads = [];
            if (winColor != null) {
                let dx = Math.round(bplan.divx * r * 2 / 100);
                let dy = Math.round(bplan.divy * ll / 2 / 100);
                dx = Math.max(1, dx);
                dy = Math.max(1, dy);
                q.makeWindowsGrid(quads, dx, dy, 
                //coverage
                bplan.covx, bplan.covy, 
                //big window chance and size
                bplan.bigChance, bplan.bigSizeX, bplan.bigSizeY, bplan.darkChance);
                quads.forEach(q => g1.add(q.toPoly()));
            }
        }
        return g1;
    }
    function makeRectWindows(bmidx, bboty, bw, bh, bplan, winColor) {
        let br = new Rect(bmidx - bw / 2, bboty - bh, bw, bh);
        if (winColor)
            br.fill = "black";
        // br.fill="gray";
        // br.strokeColor="red";
        let tdx = Math.round(bplan.divx * bw / 100);
        let tdy = Math.round(bplan.divy * bh / 100);
        tdx = Math.max(tdx, 1);
        tdy = Math.max(tdy, 1);
        let inset = (bw + bh) * 2 / 100;
        let insetR = new Rect(bmidx - bw / 2 + (tdx > 1 ? inset : 0), bboty - bh + inset, bw - (tdx > 1 ? inset * 2 : 0), bh - inset * 2);
        let q = insetR.toQuad();
        let quads = [];
        if (winColor != null) {
            q.makeWindowsGrid(quads, tdx, tdy, 
            //coverage
            bplan.covx, bplan.covy, 
            //big window chance and size
            bplan.bigChance, bplan.bigSizeX, bplan.bigSizeY, bplan.darkChance);
        }
        let g1 = new SVGGroup();
        g1.add(br);
        // add a horn. TODO!!
        // let qqq = br.toQuad();
        // qqq.y2 -= bw/6;
        // let ppp = qqq.toPoly();
        // ppp.fill = "black";
        // g1.add(ppp);
        if (winColor)
            g1.fill = winColor;
        quads.forEach(qq => g1.add(qq.toPoly()));
        return g1;
    }
    function subDivPoly(p, d1, d2, isOpen = false) {
        let p2 = new CPoly();
        for (let i = 0; i < p.x.length; i++) {
            let j = (i + 1) % p.x.length;
            if (isOpen && j != i + 1)
                continue;
            let x1 = p.x[i], x2 = p.x[j];
            let y1 = p.y[i], y2 = p.y[j];
            let mx = (x1 + x2) / 2;
            let my = (y1 + y2) / 2;
            let l = LineLen(x1, y1, x2, y2);
            let dx = (x2 - x1) / l;
            let dy = (y2 - y1) / l;
            let nx = dy, ny = -dx;
            let nlen = d1 + (d2 - d1) * rand.nextDouble();
            mx += nlen * nx * l;
            my += nlen * ny * l;
            p2.add(x1, y1);
            p2.add(mx, my);
            if (isOpen && j == p.x.length - 1)
                p2.add(x2, y2);
        }
        return p2;
    }
    var CloudType;
    (function (CloudType) {
        CloudType[CloudType["FLAT_WIDE"] = 0] = "FLAT_WIDE";
        CloudType[CloudType["TALL_THICK"] = 1] = "TALL_THICK";
    })(CloudType || (CloudType = {}));
    function makeClouds(skyHue, sunHue, sunY) {
        let type = rand.pick([null, null,
            CloudType.FLAT_WIDE, CloudType.FLAT_WIDE,
            CloudType.TALL_THICK]);
        if (type == null)
            return null;
        var w, h, n;
        if (type == CloudType.FLAT_WIDE) {
            w = 400 + rand.nextDouble() * 200;
            h = 20 + rand.nextDouble() * 10;
            n = rand.nextInt(1, 5);
        }
        else if (type == CloudType.TALL_THICK) {
            w = 100 + rand.nextDouble() * 200;
            h = w / (2 + 2 * rand.nextDouble()); //100 + rand.nextDouble() * 100;
            n = rand.nextInt(5, 15);
        }
        let numC = n;
        let cloudBrt = 0.05; //.0+rand.nextDouble()*.1;
        let g = new SVGGroup();
        let varScaleTop = .5 + rand.nextDouble() * .5;
        let varScaleBot = rand.nextDouble();
        for (let i = 0; i < numC; i++) {
            let c = makeCloud(type, w, h, skyHue, sunHue, cloudBrt, sunY, varScaleTop, varScaleBot);
            g.add(c);
        }
        return g;
    }
    function makeCloud(type, w, h, skyHue, sunHue, cloudBrt, sunY, varScaleTop, varScaleBot) {
        // TODO IDEA: Arrange clouds by distance from sun, make them
        // bright to dark.
        let p = new CPoly();
        // let pp;
        var AMT1, AMT2;
        var x, y;
        let open = true;
        var cloudHue, cloudCol1, cloudColBright;
        if (type == CloudType.FLAT_WIDE) {
            // x = rand.nextDouble() * (800-w);
            x = -200 + rand.nextDouble() * (1200 - w);
            y = sunY - 300 * rand.nextDouble();
            // Wide thin
            // p.add(0, 400);
            // p.add(200, 350);
            // // p.add(400, 380);
            // p.add(600, 350);
            // p.add(800, 400);
            p.add(x, y);
            p.add(x + w / 4, y - h);
            // p.add(400, 380);
            p.add(x + w - w / 4, y - h);
            p.add(x + w, y);
            // pp = new CPoly();
            // pp.add(x, y);
            // pp.add(x+w/5, y-h-5);
            // pp.add(x+w-w/5, y-h-5);
            // pp.add(x+w, y);
            AMT1 = .2;
            AMT2 = .1;
            cloudHue = skyHue;
            cloudCol1 = mycolor_1.hsbToRGB(cloudHue, .6, .3).toHex();
            cloudColBright = mycolor_1.hsbToRGB(sunHue, .8, .8).toHex();
        }
        else if (type == CloudType.TALL_THICK) {
            x = -200 + rand.nextDouble() * (1200 - w);
            y = 50 + 200 * rand.nextDouble();
            //tall
            // p.add(200, 400);
            // p.add(200, 200);
            // p.add(400, 200);
            // p.add(400, 400);
            p.add(x, y);
            p.add(x, y - h);
            p.add(x + w, y - h);
            p.add(x + w, y);
            AMT1 = .4;
            AMT2 = .4;
            open = false;
            cloudHue = skyHue /*+ rand.nextDouble()*.1-.05*/;
            cloudCol1 = mycolor_1.hsbToRGB(cloudHue, 0, cloudBrt).toHex();
            // cloudColBright = hsbToRGB(sunHue, .9, .9).toHex();
        }
        let cloudSubDiv = function (inP, open, amt, times) {
            let outP = inP;
            for (let i = 0; i < times; i++) {
                outP = subDivPoly(outP, 0, amt, open);
            }
            //  = subDivPoly(inP, 0, AMT1, open);
            // outP = subDivPoly(outP, 0, AMT2, open);
            // outP = subDivPoly(outP, 0, AMT2, open);
            // outP = subDivPoly(outP, 0, AMT2, open);
            // outP = subDivPoly(outP, 0, AMT2, open);
            return outP;
        };
        let p2 = cloudSubDiv(p, open, AMT1 * varScaleTop, 1);
        p2 = cloudSubDiv(p2, open, AMT2 * varScaleTop, 2);
        p2 = cloudSubDiv(p2, open, AMT2 * varScaleTop, 2);
        //console.log(p2.x);
        //console.log(p2.y);
        // p2.translate(-200, -100);
        let g1 = new SVGGroup();
        if (type == CloudType.FLAT_WIDE) {
            let pBot = new CPoly();
            pBot.add(x + w, 0);
            pBot.add(x, 0);
            let pb1 = cloudSubDiv(pBot, true, AMT1 * varScaleBot / 4, 1);
            pb1 = cloudSubDiv(pb1, true, AMT2 * varScaleBot / 2, 2);
            let ppb1 = pb1;
            pb1 = cloudSubDiv(pb1, true, AMT2 * varScaleBot / 2, 2);
            // ppb1 = cloudSubDiv(pBot, true, AMT1/4, 1);
            // ppb1 = cloudSubDiv(ppb1, true, AMT2/4, 2);
            ppb1 = cloudSubDiv(ppb1, true, AMT2 * varScaleBot / 1.5, 2);
            pb1.fill = cloudColBright;
            pb1.translate(0, y);
            pb1.scale(1, 1.1);
            g1.add(pb1);
            ppb1.fill = cloudCol1;
            // g1.add(ppb1);
            for (let i = 0; i < ppb1.x.length; i++) {
                p2.add(ppb1.x[i], ppb1.y[i] + y);
            }
            // let r1 = new ShapeRef(p2);
            // r1.translate(-100, -100);
            // let ln = new CPoly();
            // ln.closed = false;
            // ln.add(x, y);
            // ln.add(x+w, y);
            // ln.strokeColor = cloudColBright;
            // ln.strokeWidth = 2;
            // // r1.stroke = cloudColBright;
            // // g1.add(r1);
            // g1.add(ln);
        }
        p2.translate(-0, -0 - 1);
        p2.fill = cloudCol1;
        g1.add(p2);
        return g1;
    }
    function makeRectCity(CITY_BOT, winHue, r, backBuildGrad) {
        let BUIL_W = rand.nextInt(50, 100);
        let BUIL_H = rand.nextInt(400, 500);
        let bplan = BPlan.createRand();
        bplan.divx = rand.nextInt(1, 6);
        bplan.divy = rand.nextInt(3, 8);
        let buildings = [];
        let winColor = mycolor_1.hsbToRGB(winHue, .8, .2).toHex();
        let winColor2 = mycolor_1.hsbToRGB(winHue, .8, .8).toHex();
        let divs = rand.nextInt(1, 10);
        let N = rand.nextInt(3, 10);
        let segH = BUIL_H / divs;
        let extraSegHMul = (rand.nextDouble() * .6 + .4);
        let numExatraSegs = rand.pick([0, 0, 0, 1, 2, 3, 4, 5]);
        let segYVar = 0;
        let seq = null;
        if (numExatraSegs > 0) {
            seq = new geom_utils_1.Sequence(rand.pick([geom_utils_1.SequenceType.ONE_SIDE_REG, geom_utils_1.SequenceType.BOTH_SIDE_REG,
                geom_utils_1.SequenceType.ONE_SIDE_RAND, geom_utils_1.SequenceType.BOTH_SIDE_RAND]), (.25 + rand.nextDouble() * .5), rand.pick([true, false]), rand);
            segYVar = segH / 2;
        }
        let taper = rand.pick([0, (rand.nextDouble() /*-.5*/) * BUIL_W / 10]); //amt reduced
        let ROWS = 3; // including centerpiece
        for (let row = 0; row < ROWS; row++) {
            let rowGrad = backBuildGrad.copy();
            rowGrad.y1 = -1000 - row * 600;
            rowGrad.y2 = 0;
            for (let bcx = 0; bcx < 800 * 1.25; bcx += BUIL_W * (.4 + .3 * row)) {
                //let thisWinColor = rand.pick([winColor, winColor2]);
                let thisWinColor = null;
                if (row == ROWS - 1)
                    thisWinColor = winColor2;
                // else if (row > 0) thisWinColor = winColor;
                let bw = (1 + rand.nextDouble()) * BUIL_W;
                let bh = (.7 + rand.nextDouble() * .2 + (ROWS - row - 1) * .3) * BUIL_H;
                // if (bcx == 0)
                if (row == ROWS - 1)
                    bh = BUIL_H * 1.1;
                let numSegs = Math.round(bh / segH) || 1;
                let segHAdj = bh / numSegs;
                let g1 = new SVGGroup();
                let segs = [];
                let extraSegs = [];
                let isPoly = true;
                let yMin = 800;
                for (let jj = numSegs - 1; jj >= 0; jj--) {
                    for (let sc = 0; sc < 1 + numExatraSegs; sc++) {
                        let bot = -bh * jj / numSegs; // scaled later
                        let bwSeg = bw - jj * taper;
                        let g2;
                        let ht = segHAdj * (sc > 0 ? extraSegHMul : 1) + 2;
                        g2 = makeRectWindows(/*bcx+*/ (sc > 0 ? (seq.next() * bwSeg) : 0), bot, //+(sc>0?(rand.nextDouble()-.5)*segYVar:0),
                        bwSeg, ht, bplan, thisWinColor);
                        if (yMin > bot - ht)
                            yMin = bot - ht;
                        if (sc == 0)
                            segs.push(g2);
                        else
                            extraSegs.push(g2);
                        // g1.add(g2);
                    }
                }
                // Main coulmn in front of extra segs
                segs.forEach(s => extraSegs.push(s));
                segs = extraSegs;
                if (seq && seq.isRandom() && rand.nextInt(1, 10) > 6)
                    rand.shuffle(segs);
                segs.forEach(s => g1.add(s));
                if (row == ROWS - 1) 
                // if (bcx == 0)
                {
                    g1.translate((.3 + .4 * rand.nextDouble()) * 800, CITY_BOT);
                    g1.scale(1.2, 1.2);
                    g1.fill = "black";
                }
                else {
                    g1.translate(bcx - bw - bw * (row % 2) / 2, CITY_BOT);
                    g1.scale(.5, .5);
                    g1.fill = rowGrad;
                    // console.log("--"+g1.toSVG());
                }
                buildings.push(g1);
                if (row == ROWS - 1)
                    break;
            }
        }
        // rand.shuffle(buildings);
        // buildings = buildings.reverse();
        buildings.forEach(g => r.add(g));
    }
    function reDrawCity2() {
        Shape.resetId();
        let r = new SVGRoot();
        // Cloud blur is not looking that great
        // r.defExtra = "<filter id=\"f1\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\">\n\
        //   <feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"2\" />\n\
        // </filter>";
        // Quad.subDiv(x1, y1, x2, y2, x3, y3, x4, y4, segs, 10, 1);
        // segs.strokeColor = "black";
        // segs.strokeWidth=5;
        // r.add(segs);
        let backHue = rand.nextDouble();
        let winHue = backHue + .5;
        let CITY_BOT = 700;
        let back = new Rect(0, 0, 800, 800);
        // back.fill = hsbToRGB(backHue, 1, .5).toHex();
        back.fill = new LinearGradient(0, 0, 0, 1);
        let backBrt1 = .2 + .3 * rand.nextDouble();
        let backBrt2 = .2 + .4 * rand.nextDouble();
        back.fill.addStop(0, mycolor_1.hsbToRGB(backHue, 1, backBrt1).toHex());
        back.fill.addStop(100, mycolor_1.hsbToRGB(backHue, 1, backBrt2).toHex());
        r.add(back);
        let bot = new Rect(0, CITY_BOT - 20, 800, 800 - CITY_BOT + 20);
        bot.fill = "black";
        let sunY = (rand.nextDouble() * .6 + .2) * 600;
        let sun = new Circle((rand.nextDouble() * .6 + .2) * 800, sunY, 100 + rand.nextInt(0, 50));
        let sunHue = backHue + rand.nextDouble() * .3 - .15;
        sun.fill = mycolor_1.hsbToRGB(sunHue, .9, .9).toHex();
        r.add(sun);
        let clouds = makeClouds(backHue, sunHue, sunY);
        if (clouds) {
            // clouds.filter = "f1";
            r.add(clouds);
        }
        let builLG = new LinearGradient(0, 0, 0, 1);
        builLG.addStop(0, mycolor_1.hsbToRGB(backHue, 1, (backBrt1 + backBrt2) / 2).toHex(), 1);
        builLG.addStop(100, "#000000", 1);
        builLG.isUserSpace = true;
        rand.nextInt(0, 1) ?
            makeRectCity(CITY_BOT, winHue, r, builLG) :
            makePolyCity(CITY_BOT, winHue, r, builLG);
        r.add(bot);
        let svgml = r.toSVG();
        document.getElementById("canvas").innerHTML = svgml;
        // console.log(svgml);
        console.log(svgml.length);
    }
    function makePolyCity(CITY_BOT, winHue, r, backBuildGrad) {
        let R = 50 + rand.nextInt(0, 50);
        let BUIL_H = rand.nextInt(400, 500);
        let N1 = rand.nextInt(3, 10), N2 = rand.nextInt(3, 10);
        if (N1 > N2)
            [N2, N1] = [N1, N2];
        let numSides = rand.pick([
            function (idx) { return N1; },
            function (idx) { return N1; },
            function (idx) { return N1; },
            function (idx) { return rand.nextInt(N1, N2); },
            function (idx) { return idx % 2 == 0 ? N1 : N2; }
        ]);
        // let numSides = rand.nextInt(3, 10);
        let bplan = BPlan.createRand();
        bplan.divx = rand.nextInt(3, 6);
        bplan.divy = rand.nextInt(3, 8);
        let buildings = [];
        let winColor = mycolor_1.hsbToRGB(winHue, .8, .2).toHex();
        let winColor2 = mycolor_1.hsbToRGB(winHue, .8, .8).toHex();
        let branches = false; // Branches make the scene too busy
        let taper = .7 + rand.nextDouble() * .25;
        //proportion to change by
        let polyAng = rand.pick([
            function (idx, numSides) { return undefined; },
            function (idx, numSides) { return ((numSides % 2 == 0) ? -(180 / numSides) - 90 : -90) + 360 / 2 / numSides; },
            function (idx, numSides) { return rand.nextDouble() * 360; },
            function (idx, numSides) { return rand.pick([undefined, ((numSides % 2 == 0) ? -(180 / numSides) - 90 : -90) + 360 / 2 / numSides]); },
            function (idx, numSides) { return (idx % 2 == 0) ? undefined : ((numSides % 2 == 0) ? -(180 / numSides) - 90 : -90) + 360 / 2 / numSides; },
        ]);
        let ROWS = 3;
        for (let row = 0; row < ROWS; row++) {
            let rowGrad = backBuildGrad.copy();
            rowGrad.y1 = -800 - row * 600;
            rowGrad.y2 = 0;
            for (let bcx = 0; bcx < 800 * 1.29; bcx += R * (.4 + .6 * row)) {
                let thisWinColor = (row == ROWS - 1) ? winColor2 : null;
                let r = R * (.7 + rand.nextDouble() * .3);
                if (row == ROWS - 1)
                    r = R;
                let this_r = r;
                // let bh = (1+rand.nextDouble()*.5) * BUIL_H;
                let bh = (.7 + rand.nextDouble() * .5 + (ROWS - row - 1) * .3) * BUIL_H;
                if (row == ROWS - 1)
                    // if (bcx == 0)
                    bh = BUIL_H * 1.1;
                let g1 = new SVGGroup();
                let segs = [];
                let back = [];
                let branch = [];
                let polyBot = 0; //- bh*.66/divs * .7 * (numSegs-1);
                let gap = .95 + rand.nextDouble() * .2;
                let makeBackSeg = function (x1, y1, x2, y2, d1, d2) {
                    let dx = x2 - x1, dy = y2 - y1;
                    let l = Math.sqrt(dx * dx + dy * dy);
                    let nx = dy / l, ny = -dx / l;
                    let ret = new CPoly();
                    ret.add(x1 - d1 * nx, y1 - d1 * ny);
                    ret.add(x2 - d2 * nx, y2 - d2 * ny);
                    ret.add(x2 + d2 * nx, y2 + d2 * ny);
                    ret.add(x1 + d1 * nx, y1 + d1 * ny);
                    return ret;
                };
                back.push(makeBackSeg(0, this_r, 0, 0, this_r * .5 / taper, this_r * .5));
                let idx = 0;
                while (polyBot > -bh) {
                    let this_numSides = numSides(idx);
                    let thisAng = polyAng(idx, this_numSides);
                    let g2 = makePolyWithWindows(/*bcx+*/ 0, polyBot, r, this_numSides, bplan, thisWinColor, thisAng);
                    segs.push(g2);
                    let r1 = taper * r;
                    let polyBot_next = polyBot - (r + r1) * gap;
                    back.push(makeBackSeg(0, polyBot, 0, polyBot_next, r * .5, r1 * .5));
                    if (branches && polyBot < -bh / 2) {
                        // Branches making the scene too busy
                        for (let ii = 0; ii < this_numSides; ii++) {
                            if (rand.nextDouble() > .5)
                                continue;
                            let a = thisAng + (ii + .5) * 360 / this_numSides;
                            let rad = a * Math.PI / 180;
                            let dx = Math.cos(rad);
                            let dy = Math.sin(rad);
                            let g3 = makePolyWithWindows(dx * r * 1.2, polyBot + dy * r * 1.5, r / 2, this_numSides, bplan, thisWinColor, polyAng(idx + ii, this_numSides));
                            branch.push(g3);
                        }
                    }
                    polyBot = polyBot_next;
                    r = r1;
                    idx++;
                    if (r < 10)
                        break;
                }
                back.pop();
                back.forEach(s => g1.add(s));
                branch.forEach(s => g1.add(s));
                segs.forEach(s => g1.add(s));
                if (row == ROWS - 1) 
                // if (bcx == 0)
                {
                    g1.translate((.3 + .4 * rand.nextDouble()) * 800, CITY_BOT - this_r);
                    g1.scale(1.2, 1.2);
                }
                else {
                    g1.translate(bcx - 2 * R + R * (row % 2) / 2, CITY_BOT - this_r / 2.2);
                    // g1.translate(, CITY_BOT-polyBot+2*R);
                    g1.scale(.5, .5); //*(isPoly?-1:1)
                    g1.fill = rowGrad;
                }
                buildings.push(g1);
                if (row == ROWS - 1)
                    break;
            }
        }
        // rand.shuffle(buildings);
        // buildings = buildings.reverse();
        buildings.forEach(g => r.add(g));
    }
    let f = function () {
        switch (rand.nextInt(0, 1)) {
            case 0:
                reDrawRects1();
                break;
            case 1:
                reDrawTri1();
                break;
        }
    };
    f = reDrawCity2;
    f();
    var intv = setInterval(f, 3000);
    // Stop recreate on escape
    window.addEventListener('keydown', function (e) {
        if ((e.key == 'Escape' || e.key == 'Esc' || e.keyCode == 27)) {
            clearInterval(intv);
            intv = null;
            return true;
        }
        else if ((e.key == 'Space' || e.key == 'Spc' || e.keyCode == 32)) {
            if (intv == null) {
                f();
                intv = setInterval(f, 3000);
            }
            else {
                clearInterval(intv);
                intv = null;
            }
            return false; //?
        }
    }, true);
});
/*
let r = new SVGRoot();
let g1 = new SVGGroup();
let r1 = new Rect(1, 1, 200, 200);
g1.add(r1);
g1.add(new Rect(100, 100, 200, 200));

let rf = new ShapeRef(g1);
rf.fill="red";

let r2 = new Rect(50, 50, 200, 200);
rf.setClip(r2);

let rf2 = new ShapeRef(r2);
rf2.fill="green";
r.add(rf2);

r.add(rf);


console.log(r.toSVG());
document.getElementById("canvas").innerHTML=r.toSVG();
*/ 
