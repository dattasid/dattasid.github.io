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
            s += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"" + this.w + "\" height=\"" + this.h + "\"";
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
define("fish", ["require", "exports", "mycolor", "SVG", "RNG"], function (require, exports, mycolor_1, SVG_1, RNG_1) {
    "use strict";
    exports.__esModule = true;
    function makeFishes(rand, bdCol, finCol, bdHue) {
        var g = new SVG_1.SVGGroup();
        var FishType;
        (function (FishType) {
            FishType[FishType["SQ"] = 0] = "SQ";
            FishType[FishType["TRI"] = 1] = "TRI";
            FishType[FishType["CIRC"] = 2] = "CIRC";
            FishType[FishType["MIN"] = 3] = "MIN";
        })(FishType || (FishType = {}));
        var fishType = rand.pick([FishType.TRI, FishType.SQ, FishType.CIRC, FishType.MIN]);
        if (1)
            fishType = FishType.MIN;
        var bd = new SVG_1.SVGGroup();
        if (fishType == FishType.MIN) {
            var hue = rand.nextDouble();
            var finHue = hue + rand.range(-.2, .2);
            finCol = mycolor_1.hsbToRGB(finHue, .7, .6).toHex();
            var finColDark = mycolor_1.hsbToRGB(finHue, .7, .4).toHex();
            bdCol = mycolor_1.hsbToRGB(hue, .7, .6).toHex();
            var bdColDark = mycolor_1.hsbToRGB(hue, .7, .3).toHex();
            var bdw = rand.range(.5, .9);
            var bdh = rand.range(.1, .6);
            var b1_1 = new SVG_1.Rect(0, 0, bdw, bdh);
            b1_1.fill = bdCol;
            bd.add(b1_1);
            var bbx = -bdw / 4 + rand.range(-bdw / 8, bdw / 8);
            var bby = bdh / 4 + rand.range(-bdh / 8, bdh / 8);
            b1_1 = new SVG_1.Rect(bbx, bby, bdw + bdw / 2, bdh / 2);
            b1_1.fill = bdCol;
            bd.add(b1_1);
            if (rand.nextDouble() > .7) {
                var stripes = SVG_1.makeStripedRect(0, 0, bdw, bdh, rand.nextInt(2, 5), rand.range(.5, 1), rand.nextDouble() > .5);
                stripes.fill = mycolor_1.hsbToRGB(hue + rand.range(-.2, .2), rand.pick([0, .7]), rand.range(.1, .7)).toHex();
                stripes.opacity = rand.range(.5, .9);
                bd.add(stripes);
            }
            var maxx = bbx + bdw + bdw / 2;
            for (var i = 0; i < 4; i++) {
                var x1 = rand.range(0, bdw - bdw / 2);
                var w1 = rand.range(bdw / 4, bdw / 2);
                var y1 = rand.range(-bdh / 8, bdh / 2 + bdh / 8);
                b1_1 = new SVG_1.Rect(x1, y1, w1, rand.range(bdh / 4, bdh / 2));
                b1_1.fill = mycolor_1.hsbToRGB(hue, .7, .6 + rand.range(-.2, .2)).toHex();
                b1_1.opacity = rand.range(.4, .9);
                bd.add(b1_1);
                if (x1 + w1 > maxx)
                    maxx = x1 + w1;
            }
            var tlw = rand.range(.1, .4);
            var fn = new SVG_1.Rect(maxx, bdh / 8, tlw, bdh * 3 / 4);
            fn.fill = finCol;
            bd.add(fn);
            var shd = new SVG_1.Rect(0, bdh * .8, bdw, bdh * .2);
            shd.fill = "#000";
            shd.opacity = .5;
            bd.add(shd);
        }
        else if (fishType == FishType.CIRC) {
            var bdw = rand.range(.5, .9);
            var fn = new SVG_1.Circ(.5, 0, .5, .4);
            fn.fill = bdCol;
            bd.add(fn);
            var b1_2 = new SVG_1.Circ(bdw / 2, 0, bdw / 2, bdw / 2 * .6);
            b1_2.fill = finCol;
            bd.add(b1_2);
            bd.add(new SVG_1.Circ(.2, 0, .05));
        }
        else {
            var b1;
            switch (fishType) {
                case FishType.SQ:
                    b1 = new SVG_1.Rect(0, 0, 1, 1);
                    break;
                case FishType.TRI:
                    b1 = makeTri(0, 0, 0, 1, 1, 0);
                    break;
            }
            b1.fill = bdCol;
            bd.add(b1);
            if (fishType == FishType.SQ) {
                var fh = .05 + rand.nextDouble() * .4;
                var fw = .05 + rand.nextDouble() * .5;
                var dfw = .5 + rand.nextDouble() * .5;
                var dfh = .5 + rand.nextDouble() * .5;
                var nFin = rand.nextInt(1, 5);
                for (var y = 0, i = 0; y < 1 && i < nFin; i++) {
                    var w = fw;
                    if (y + w > 1)
                        w = 1 - y;
                    var fin = new SVG_1.Rect(1, y, fh, w);
                    fin.fill = finCol;
                    bd.add(fin);
                    y += fw * 2;
                    fw *= dfw;
                    fh *= dfh;
                    if (fw < .01 || fh < .01)
                        break;
                }
            }
            var hlw = rand.nextDouble() * .4;
            var hlh = rand.nextDouble() * .4;
            var tlw = .3 + rand.nextDouble() * .4;
            var tx = .85, ty = .85;
            switch (fishType) {
                case FishType.SQ:
                    tx = ty = .85;
                    break;
                case FishType.TRI:
                    tx = ty = .4;
                    break;
            }
            var tl = makeTri(tx, ty, tx + tlw, ty, tx, ty + tlw);
            tl.fill = finCol;
            bd.add(tl);
            bd.add(new SVG_1.Rect(.1, .1, .1, .1));
        }
        var fishes = new SVG_1.SVGGroup();
        var FISHSZ = rand.range(10, 40);
        var ang = rand.range(0, 20);
        var count = rand.range(12, 20);
        if (fishType == FishType.MIN) {
            FISHSZ = rand.range(10, 20) * 3;
            ang = 0;
        }
        else if (fishType != FishType.CIRC) {
            ang += 45;
        }
        else {
            FISHSZ = rand.range(50, 80);
            count = rand.range(2, 5);
        }
        var xgap = rand.range(.6, 1);
        for (var i = 0; i < count; i++) {
            var ths = new SVG_1.ShapeRef(bd);
            ths.translate(+i * FISHSZ * xgap, i == 0 ? 0 : (0 + (rand.nextDouble() * 3 - 1.5) * FISHSZ));
            ths.rotate(-ang);
            if (i == 0)
                ths.scale(FISHSZ);
            else
                ths.scale(FISHSZ * Math.pow(.98, i) * (rand.range(.2, 1)));
            fishes.add(ths);
        }
        fishes.children.reverse();
        return fishes;
    }
    function makeTri(x1, y1, x2, y2, x3, y3) {
        var p = new SVG_1.CPoly();
        p.add(x1, y1);
        p.add(x2, y2);
        p.add(x3, y3);
        return p;
    }
    function makeSky(W, H) {
        var r = new SVG_1.Rect(0, 0, W, H * .66);
        var lg = new SVG_1.LinearGradient(0, 0, 0, 1);
        lg.addStop(0, mycolor_1.hsbToRGB(.6, .6, .7).toHex());
        lg.addStop(100, mycolor_1.hsbToRGB(.6, .3, 0).toHex());
        r.fill = lg;
        return r;
    }
    function makeGroundBack(W, H) {
        var r = new SVG_1.Rect(0, H * .66, W, H * .34);
        var lg = new SVG_1.LinearGradient(0, 0, 0, 1);
        lg.addStop(0, mycolor_1.hsbToRGB(.6, .3, 0).toHex());
        lg.addStop(100, mycolor_1.hsbToRGB(.6, .3, .05).toHex());
        r.fill = lg;
        return r;
    }
    function makeLightRay(W, H, rand) {
        var rw = rand.range(20, 40);
        var r = new SVG_1.Rect(0, 0, rw, H * rand.range(.66, .8));
        var lg = new SVG_1.LinearGradient(0, 0, 0, 1);
        lg.addStop(0, "white", .5);
        lg.addStop(.2, "white", .1);
        lg.addStop(1, "white", 0);
        var rays = new SVG_1.SVGGroup();
        var ang, xstart;
        if (rand.pick([0, 1])) {
            ang = 30 + rand.range(-10, 10);
            xstart = W * (rand.range(.6, .8));
        }
        else {
            ang = -30 - rand.range(.10, 10);
            xstart = W * (rand.range(.2, .4));
        }
        for (var i = 0; i < 3; i++) {
            var rf = new SVG_1.ShapeRef(r);
            rf.translate(xstart + i * rw * 2, -30);
            rf.rotate(ang);
            rf.scale(rand.range(1, 1.5), rand.range(.8, 1.2));
            rf.fill = lg;
            rays.add(rf);
        }
        return rays;
    }
    function makeWaterTop(W, H, rand) {
        var g = new SVG_1.SVGGroup();
        var w = W * rand.pick([
            rand.range(.02, .1),
            rand.range(.1, .8)
        ]);
        var count = 20 * W / w;
        var topHt = H * .15;
        for (var y = 0; y < topHt; y += 5)
            for (var x = -W * .1; x < W * 1.2 - w / 2; x += w * .7) {
                var r = new SVG_1.Rect(x + rand.range(-.5, .5) * w, y + rand.range(-2, 2), w, 5);
                r.fill = mycolor_1.hsbToRGB(.6, .6, rand.range(.2, .7)).toHex();
                r.opacity = 1 - y / topHt;
                if (r.opacity < 0)
                    break;
                g.add(r);
            }
        return g;
    }
    function makeSmallWeed(W, H, rand, pHue) {
        var g = new SVG_1.SVGGroup();
        var dark = mycolor_1.hsbToRGB(.3 + rand.range(0, .2), .7, .2).toHex();
        var w = rand.range(.05, .5);
        var h = rand.range(.5, 1.5);
        var w1 = w;
        var h1 = h;
        var base = 0;
        for (var j = 0; j < 3; j++) {
            for (var i = 0; i < 3; i++) {
                var x = w1 * (-1.5 * (j + 1) + (i * (j + 1)) * 1.5 + rand.range(-.2, .2));
                var y = h * rand.range(-.1, .2) + base;
                var r = new SVG_1.Rect(x, y, w, h);
                r.fill = dark;
                g.add(r);
            }
            base -= h * 1.1;
            w *= .7;
            h *= .7;
        }
        return g;
    }
    function makeSmallWeedBed(W, H, rand, pHue) {
        var g = makeSmallWeed(W, H, rand, pHue);
        g.translate(300, 550);
        g.scale(20);
        return g;
    }
    function makeWeedBed2(W, H, rand, pHue) {
        var w = rand.range(5, 20);
        var g = new SVG_1.SVGGroup();
        pHue = .3 + rand.range(0, .2);
        var dark = mycolor_1.hsbToRGB(pHue, .5, .01).toHex();
        for (var x = 0; x < W; x += w) {
            var h = rand.range(200, 300);
            var leaf = new SVG_1.Rect(x, H - h, w + 1, h);
            leaf.fill = dark;
            g.add(leaf);
        }
        dark = mycolor_1.hsbToRGB(pHue, .5, .1).toHex();
        var brt = mycolor_1.hsbToRGB(pHue, .5, .2).toHex();
        var darker = mycolor_1.hsbToRGB(pHue, .5, .05).toHex();
        for (var x = 0; x < W; x += w) {
            var h = rand.range(100, 200);
            var leaf = new SVG_1.Rect(x, H - h, w + 2, h);
            leaf.fill = dark;
            g.add(leaf);
            if (true) {
                var num = 4;
                for (var hlct = 0; hlct < num; hlct++) {
                    if (rand.nextDouble() > .7)
                        continue;
                    var hl = new SVG_1.Rect(x + hlct * w / num, H - h - h / 9 * rand.nextDouble(), w / num + 2, h / 10 * (1 + 4 * rand.nextDouble()));
                    hl.fill = brt;
                    g.add(hl);
                }
                for (var hlct = 0; hlct < num; hlct++) {
                    var h1 = h / 10 * (1 + 6 * rand.nextDouble());
                    var hl = new SVG_1.Rect(x + hlct * w / num, H - h1, w / num + 2, h1);
                    hl.fill = darker;
                    g.add(hl);
                }
            }
            for (var j = 0; j < rand.range(0, 3); j++) {
                var hor = new SVG_1.Rect(x - w * 3, H - h + rand.range(0, .5) * h, w * 4, h / 16);
                hor.fill = darker;
                hor.opacity = .5;
                g.add(hor);
            }
        }
        return g;
    }
    function makeVertWeed(W, H, rand, hue, maxBrt, isBack) {
        var X = rand.range(100, 700);
        var g = new SVG_1.SVGGroup();
        var segH = 40;
        var N = 5;
        var LEAF_H = 15;
        var LEAF_W = 50;
        for (var y = 0; y < H; y += segH, X += rand.range(-5, 5)) {
            var b = maxBrt * (H - y) / H;
            var dark = mycolor_1.hsbToRGB(hue, .7, b).toHex();
            var darker = mycolor_1.hsbToRGB(hue, .7, b / 2).toHex();
            var stem = new SVG_1.Rect(X, y, 5, segH);
            stem.fill = isBack ? darker : dark;
            g.add(stem);
            var x1 = X + rand.range(-5, -15);
            var y1 = y;
            var w = LEAF_W;
            var h = LEAF_H;
            for (var j = 0; j < 3; j++) {
                var leaf = new SVG_1.Rect(x1, y1, w, h);
                leaf.fill = isBack ? darker : dark;
                leaf.opacity = 1;
                g.add(leaf);
                if (!isBack) {
                    var hh = rand.range(.2, .4) * h;
                    leaf = new SVG_1.Rect(x1, y1 + (h - hh), w, hh);
                    leaf.fill = darker;
                    leaf.opacity = 1;
                    g.add(leaf);
                }
                x1 += w - rand.range(0, w / 4);
                y1 += rand.range(-h / 4, h / 4);
                w *= .7;
                h *= .7;
            }
        }
        return g;
    }
    function makeCoral(W, H, rand) {
        var hue = rand.nextDouble();
        var g = new SVG_1.SVGGroup();
        var x = rand.range(0, W * .66), y = H * rand.range(.75, .85);
        var w = rand.range(0, W - x), h = (H - y);
        if (w < W / 3)
            w = W / 3;
        if (x + w > W)
            w = W - x;
        var r = new SVG_1.Rect(x, y, w, h);
        r.fill = mycolor_1.hsbToRGB(hue, .6, .4).toHex();
        g.add(r);
        var NX = rand.range(5, 15), NY = rand.range(7, 15);
        if (NX < w * 25 / W)
            NX = w * 25 / W;
        var dw = w / NX, dh = h / NY;
        var grid = [];
        var dw1 = dw, xcopy = x;
        for (var yi = 0; yi < NY; yi++) {
            for (var xi = 0; xi < NX; xi++) {
                if (yi < 2 && rand.nextDouble() < .25)
                    continue;
                var cell_1 = new SVG_1.SVGGroup();
                var rw = rand.nextDouble() * dw1 / 4;
                var rh = rand.nextDouble() * dh / 4;
                var x1 = xcopy + dw1 * xi - rw;
                var y1 = y + dh * yi - rh;
                var cellback = new SVG_1.Rect(x1, y1, dw1 + 2 * rw, dh + 2 * rh);
                cellback.fill = mycolor_1.hsbToRGB(hue, .6 + rand.range(0, .2), rand.range(.3, .4) * (1 - yi / NY)).toHex();
                cell_1.add(cellback);
                var choice = rand.nextInt(1, 3);
                switch (choice) {
                    case 1:
                    case 2:
                        {
                            var NB = rand.nextInt(2, 6) + rand.nextInt(2, 6);
                            var dh1 = (dh + 2 * rh);
                            var ht = dh1 * rand.range(1, 3);
                            var s = SVG_1.makeStripedRect(x1, y1 + dh1 - ht, dw1 + 2 * rw, ht, NB, rand.range(.3, .8), true);
                            for (var _i = 0, _a = s.children; _i < _a.length; _i++) {
                                var r_1 = _a[_i];
                                var rct = r_1;
                                var dh11 = rct.h * rand.range(.8, 1.5);
                                rct.y -= (dh11 - rct.h);
                                rct.h = dh11;
                            }
                            s.fill = mycolor_1.hsbToRGB(hue + rand.range(-.3, .3), .8 + rand.range(0, .1), rand.range(.3, .4) * (1 - (yi + 1) / NY)).toHex();
                            cell_1.add(s);
                        }
                        break;
                    case 3:
                        {
                            var NB = rand.nextInt(3, 5) + rand.nextInt(2, 3);
                            var dh1 = (dh + 2 * rh);
                            var ht = dh1 * rand.range(1, 3);
                            var s = SVG_1.makeStripedRect(x1, y1 - (ht - dh1), dw1 + 2 * rw, ht, NB, rand.range(.2, .8), false);
                            for (var _b = 0, _c = s.children; _b < _c.length; _b++) {
                                var r_2 = _c[_b];
                                var rct = r_2;
                                var neww = rct.w * rand.range(.8, 1.5);
                                rct.x -= (neww - rct.w) / 2;
                                rct.w = neww;
                            }
                            s.fill = mycolor_1.hsbToRGB(hue + rand.range(-.3, .3), .8 + rand.range(0, .1), rand.range(.3, .4) * (1 - (yi + 1) / NY)).toHex();
                            cell_1.add(s);
                        }
                        break;
                    case 4: break;
                }
                grid.push(cell_1);
            }
            dw1 = dw * rand.range(.9, 1.5);
            xcopy = x - (dw1 - dw) * NX / 2;
        }
        rand.shuffle(grid);
        for (var _d = 0, grid_1 = grid; _d < grid_1.length; _d++) {
            var cell = grid_1[_d];
            g.add(cell);
        }
        return g;
    }
    function main() {
        var rand = new RNG_1.RNG(Math.random() * 99999999);
        SVG_1.SVGReset();
        var W = 1000, H = 600;
        var r = new SVG_1.SVGRoot(W, H);
        var sky = makeSky(W, H);
        r.add(sky);
        var ground = makeGroundBack(W, H);
        r.add(ground);
        var top = makeWaterTop(W, H, rand);
        r.add(top);
        var hue = rand.nextDouble();
        var bdCol = mycolor_1.hsbToRGB(hue, .5, .8).toHex();
        var finCol = mycolor_1.hsbToRGB(hue + .1, .3, .8).toHex();
        var hlCol = mycolor_1.hsbToRGB(hue, .7, .7).toHex();
        var coral = makeCoral(W, H, rand);
        r.add(coral);
        var NSHOAL = rand.nextInt(1, 3);
        for (var i = 0; i < NSHOAL; i++) {
            var fishBack_1 = rand.nextDouble() < .5;
            var fishes_1 = makeFishes(rand, bdCol, finCol, hue);
            if (fishBack_1)
                fishes_1.translate(rand.range(W * .75, W * .95), rand.range(H * .3, H * .5));
            else
                fishes_1.translate(rand.range(W * .05, W * .3), rand.range(H * .5, H * .7));
            var fscl = rand.range(.5, .7);
            for (var j = 0; j < (NSHOAL - i - 1); j++)
                fscl *= fscl;
            fishes_1.scale(fishBack_1 ? -fscl : fscl, fscl);
            r.add(fishes_1);
        }
        var fishes = makeFishes(rand, bdCol, finCol, hue);
        var fishBack = rand.nextDouble() < .5;
        if (fishBack)
            fishes.translate(rand.range(W * .75, W * .95), rand.range(H * .3, H * .5));
        else
            fishes.translate(rand.range(W * .05, W * .3), rand.range(H * .5, H * .7));
        fishes.scale(fishBack ? -1 : 1, 1);
        r.add(fishes);
        if (rand.nextDouble() < .8) {
            var ray = makeLightRay(W, H, rand);
            r.add(ray);
        }
        addToDoc(r);
    }
    function makePlant(rand) {
        var x = 400, y = 400;
        var lw = rand.nextDouble() * 20 + 10;
        var lh = rand.nextDouble() * 50 + 10;
        var w = Math.min(lw, lh) * 2, h = lh / 2;
        var p = new SVG_1.SVGGroup();
        var rHue = rand.nextDouble();
        var col1 = mycolor_1.hsbToRGB(rHue, .7, .5).toHex();
        var brt = mycolor_1.hsbToRGB(rHue, .9, .7).toHex();
        var dark = mycolor_1.hsbToRGB(rHue, .7, .2).toHex();
        var gap = 5;
        var dscl = rand.range(.2, .9);
        var vary = rand.range(0, 2);
        for (var i = 0; i < 5; i++) {
            var scl = void 0, lx = void 0, ly = void 0;
            if (i == 0) {
                scl = 1;
                lx = x + .5 * w;
                ly = y + h;
            }
            else {
                scl = rand.range(.3, .6);
                lx = x + rand.nextDouble() * w;
                ly = y + rand.nextDouble() * h;
            }
            var tcol = rand.pick([col1, brt, dark]);
            for (var j = 0; j < 5; j++) {
                if (i > 0 || j > 0) {
                    var lf = new SVG_1.Rect(lx - lw * scl / 2 + lw * scl * vary * (j == 0 ? 0 : (j % 2 ? -.5 : .5)), ly, lw * scl, lh * scl);
                    lf.fill = tcol;
                    p.add(lf);
                }
                scl *= dscl;
                ly -= (lh * scl + gap);
                if (scl < .1)
                    break;
            }
        }
        return p;
    }
    function makeRock(rand) {
        var x = 400, y = 400;
        var w = 200, h = 300;
        var rHue = rand.nextDouble();
        var col1 = mycolor_1.hsbToRGB(rHue, .3, .5).toHex();
        var brt = mycolor_1.hsbToRGB(rHue, .5, .7).toHex();
        var dark = mycolor_1.hsbToRGB(rHue, .3, .2).toHex();
        var r = new SVG_1.SVGGroup();
        var c1 = new SVG_1.Rect(x, y, w, h);
        c1.fill = col1;
        r.add(c1);
        for (var i = 0; i < 10; i++) {
            var rw = w * rand.range(.2, .4);
            var rh = h * rand.range(.2, .4);
            var c2 = new SVG_1.Rect(x + (w * rand.range(-.05, 1.05)), y + (h * rand.range(-.05, 1.0)), rw, rh);
            c2.fill = dark;
            r.add(c2);
        }
        return r;
    }
    function addToDoc(r) {
        var svgml = r.toSVG();
        console.log(svgml.length);
        drawOnCanvas(svgml);
        setupSVGSave(svgml);
    }
    var f = main;
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
    main();
});
