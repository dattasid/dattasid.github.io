var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("RNG", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var RNG = (function () {
        function RNG(seed) {
            this.seed = seed;
        }
        RNG.prototype.next = function (min, max) {
            max = max || 0;
            min = min || 0;
            this.seed = (this.seed * 9301 + 49297) % 233280;
            var rnd = this.seed / 233280;
            return min + rnd * (max - min);
        };
        RNG.prototype.nextInt = function (min, max) {
            return Math.round(this.next(min, max));
        };
        RNG.prototype.nextDouble = function () {
            return this.next(0, 1);
        };
        RNG.prototype.range = function (a, b) {
            return this.next(a, b);
        };
        RNG.prototype.pick = function (collection) {
            return collection[this.nextInt(0, collection.length - 1)];
        };
        RNG.prototype.shuffle = function (arr) {
            for (var i = 0; i < arr.length; i++) {
                var j = this.nextInt(0, arr.length - 1);
                _a = [arr[j], arr[i]], arr[i] = _a[0], arr[j] = _a[1];
            }
            var _a;
        };
        return RNG;
    }());
    exports.RNG = RNG;
});
define("SVG", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    function SVGReset() {
        Shape.resetId();
        LinearGradient.resetId();
    }
    exports.SVGReset = SVGReset;
    var Stop = (function () {
        function Stop(offset, col, opacity) {
            if (opacity === void 0) { opacity = undefined; }
            this.opacity = undefined;
            this.offset = offset;
            this.col = col;
            this.opacity = opacity;
        }
        Stop.prototype.toSVG = function () {
            return "<stop stop-color=\"" + this.col + "\""
                + ((this.opacity != undefined) ? " stop-opacity=\"" + this.opacity + "\"" : "")
                + " offset=\"" + this.offset + "\"/>";
        };
        return Stop;
    }());
    exports.Stop = Stop;
    var Grad = (function () {
        function Grad() {
            this.stops = [];
            this.isUserSpace = false;
            this.nm = "unnamed";
        }
        Grad.prototype.addStop = function (offset, col, opacity) {
            if (opacity === void 0) { opacity = undefined; }
            this.stops.push(new Stop(offset, col, opacity));
        };
        return Grad;
    }());
    exports.Grad = Grad;
    var LinearGradient = (function (_super) {
        __extends(LinearGradient, _super);
        function LinearGradient(x1, y1, x2, y2) {
            var _this = _super.call(this) || this;
            _this.nm = "LG" + LinearGradient.id;
            LinearGradient.id++;
            _this.x1 = x1;
            _this.y1 = y1;
            _this.x2 = x2;
            _this.y2 = y2;
            return _this;
        }
        LinearGradient.prototype.copy = function () {
            var lg = new LinearGradient(this.x1, this.y1, this.x2, this.y2);
            lg.stops = this.stops;
            lg.isUserSpace = this.isUserSpace;
            return lg;
        };
        LinearGradient.resetId = function () {
            LinearGradient.id = 0;
        };
        LinearGradient.prototype.toSVG = function () {
            return "<linearGradient id=\"" + this.nm + "\" x1=\"" + this.x1 + "\" x2=\"" + this.x2
                + "\" y1=\"" + this.y1 + "\" y2=\"" + this.y2 + "\"" + (this.isUserSpace ? " gradientUnits=\"userSpaceOnUse\"" : "") + ">\n"
                + this.stops.map(function (x) { return x.toSVG(); }).join("\n")
                + "\n</linearGradient>";
        };
        return LinearGradient;
    }(Grad));
    LinearGradient.id = 1;
    exports.LinearGradient = LinearGradient;
    var Shape = (function () {
        function Shape() {
            this.cls = undefined;
            this.trans = "";
            this.fill = undefined;
            this.filter = undefined;
            this.opacity = undefined;
            this.refName = undefined;
            this.nm = "SHP" + Shape.id;
            Shape.id++;
        }
        Shape.resetId = function () {
            Shape.id = 0;
        };
        Shape.prototype.toSVGSub = function () {
            var isFillGrad = (this.fill instanceof Grad);
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
        };
        Shape.prototype.setClip = function (shp) {
            if (shp == null) {
                this.clip = undefined;
                return;
            }
            this.clip = new Clip(shp);
        };
        Shape.prototype.collectDefs = function (clips, shrefs, grads) {
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
        };
        Shape.prototype.translate = function (x, y) {
            if (y === void 0) { y = undefined; }
            this.trans += "translate(" + x + " " + (y ? y : "") + ") ";
        };
        Shape.prototype.rotate = function (a, x, y) {
            if (x === void 0) { x = undefined; }
            if (y === void 0) { y = undefined; }
            this.trans += "rotate(" + a + " " + (x ? x : "") + " " + (x ? y : "") + ") ";
        };
        Shape.prototype.scale = function (x, y) {
            if (y === void 0) { y = undefined; }
            this.trans += "scale(" + x + " " + (y ? y : "") + ") ";
        };
        return Shape;
    }());
    Shape.id = 1;
    exports.Shape = Shape;
    var Clip = (function () {
        function Clip(ref) {
            this.nm = "CC" + Clip.id1;
            Clip.id1++;
            this.ref = ref;
        }
        Clip.prototype.toSVG = function () {
            var rf = new ShapeRef(this.ref);
            rf.nm = null;
            var s = "";
            s += "<clipPath id=\"" + this.nm + "\">\n";
            var cren = [];
            Clip.collectChildren(this.ref, cren);
            cren.forEach(function (c) { rf.ref = c; s += rf.toSVG(); });
            s += "\n</clipPath>\n";
            return s;
        };
        Clip.collectChildren = function (s, names) {
            var _this = this;
            if (s instanceof SVGGroup) {
                s.children.forEach(function (c) { return _this.collectChildren(c, names); });
            }
            else
                names.push(s);
        };
        return Clip;
    }());
    Clip.id1 = 1;
    exports.Clip = Clip;
    var SVGGroup = (function (_super) {
        __extends(SVGGroup, _super);
        function SVGGroup() {
            var _this = _super.call(this) || this;
            _this.children = [];
            return _this;
        }
        SVGGroup.prototype.add = function (child) {
            this.children.push(child);
        };
        SVGGroup.prototype.collectDefs = function (clips, shrefs, grads) {
            _super.prototype.collectDefs.call(this, clips, shrefs, grads);
            this.children.forEach(function (x) { return x.collectDefs(clips, shrefs, grads); });
        };
        SVGGroup.prototype.toSVG = function () {
            var s = "<g " + this.toSVGSub() + ">\n";
            this.children.forEach(function (element) {
                s += element.toSVG() + "\n";
            });
            s += "</g>";
            return s;
        };
        return SVGGroup;
    }(Shape));
    exports.SVGGroup = SVGGroup;
    var SVGRoot = (function (_super) {
        __extends(SVGRoot, _super);
        function SVGRoot(w, h) {
            var _this = _super.call(this) || this;
            _this.w = w;
            _this.h = h;
            return _this;
        }
        SVGRoot.prototype.toSVG = function () {
            var clips = {};
            var shrefs = {};
            var grads = {};
            this.collectDefs(clips, shrefs, grads);
            var s = "";
            s += "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + this.w + "\" height=\"" + this.h + "\"";
            if (this.id)
                s += " id=\"" + this.id + "\"";
            s += ">\n";
            s += "<defs>\n";
            if (this.defExtra)
                s += this.defExtra + "\n";
            if (Object.keys(grads).length > 0) {
                Object.keys(grads).forEach(function (nm) { s += grads[nm].toSVG() + "\n"; });
            }
            if (Object.keys(shrefs).length > 0) {
                Object.keys(shrefs).forEach(function (nm) { s += shrefs[nm].toSVG() + "\n"; });
            }
            s += "\n";
            if (Object.keys(clips).length > 0) {
                Object.keys(clips).forEach(function (nm) {
                    s += clips[nm].toSVG() + "\n";
                });
            }
            s += "</defs>\n";
            s += _super.prototype.toSVG.call(this);
            s += "\n</svg>";
            return s;
        };
        return SVGRoot;
    }(SVGGroup));
    exports.SVGRoot = SVGRoot;
    var ShapeRef = (function (_super) {
        __extends(ShapeRef, _super);
        function ShapeRef(ref) {
            var _this = _super.call(this) || this;
            _this.ref = ref;
            return _this;
        }
        ShapeRef.prototype.collectDefs = function (clips, shrefs, grads) {
            _super.prototype.collectDefs.call(this, clips, shrefs, grads);
            shrefs[this.ref.nm] = this.ref;
        };
        ShapeRef.prototype.toSVG = function () {
            return "<use xlink:href=\"#" + this.ref.nm + "\"" + this.toSVGSub() + "/>";
        };
        return ShapeRef;
    }(Shape));
    exports.ShapeRef = ShapeRef;
    var Rect = (function (_super) {
        __extends(Rect, _super);
        function Rect(x, y, w, h, cls) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (w === void 0) { w = 0; }
            if (h === void 0) { h = 0; }
            if (cls === void 0) { cls = undefined; }
            var _this = _super.call(this) || this;
            _this.x = x;
            _this.y = y;
            _this.w = w;
            _this.h = h;
            if (cls && cls.length > 0)
                _this.cls = cls;
            return _this;
        }
        Rect.prototype.toSVG = function () {
            return "<rect x=\"" + this.x + "\" y=\"" + this.y + "\" width=\"" + this.w + "\" height=\"" + this.h + "\" " +
                this.toSVGSub()
                + " />";
        };
        return Rect;
    }(Shape));
    exports.Rect = Rect;
    var Circ = (function (_super) {
        __extends(Circ, _super);
        function Circ(cx, cy, r, r2, cls) {
            if (r2 === void 0) { r2 = undefined; }
            if (cls === void 0) { cls = undefined; }
            var _this = _super.call(this) || this;
            _this.cx = cx;
            _this.cy = cy;
            _this.rx = r;
            _this.ry = r2 ? r2 : r;
            if (cls && cls.length > 0)
                _this.cls = cls;
            return _this;
        }
        Circ.prototype.toSVG = function () {
            return "<ellipse cx=\"" + this.cx + "\" cy=\"" + this.cy + "\" rx=\"" + this.rx + "\" ry=\"" + this.ry + "\" " +
                this.toSVGSub()
                + " />";
        };
        return Circ;
    }(Shape));
    exports.Circ = Circ;
    var Circle = (function (_super) {
        __extends(Circle, _super);
        function Circle(cx, cy, r, cls) {
            if (cx === void 0) { cx = 0; }
            if (cy === void 0) { cy = 0; }
            if (r === void 0) { r = 0; }
            if (cls === void 0) { cls = undefined; }
            var _this = _super.call(this) || this;
            _this.cx = cx;
            _this.cy = cy;
            _this.r = r;
            if (cls && cls.length > 0)
                _this.cls = cls;
            return _this;
        }
        Circle.prototype.toSVG = function () {
            return "<circle cx=\"" + this.cx + "\" cy=\"" + this.cy + "\" r=\"" + this.r + "\" " +
                this.toSVGSub()
                + " />";
        };
        return Circle;
    }(Shape));
    exports.Circle = Circle;
    var CPoly = (function (_super) {
        __extends(CPoly, _super);
        function CPoly() {
            var _this = _super.call(this) || this;
            _this.closed = true;
            _this.x = [];
            _this.y = [];
            return _this;
        }
        CPoly.prototype.add = function (x, y) {
            this.x.push(x);
            this.y.push(y);
        };
        CPoly.prototype.toSVG = function () {
            if (this.x.length == 0)
                return "";
            var s = "<path d=\"";
            s += "M " + this.x[0] + "," + this.y[0] + " ";
            for (var i = 1; i < this.x.length; i++) {
                s += "L " + this.x[i] + "," + this.y[i] + " ";
            }
            if (this.closed)
                s += "Z";
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        };
        CPoly.makeRegPoly = function (n, cx, cy, r, rotDeg) {
            if (cx === void 0) { cx = 0; }
            if (cy === void 0) { cy = 0; }
            if (r === void 0) { r = 1; }
            if (rotDeg === void 0) { rotDeg = -90; }
            var ret = new CPoly();
            var ang = Math.PI * 2 / n;
            var alpha = rotDeg * Math.PI / 180;
            for (var i = 0; i < n; i++) {
                ret.add(cx + r * Math.cos(ang * i + alpha), cy + r * Math.sin(ang * i + alpha));
            }
            return ret;
        };
        return CPoly;
    }(Shape));
    exports.CPoly = CPoly;
    var LineSegs = (function (_super) {
        __extends(LineSegs, _super);
        function LineSegs() {
            var _this = _super.call(this) || this;
            _this.closed = true;
            _this.x1 = [];
            _this.y1 = [];
            _this.x2 = [];
            _this.y2 = [];
            return _this;
        }
        LineSegs.prototype.add = function (x1, y1, x2, y2) {
            this.x1.push(x1);
            this.y1.push(y1);
            this.x2.push(x2);
            this.y2.push(y2);
        };
        LineSegs.prototype.toSVG = function () {
            if (this.x1.length == 0)
                return "";
            var s = "<path d=\"";
            for (var i = 0; i < this.x1.length; i++) {
                s += "M" + this.x1[i] + "," + this.y1[i] +
                    "L" + this.x2[i] + "," + this.y2[i] + " ";
            }
            s += "\" " + this.toSVGSub() + "/>";
            return s;
        };
        return LineSegs;
    }(Shape));
    exports.LineSegs = LineSegs;
    function makeStripedRect(x, y, w, h, N, gapFrac, isVert) {
        var sum = 0;
        for (var i = 0; i < N; i++) {
            if (i > 0)
                sum += gapFrac;
            sum += 1;
        }
        var d = (1 + gapFrac) / sum;
        var g = new SVGGroup();
        if (isVert) {
            var sw = w / sum;
            for (var i = 0; i < N; i++) {
                var x1 = x + i * d * w;
                var r = new Rect(x1, y, sw, h);
                g.add(r);
            }
        }
        else {
            var sh = h / sum;
            for (var i = 0; i < N; i++) {
                var y1 = y + i * d * h;
                var r = new Rect(x, y1, w, sh);
                g.add(r);
            }
        }
        return g;
    }
    exports.makeStripedRect = makeStripedRect;
});
define("mycolor", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var Color = (function () {
        function Color() {
        }
        Color.prototype.normalize = function () {
            this.red = Math.max(0, Math.min(1, this.red));
            this.green = Math.max(0, Math.min(1, this.green));
            this.blue = Math.max(0, Math.min(1, this.blue));
        };
        Color.to2bHex = function (val) {
            var s = ("0" + Math.round(val * 255).toString(16).toUpperCase());
            return s.substr(s.length - 2);
        };
        Color.prototype.toHex = function () {
            this.normalize();
            return "#" + Color.to2bHex(this.red) + Color.to2bHex(this.green) + Color.to2bHex(this.blue);
        };
        return Color;
    }());
    exports.Color = Color;
    function hsbToRGB(hue, saturation, value) {
        hue -= Math.floor(hue);
        hue *= 360;
        hue %= 360;
        saturation = Math.min(Math.max(0, saturation), 1);
        value = Math.min(1, Math.max(0, value));
        var rgb = new Color();
        var i;
        var f, p, q, t;
        if (saturation === 0) {
            rgb.red = value;
            rgb.green = value;
            rgb.blue = value;
            return rgb;
        }
        var h = hue / 60;
        i = Math.floor(h);
        f = h - i;
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
        return rgb;
    }
    exports.hsbToRGB = hsbToRGB;
});
define("rects_div", ["require", "exports", "RNG", "SVG", "mycolor"], function (require, exports, RNG_1, SVG_1, mycolor_1) {
    "use strict";
    exports.__esModule = true;
    var Dir;
    (function (Dir) {
        Dir[Dir["HOR"] = 0] = "HOR";
        Dir[Dir["VERT"] = 1] = "VERT";
    })(Dir || (Dir = {}));
    var RepType;
    (function (RepType) {
        RepType[RepType["NONE"] = 0] = "NONE";
        RepType[RepType["COPY"] = 0] = "COPY";
        RepType[RepType["XFLIP"] = 1] = "XFLIP";
        RepType[RepType["YFLIP"] = 2] = "YFLIP";
    })(RepType || (RepType = {}));
    var RR = (function () {
        function RR() {
            this.source = null;
            this.repeatChildren = false;
            this.repeatType = RepType.COPY;
            this.id = "R";
            this.deco_id = 0;
            this.level = 0;
        }
        RR.prototype.doDiv = function (rand, x, y, w, h, leaves, level, parent, stats, isPartOfPattern, insetPerc, curXFlip, curYFlip, bgHue) {
            if (curXFlip === void 0) { curXFlip = false; }
            if (curYFlip === void 0) { curYFlip = false; }
            if (bgHue === void 0) { bgHue = undefined; }
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            if (stats.breakPattern && level > 2 && this.source && rand.nextDouble() > .8)
                this.source = undefined;
            var isLeaf = false;
            if ((this.source && !this.source.children)
                || (!this.source &&
                    (level > stats.maxLevel || (level > 0 && rand.nextDouble() > .7)))
                || w < 5 || h < 5) {
                isLeaf = true;
            }
            if (this.source) {
                if (!this.source.color && isLeaf)
                    console.log("COLOR NOT FOUND. this:" + this.id + "  source:" + this.source.id);
                this.color = this.source.color;
                this.isHL = this.source.isHL;
                if (this.isHL)
                    stats.numHL++;
            }
            else if (isLeaf || (rand.nextDouble() > .5 && insetPerc > 0)) {
                var hue = rand.nextDouble();
                if (bgHue)
                    hue = bgHue + .5 + rand.range(-.2, .2);
                this.isHL = level > 1 && isPartOfPattern && w < 320 && h < 320
                    && isLeaf && rand.nextDouble() > .7;
                if (this.isHL)
                    stats.numHL++;
                this.color = mycolor_1.hsbToRGB(hue, this.isHL ? .8 : .6, this.isHL ? .8 : isLeaf ? .6 : .3).toHex();
                bgHue = hue;
            }
            if (isLeaf || this.color) {
                if (!(isLeaf && stats.skipChildren > 0 && rand.nextDouble() < stats.skipChildren * level)) {
                    leaves.push(this);
                }
            }
            if (isLeaf)
                return;
            if (this.color) {
                var wi = w * insetPerc;
                var hi = h * insetPerc;
                if (stats.balancedInset)
                    wi = hi = Math.min(wi, hi);
                x += wi;
                y += hi;
                w -= wi * 2;
                h -= hi * 2;
            }
            var nopts = [2];
            if (level < 3)
                nopts.push(3);
            this.divN = this.source ? this.source.divN : rand.pick(nopts);
            {
                var w1 = w, h1 = h;
                if (level > 2 && w > h + 1)
                    w1 *= 2;
                if (level > 2 && h > w + 1)
                    h1 *= 2;
                this.divDir = this.source ? this.source.divDir :
                    (rand.range(0, w1 + h1) > w1 ? Dir.VERT : Dir.HOR);
            }
            if (w + 1 < h && this.divDir == Dir.HOR && !this.source)
                this.divN = 2;
            if (h + 1 < w && this.divDir == Dir.VERT && !this.source)
                this.divN = 2;
            this.children = [];
            var cw = w, ch = h;
            if (this.divDir == Dir.HOR)
                cw = w / this.divN;
            else
                ch = h / this.divN;
            this.repeatChildren = this.source ? this.source.repeatChildren :
                rand.nextDouble() > .5 + level * .2;
            var replType = RepType.NONE;
            if (!this.source && this.repeatChildren)
                replType = rand.pick([RepType.COPY, RepType.XFLIP, RepType.YFLIP]);
            if (this.divDir == Dir.VERT && replType == RepType.XFLIP)
                replType = RepType.YFLIP;
            if (this.divDir == Dir.HOR && replType == RepType.YFLIP)
                replType = RepType.XFLIP;
            if (level < 3)
                console.log(this.id + " divdir " + this.divDir + " flip " + replType);
            if (this.repeatType == RepType.XFLIP)
                curXFlip = !curXFlip;
            if (this.repeatType == RepType.YFLIP)
                curYFlip = !curYFlip;
            if (level < 3 && this.source)
                console.log(this.id + " copying " + this.source.id + " with flip " + this.repeatType +
                    " " + curXFlip + " " + curYFlip);
            var reverseChildren = false;
            if ((curXFlip && this.divDir == Dir.HOR) ||
                (curYFlip && this.divDir == Dir.VERT)) {
                reverseChildren = true;
            }
            var first = undefined;
            for (var i = 0; i < this.divN; i++) {
                var c = new RR();
                c.level = this.level + 1;
                this.children.push(c);
                c.id = this.id + "_" + i;
                c.deco_id = this.deco_id * 10 + i;
                if (i == 0)
                    first = c;
                var cx = x, cy = y;
                if (this.divDir == Dir.HOR)
                    cx = x + cw * i;
                else
                    cy = y + ch * i;
                if (this.source) {
                    var j = i;
                    if (reverseChildren)
                        j = this.source.divN - i - 1;
                    c.source = this.source.children[j];
                    c.deco_id = c.source.deco_id;
                }
                else if (this.repeatChildren && i > 0) {
                    c.source = first;
                    c.repeatType = replType;
                }
                c.doDiv(rand, cx, cy, cw, ch, leaves, level + 1, this, stats, isPartOfPattern || this.repeatChildren, insetPerc, curXFlip, curYFlip, bgHue);
            }
        };
        return RR;
    }());
    var ConfigAndStats = (function () {
        function ConfigAndStats() {
            this.balancedInset = false;
            this.skipChildren = 0;
            this.maxLevel = 4;
            this.breakPattern = true;
            this.numHL = 0;
        }
        return ConfigAndStats;
    }());
    function make() {
        var rand = new RNG_1.RNG(Math.random() * 999999999);
        var leaves = [];
        var insetFixed = 10;
        var insetPerc;
        var count = 0;
        while (true) {
            console.log("-------------------------------");
            leaves = [];
            var stats = new ConfigAndStats();
            insetPerc = rand.pick([0, rand.range(.05, .2)]);
            if (insetPerc > 0)
                stats.balancedInset = rand.nextDouble() > .5;
            if (insetPerc > 0)
                stats.skipChildren = rand.pick([0, 0, rand.nextDouble() * .3]);
            if (rand.nextDouble() < .3) {
                stats.maxLevel = 6;
                insetFixed = 5;
            }
            if (rand.nextDouble() < .3)
                stats.breakPattern = false;
            var root = new RR();
            root.doDiv(rand, 0, 0, 800, 800, leaves, 0, null, stats, false, insetPerc);
            if (leaves.length > 10)
                break;
            count++;
            if (count > 20 && leaves.length > 1)
                break;
        }
        var r = new SVG_1.SVGRoot(800, 800);
        var back = new SVG_1.Rect(0, 0, 800, 800);
        back.fill = "black";
        r.add(back);
        var strokeColor;
        if (insetPerc > 0 && rand.nextDouble() > .3)
            strokeColor = "black";
        var limitedColorsForZeroInset = rand.nextDouble() < .4;
        var colors = [], mainColors = [];
        if (limitedColorsForZeroInset) {
            var hue = rand.nextDouble();
            var numC1 = rand.pick([1, 2, 3]);
            for (var i = 0; i < numC1; i++) {
                colors.push(mycolor_1.hsbToRGB(hue + rand.range(-.2, .2) + .5 * i, .6, .5).toHex());
            }
            var numC2 = rand.pick([1, 2, 3]);
            for (var i = 0; i < numC2; i++) {
                mainColors.push(mycolor_1.hsbToRGB(hue + rand.range(-.2, .2) + .5 * i, .8, .8).toHex());
            }
        }
        for (var _i = 0, leaves_1 = leaves; _i < leaves_1.length; _i++) {
            var l = leaves_1[_i];
            if (insetFixed * 2 > l.w)
                continue;
            var box = new SVG_1.Rect(l.x + insetFixed, l.y + insetFixed, l.w - insetFixed * 2, l.h - insetFixed * 2);
            box.fill = l.color;
            if (insetPerc == 0 && limitedColorsForZeroInset) {
                box.fill = colors[l.deco_id % colors.length];
                if (l.isHL)
                    box.fill = mainColors[l.deco_id % mainColors.length];
            }
            if (strokeColor) {
                box.strokeColor = strokeColor;
                box.strokeWidth = 3 - 2 * l.level / 10;
            }
            r.add(box);
        }
        addToDoc(r);
    }
    function addToDoc(r) {
        var svgml = r.toSVG();
        console.log(svgml.length);
        drawOnCanvas(svgml);
        setupSVGSave(svgml);
    }
    var f = make;
    f();
    var intv = setInterval(f, 3000);
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
            return false;
        }
    }, true);
});
