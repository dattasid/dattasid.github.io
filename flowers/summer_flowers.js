define("RNG", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RNG {
        constructor(seed) {
            // faster than added uniform 
            this.haveNextNextGaussian = false;
            this.nextNextGaussian = 0;
            if (seed)
                this.seed = seed;
            else
                this.seed = Math.random() * 9999999999;
        }
        next(min, max) {
            max = max || 0;
            min = min || 0;
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233279;
            return min + rnd * (max - min);
        }
        // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
        nextInt(min, max) {
            return Math.floor(this.next(min, max));
        }
        nextDouble() {
            return this.next(0, 1);
        }
        range(a, b) {
            return this.next(a, b);
        }
        chance(ch) {
            return this.nextDouble() < ch;
        }
        pick(collection) {
            return collection[this.nextInt(0, collection.length)];
        }
        pickW(collection, wts) {
            if (collection.length != wts.length)
                return undefined;
            var s = 0;
            for (var w of wts)
                s += w;
            let ch = this.nextDouble() * s;
            for (var i = 0; i < collection.length; i++) {
                if (ch < wts[i])
                    return collection[i];
                ch -= wts[i];
            }
            return undefined;
        }
        shuffle(arr) {
            for (let i = 0; i < arr.length; i++) {
                let j = this.nextInt(0, arr.length);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
        nextGaussian() {
            // See Knuth, ACP, Section 3.4.1 Algorithm C.
            if (this.haveNextNextGaussian) {
                this.haveNextNextGaussian = false;
                return this.nextNextGaussian;
            }
            else {
                var v1, v2, s;
                do {
                    v1 = 2 * this.nextDouble() - 1; // between -1 and 1
                    v2 = 2 * this.nextDouble() - 1; // between -1 and 1
                    s = v1 * v1 + v2 * v2;
                } while (s >= 1 || s == 0);
                let multiplier = Math.sqrt(-2 * Math.log(s) / s);
                this.nextNextGaussian = v2 * multiplier;
                this.haveNextNextGaussian = true;
                return v1 * multiplier;
            }
        }
    }
    exports.RNG = RNG;
});
define("SVG", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const XMLNS = "http://www.w3.org/2000/svg";
    function SVGReset() {
        Shape.resetId();
        LinearGradient.resetId();
    }
    exports.SVGReset = SVGReset;
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
    exports.Stop = Stop;
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
    exports.Grad = Grad;
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
    exports.LinearGradient = LinearGradient;
    class Shape {
        constructor() {
            this.cls = undefined;
            this.trans = "";
            this.fill = undefined;
            this.filter = undefined;
            this.opacity = undefined;
            this.attrExtra = "";
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
                + (this.clip ? (" clip-path=\"url(#" + this.clip.nm + ")\"") : "")
                + ((this.attrExtra && this.attrExtra.length > 0)
                    ? this.attrExtra : "");
        }
        appendShapeAttrs(attr) {
            if (this.strokeColor)
                attr["stroke"] = this.strokeColor;
            if (this.strokeWidth)
                attr["stroke-width"] = this.strokeWidth;
            if (this.fill)
                attr["fill"] = this.fill;
            // TODO incomplete
        }
        setNodeShapeProps(el) {
            if (this.nm)
                el.id = this.nm;
            if (this.cls)
                el.class = this.cls;
            // TODO incomplete
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
    exports.Shape = Shape;
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
    exports.Clip = Clip;
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
    exports.SVGGroup = SVGGroup;
    class SVGRoot extends SVGGroup {
        constructor(w, h) {
            super();
            this.attrExtra = null;
            this.w = w;
            this.h = h;
        }
        toSVG() {
            let clips = {};
            let shrefs = {};
            let grads = {};
            this.collectDefs(clips, shrefs, grads);
            let s = "";
            s += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"" + this.w + "\" height=\"" + this.h + "\"";
            if (this.id)
                s += " id=\"" + this.id + "\"";
            if (this.attrExtra)
                s += " " + this.attrExtra;
            s += ">\n";
            s += "<defs>\n";
            if (this.defExtra)
                s += this.defExtra + "\n";
            if (Object.keys(grads).length > 0) {
                Object.keys(grads).forEach(nm => { s += grads[nm].toSVG() + "\n"; /*console.log("CALLED "+nm);*/ });
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
            s += "\n</svg>";
            return s;
        }
    }
    exports.SVGRoot = SVGRoot;
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
    exports.ShapeRef = ShapeRef;
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
        createSVGNode() {
            let attr = {
                x: this.x, y: this.y,
                width: this.w, height: this.h
            };
            this.appendShapeAttrs(attr);
            let el = createSVGNode("rect", attr);
            this.setNodeShapeProps(el);
            return el;
        }
    }
    exports.Rect = Rect;
    class Ellipse extends Shape {
        constructor(cx, cy, r, r2 = undefined, cls = undefined) {
            super();
            this.cx = cx;
            this.cy = cy;
            this.rx = r;
            this.ry = r2 ? r2 : r;
            if (cls && cls.length > 0)
                this.cls = cls;
        }
        toSVG() {
            return "<ellipse cx=\"" + this.cx + "\" cy=\"" + this.cy + "\" rx=\"" + this.rx + "\" ry=\"" + this.ry + "\" " +
                this.toSVGSub()
                + " />";
        }
    }
    exports.Ellipse = Ellipse;
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
        createSVGNode() {
            let attr = {
                cx: this.cx, cy: this.cy,
                r: this.r
            };
            this.appendShapeAttrs(attr);
            let el = createSVGNode("circle", attr);
            this.setNodeShapeProps(el);
            return el;
        }
    }
    exports.Circle = Circle;
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
    exports.CPoly = CPoly;
    class Line extends Shape {
        constructor(x1, y1, x2, y2) {
            super();
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.closed = true;
        }
        toSVG() {
            let t = this;
            let s = `<line x1="${t.x1}" y1="${t.y1}" x2="${t.x2}" y2="${t.y2}" `;
            if (this.markerEnd)
                s += ` marker-end="url(#${this.markerEnd})" `;
            s += this.toSVGSub() + "/>";
            return s;
        }
    }
    exports.Line = Line;
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
    exports.LineSegs = LineSegs;
    class SVGText extends Shape {
        constructor(str, x, y) {
            super();
            this.str = str;
            this.x = x;
            this.y = y;
        }
        toSVG() {
            let s = "<text x=\"" + this.x + "\" y=\"" + this.y +
                "\" " + this.toSVGSub() + ">\n";
            s += this.str;
            s += "</text>";
            return s;
        }
    }
    exports.SVGText = SVGText;
    function makeStripedRect(x, y, w, h, N, gapFrac, isVert) {
        let sum = 0;
        for (let i = 0; i < N; i++) {
            if (i > 0)
                sum += gapFrac;
            sum += 1;
        }
        let d = (1 + gapFrac) / sum;
        let g = new SVGGroup();
        if (isVert) {
            let sw = w / sum;
            for (let i = 0; i < N; i++) {
                let x1 = x + i * d * w;
                let r = new Rect(x1, y, sw, h);
                g.add(r);
            }
        }
        else {
            let sh = h / sum;
            for (let i = 0; i < N; i++) {
                let y1 = y + i * d * h;
                let r = new Rect(x, y1, w, sh);
                g.add(r);
            }
        }
        return g;
    }
    exports.makeStripedRect = makeStripedRect;
    class Vec2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        len() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        perp() {
            return new Vec2(this.y, -this.x);
        }
        inPlaceUnit() {
            let l = this.len();
            this.x /= l;
            this.y /= l;
        }
    }
    exports.Vec2 = Vec2;
    class Curve3Poly extends Shape {
        constructor() {
            super(...arguments);
            this.closed = false;
            this.x = [];
            this.y = [];
        }
        add(x1, y1, x2, y2, x3, y3, x4, y4) {
            if (this.x.length == 0) {
                this.x.push(x1);
                this.y.push(y1);
            }
            this.x.push(x2);
            this.y.push(y2);
            this.x.push(x3);
            this.y.push(y3);
            this.x.push(x4);
            this.y.push(y4);
        }
        close() {
            this.closed = true;
        }
        toSVG() {
            let s = `<path d="`
                + ((this.x.length > 0) ? `M${this.x[0]} ${this.y[0]} ` : "");
            for (let i = 1; i + 2 < this.x.length; i += 3) {
                s += `C${this.x[i]} ${this.y[i]}, ${this.x[i + 1]} ${this.y[i + 1]}, ${this.x[i + 2]} ${this.y[i + 2]}`;
            }
            s += `${this.closed ? " Z" : ""}" ${this.toSVGSub()}>\n`;
            return s;
        }
    }
    exports.Curve3Poly = Curve3Poly;
    var PathOp;
    (function (PathOp) {
        PathOp[PathOp["M"] = 0] = "M";
        PathOp[PathOp["L"] = 1] = "L";
        PathOp[PathOp["C"] = 2] = "C";
        PathOp[PathOp["Z"] = 3] = "Z";
    })(PathOp || (PathOp = {}));
    ;
    class PathStep {
        constructor(op, vals) {
            this.op = op;
            this.vals = vals;
        }
    }
    /* Generic path */
    class GPath extends Shape {
        constructor() {
            super();
            this.steps = [];
        }
        clear() {
            this.steps = [];
            return this;
        }
        moveTo(x, y) {
            this.steps.push(new PathStep(PathOp.M, [x, y]));
            return this;
        }
        lineTo(x, y) {
            this.steps.push(new PathStep(PathOp.L, [x, y]));
            return this;
        }
        polyTo(...v) {
            for (let i = 0; i + 1 < v.length; i += 2) {
                this.lineTo(v[i], v[i + 1]);
            }
            return this;
        }
        close() {
            this.steps.push(new PathStep(PathOp.Z, null));
        }
        curve3(x1, y1, x2, y2, x3, y3) {
            this.steps.push(new PathStep(PathOp.C, [x1, y1, x2, y2, x3, y3]));
        }
        toSVG() {
            // we need element to be created even empty
            // if (this.steps.length == 0) return "";
            let s = "<path d=\"";
            let d = this.toDString();
            s += d;
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        }
        createSVGNode() {
            let attr = {
                d: this.toDString()
            };
            this.appendShapeAttrs(attr);
            let el = createSVGNode("path", attr);
            this.setNodeShapeProps(el);
            return el;
        }
        toDString() {
            let s = "";
            for (let step of this.steps) {
                switch (step.op) {
                    case PathOp.M:
                        s += `M${step.vals[0]} ${step.vals[1]} `;
                        break;
                    case PathOp.L:
                        s += `L${step.vals[0]} ${step.vals[1]} `;
                        break;
                    case PathOp.Z:
                        s += `Z `;
                        break;
                    case PathOp.C:
                        s += `C${step.vals[0]} ${step.vals[1]} `
                            + `${step.vals[2]} ${step.vals[3]} ${step.vals[4]} ${step.vals[5]}`;
                        break;
                }
            }
            return s;
        }
    }
    exports.GPath = GPath;
    function createSVGNode(type, attrs) {
        var el = document.createElementNS(XMLNS, type);
        if (el) {
            for (let key in attrs) {
                if (attrs.hasOwnProperty(key)) {
                    el.setAttribute(key, attrs[key]);
                }
            }
        }
        return el;
    }
    exports.createSVGNode = createSVGNode;
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
            default:// case 5:
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
define("geom-utils", ["require", "exports", "SVG"], function (require, exports, S) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HandleType;
    (function (HandleType) {
        HandleType[HandleType["SMOOTH"] = 0] = "SMOOTH";
        HandleType[HandleType["CUSP"] = 1] = "CUSP";
    })(HandleType = exports.HandleType || (exports.HandleType = {}));
    class Pt {
        // x:number
        // y:number
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        clone() { return new Pt(this.x, this.y); }
        len() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        norm() {
            let l = this.len();
            this.x /= l;
            this.y /= l;
        }
    }
    exports.Pt = Pt;
    class Bezier {
        // https://github.com/rougier/gl-bezier/blob/master/cubic_bezier.py
        constructor(x0, y0, x1, y1, x2, y2, x3, y3) {
            this.x0 = x0;
            this.y0 = y0;
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.x3 = x3;
            this.y3 = y3;
        }
        // TODO optimize
        eval(t, out) {
            let t1 = 1 - t;
            let k1 = t1 * t1 * t1;
            let k2 = 3 * t * t1 * t1;
            let k3 = 3 * t * t * t1;
            let k4 = t * t * t;
            out.x =
                this.x0 * k1 +
                    this.x1 * k2 +
                    this.x2 * k3 +
                    this.x3 * k4;
            out.y =
                this.y0 * k1 +
                    this.y1 * k2 +
                    this.y2 * k3 +
                    this.y3 * k4;
        }
        split(t) {
            // Split curve at t into left and right cubic bezier curves
            let left_x0 = this.x0;
            let left_y0 = this.y0;
            let left_x1 = this.x0 + t * (this.x1 - this.x0);
            let left_y1 = this.y0 + t * (this.y1 - this.y0);
            let left_x2 = this.x1 + t * (this.x2 - this.x1);
            let left_y2 = this.y1 + t * (this.y2 - this.y1);
            let right_x2 = this.x2 + t * (this.x3 - this.x2);
            let right_y2 = this.y2 + t * (this.y3 - this.y2);
            let right_x1 = left_x2 + t * (right_x2 - left_x2);
            let right_y1 = left_y2 + t * (right_y2 - left_y2);
            left_x2 = left_x1 + t * (left_x2 - left_x1);
            left_y2 = left_y1 + t * (left_y2 - left_y1);
            var right_x0, right_y0;
            let left_x3 = right_x0 = left_x2 + t * (right_x1 - left_x2);
            let left_y3 = right_y0 = left_y2 + t * (right_y1 - left_y2);
            let right_x3 = this.x3;
            let right_y3 = this.y3;
            return [new Bezier(left_x0, left_y0, left_x1, left_y1, left_x2, left_y2, left_x3, left_y3),
                new Bezier(right_x0, right_y0, right_x1, right_y1, right_x2, right_y2, right_x3, right_y3)
            ];
        }
        toPath() {
            let p = new S.GPath();
            p.moveTo(this.x0, this.y0);
            p.curve3(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3);
            return p;
        }
    }
    exports.Bezier = Bezier;
    /**
     * Given a cubic beier (given as r theta instead of x, y,
     * Create a shell around it.
     * @param spr1
     * @param spr2
     * @param spr3
     * @param a0_rad
     * @param a1_rad
     * @param a2_rad
     * @param x0
     * @param y0
     * @param width0
     * @param width1
     * @param width2
     * @param smooth_top
     */
    function makeShell(spr1, spr2, spr3, a0_rad, a1_rad, a2_rad, x0, y0, width0, width1, width2, smooth_top) {
        // Spine coords, pt 0 being .5, 1
        let spx1 = x0 + Math.sin(a0_rad) * spr1;
        let spy1 = y0 - Math.cos(a0_rad) * spr1;
        let spx2 = spx1 + Math.sin(a1_rad) * spr2;
        let spy2 = spy1 - Math.cos(a1_rad) * spr2;
        let spx3 = spx2 + Math.sin(a2_rad) * spr3;
        let spy3 = spy2 - Math.cos(a2_rad) * spr3;
        let dx0 = Math.cos(a0_rad) * width0;
        let dy0 = Math.sin(a0_rad) * width0;
        // Offset of side points from spine
        let dx1 = Math.cos((a0_rad + a1_rad) / 2) * width1;
        let dy1 = Math.sin((a0_rad + a1_rad) / 2) * width1;
        let dx2 = Math.cos(smooth_top ? a2_rad : (a1_rad + a2_rad) / 2) * width2;
        let dy2 = Math.sin(smooth_top ? a2_rad : (a1_rad + a2_rad) / 2) * width2;
        let p = new PolyCurve3();
        p.start(x0 - dx0, y0 - dy0);
        p.cuspCurve3(spx1 - dx1, spy1 - dy1, (smooth_top ? spx3 : spx2) - dx2, (smooth_top ? spy3 : spy2) - dy2, spx3, spy3);
        p.cuspCurve3((smooth_top ? spx3 : spx2) + dx2, (smooth_top ? spy3 : spy2) + dy2, spx1 + dx1, spy1 + dy1, x0 + dx0, y0 + dy0);
        return [new Bezier(x0, y0, spx1, spy1, spx2, spy2, spx3, spy3),
            p];
    }
    exports.makeShell = makeShell;
    class PolyCurve3 {
        constructor() {
            this.x = [];
            this.y = [];
            this.type = [];
        }
        start(x, y) {
            this.x.push(x);
            this.y.push(y);
        }
        smoothCurve3(x1, y1, x2, y2, x3, y3) {
            this.x.push(x1);
            this.y.push(y1);
            this.x.push(x2);
            this.y.push(y2);
            this.x.push(x3);
            this.y.push(y3);
            this.type.push(HandleType.SMOOTH);
        }
        cuspCurve3(x1, y1, x2, y2, x3, y3) {
            this.x.push(x1);
            this.y.push(y1);
            this.x.push(x2);
            this.y.push(y2);
            this.x.push(x3);
            this.y.push(y3);
            this.type.push(HandleType.CUSP);
        }
        toPath() {
            let p = new S.GPath();
            p.moveTo(this.x[0], this.y[0]);
            for (let i = 1; i + 2 < this.x.length; i += 3) {
                p.curve3(this.x[i], this.y[i], this.x[i + 1], this.y[i + 1], this.x[i + 2], this.y[i + 2]);
            }
            return p;
        }
        clone() {
            let pc = new PolyCurve3();
            pc.x = this.x.slice();
            pc.y = this.y.slice();
            pc.type = this.type.slice();
            return pc;
        }
        perturb(rand, amtx, amty) {
        }
        /*TODO NOTE: is start guaranteed == last? */
        keepSmooth() {
        }
    }
    exports.PolyCurve3 = PolyCurve3;
    /**
     * A polygon, each point can be cusp or smooth. Can be
     * converted to a quadratic curve.
     */
    class PolyQuadLine {
        constructor() {
            this.x = [];
            this.y = [];
            this.type = [];
            this.closed = false;
        }
        len() {
            return this.x.length;
        }
        clear() {
            this.x = [];
            this.y = [];
            this.type = [];
        }
        add(x, y, after) {
            if (after != undefined) {
                this.x.splice(after + 1, 0, x);
                this.y.splice(after + 1, 0, y);
                this.type.splice(after + 1, 0, HandleType.SMOOTH);
            }
            else {
                this.x.push(x);
                this.y.push(y);
                this.type.push(HandleType.SMOOTH);
            }
        }
        togglePt(i) {
            if (i < 0 || i > this.len())
                return;
            if (this.type[i] == HandleType.CUSP)
                this.type[i] = HandleType.SMOOTH;
            else if (this.type[i] == HandleType.SMOOTH)
                this.type[i] = HandleType.CUSP;
        }
        deletePt(i) {
            if (i < 0 || i > this.len())
                return;
            this.x.splice(i, 1);
            this.y.splice(i, 1);
            this.type.splice(i, 1);
        }
        toPolyD() {
            if (this.len() < 1)
                return "";
            let x = this.x, y = this.y;
            let s = `M${x[0]} ${y[0]} `;
            for (let i = 1; i < x.length; i++) {
                s += `L${x[i]} ${y[i]} `;
            }
            if (this.closed)
                s += "Z";
            return s;
        }
        toCurveD() {
            let l = this.len();
            if (l < 1)
                return "";
            let x = this.x, y = this.y;
            let s = `M${x[0]} ${y[0]} `;
            let last = x.length - 1;
            for (let i = 0; i + 1 < x.length; i++) {
                let i2 = (i + 1) % l;
                let i3 = (i + 2) % l;
                if (i2 == 0 || (!this.closed && i2 == last) || this.type[i2] == HandleType.CUSP) {
                    s += `L${x[i2]} ${y[i2]}`;
                }
                else if (i3 == 0 || (!this.closed && i3 == last) || this.type[i3] == HandleType.CUSP) {
                    s += `Q${x[i2]} ${y[i2]},${x[i3]} ${y[i3]}`;
                    i++;
                }
                else {
                    let x3 = (x[i2] + x[i3]) / 2;
                    let y3 = (y[i2] + y[i3]) / 2;
                    s += `Q${x[i2]} ${y[i2]},${x3} ${y3}`;
                }
            }
            if (this.closed)
                s += "Z";
            return s;
        }
    }
    exports.PolyQuadLine = PolyQuadLine;
});
define("summer_flowers", ["require", "exports", "RNG", "SVG", "mycolor", "geom-utils"], function (require, exports, RNG_1, S, mycolor_1, geom_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PI = Math.PI;
    function DR(d) {
        return d * Math.PI / 180;
    }
    var FL_ARRANGE;
    (function (FL_ARRANGE) {
        FL_ARRANGE[FL_ARRANGE["SIMPLE"] = 0] = "SIMPLE";
        FL_ARRANGE[FL_ARRANGE["SPIKE"] = 1] = "SPIKE";
        FL_ARRANGE[FL_ARRANGE["BOQ"] = 2] = "BOQ";
    })(FL_ARRANGE || (FL_ARRANGE = {}));
    ;
    class PSpec {
        constructor(rand, H) {
            // The three segments of the main ste,m and branches. The branches will
            // scale down but keep their ratios.
            this.r1 = null;
            this.r2 = null;
            this.r3 = null;
            this.ground_leaf = rand.chance(.25);
            // this.ground_leaf = true
            let leaf_val = rand.nextDouble() * .4 + .3;
            let leaf_hue = .2 + rand.nextDouble() * .2;
            this.leaf_color = mycolor_1.hsbToRGB(leaf_hue, 1, leaf_val).toHex();
            this.leaf_color_dark = mycolor_1.hsbToRGB(leaf_hue, 1, leaf_val * .3).toHex();
            this.twig_lg = new S.LinearGradient(0, 0, 0, 1);
            this.twig_lg.addStop(0, this.leaf_color);
            this.twig_lg.addStop(1, this.leaf_color_dark);
            if (this.ground_leaf) {
                this.ground_leaf_num = rand.nextInt(6, 30);
                this.ground_leaf_max_a0 = rand.nextInt(20, 80);
                this.leaf_r1 = rand.nextInt(H * .04, H * .3);
                this.leaf_r2 = rand.nextInt(H * .04, H * .3);
                this.leaf_r3 = rand.nextInt(H * .04, H * .3);
                this.leaf_w0 = rand.nextInt(1, H / 60);
                this.leaf_w1 = rand.nextInt(H / 100, H / 20);
                this.leaf_w2 = rand.nextInt(H / 120, H / 10);
            }
            else {
                this.leaf_r1 = rand.nextInt(H * .015, H * .1);
                this.leaf_r2 = rand.nextInt(H * .015, H * .1);
                this.leaf_r3 = rand.nextInt(H * .015, H * .1);
                this.leaf_w0 = 0;
                this.leaf_w1 = rand.nextInt(H * .005, H * .035);
                this.leaf_w2 = rand.nextInt(H * .005, H * .045);
            }
            let leaf_len = this.leaf_r1 + this.leaf_r2 + this.leaf_r3;
            var m = rand.nextInt(5, 60);
            this.leaf_angle = [m, m + rand.nextInt(0, 30)];
            this.leaf_density = .03 + .03 * rand.nextDouble();
            this.r1 = rand.nextInt(H / 15, H / 3);
            this.r2 = rand.nextInt(H / 15, H / 3);
            this.r3 = rand.nextInt(H / 15, H / 3);
            let stem_len = this.r1 + this.r2 + this.r3;
            if (stem_len < leaf_len * 1.2) {
                let scl = leaf_len * 1.2 / stem_len;
                this.r1 *= scl;
                this.r2 *= scl;
                this.r3 *= scl;
            }
            this.num_stems = rand.pickW([1, rand.nextInt(3, 10)], [4, 1]);
            this.stem_max_a0 = rand.nextInt(20, 60);
            var m = rand.nextInt(5, 60);
            this.branch_a0 = [m, m + rand.nextInt(1, 60)];
            this.branch_a1_rel = rand.nextInt(10, 60);
            if (rand.chance(.5)) {
                this.branch_a2_rel = rand.nextInt(10, 60);
            }
            else {
                this.branch_a2_abs = rand.nextInt(1, 60);
            }
            if (this.num_stems == 1) {
                this.stem_max_a0 = rand.nextInt(1, 5);
                this.branch_a1_rel = rand.nextInt(0, 10);
                // this.branch_a2_rel = rand.nextInt(0, 20)
            }
            this.branch_max_level = 1 + (rand.chance(.2) ? 1 : 0);
            var flower_hue = -1;
            while (flower_hue == -1 || (flower_hue > .2 && flower_hue < .4))
                flower_hue = rand.nextDouble();
            var flower_sat = -1, flower_val;
            if (rand.chance(.2)) {
                // Whitish flower
                flower_sat = rand.nextDouble() * .4;
                flower_val = .8 + rand.nextDouble() * .2;
            }
            else {
                flower_sat = rand.nextDouble() * .4 + .6;
                flower_val = rand.nextDouble() * .2 + .8;
            }
            this.flower_color = mycolor_1.hsbToRGB(flower_hue, flower_sat, flower_val).toHex();
            this.flower_color_dark = mycolor_1.hsbToRGB(flower_hue, flower_sat, flower_val * (.4 + rand.nextDouble() * .4)).toHex();
            this.flower_arrangement = rand.pickW([FL_ARRANGE.SIMPLE, FL_ARRANGE.SPIKE, FL_ARRANGE.BOQ], [4, 1, 1]);
            this.flower_spike_r1 = rand.nextInt(H * .02, H * .04);
            this.flower_spike_a0_rad = rand.nextInt(10, 120) * PI / 180;
            this.flower_boq_r1 = rand.nextInt(H * .01, H * .02);
            this.flower_boq_ct = rand.nextInt(5, 15);
            this.flower_boq_spread = PI / 6 + rand.nextDouble() * PI / 2;
            this.flower_boq_hair_type = rand.chance(.2);
            this.flower_boq_stalk_curly = rand.nextDouble();
            this.flower_boq_angles = makePetalAngles(this.flower_boq_ct, this.flower_boq_spread, rand.chance(.5));
            this.flower_r = [rand.nextInt(2, 15), rand.nextInt(2, 15), rand.nextInt(2, 15)];
            this.flower_w = [rand.nextInt(2, 20), rand.nextInt(2, 20)];
            this.flower_round = rand.chance(.3);
            this.flower_num_petals = rand.nextInt(1, 8);
            if (this.flower_arrangement != FL_ARRANGE.SIMPLE)
                this.flower_num_petals = rand.nextInt(1, 3);
            this.flower_spread = PI * (.3 + .7 * rand.nextDouble());
            if (this.flower_num_petals < 4 && this.flower_spread > PI / 2)
                this.flower_spread /= 2;
            this.flower_petal_order = rand.chance(.5);
            this.flower_petal_angles = makePetalAngles(this.flower_num_petals, this.flower_spread, this.flower_petal_order);
            this.flower_scale = (this.flower_arrangement != FL_ARRANGE.SIMPLE) ? .5 : 1;
        }
    }
    function makeAngleList(rand, n) {
        let a = [];
        let off = rand.nextInt(0, 30);
        for (let i = 0; i < n; i++) {
            a.push(off + i * 360 / n);
        }
        a.sort((a, b) => { return Math.sin(DR(a)) - Math.sin(DR(b)); });
        return a;
    }
    function makeLeaf(spec, leaf_dir, leaf_origin_x, leaf_origin_y, width_scale, ground_leaf_angle_scale) {
        let leaf_dir1 = leaf_dir + PI / 6 * rand.nextDouble() * rand.pick([-1, 1]) * ground_leaf_angle_scale;
        let leaf_dir2 = leaf_dir + PI / 3 * rand.nextDouble() * rand.pick([-1, 1]) * ground_leaf_angle_scale;
        let [l_spine, l_shell] = geom_utils_1.makeShell(spec.leaf_r1, spec.leaf_r2, spec.leaf_r3, leaf_dir, leaf_dir1, leaf_dir2, leaf_origin_x, leaf_origin_y, spec.leaf_w0 * width_scale, spec.leaf_w1 * width_scale, spec.leaf_w2 * width_scale, false);
        let l_path = l_shell.toPath();
        l_path.fill = spec.leaf_color;
        l_path.strokeColor = "black";
        l_path.strokeWidth = .5;
        r.add(l_path);
        {
            let p_s = l_shell.clone();
            // for (let i = 0; i < l_shell.x.length; i++)
            // {
            //   p_s.x[i] += rand.nextDouble() * spec.leaf_r1 * .5
            //   p_s.y[i] += (.8 + 1 * width_scale * rand.nextDouble()) * spec.leaf_r1 * .5
            // }
            // leaf tip
            p_s.x[3] += (rand.nextDouble() * 2 - 1) * spec.leaf_r1 * .7;
            p_s.y[3] += (.8 + 1 * rand.nextDouble()) * spec.leaf_r1 * .5;
            p_s.x[2] += (rand.nextDouble() * 2 - 1.5) * spec.leaf_r1 * .5;
            p_s.y[2] += (.8 + 1 * rand.nextDouble()) * spec.leaf_r1 * .5;
            p_s.x[4] += (rand.nextDouble() * 2 - .5) * spec.leaf_r1 * .5;
            p_s.y[4] += (.8 + 1 * rand.nextDouble()) * spec.leaf_r1 * .5;
            let s_p = p_s.toPath();
            s_p.setClip(l_path);
            s_p.fill = spec.leaf_color_dark;
            if (!GLOBAL_FAST) {
                // s_p.filter = "blur_2"
                s_p.filter = "f1";
            }
            r.add(s_p);
        }
        // if (width_scale > .1)
        // {
        //   let [p3, p4] = l_spine.split(.7 + rand.nextDouble() * .2)
        //   let l_mid = p3.toPath()
        //   l_mid.fill = "none"
        //   l_mid.strokeColor = "black"
        //   r.add(l_mid)
        // }
    }
    function makePetal(spec, p_dir_r, leaf_origin_x, leaf_origin_y, width_scale, bend_center_amt, flower_scale) {
        let [p_spine, p_shell] = geom_utils_1.makeShell(spec.flower_r[0] * flower_scale, spec.flower_r[1] * flower_scale, spec.flower_r[2] * flower_scale, p_dir_r, p_dir_r - bend_center_amt * PI / 6, //+ PI/6 * rand.nextDouble() * rand.pick([-1, 1]) / width_scale
        p_dir_r - bend_center_amt * PI / 2, leaf_origin_x, leaf_origin_y, 0, spec.flower_w[0] * width_scale * flower_scale, spec.flower_w[1] * width_scale * flower_scale, spec.flower_round);
        let f_path = p_shell.toPath();
        f_path.fill = spec.flower_color;
        f_path.strokeColor = "black";
        f_path.strokeWidth = .5;
        r.add(f_path);
        let p_s = p_shell.clone();
        for (let i = 0; i < p_shell.x.length; i++) {
            p_s.x[i] += (rand.nextDouble() * spec.flower_r[0] * .5) * flower_scale;
            p_s.y[i] += ((.5 + rand.nextDouble()) * (spec.flower_r[0]) * 1) * flower_scale;
        }
        let s_p = p_s.toPath();
        s_p.setClip(f_path);
        s_p.fill = spec.flower_color_dark;
        if (!GLOBAL_FAST)
            s_p.filter = "blur_2";
        r.add(s_p);
    }
    function makeFlower(spec, f_dir_rad, f_origin_x, f_origin_y, scale) {
        for (let angle of spec.flower_petal_angles) {
            makePetal(spec, f_dir_rad + angle, f_origin_x, f_origin_y, Math.cos(angle), angle * 2 / spec.flower_spread, spec.flower_scale * scale);
        }
    }
    function makePetalAngles(n, spread, reverse) {
        let n2 = Math.floor(n / 2);
        let da = spread / n;
        let offa = n % 2 == 1 ? da : da / 2;
        let a = [];
        for (let i = n2 - 1; i >= 0; i--) {
            let a1 = spread / 2 - i * da - offa;
            a.push(a1);
            a.push(-a1);
        }
        if (n % 2 == 1)
            a.push(0);
        if (reverse)
            a = a.reverse();
        return a;
    }
    function makeTwig(spec, scale, a0_deg, x0, y0, lvl, max_level) {
        let thick_scale = scale; //Math.pow(.3, lvl)
        let t2 = rand.nextDouble() * .3 + .7;
        let a1 = a0_deg +
            rand.nextInt(-spec.branch_a1_rel, spec.branch_a1_rel + 1);
        let a2_deg = spec.branch_a2_abs ?
            rand.nextInt(-spec.branch_a2_abs, spec.branch_a2_abs + 1)
            : rand.nextInt(-spec.branch_a2_abs, spec.branch_a2_abs + 1);
        let [twig_spine, twig_shell] = geom_utils_1.makeShell(spec.r1 * scale, spec.r2 * scale, spec.r3 * scale, DR(a0_deg), DR(a1), DR(a2_deg), x0, y0, 5 * thick_scale * t2, 3 * thick_scale * t2, 2 * thick_scale * t2, false);
        let twig_path = twig_shell.toPath();
        twig_path.strokeColor = "black";
        twig_path.strokeWidth = .5;
        twig_path.fill = spec.twig_lg; //spec.leaf_color
        // Leaves
        if (!spec.ground_leaf) {
            let pt = new geom_utils_1.Pt();
            let pt1 = new geom_utils_1.Pt();
            let dir = 1;
            let dt = spec.leaf_density / scale;
            let tstart = (lvl == 0) ? .2 : .1;
            let z_angle = rand.nextDouble() * PI;
            for (let t = tstart; t < .7; t += dt) {
                twig_spine.eval(t, pt);
                twig_spine.eval(t + .01, pt1);
                z_angle = (z_angle + 1) % (2 * PI);
                let w_scale = Math.cos(z_angle);
                let a_t = Math.atan2(pt1.y - pt.y, pt1.x - pt.x) + Math.PI / 2;
                // leaf angle
                a_t += Math.sin(z_angle) * DR(rand.nextInt(spec.leaf_angle[0], spec.leaf_angle[1]));
                makeLeaf(spec, a_t, pt.x, pt.y, w_scale, 1); // No angle scaling for normal leaves
                dir *= -1;
            }
        }
        if (lvl < max_level) {
            let pt = new geom_utils_1.Pt();
            let pt1 = new geom_utils_1.Pt();
            let dir = 1;
            for (let t = .3; t < .8; t += .1) {
                twig_spine.eval(t, pt);
                twig_spine.eval(t + .01, pt1);
                let a_t = Math.atan2(pt1.y - pt.y, pt1.x - pt.x) + Math.PI / 2;
                let scale1 = scale * (1 - t);
                makeTwig(spec, scale1, a_t * 180 / Math.PI + rand.nextInt(spec.branch_a0[0], spec.branch_a0[1]) * dir, pt.x, pt.y, lvl + 1, max_level);
                dir *= -1;
            }
        }
        r.add(twig_path);
        // if (lvl >= max_level)
        {
            // Flower
            if (spec.flower_arrangement == FL_ARRANGE.SIMPLE) {
                makeFlower(spec, DR(a2_deg), twig_spine.x3, twig_spine.y3, 1);
            }
            else if (spec.flower_arrangement == FL_ARRANGE.SPIKE) {
                let [spike_spine, shell] = geom_utils_1.makeShell(spec.flower_spike_r1, spec.flower_spike_r1, spec.flower_spike_r1, DR(a2_deg), DR(a2_deg + -60 + rand.nextDouble() * 120), DR(a2_deg + -60 + rand.nextDouble() * 120), twig_spine.x3, twig_spine.y3, 0, 0, 0, false);
                let ss = spike_spine.toPath();
                ss.strokeColor = spec.leaf_color;
                ss.strokeWidth = 1;
                ss.fill = "none";
                r.add(ss);
                let pt = new geom_utils_1.Pt();
                let pt1 = new geom_utils_1.Pt();
                let dir = 1;
                for (let t = 0; t <= 1; t += .2) {
                    spike_spine.eval(t, pt);
                    spike_spine.eval(t + .01, pt1);
                    let a_t = Math.atan2(pt1.y - pt.y, pt1.x - pt.x) + PI / 2;
                    let scale1 = (1 - t) * .5 + .5;
                    makeFlower(spec, a_t + spec.flower_spike_a0_rad, pt.x, pt.y, scale1);
                    makeFlower(spec, a_t - spec.flower_spike_a0_rad, pt.x, pt.y, scale1);
                    // makeTwig(spec, scale1,
                    //   a_t*180/Math.PI + rand.nextInt(spec.branch_a0[0], spec.branch_a0[1]) * dir,
                    //   pt.x, pt.y, lvl+1, max_level)
                    dir *= -1;
                }
            }
            else if (spec.flower_arrangement == FL_ARRANGE.BOQ) {
                for (let angle of spec.flower_boq_angles) {
                    let st_ang_r = DR(a2_deg) + angle;
                    let st_ang_r2 = st_ang_r + DR(-60 + rand.nextDouble() * 120) * spec.flower_boq_stalk_curly;
                    let [spike_spine, shell] = geom_utils_1.makeShell(spec.flower_boq_r1, spec.flower_boq_r1, spec.flower_boq_r1, st_ang_r, st_ang_r + DR(-60 + rand.nextDouble() * 120) * spec.flower_boq_stalk_curly, st_ang_r2, twig_spine.x3, twig_spine.y3, 0, 0, 0, false);
                    let ss = spike_spine.toPath();
                    ss.strokeColor = spec.flower_boq_hair_type ? spec.flower_color : spec.leaf_color_dark;
                    ss.strokeWidth = 1;
                    ss.fill = "none";
                    r.add(ss);
                    if (!spec.flower_boq_hair_type)
                        makeFlower(spec, st_ang_r2, spike_spine.x3, spike_spine.y3, 1);
                }
                // let pt = new Pt()
                // let pt1 = new Pt()
                // let dir = 1
                // for (let t = 0; t <= 1; t+= .2)
                // {
                //   spike_spine.eval(t, pt)
                //   spike_spine.eval(t+.01, pt1)
                //   let a_t = Math.atan2(pt1.y-pt.y, pt1.x-pt.x) + PI/2
                //   let scale1 = (1-t) * .5 + .5
                //   makeFlower(spec, a_t + spec.flower_spike_a0_rad,
                //               pt.x, pt.y, scale1)
                //   makeFlower(spec, a_t - spec.flower_spike_a0_rad,
                //               pt.x, pt.y, scale1)
                //   // makeTwig(spec, scale1,
                //   //   a_t*180/Math.PI + rand.nextInt(spec.branch_a0[0], spec.branch_a0[1]) * dir,
                //   //   pt.x, pt.y, lvl+1, max_level)
                //   dir *= -1
                // }
            }
        }
    }
    function makePlant(spec, x, y) {
        // let r1 = rand.nextInt(50, 400)
        // let r2 = rand.nextInt(50, 200)
        // let r3 = rand.nextInt(50, 100)
        // let max_a0 = rand.nextInt(20, 60)
        // let num_branch0 = rand.nextInt(1, 5)
        for (let i = 0; i < spec.num_stems; i++) {
            let a0 = rand.nextInt(-spec.stem_max_a0, spec.stem_max_a0 + 1);
            makeTwig(spec, .7 + rand.nextDouble() * .3, // Scale
            a0, x, y, 0, spec.branch_max_level);
        }
        if (spec.ground_leaf) {
            let angles = makeAngleList(rand, spec.ground_leaf_num);
            for (let i = 0; i < spec.ground_leaf_num; i++) {
                // Note could end up imbalanced, can be done better,
                // let z_angle = Math.PI * 2 * rand.nextDouble()
                // let z_angle = (i < 5)?
                //         (rand.nextDouble() * Math.PI/6 + rand.pick([0, Math.PI*5/6]))
                //         :(rand.nextDouble() * Math.PI/2 + Math.PI/4)
                let z_angle = DR(angles[i]);
                // let a0 = rand.nextInt(-spec.stem_max_a0, spec.stem_max_a0+1)
                // let a0 = rand.nextInt(-70, 71)
                let cos_z = Math.cos(z_angle);
                let a0 = cos_z * spec.ground_leaf_max_a0;
                // let a0 = z_angle * 180 / Math.PI -90
                let scale = .8 + .2 * rand.nextDouble();
                // let w_scale = .2 + .8 * rand.nextDouble()
                let w_scale = .2 + .8 * Math.sin(z_angle);
                makeLeaf(spec, DR(a0), x, y, w_scale, cos_z);
                // TODO TODO TODO LEAF ANGLES
                // let [gl_spine, gl_shell] = makeShell(
                //   spec.leaf_r1 * scale,
                //   spec.leaf_r2 * scale,
                //   spec.leaf_r3 * scale,
                //   DR(a0),
                //   DR(a0 + rand.nextInt(-60, 60) * cos_z),
                //   DR(a0 + rand.nextInt(-60, 60) * cos_z),
                //   x, y, spec.leaf_w0*w_scale, spec.leaf_w1*w_scale, spec.leaf_w2*w_scale,
                //   false)
                // let gl_path = gl_shell.toPath()
                // gl_path.strokeColor = "black"
                // gl_path.strokeWidth = 1
                // // let g = new S.LinearGradient(spine.x4, spine.y1, spine.x1, spine.y4);// Swapped x looks better
                // // g.addStop(.3, "#010")
                // // g.addStop(1, hsbToRGB(.333, 1, rand.nextDouble() * .4 + .6).toHex())
                // // g.isUserSpace = true
                // // shell.fill = "green"//g
                // gl_path.fill = spec.leaf_color
                // r.add(gl_path)
                // if (w_scale > .2)
                // {
                //   // let [p1, p2] = spine.split(.1)
                //   // let [p3, p4] = p2.split(.7)
                //   let [p3, p4] = gl_spine.split(.7 + rand.nextDouble() * .2)
                //   let s1 = p3.toPath();
                //   s1.fill = "none"
                //   s1.strokeColor = "black"
                //   r.add(s1)
                // }
            }
        }
    }
    function makeBackground(W, H) {
        let back_lg = new S.LinearGradient(0, 0, 0, 1);
        back_lg.addStop(0, "skyblue");
        back_lg.addStop(.5, "skyblue");
        back_lg.addStop(.68, "blue");
        back_lg.addStop(.7, "green");
        back_lg.addStop(.86, mycolor_1.hsbToRGB(.3, 1, .2).toHex());
        back_lg.addStop(.96, mycolor_1.hsbToRGB(.3, 1, .2).toHex());
        back_lg.addStop(1, "darkgreen");
        let bg = new S.Rect(0, 0, W, H);
        bg.fill = back_lg;
        r.add(bg);
        let cloud_lg = new S.LinearGradient(0, 0, 0, 1);
        cloud_lg.addStop(0, "white");
        cloud_lg.addStop(.1 + rand.nextDouble() * .8, "lightgrey"); // cloud shininess
        cloud_lg.addStop(1, "grey");
        let cl = new S.SVGGroup();
        let n_clouds = rand.nextInt(1, 10);
        let ylines = [];
        for (let i = 0; i < rand.nextInt(1, 3); i++) {
            ylines.push(H * (.05 + rand.nextDouble() * .35));
        }
        if (rand.chance(.7)) {
            let yscale = rand.pick([1, 1 + rand.nextDouble() * 2]);
            for (let i = 0; i < n_clouds; i++) {
                //      makeCloud(cl, cloud_lg, W*rand.nextDouble(), H * (.05 + rand.nextDouble() * .35), yscale)
                makeCloud(cl, cloud_lg, W * rand.nextDouble(), rand.pick(ylines), yscale);
            }
            // makeCloud(cl, cloud_lg, W*.7, H * .25)
            cl.filter = "blur_20";
        }
        else {
            for (let i = 0; i < n_clouds; i++) {
                //      makeWispyWhiteCloud(cl, cloud_lg, W*rand.nextDouble(), H * (.05 + rand.nextDouble() * .35))
                makeWispyWhiteCloud(cl, cloud_lg, W * rand.nextDouble(), rand.pick(ylines));
            }
        }
        r.add(cl);
    }
    function makeCloud(cl, cloud_lg, x, y, yscale) {
        // NOTE: Makes cloud to above and right. Maybe center this.
        let cw = 200;
        let n = 20;
        let dx = cw / n;
        for (let i = 0; i < n; i++) {
            let c = new S.Ellipse(x + i * dx + rand.nextDouble() * 35, y + rand.nextDouble() * 15, 25 + rand.nextDouble() * 50, 5 * yscale + rand.nextDouble() * 5 * yscale);
            c.fill = cloud_lg;
            cl.add(c);
        }
        n = 30;
        dx = cw * .7 / n;
        for (let i = 0; i < 30; i++) {
            let c = new S.Ellipse(x + cw * .1 + i * dx + rand.nextDouble() * 35, y + -35 * yscale / 2 + rand.nextDouble() * 45 * yscale / 2, 5 + rand.nextDouble() * 50, 5 + rand.nextDouble() * 20 * yscale);
            c.fill = cloud_lg;
            cl.add(c);
        }
    }
    function makeWispyWhiteCloud(cl, cloud_lg, x, y) {
        for (let i = 0; i < 20; i++) {
            let c = new S.Ellipse(x + i * 10 + rand.nextDouble() * 35, y + rand.nextDouble() * 15, 25 + rand.nextDouble() * 50, 5 + rand.nextDouble() * 5);
            c.fill = "url(#white_cloud)";
            cl.add(c);
        }
    }
    class DrawQ {
        constructor(mainCtx, totalCount) {
            this.mainCtx = mainCtx;
            this.totalCount = totalCount;
            this.images = [];
            this.done = [];
            this.progress = document.getElementById("progress");
            this.loadCalls = 0;
        }
        drawOnCanvas(svgdata) {
            // var canvas = <HTMLCanvasElement>document.getElementById('canvas2');
            // var ctx = canvas.getContext('2d');
            // ctx.imageSmoothingEnabled = true;
            var img = new Image();
            var svg = new Blob([svgdata], { type: 'image/svg+xml' });
            var url = DrawQ.DOMURL.createObjectURL(svg);
            let idx = this.images.push(img) - 1;
            var loader = this;
            img.onload = function () {
                loader.imgOnLoad(idx);
                // ctx.drawImage(img, 0, 0);
                // DrawQ.DOMURL.revokeObjectURL(url);
            };
            img.src = url;
        }
        imgOnLoad(myidx) {
            this.loadCalls++;
            console.log("Call " + myidx + " (" + this.loadCalls + "/" + this.totalCount + ")");
            // Find all previous undone work.
            var i;
            for (i = myidx - 1; i >= 0; i--) {
                if (this.done[i])
                    break;
            }
            let lastDone = i;
            this.mainCtx.imageSmoothingEnabled = true;
            for (i = lastDone + 1;; i++) {
                if (!this.images[i] || !this.images[i].complete) {
                    // console.log("Call for "+myidx+", stopped at "+i)
                    return;
                }
                // Draw all previous images (MAYBE including current) if
                // 1. Every previous image is done (maybe during this invocation)
                // 2. No null image before this that is not done.
                console.log("Draw " + i);
                this.mainCtx.drawImage(this.images[i], 0, 0);
                DrawQ.DOMURL.revokeObjectURL(this.images[i].src);
                this.images[i] = null;
                this.done[i] = true;
                this.progress.innerText = "Progress: " + (i - 1) + "/" + this.totalCount;
                if (i == this.totalCount)
                    this.progress.classList.add("complete");
            }
        }
    }
    DrawQ.DOMURL = window.URL || window["webkitURL"] || window;
    let rand = new RNG_1.RNG();
    let r = null;
    let GLOBAL_FAST = true;
    function main(W, H, smooth) {
        // const GLOBAL_FAST = true
        GLOBAL_FAST = !smooth;
        //const W = 1024, H = 600;
        var mainCanvas = document.getElementById('canvas2');
        mainCanvas.width = W;
        mainCanvas.height = H;
        var mainCtx = mainCanvas.getContext('2d');
        // Currently filters must be manually placed.
        let defs = `<defs>
  <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="${H / 160}" />
  </filter>
  <filter id="blur_2" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="${H / 320}" />
  </filter>
  <filter id="blur_20" x="-20%" y="-20%" width="140%" height="170%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="${H / 100}" />
  </filter>
    <radialGradient id="white_cloud"
      cx="50%" cy="50%" r="50%" >
      <stop offset="0%" stop-color="white" />
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
        r = new S.SVGRoot(W, H);
        r.defExtra = defs;
        S.SVGReset();
        makeBackground(W, H);
        // console.log(r.toSVG())
        // drawAppend(r.toSVG())
        let plantCountScale = (W / H * 2 / 3);
        let N1 = Math.floor(rand.nextInt(7, 12) * plantCountScale) || 1, N2 = Math.floor(rand.nextInt(15, 23) * plantCountScale) || 1;
        let dq = new DrawQ(mainCtx, N1 + N2);
        dq.drawOnCanvas(r.toSVG());
        if (rand.chance(.5)) {
            let spec = new PSpec(rand, H * (.75 + rand.nextDouble() * .25));
            let n = N1;
            let dx = W / n;
            let arr = [...Array(n).keys()];
            rand.shuffle(arr);
            for (let i = 0; i < n; i++) {
                let pos = arr[i];
                r.children = [];
                makePlant(spec, pos * dx + (1 + rand.nextDouble()) * dx / 2, H * .85 + (i / n) * H * .1);
                let svgml = r.toSVG();
                dq.drawOnCanvas(svgml);
            }
            // main(spec, 2*W/3, H * .75)
            spec = new PSpec(rand, H * (.3 + rand.nextDouble() * .4));
            n = N2;
            dx = W / n;
            arr = [...Array(n).keys()];
            rand.shuffle(arr);
            for (let i = 0; i < n; i++) {
                let pos = arr[i];
                r.children = [];
                makePlant(spec, pos * dx + (1 + rand.nextDouble()) * dx / 2, H * .9 + (i / n) * H * .1);
                let svgml = r.toSVG();
                dq.drawOnCanvas(svgml);
            }
        }
        else {
            // let n = N1
            let dx = W / N1;
            let arr = [...Array(N1).keys()];
            rand.shuffle(arr);
            var spec;
            for (let i = 0; i < N1; i++) {
                let pos = arr[i];
                if (i % 3 == 0)
                    spec = new PSpec(rand, H * (.75 + rand.nextDouble() * .25));
                r.children = [];
                makePlant(spec, pos * dx + (1 + rand.nextDouble()) * dx / 2, H * .85 + (i / N1) * H * .1);
                dq.drawOnCanvas(r.toSVG());
            }
            // main(spec, 2*W/3, H * .75)
            // n = N2
            dx = W / N2;
            arr = [...Array(N2).keys()];
            rand.shuffle(arr);
            for (let i = 0; i < N2; i++) {
                let pos = arr[i];
                if (i % 2 == 0)
                    spec = new PSpec(rand, H * (.3 + rand.nextDouble() * .4));
                r.children = [];
                makePlant(spec, pos * dx + (1 + rand.nextDouble()) * dx / 2, H * .9 + (i / N2) * H * .1);
                dq.drawOnCanvas(r.toSVG());
            }
        }
        // Bottom grass
        {
            let grassCol = mycolor_1.hsbToRGB(.3, 1, .25).toHex();
            r.children = [];
            let GN = 180;
            let gw = W * 1. / GN;
            let gl = H * .005;
            for (let i = 0; i < GN; i++) {
                let [sp, sh] = geom_utils_1.makeShell(
                // gl, gl, gl,
                gl * rand.range(1, 8), gl * rand.range(1, 8), gl * rand.range(1, 8), 0, rand.nextDouble() * PI / 6 * rand.pick([1, -1]), rand.nextDouble() * PI / 6 * rand.pick([1, -1]), gw * i, H, gw * 1.2, gw * .6, gw * .5, false);
                let shs = sh.toPath();
                // shs.fill = hsbToRGB(.3, 1, rand.range(.1, .2)).toHex()
                shs.fill = grassCol;
                // shs.strokeColor = "black"
                r.add(shs);
            }
            r.opacity = .7;
            // r.filter = "blur_2"
            dq.drawOnCanvas(r.toSVG());
        }
    }
    main(1200, 800, false);
    window["make_all_flowers"] = main;
});
