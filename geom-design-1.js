define("RNG", ["require", "exports"], function (require, exports) {
    "use strict";
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
    }
    exports.RNG = RNG;
});
define("mycolor", ["require", "exports"], function (require, exports) {
    "use strict";
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
define("geom-design-1", ["require", "exports", "RNG", "mycolor"], function (require, exports, RNG_1, mycolor_1) {
    "use strict";
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
        toSVG() {
            return "<linearGradient id=\"" + this.nm + "\" x1=\"" + this.x1 + "\" x2=\"" + this.x2
                + "\" y1=\"" + this.y1 + "\" y2=\"" + this.y2 + "\">\n"
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
        }
        toSVGSub() {
            return (this.cls ? (" class=\"" + this.cls + "\"") : "")
                + (this.trans.length > 0 ? (" transform=\"" + this.trans + "\"") : "")
                + (this.fill ? (" fill=\"" + this.fill + "\"") : "")
                + (this.filter ? (" filter=\"url(#" + this.filter + ")\"") : "")
                + (this.opacity ? (" fill-opacity=\"" + this.opacity + "\"") : "");
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
    }
    class CPoly extends Shape {
        constructor() {
            super();
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
            s += "Z\" " + this.toSVGSub() + "/>";
            return s;
        }
        static makeRegPoly(n, cx = 0, cy = 0, r = 1) {
            let ret = new CPoly();
            let ang = Math.PI * 2 / n;
            for (let i = 0; i < n; i++) {
                ret.add(cx + r * Math.cos(ang * i - Math.PI / 2), cy + r * Math.sin(ang * i - Math.PI / 2));
            }
            return ret;
        }
    }
    let rand = new RNG_1.RNG(Math.random() * 12345678);
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
    function f() {
        switch (rand.nextInt(0, 1)) {
            case 0:
                reDrawRects1();
                break;
            case 1:
                reDrawTri1();
                break;
        }
    }
    f();
    var intv = setInterval(f, 3000);
    // Stop recreate on escape
    window.addEventListener('keydown', function (e) {
        if ((e.key == 'Escape' || e.key == 'Esc' || e.keyCode == 27)) {
            clearInterval(intv);
            return true;
        }
    }, true);
});
